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

**The app and the backend are being connected, one feature at a time.** Students, weekly lessons, notes and programs go through the API when `mobile/.env` sets `EXPO_PUBLIC_API_URL`; everything else is still kept on the phone (AsyncStorage). Since backend V6 the backend's model matches the app's; the differences left are under "Model gaps".

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
sh run-ui-tests.sh [.maestro/<folder or flow>]   # Maestro UI suite on the iOS Simulator (needs `npx expo start`); prints the test cases first
```

**UI tests (`mobile/.maestro/`).** Folders: `regression/` (the main flow of each area, `01-`…`08-`), `edge-cases/` (one file per feature: refused saves, cancels, empty results, limits), `backend/` (front to back, needs the backend), `subflows/` (shared steps: `start.yaml` opens Expo Go and resets to sample data, `open.yaml` opens without resetting). `config.yaml` makes `sh run-ui-tests.sh` run regression + edge cases; a new feature gets a regression flow and an edge-cases file, and flows reference subflows as `../subflows/…`. Number each case `# 1. …` on one line: `run-ui-tests.sh` prints those before running. Type letters only where possible (a digit right after a letter can stall the iOS keyboard), close the keyboard with `pressKey: Enter` (not `hideKeyboard`), and check words on screen rather than `enabled:` (iOS doesn't report React Native's disabled state). Maestro matches text case-insensitively, so a field's capitalised label and the box share a name: tap the box with `index: 1`. Cards and buttons read as one combined label, so match names with `.*Name.*`. Things below the fold or behind a sheet's footer need `scrollUntilVisible` first. Results go to `mobile/ui-test-results/` (ignored by git). Findings from runs are in `mobile/UI-TEST-FINDINGS.md`. `.maestro/backend/full-flow.yaml` is the front-to-back flow (students → lessons → notes → programs → reopen → delete) and needs the backend plus `mobile/.env`; it's in a subfolder so the normal suite skips it. Run it with `sh run-ui-tests.sh .maestro/backend/full-flow.yaml`. When you change a screen's text or layout, update its flow.

`backend/requests.http` has ready-made API requests.

## Mobile app

**Shell and navigation.** `App.tsx` holds the header, "Add" button, bottom tabs (Dashboard, Students, Calendar, Programs, Lessons, Settings) and switches screens with `useState`; no navigation library. Cross-screen requests go through `navigate(tab, intent)` with a one-time `Intent` from `src/navigation.ts` (`add`, `openStudent`, `newNote`, `openNote`, `filterNotes`); the target screen acts on it, then calls `onIntentHandled()`. Notes opened from another screen go back there on close (`returnTo`).

**State.** `src/store.tsx` (`useStore()`) holds everything, each saved with `usePersistentState` (`src/storage.ts`) under AsyncStorage keys `skatepod.students.v2`, `.lessons.v1`, `.notes.v1`, `.programs.v2` (a list; the old one-per-student `.programs.v1` is upgraded with `upgradeOldPrograms`), `.settings.v1`, `.availability.v1`, `.historyCheckedAt.v1`. If a stored shape changes, bump the key or upgrade old data on load (lessons use `upgradeLesson`). **Students, lessons, notes and programs can live on the backend:** when `EXPO_PUBLIC_API_URL` is set in `mobile/.env` (see `.env.example`), the store loads them with `src/api.ts` (`reloadFromBackend`, errors in `backendError`) and `saveStudent`/`deleteStudent`/`saveLesson`/`deleteLesson`/`saveNote`/`deleteNotes`/`saveProgram`/`deleteProgram` send POST/PUT/DELETE, and `uploadMusic` sends a music file (`POST /api/music`, multipart) (`source: "backend"`); without it, everything stays on the phone as before (Maestro and CI run that way). Screens never set students, lessons or notes directly: they call those functions, which resolve to false/null after an alert if the backend says no (editors then stay open). New items get their id from the backend. Moving a lesson shows straight away and goes back if the PUT fails. Programs only save when the coach taps Save. `api.ts` logs one line per call in development (`→ POST /students 201 (14 ms)`). The JSON mapping (`studentFromApi`, `studentToApi`, `defaultTrackFor`, `toneFor`, `lessonFromApi`, `lessonToApi`, `noteFromApi`, `noteToApi`, `programFromApi`, `programToApi`) is in `data.ts`. Next to move: availability.

