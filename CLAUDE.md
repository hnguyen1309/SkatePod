# CLAUDE.md

SkatePod is a coach-first app for figure skating coaches (student list, lesson notes, practice checklist, links to Drive/music/competition files). It's an early personal project. Product vision, MVP scope and the roadmap are in [README.md](README.md).

## Repo layout

| Folder | What it is |
| --- | --- |
| `mobile/` | iPhone app: Expo, React Native and TypeScript. Runs in Expo Go. |
| `backend/` | REST API: Spring Boot 4.1, Java 21, JPA, Flyway, PostgreSQL 17, Maven. |
| `prototype/figma-make/` | Original Figma Make web prototype (React, Vite, Tailwind). Design reference only, don't change it. |

**The app and the backend aren't connected yet.** The mobile app keeps its own sample data on the phone (AsyncStorage). Their data models also differ (see below).

## Commands

Step-by-step start-up notes for Han are in [RUNNING.md](RUNNING.md). Keep it in sync with this section.

Database: a native **Homebrew PostgreSQL 17**, not Docker. `backend/compose.yaml` is no longer used.

```bash
brew services start postgresql@17      # starts on login; check with `pg_isready -h localhost`
brew services stop postgresql@17
dropdb skatepod && createdb -O skatepod skatepod   # wipe the DB; the next backend start reloads sample data
```

The connection is `localhost:5432`, and the database, user and password are all `skatepod`. These match the defaults in `application.yaml`. One-time setup on a new Mac: `brew install postgresql@17`, then `CREATE ROLE skatepod WITH LOGIN PASSWORD 'skatepod'` and `CREATE DATABASE skatepod OWNER skatepod` through `psql postgres`.

Backend (run from `backend/`; needs PostgreSQL running):

```bash
./mvnw spring-boot:run        # API on http://localhost:8080/api, dev profile (loads sample data)
./mvnw test                   # all tests
./mvnw test -Dtest=NextLessonCalculatorTest            # one class
./mvnw test -Dtest=StudentServiceTest#createTrimsInputAndTreatsBlankFocusAsEmpty  # one method
```

`backend/requests.http` has ready-made requests for VS Code REST Client or IntelliJ.

Mobile (run from `mobile/`):

```bash
sh setup.sh                   # one time: installs expo@latest, then `npx expo install` matching versions
npx expo start                # front end: scan the QR code with Expo Go (add --tunnel if the phone can't connect)
npx tsc --noEmit              # type check (there's no linter)
npm test                      # unit tests for src/data.ts (Node's built-in test runner, src/**/*.test.ts)
```

## Backend architecture

Package by feature under `com.skatepod.api`: `student/`, `lesson/`, `common/`.

- **Layering:** Controller (HTTP and `@Valid`) → Service (business rules, `@Transactional`, entity ↔ DTO mapping) → Spring Data repository. Entities never leave the service layer. Controllers only return DTO records from `dto/`.
- **Entities** extend `common/BaseEntity` (UUID id plus `created_at`/`updated_at` set in `@PrePersist`/`@PreUpdate`). They have a protected no-arg constructor for JPA, and a public constructor that delegates to an `update(...)` method. There are no setters.
- **Services trim strings**, and `StudentService.blankToNull` turns a blank optional field into null.
- **Errors:** throw `NotFoundException("Student", id)` for a 404, `BadRequestException("message")` for a broken business rule (400), or `ConflictException("message")` when a request clashes with saved data (409). `ApiExceptionHandler` turns each into a `ProblemDetail`. Validation errors become 400 problem details automatically (`spring.mvc.problemdetails.enabled`).
- **Time:** inject the `Clock` bean (`common/ClockConfig`) and use `LocalDateTime.now(clock)`, never a bare `now()`. Tests use `Clock.fixed(...)`.
- **Next lesson:** `StudentService.toResponse` calls `NextLessonCalculator.findNext(lessons, now)`, which returns the earliest lesson starting at or after `now` (lessons that already started today are skipped). `list()` loads all lessons in one query and groups them by student to avoid N+1 queries.
- **Student disciplines:** a student has zero or more `StudentDiscipline`s (`@ElementCollection`, table `student_disciplines`, one row per student and discipline). Each one is a `Discipline` enum value plus a level. The catalog (`DisciplineCategory` > `Discipline` > ordered levels) lives in code in `student/Discipline.java`, not in DB tables, and is served at `GET /api/disciplines`. `StudentService.toDisciplines` rejects a level from another discipline and duplicate disciplines with `BadRequestException` (400). **The catalog is copied in `mobile/src/data.ts` (`DISCIPLINES`). Change both together.**
- **Lesson types:** only `Public`, `Freestyle` and `Off-ice` are allowed. The rule lives in three places: `@Pattern` in `LessonRequest`, the CHECK constraint from migration V3, and `LESSON_TYPES` in `mobile/src/data.ts`. Change all three together.
- **No double booking:** a lesson can't overlap any other lesson on the same day, for any student (the coach teaches one at a time). Back-to-back is fine. `LessonService.checkTimeIsFree` throws `ConflictException` (409). The app has the same rule in `findClash` (`mobile/src/data.ts`), and `CalendarScreen` blocks saving with an alert. Change both together.
- **Lesson colors:** the `LessonColor` enum (`TEAL`, `SAND`, `PURPLE`) is stored as a string. Mobile uses the same names in lowercase. The calendar legend reads teal = Freestyle, sand = Public, purple = Off-ice.

### Database

