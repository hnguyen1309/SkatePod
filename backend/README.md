# SkatePod API (Spring Boot)

REST API for the SkatePod app: students and their lessons (dated entries on the coach's calendar), stored in PostgreSQL.

**Stack:** Java 21 · Spring Boot 4.1 · Spring Data JPA · Bean Validation · Flyway · PostgreSQL 17 · Maven

## One-time setup (Mac)

You need **Java 21**, **Maven** and **Docker Desktop**.

1. Check that Homebrew matches your Mac. On Apple Silicon, `which brew` must print `/opt/homebrew/bin/brew`. If it prints `/usr/local/bin/brew`, that's the Intel version (often copied over from an old Mac), and it will try to compile everything from source. Install the native one from [brew.sh](https://brew.sh) and add `eval "$(/opt/homebrew/bin/brew shellenv)"` to `~/.zprofile`.
2. Install the tools:

```bash
brew install openjdk@21 maven
brew install --cask docker-desktop
```

3. Make Java 21 the default, since Maven otherwise uses the newest Java it finds. Add these lines to `~/.zprofile`, then open a new Terminal tab:

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

4. Check: `java -version` and `mvn -version` should both say 21.
5. Open **Docker Desktop** once and accept its setup screens. You don't need to install PostgreSQL: Docker runs it for you.
6. If `./mvnw` isn't in `backend/` yet, create it with `mvn wrapper:wrapper`, then commit `mvnw`, `mvnw.cmd` and `.mvn/`.

## Run it locally

```bash
cd backend
docker compose up -d      # start PostgreSQL
./mvnw spring-boot:run    # start the API on http://localhost:8080
```

`spring-boot:run` uses the **dev** profile, which loads made-up sample students and lessons. Try it:

```bash
curl http://localhost:8080/api/students
```

Or open `requests.http` in VS Code (REST Client extension) or IntelliJ and click **Send Request**.

Run the tests:

```bash
./mvnw test
```

Stop the database with `docker compose down` (add `-v` to wipe its data).

## Endpoints

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/students` | List students A to Z, each with their next lesson |
| GET | `/api/students/{id}` | One student |
| POST | `/api/students` | Create a student → 201 |
| PUT | `/api/students/{id}` | Update a student |
| DELETE | `/api/students/{id}` | Delete a student with their lessons, notes and program → 204 |
| GET | `/api/disciplines` | Every discipline with its category and levels (lowest first) |
| GET | `/api/lessons?studentId=` | List weekly lessons, Monday first (optionally for one student) |
| GET | `/api/lessons/{id}` | One lesson |
| POST | `/api/lessons` | Add a weekly lesson → 201 |
| PUT | `/api/lessons/{id}` | Change a lesson |
| DELETE | `/api/lessons/{id}` | Delete a lesson (its notes stay in the history) → 204 |
| GET | `/api/availability` | List availability blocks, Monday first |
| POST | `/api/availability` | Add a block → 201 |
| PUT | `/api/availability/{id}` | Change a block |
| DELETE | `/api/availability/{id}` | Delete a block → 204 |
| GET | `/api/notes?studentId=&from=&to=` | The training history, newest first (fills in new entries first) |
| GET | `/api/notes/{id}` | One note |
| POST | `/api/notes` | Add a note (for example "Add a past lesson") → 201 |
| PUT | `/api/notes/{id}` | Change a note |
| DELETE | `/api/notes/{id}` | Delete a note for good → 204 |
| GET | `/api/students/{id}/program` | The student's program, or a starting program (`saved: false`) |
| PUT | `/api/students/{id}/program` | Save the student's program (creates or replaces it) |
| DELETE | `/api/students/{id}/program` | Remove the program → 204 |
| GET | `/api/tracks` | Championship, Excel and Adult, with their levels |
| GET | `/api/elements` | Every program element (jumps, spins, sequences) |

Errors come back as JSON "problem details": **400** for invalid input, **404** for unknown IDs and **409** for a clash.

**Students.** A student has a list of `disciplines`, which can be empty. Each item has a discipline (for example `STANDARD_FREESKATE`), a track (`CHAMPIONSHIP`, `EXCEL` or `ADULT`) and a level from that discipline's own ladder (for example `Pre-Gold`). The track isn't shown on the student profile; it's there so a new program starts on the student's track. Using a level from another discipline, or listing the same discipline twice, returns a 400 that explains what's wrong.

**Lessons repeat every week**, like the app's calendar: a `dayOfWeek` (`MONDAY` ...), a `startTime` (any minute), `durationMinutes` (5 to 240) and a `type` (`Public`, `Freestyle` or `Off-ice`; the `color` follows from it). A lesson runs from `startDate` to an optional `endDate`. Leave `startDate` out and a new lesson starts today; it can't start before today. Each lesson also shows the `place` of the availability block it starts in, if any.

**No double booking.** A coach teaches one lesson at a time, so a lesson can't overlap another lesson on the same weekday, for any student, in weeks when both are running. The 409 says which lesson is in the way. Back-to-back is fine (9:00–9:45 and 9:45–10:15), and so are lessons whose dates never meet.

**Training history.** Every calendar lesson that has started gets a note (empty until the coach writes in it). `GET /api/notes` adds the missing ones first, for lessons that started since the last check, so a note you delete doesn't come back. A note with a `lessonId` must be for that lesson's student; a note without one ("Add a past lesson") can't be dated in the future.

**Availability blocks** are optional, like in the app. The end must be after the start, and blocks on one day can't overlap (409).

**Programs.** One per student. A student without a saved program gets the app's starting program (Untitled, 2:10, four starter elements) on their own freeskate track. The level must be one of the track's levels and every element code must be in the catalog (`GET /api/elements`).

**Postman.** `postman/SkatePod-API.postman_collection.json` has every request above with checks. In Postman: Import → that file → Run collection. It creates a test student, tries everything, and deletes what it made.

**Request log.** Every call to the API prints one line in the terminal where the backend runs, for example `POST /api/students → 201 (14 ms)`. Use it to check that a request from the app or Postman arrived. Only the method, path, status and time are logged, never what was sent.

## How the code is organized

```
src/main/java/com/skatepod/api/
  student/        Students, disciplines, tracks, next lesson (NextLessonCalculator)
  lesson/         Weekly lessons; WeeklyLessons.java has the date rules (copies of the app's)
  availability/   Availability blocks
  note/           Training history (notes) and filling it in (NoteService.catchUpHistory)
  program/        Programs, the element catalog, tracks and elements endpoints
  common/         BaseEntity (id + timestamps), errors, Clock
  (each feature has a dto/ folder for its request and response records)
src/main/resources/
  db/migration/   Flyway schema migrations (V1, V2, ...)
  db/sample/      dev-only sample data
```

**Request flow:** Controller (HTTP + validation) → Service (business rules, transactions, entity ↔ DTO) → Repository (database). Entities never leave the service layer; the API only returns DTOs.

**Database changes:** never edit an applied migration. Add the next file, like `V7__add_something.sql`. Hibernate is set to `validate`, so the app won't start if an entity and the schema disagree.

## Your first feature: next lesson from the calendar ✅

> As an instructor, I want each student's next lesson to come from my calendar, so that I always see accurate schedule info without updating it twice.

Done: you built `NextLessonCalculator` for dated lessons. Lessons repeat weekly now (like the app), so it works out when each lesson next happens; `NextLessonCalculatorTest` has the rules.

## Notes

- `compose.yaml` passwords are for local development only. Use environment variables (`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`) when deploying.
- The dev sample data is a Flyway migration, so use the dev database only for development. Start production with a fresh database.
- The iPhone app doesn't call this API yet. The API now matches the app's model (weekly lessons, notes, programs, availability), so connecting them is the next step. The app's settings stay on the phone.