**Where things live.**
- `src/data.ts`: types, sample data, catalogs and **all business rules as plain functions** (so they're testable). Tests are in `src/data.test.ts`.
- `src/theme.ts`: colors, `lessonColors`, `categoryColors`, radius, shadow. Styling is inline style objects with these tokens.
- `src/components/ui.tsx`: `Screen`, `Card`, `Button`, `Field`, `Sheet`, `Chips`, `Dropdown`, `DisciplineBadges`, etc. Icons in `Icon.tsx`.
- Screens in `src/screens/`: `DashboardScreen`, `StudentsScreen`, `CalendarScreen`, `ProgramsScreen`, `LessonsScreen`, `SettingsScreen`.

**iOS limits.** A pop-up can't open over a `Sheet`, so `Dropdown` and the native date/time wheels (`@react-native-community/datetimepicker`) open inline. Use `Dropdown` for any fixed-list value (disciplines, levels, tracks, student pickers), never free text.

**Students.** First name or initials, plus disciplines (each a discipline and a level from `DISCIPLINES`). No `focus` or `progress` (removed Nov 2026). The next lesson is computed, never stored (`findNextLesson`, `nextLessonLabel`). Deleting a student deletes everything that's theirs (lessons, notes, programs, music files), on the phone too (`deletePhoneStudentData` in the store) and on the backend, and the confirm alert says so.

**Calendar (weekly lessons).**
- `Lesson`: `day` (0 = Monday), `start` (minutes after midnight, any minute; 570 = 9:30 AM), `duration`, `type`, `color`, `createdAt?`, `startDate?`, `endDate?` (calendar days "YYYY-MM-DD").
- Lessons repeat weekly from `startDate` (today at the earliest for new ones) to an optional `endDate`. Lessons without dates count as always on. `isLessonActiveOn`, `nextLessonTime` and `findClash` respect the dates. A lesson booked for a day already past this week starts next week: after saving, the calendar jumps to the week of its next lesson (`showWeekOf`, `weekOffsetOf`), and clash alerts add when a not-yet-started lesson begins (`startsLaterNote`).
- One-time lessons are stored the same way, with `endDate` = `startDate` (`isOneTimeLesson`); no extra field. The editor has a **Date** (the weekday comes from it, no Day picker), a **Repeat** switch (off for new lessons) and, when on, a **Recurrence ends** card: No end date / Specific date / After X lessons (`endDateAfterLessons`, `countWeeklyLessons`). Dragging a one-time lesson to another day moves its date within that week (`moveToWeekday`).
- Color follows type (`colorForType`): Freestyle = teal, Public = sand, Off-ice = purple. No color field in the editor. Lesson cards show the name and a clock with the length ("60m"); the type is in the color and the accessibility label (`Name · Type · 60m`, which the Maestro flows match). Cards have a small shadow; hour lines are faint dashes (`DashedLine`).
- Grid 6 AM–10 PM. Touching an empty spot shows a dashed "+" slot (default lesson length) where the lesson would go; tap to add. Drag to move, drag the bottom edge to resize (snap to 15 min). Tapping a lesson opens a bottom preview panel (max one third of the screen) that stays open after editing. In the editor, start, end and duration stay in sync. "Today" scrolls to today's column, with yesterday before it.
- The grid is a fixed-height box sized to fill the screen once the "Calendar" title has scrolled away (measured with `onLayout`; on open it reaches a bit past the bottom), scrolled inside: a vertical `ScrollView` holds the hour labels plus a horizontal `Animated.ScrollView` of days, so the hour labels stay put sideways. The day names row sits above and follows the days with a native-driven `translateX`.
- Zoom: pinch (a two-finger `PanResponder` that captures before the scroll views and switches them off while pinching) or the −/+ buttons. `calendarScale` turns the wished-for hour height into hour height and day width: fully out = 12 hours × 7 days in the box (`MIN_ZOOM_HOURS`), fully in = `MAX_HOUR_HEIGHT` / `MAX_DAY_WIDTH`. Everything on the grid (`topFor`, tap-to-add, drag snap) uses the current `hourHeight`. The zoom is remembered while the app is open, not saved.
- Optional availability blocks (`AvailabilityBlock`: day, start, end, optional place) get a faint dashed teal outline and the place name; on a day that has blocks, the time outside them gets light diagonal stripes on the white background (`unavailableStretches`, `Stripes`, an SVG path in `colors.unavailable`). No solid grey fills. Days without blocks stay plain, since "not set" isn't "not available". It's only a hint: lessons can still be booked anywhere, no warnings. A lesson inside one shows its place (`placeFor`). Blocks on one day can't overlap (`findBlockOverlap`). There's no rink preset or home rink.

**Lessons tab (training history).** Each lesson occurrence gets a `Note` (possibly empty) once it starts: `lessonHistoryToAdd` fills in what's missing since `historyCheckedAt`, run by the store on load and every minute. On the backend the backend does this on `GET /api/notes`, so the store just reloads notes every minute instead. Deleted entries don't come back. A lesson's note (`lessonId`) shows the lesson's student, type, length and time read-only; `syncLessonNote` updates it when the lesson changes (the Calendar saves that note with `saveNote`), and opening a lesson's note reuses the existing one (`findLessonNote`). "Add a past lesson" makes a note with a past date and no `lessonId`. Filters by student, level and time (`matchesHistoryFilter`, `HISTORY_RANGES`), plus Select mode to share or delete several.

**Programs.** A student can have several programs (Nov 2026), each with a free-text `name`. Each is a card: closed it's one row with a trash can (deleting asks first); tap to open it. One open at a time. Changes go to a `draft` and are kept only on **Save program**, which is grey until `programHasChanges` and while a music file uploads; closing, switching program or student with unsaved changes asks "Discard changes?". `programNotReady` checks name, music title, duration and link before saving. New programs come from `newProgramFor` (the student's freeskate track and level). Music: an uploaded file (`MusicFile`, backend only, up to 20 MB, picked with `expo-document-picker`, played by opening `api.musicFileUrl`) and/or a `musicLink` (`musicServiceName` says where it opens). Elements per program, with Edit mode and drag to reorder. Track and level come from `TRACK_LEVELS` (2026-27: Championship, Excel, Adult); `validTrackAndLevel` checks a pair. `requirementLinks` links to official U.S. Figure Skating charts; link to the rules, don't copy or enforce them. When charts change, update the URLs and `REQUIREMENTS_CHECKED`.