- Flyway owns the schema. `ddl-auto: validate` means the app won't start if an entity and the schema disagree.
- **Never edit an applied migration.** Add `V3__...sql` and so on to `src/main/resources/db/migration/`.
- `db/sample/V1000__sample_data.sql` is loaded only by the `dev` profile, and `spring-boot:run` turns that profile on through `pom.xml`. Sample dates are relative to `CURRENT_DATE`.
- Because the sample data is V1000, a new schema migration (V3, V4, and so on) sorts before it. Flyway then refuses to start on a dev DB that already has V1000. Reset the dev DB (`dropdb skatepod && createdb -O skatepod skatepod`) after adding one. If the new migration adds a rule the sample data breaks, also update `V1000__sample_data.sql`, which only runs on a fresh DB.
- `lessons.student_id` uses `ON DELETE CASCADE`, so deleting a student deletes their lessons.
- Lessons are dated calendar entries (`lesson_date` plus `start_time`), not weekly slots. V2 migrated away from `day_of_week`.
- Production config comes from `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` and `PORT`.

### Tests

These are plain JUnit 5 unit tests with AssertJ and Mockito (`@ExtendWith(MockitoExtension.class)`, repositories mocked). They don't use a Spring context or a database. Follow that style for new tests, and give them descriptive method names or `@DisplayName`.

## Mobile architecture

- `App.tsx` contains the whole shell: header, "Add" button, bottom tabs, and screen switching through `useState`. There's no navigation library.
- Cross-screen navigation goes through `navigate(tab, intent)`. An `Intent` (`src/navigation.ts`) is a one-time request such as `{ kind: "openStudent", studentId }`. The target screen acts on it and then calls `onIntentHandled()`.
- `src/store.tsx` is a React context (`useStore()`) that holds students, lessons, availability blocks, notes, programs and settings. Each one is saved with `usePersistentState` (`src/storage.ts`, AsyncStorage keys `skatepod.*.v1`). If you change a stored type's shape, bump the key version or handle old data (lessons do this with `upgradeLesson` in `data.ts`).
- **Calendar:** lessons can start at any minute (picked with the native iOS time wheel from `@react-native-community/datetimepicker`, shown inline because a pop-up can't open over a `Sheet`). In the editor, start, end and duration stay in sync. Tapping the grid or dragging a lesson snaps to 15 minutes. There's no rink preset and no "home rink": coaches can optionally add availability blocks (`AvailabilityBlock`: day, start, end, optional place), shown as shaded areas. A lesson inside a block shows its place (`placeFor`). Blocks on the same day can't overlap (`findBlockOverlap`).
- `src/data.ts` holds types, sample data and the skating element catalog. `src/theme.ts` holds colors, `lessonColors`, radius and shadow. Shared UI pieces (`Screen`, `Card`, `Button`, `Field`, `Sheet`, `Chips` and so on) are in `src/components/ui.tsx`, and icons are in `Icon.tsx`.
- Use `Dropdown` (in `ui.tsx`) for any value the API only accepts from a fixed list. It opens its options inline, because a pop-up can't open on top of a `Sheet` on iOS. Student disciplines and levels use it, with no free text. `DisciplineBadges` shows a student's disciplines as pills colored by `categoryColors` in `theme.ts`.
- **Requirement links:** `requirementLinks` in `data.ts` links the Programs screen to official U.S. Figure Skating charts for the student's track and level. Link to the rules, don't copy them or enforce element limits, because they change by season and have exceptions. When charts change, update the URLs and `REQUIREMENTS_CHECKED`.
- **Lessons tab (training history):** every weekly calendar lesson gets an entry (a `Note`, possibly empty) once it starts. `lessonHistoryToAdd` in `data.ts` finds the missing ones since the last check (`skatepod.historyCheckedAt.v1`); the store runs it on load and every minute. History follows a lesson's `startDate`/`endDate` (calendar days like "2026-11-12"; new weekly lessons start today at the earliest, end date optional). Lessons saved before these dates existed have none and count as always on (history from their `createdAt`, or the start of that week). `isLessonActiveOn`, `nextLessonTime` and `findClash` all respect the dates. Lessons that already happened are added on the Lessons tab ("Add a past lesson", a note with a past date and no `lessonId`). A lesson's note shows the lesson's student, type and length read-only; `syncLessonNote` keeps them in step when the lesson is edited.
- **Unit tests:** `src/*.test.ts` files run with Node's built-in runner (`node:test`, `node:assert/strict`), no Jest yet. They can only import files with no React Native imports (like `data.ts`), and they import with the `.ts` extension. Keep business rules in `data.ts` as plain functions (e.g. `syncLessonNote`) so they can be tested.
- Styling uses inline style objects and `theme.ts` tokens. There's no styling library.
- **Model mismatch with the backend:** the mobile `Lesson` is still weekly (`day` 0 = Monday, `start` = minutes after midnight, e.g. 570 = 9:30 AM). The backend uses dated lessons. Both work out the next lesson from the calendar and never store it: `findNextLesson`/`nextLessonLabel` in `data.ts` mirror `NextLessonCalculator`, and the student editor shows it read-only. Keep this in mind when connecting the two. The mobile `Student` also no longer has `focus` or `progress` (removed Nov 2026), while the backend student still has a `focus` column.

## Conventions and context

- **Privacy:** many skaters are minors. Keep student data minimal (first names or initials), and don't add student accounts or extra personal fields without asking.
- The code is commented in a plain, explanatory style for a developer who is learning (some comments address Han directly). Keep new comments in that tone and at a similar density.
- READMEs are written in plain language with step-by-step Mac instructions. Update `README.md`, `backend/README.md` or `mobile/README.md` when commands, endpoints or the roadmap change.
- All student, lesson and note data is made up. Keep it that way.
