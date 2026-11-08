# CLAUDE.md

SkatePod is a coach-first iPhone app for figure skating coaches: students, a weekly lesson calendar, a lesson history with notes, and program layouts. It's Han's early personal project, used to learn product management (Jira, Confluence) and coding. Vision, MVP scope and roadmap are in [README.md](README.md).

**Keep this file current.** After any major change (new screen, model or storage change, new rule, new command, new working agreement), update the matching section here in the same commit. Keep it short: rules and pointers, not history.

## Working rules (from Han)

- **Don't open, launch or drive the iOS Simulator** unless Han says so in that conversation. Check changes from the CLI (`npx tsc --noEmit`, `npm test`, `./mvnw test`) and tell Han what to try on the phone.
- Commit or push only when asked. Work on a feature branch, never on `main`. Don't stage `mobile/package-lock.json` drift, the root `package.json`/`package-lock.json`, `design/` or `research/` unless asked.
- Jira (project SKATE, board 2) and Confluence hold the epics, stories and research. Commit messages and stories reference SKATE keys when there is one.

## Repo layout

| Folder | What it is |
| --- | --- |
| `mobile/` | The app: Expo, React Native 0.86, TypeScript. Runs in Expo Go (no `ios/` folder, so no `xcodebuild`). |
| `backend/` | REST API: Spring Boot 4.1, Java 21, JPA, Flyway, PostgreSQL 17, Maven. |
| `prototype/figma-make/` | Original Figma Make web prototype. Design reference only, don't change it. |
| `docs/media/` | Demo GIF used in the README. |
| `.github/workflows/ci.yml` | CI on every push and PR: mobile `npm ci`, `tsc`, `npm test` (Node 22); backend `./mvnw -B test` (Java 21). |

**The app and the backend aren't connected yet.** The app keeps its own data on the phone (AsyncStorage), and the models differ (see "Model gaps").

## Commands

Han's step-by-step start-up notes are in [RUNNING.md](RUNNING.md); keep it in sync with this section.

```bash
# Database: Homebrew PostgreSQL 17 (not Docker; backend/compose.yaml is unused). DB, user and password are all `skatepod` on localhost:5432.
brew services start postgresql@17                 # check with `pg_isready -h localhost`
dropdb skatepod && createdb -O skatepod skatepod  # wipe; the next backend start reloads sample data

# Backend (from backend/, needs PostgreSQL)
./mvnw spring-boot:run                            # http://localhost:8080/api, dev profile with sample data
./mvnw test                                       # or -Dtest=ClassName / -Dtest=ClassName#method

# Mobile (from mobile/)
sh setup.sh                                       # one time
npx expo start                                    # scan the QR code with Expo Go (--tunnel if needed)
npx tsc --noEmit                                  # type check (no linter)
npm test                                          # unit tests: src/**/*.test.ts with Node's built-in runner
sh run-ui-tests.sh [.maestro/NN-flow.yaml]        # Maestro UI suite on the iOS Simulator (needs `npx expo start`); resets app data
```

**UI tests (`mobile/.maestro/`).** One flow per area, each starting with `subflows/start.yaml` (open Expo Go, reset to sample data). Maestro matches text case-insensitively, so a field's capitalised label and the box share a name: tap the box with `index: 1`. Cards and buttons read as one combined label, so match names with `.*Name.*`. Things below the fold or behind a sheet's footer need `scrollUntilVisible` first. Results go to `mobile/ui-test-results/` (ignored by git). Findings from runs are in `mobile/UI-TEST-FINDINGS.md`. When you change a screen's text or layout, update its flow.

`backend/requests.http` has ready-made API requests.

## Mobile app

**Shell and navigation.** `App.tsx` holds the header, "Add" button, bottom tabs (Dashboard, Students, Calendar, Programs, Lessons, Settings) and switches screens with `useState`; no navigation library. Cross-screen requests go through `navigate(tab, intent)` with a one-time `Intent` from `src/navigation.ts` (`add`, `openStudent`, `newNote`, `openNote`, `filterNotes`); the target screen acts on it, then calls `onIntentHandled()`. Notes opened from another screen go back there on close (`returnTo`).