**Tests.** `src/*.test.ts` use `node:test` and `node:assert/strict`, import with the `.ts` extension, and can only import files without React Native imports (like `data.ts`). Add a test for every new rule in `data.ts`.

## Backend

Package by feature under `com.skatepod.api`: `student/`, `lesson/`, `common/`.

- **Layers:** Controller (HTTP, `@Valid`, returns DTO records from `dto/`) → Service (rules, `@Transactional`, entity ↔ DTO, trims strings, `blankToNull`) → Spring Data repository. Entities never leave the service.
- **Entities** extend `common/BaseEntity` (UUID, `created_at`/`updated_at`), have a protected no-arg constructor plus a public one that calls `update(...)`, and no setters.
- **Errors:** `NotFoundException` (404), `BadRequestException` (400), `ConflictException` (409), turned into `ProblemDetail` by `ApiExceptionHandler`.
- **Request log:** `common/RequestLoggingFilter` prints one line per `/api` call in the backend terminal (`POST /api/students → 201 (14 ms)`). Method, path, status and time only, never bodies (student data).
- **Time:** inject the `Clock` bean and use `now(clock)`; tests use `Clock.fixed(...)`.
- **Features** (packages): `student/` (students, disciplines, `Track`, next lesson), `lesson/` (weekly lessons; `WeeklyLessons` has the date rules), `availability/`, `note/` (training history; `NoteService.catchUpHistory` adds an empty note per started lesson since `history_check`, run on `GET /api/notes`), `program/` (several named programs per student at `/api/programs`, `ElementCatalog`, `GET /api/tracks` and `/api/elements`), `music/` (uploaded music files: `POST /api/music` multipart, `GET /api/music/{id}` plays it with Range support; bytes on disk in `skatepod.music.dir` = `MUSIC_DIR`, default `backend/uploads/music`, ignored by git; a file is deleted once no program uses it). The app's settings stay on the phone.
- **Disciplines:** catalog in code (`student/Discipline.java`), served at `GET /api/disciplines`; stored per student in `student_disciplines`.
- **Database:** Flyway owns the schema (`ddl-auto: validate`). Never edit an applied migration; add the next `V9__...sql`. Sample data `db/sample/V1000__sample_data.sql` and `V1001__sample_programs.sql` load only in the `dev` profile (add more as `V1002...`); after adding a migration, reset the dev DB (it sorts before V1000). Deleting a student deletes everything that's theirs: `StudentService.delete` first calls `ProgramService.deleteAllFor` (programs plus their music files on disk), then the database cascades to lessons, notes and disciplines. That's right because every program belongs to one student today. Team disciplines (pairs, ice dance teams, synchro, Theatre On Ice) will need shared programs with different delete rules; that's out of scope for now, so don't add sharing without asking Han; deleting a lesson keeps its notes (`lesson_id` set to null). Production config: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `PORT`, `MUSIC_DIR`.
- **Tests:** plain JUnit 5 + AssertJ + Mockito with mocked repositories, no Spring context or DB. Descriptive names or `@DisplayName`. Give unsaved entities an id with `ReflectionTestUtils.setField(entity, "id", ...)` when a rule compares ids.
- **Postman:** `backend/postman/SkatePod-API.postman_collection.json` (every endpoint with checks; creates and deletes its own test student). Run it with `npx newman run backend/postman/SkatePod-API.postman_collection.json` while the backend runs; when you change an endpoint, update it.

