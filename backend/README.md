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
| GET | `/api/students` | List students, each with their next lesson |
| GET | `/api/students/{id}` | One student |
| POST | `/api/students` | Create a student → 201 |
| PUT | `/api/students/{id}` | Update a student |
| DELETE | `/api/students/{id}` | Delete a student and their lessons → 204 |
| GET | `/api/disciplines` | Every discipline with its category and levels (lowest first) |
| GET | `/api/lessons?studentId=` | List lessons in calendar order (optionally for one student) |
| GET | `/api/lessons/{id}` | One lesson |
| POST | `/api/lessons` | Schedule a lesson → 201 |
| PUT | `/api/lessons/{id}` | Update a lesson |
| DELETE | `/api/lessons/{id}` | Delete a lesson → 204 |

Errors come back as JSON "problem details": **400** for invalid input (with the field errors), **404** for unknown IDs and **409** for a double booking.

A coach can only teach one lesson at a time, so a new or moved lesson can't overlap another lesson that day, for any student. The API answers with a 409 that says which lesson is in the way. Back-to-back lessons are fine (one ending at 9:45 and the next starting at 9:45).

A lesson's `type` must be exactly `Public`, `Freestyle` or `Off-ice`. The API answers anything else with a 400, and the database refuses it too.

A student has a list of `disciplines`, which can be empty. Each item has a discipline (for example `STANDARD_FREESKATE`), a track (`CHAMPIONSHIP`, `EXCEL` or `ADULT`, the same tracks as the app's Programs panel) and a level from that discipline's own ladder (for example `Pre-Gold`). The track isn't shown on the student profile; it's there so the Programs panel can be filled in. Using a level from another discipline, or listing the same discipline twice, returns a 400 that explains what's wrong. The full list is in `Discipline.java` and at `GET /api/disciplines`.

## How the code is organized

```
src/main/java/com/skatepod/api/
  student/        Student entity, repository, service, controller
    dto/          StudentRequest (input + validation), StudentResponse, NextLessonResponse
    NextLessonCalculator.java   ← feature #2, yours to build
  lesson/         Lesson entity, repository, service, controller
    dto/          LessonRequest, LessonResponse
  common/         BaseEntity (id + timestamps), errors, Clock
src/main/resources/
  db/migration/   Flyway schema migrations (V1, V2, ...)
  db/sample/      dev-only sample data
```

**Request flow:** Controller (HTTP + validation) → Service (business rules, transactions, entity ↔ DTO) → Repository (database). Entities never leave the service layer; the API only returns DTOs.

**Database changes:** never edit an applied migration. Add a new file like `V2__add_student_notes.sql`. Hibernate is set to `validate`, so the app won't start if an entity and the schema disagree.

## Your first feature: next lesson from the calendar 🎯

> As an instructor, I want each student's next lesson to come from my calendar, so that I always see accurate schedule info without updating it twice.

1. Open `src/test/java/.../student/NextLessonCalculatorTest.java` and delete the `@Disabled` line.
2. Run `./mvnw test` and watch 5 of its 7 tests fail (red). The two that expect "not scheduled" already pass.
3. Implement `NextLessonCalculator.findNext()` until they all pass (green).
4. Run the app and `GET /api/students`: each student's `nextLesson` is now filled in.

## Notes

- `compose.yaml` passwords are for local development only. Use environment variables (`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`) when deploying.
- The dev sample data is a Flyway migration, so use the dev database only for development. Start production with a fresh database.
- The iPhone app doesn't call this API yet. Connecting them is a later step.