**State.** `src/store.tsx` (`useStore()`) holds everything, each saved with `usePersistentState` (`src/storage.ts`) under AsyncStorage keys `skatepod.students.v2`, `.lessons.v1`, `.notes.v1`, `.programs.v1`, `.settings.v1`, `.availability.v1`, `.historyCheckedAt.v1`. If a stored shape changes, bump the key or upgrade old data on load (lessons use `upgradeLesson`).

**Where things live.**
- `src/data.ts`: types, sample data, catalogs and **all business rules as plain functions** (so they're testable). Tests are in `src/data.test.ts`.
- `src/theme.ts`: colors, `lessonColors`, `categoryColors`, radius, shadow. Styling is inline style objects with these tokens.
- `src/components/ui.tsx`: `Screen`, `Card`, `Button`, `Field`, `Sheet`, `Chips`, `Dropdown`, `DisciplineBadges`, etc. Icons in `Icon.tsx`.
- Screens in `src/screens/`: `DashboardScreen`, `StudentsScreen`, `CalendarScreen`, `ProgramsScreen`, `LessonsScreen`, `SettingsScreen`.

**iOS limits.** A pop-up can't open over a `Sheet`, so `Dropdown` and the native date/time wheels (`@react-native-community/datetimepicker`) open inline. Use `Dropdown` for any fixed-list value (disciplines, levels, tracks, student pickers), never free text.

**Students.** First name or initials, plus disciplines (each a discipline and a level from `DISCIPLINES`). No `focus` or `progress` (removed Nov 2026). The next lesson is computed, never stored (`findNextLesson`, `nextLessonLabel`).

**Calendar (weekly lessons).**
- `Lesson`: `day` (0 = Monday), `start` (minutes after midnight, any minute; 570 = 9:30 AM), `duration`, `type`, `color`, `createdAt?`, `startDate?`, `endDate?` (calendar days "YYYY-MM-DD").
- Lessons repeat weekly from `startDate` (today at the earliest for new ones) to an optional `endDate`. Lessons without dates count as always on. `isLessonActiveOn`, `nextLessonTime` and `findClash` respect the dates.
- Color follows type (`colorForType`): Freestyle = teal, Public = sand, Off-ice = purple. No color field in the editor. Lesson cards show the name and a clock with the length ("60m"); the type is in the color and the accessibility label (`Name · Type · 60m`, which the Maestro flows match). Cards have a small shadow; hour lines are faint dashes (`DashedLine`).
- Grid 6 AM–10 PM. Touching an empty spot shows a dashed "+" slot (default lesson length) where the lesson would go; tap to add. Drag to move, drag the bottom edge to resize (snap to 15 min). Tapping a lesson opens a bottom preview panel (max one third of the screen) that stays open after editing. In the editor, start, end and duration stay in sync. "Today" scrolls to today's column, with yesterday before it.
- The grid is a fixed-height box sized to fill the screen once the "Calendar" title has scrolled away (measured with `onLayout`; on open it reaches a bit past the bottom), scrolled inside: a vertical `ScrollView` holds the hour labels plus a horizontal `Animated.ScrollView` of days, so the hour labels stay put sideways. The day names row sits above and follows the days with a native-driven `translateX`.
- Zoom: pinch (a two-finger `PanResponder` that captures before the scroll views and switches them off while pinching) or the −/+ buttons. `calendarScale` turns the wished-for hour height into hour height and day width: fully out = 12 hours × 7 days in the box (`MIN_ZOOM_HOURS`), fully in = `MAX_HOUR_HEIGHT` / `MAX_DAY_WIDTH`. Everything on the grid (`topFor`, tap-to-add, drag snap) uses the current `hourHeight`. The zoom is remembered while the app is open, not saved.
- Optional availability blocks (`AvailabilityBlock`: day, start, end, optional place) get a faint dashed teal outline and the place name; on a day that has blocks, the time outside them gets light diagonal stripes on the white background (`unavailableStretches`, `Stripes`, an SVG path in `colors.unavailable`). No solid grey fills. Days without blocks stay plain, since "not set" isn't "not available". It's only a hint: lessons can still be booked anywhere, no warnings. A lesson inside one shows its place (`placeFor`). Blocks on one day can't overlap (`findBlockOverlap`). There's no rink preset or home rink.

**Lessons tab (training history).** Each lesson occurrence gets a `Note` (possibly empty) once it starts: `lessonHistoryToAdd` fills in what's missing since `historyCheckedAt`, run by the store on load and every minute. Deleted entries don't come back. A lesson's note (`lessonId`) shows the lesson's student, type, length and time read-only; `syncLessonNote` updates it when the lesson changes, and opening a lesson's note reuses the existing one (`findLessonNote`). "Add a past lesson" makes a note with a past date and no `lessonId`. Filters by student, level and time (`matchesHistoryFilter`, `HISTORY_RANGES`), plus Select mode to share or delete several.

**Programs.** Elements per student, with Edit mode and drag to reorder. Track and level come from `TRACK_LEVELS` (2026-27: Championship, Excel, Adult); `validTrackAndLevel` checks a pair. `requirementLinks` links to official U.S. Figure Skating charts; link to the rules, don't copy or enforce them. When charts change, update the URLs and `REQUIREMENTS_CHECKED`.

**Tests.** `src/*.test.ts` use `node:test` and `node:assert/strict`, import with the `.ts` extension, and can only import files without React Native imports (like `data.ts`). Add a test for every new rule in `data.ts`.

## Backend

Package by feature under `com.skatepod.api`: `student/`, `lesson/`, `common/`.

- **Layers:** Controller (HTTP, `@Valid`, returns DTO records from `dto/`) → Service (rules, `@Transactional`, entity ↔ DTO, trims strings, `blankToNull`) → Spring Data repository. Entities never leave the service.
- **Entities** extend `common/BaseEntity` (UUID, `created_at`/`updated_at`), have a protected no-arg constructor plus a public one that calls `update(...)`, and no setters.
- **Errors:** `NotFoundException` (404), `BadRequestException` (400), `ConflictException` (409), turned into `ProblemDetail` by `ApiExceptionHandler`.
- **Time:** inject the `Clock` bean and use `now(clock)`; tests use `Clock.fixed(...)`.
- **Disciplines:** catalog in code (`student/Discipline.java`), served at `GET /api/disciplines`; stored per student in `student_disciplines`.
- **Database:** Flyway owns the schema (`ddl-auto: validate`). Never edit an applied migration; add the next `V6__...sql`. Sample data `db/sample/V1000__sample_data.sql` loads only in the `dev` profile; after adding a migration, reset the dev DB (it sorts before V1000). Deleting a student cascades to their lessons. Production config: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `PORT`.
- **Tests:** plain JUnit 5 + AssertJ + Mockito with mocked repositories, no Spring context or DB. Descriptive names or `@DisplayName`.

## Rules that live in two or more places (change together)

| Rule | Backend | Mobile (`data.ts`) |
| --- | --- | --- |
| Discipline catalog | `student/Discipline.java` | `DISCIPLINES` |
| Tracks: Championship, Excel, Adult | `student/Track.java` | `TRACK_LEVELS` keys |
| Lesson types: Public, Freestyle, Off-ice | `@Pattern` in `LessonRequest` + CHECK in migration V3 | `LESSON_TYPES` |
| No double booking (overlap blocked, back-to-back fine, any student) | `LessonService.checkTimeIsFree` (409) | `findClash` (also checks date ranges; `CalendarScreen` alerts) |
| Next lesson = earliest start at or after now | `NextLessonCalculator.findNext` | `findNextLesson` / `nextLessonTime` |
| Lesson colors TEAL / SAND / PURPLE | `LessonColor` enum | lowercase names, `colorForType` |

## Model gaps (for when the app connects to the backend)

- Backend lessons are dated one-offs (`lesson_date` + `start_time`); mobile lessons are weekly with optional start/end dates.
- Backend student disciplines have a `track` (CHAMPIONSHIP / EXCEL / ADULT, `student/Track.java`) for the Programs panel, not shown on the profile; mobile students don't have one yet. Focus and progress are gone from both (backend V5).
- Mobile-only so far: notes/lesson history, programs, availability blocks, settings.

## Conventions

- **Privacy:** many skaters are minors. Keep student data minimal (first names or initials); no student accounts or extra personal fields without asking. All sample data is made up; keep it that way.
- Comments are plain and explanatory for a developer who is learning (some address Han directly). Match that tone and density.
- READMEs (`README.md`, `mobile/README.md`, `backend/README.md`) are plain-language, step-by-step for a Mac. Update them when commands, endpoints, screens or the roadmap change.