## Rules that live in two or more places (change together)

| Rule | Backend | Mobile (`data.ts`) |
| --- | --- | --- |
| Discipline catalog | `student/Discipline.java` | `DISCIPLINES` |
| Tracks and their levels: Championship, Excel, Adult | `student/Track.java` | `TRACK_LEVELS` |
| Program element catalog and starter elements | `program/ElementCatalog.java` | `ELEMENT_CATALOG`, `STARTER_ELEMENTS` |
| Jump combinations: 2 or 3 jumps joined by "+", may use the half loop `1Eu` ("2A+1Eu+3S") | `ElementCatalog.find` | `COMBINATIONS`, `HALF_LOOP` (`ProgramsScreen`) |
| A program needs a name, a music title, a duration like 2:10, and a link (if any) starting with http(s):// | `ProgramRequest` | `programNotReady` |
| Music files: audio only, up to 20 MB | `MusicFileService` (`MAX_BYTES`, `AUDIO_TYPES`), multipart limits in `application.yaml` | `MAX_MUSIC_BYTES`, picker `type: "audio/*"` |
| Lesson types: Public, Freestyle, Off-ice | `@Pattern` in `LessonRequest` + CHECK in migration V3 | `LESSON_TYPES` |
| No double booking (same weekday, overlap blocked, back-to-back fine, any student, only when date ranges meet) | `LessonService.checkTimeIsFree` (409) | `findClash` (`CalendarScreen` alerts) |
| Weekly date rules (date ranges overlap, active on a day, next start, starts between) | `lesson/WeeklyLessons` | `datesOverlap`, `isLessonActiveOn`, `nextLessonTime`, `lessonTimesBetween` |
| New lessons start today at the earliest | `LessonService.create` (400) | lesson editor |
| Training history: an empty note per started lesson, one per lesson per day | `NoteService.catchUpHistory`, `findLessonNote` | `lessonHistoryToAdd`, `findLessonNote` |
| Availability blocks on a day can't overlap; a lesson's place | `AvailabilityService` (409), `placeFor` | `findBlockOverlap`, `placeFor` |
| Next lesson = earliest start at or after now | `NextLessonCalculator.findNext` | `findNextLesson` / `nextLessonTime` |
| Lesson colors follow the type: TEAL / SAND / PURPLE | `LessonColor.forType` | lowercase names, `colorForType` |

## Model gaps (for when the app connects to the backend)

The backend matches the app's model since V6. What's left to map in the app:
- **Names and units:** lessons use `dayOfWeek` ("MONDAY") and `startTime` ("09:30") instead of `day` (0 = Monday) and `start` (minutes); `lessonFromApi`/`lessonToApi` convert. Notes use `durationMinutes` (60) instead of `duration` ("60 minutes"); `noteFromApi`/`noteToApi` convert. Programs send element codes only, tracks in capitals and the music file as `musicFileId`; `programFromApi`/`programToApi` convert. Colors are uppercase.
- **Track:** the app keeps each discipline's `track` from the backend (hidden on the profile) and gives new disciplines `defaultTrackFor`.
- **Not in the backend:** student `tone` (avatar color the app assigns), settings, and `syncLessonNote` (when a lesson changes, the app PUTs its note too).
- **IDs:** the backend makes UUIDs; the app's are short random strings, so data already on a phone needs new ids when uploaded.

## Conventions

- **Privacy:** many skaters are minors. Keep student data minimal (first names or initials); no student accounts or extra personal fields without asking. All sample data is made up; keep it that way.
- Comments are plain and explanatory for a developer who is learning (some address Han directly). Match that tone and density.
- READMEs (`README.md`, `mobile/README.md`, `backend/README.md`) are plain-language, step-by-step for a Mac. Update them when commands, endpoints, screens or the roadmap change.
