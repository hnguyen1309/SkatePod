# SkatePod API (Spring Boot)

REST API for the SkatePod app: students and their weekly lessons, stored in PostgreSQL.

**Stack:** Java 21 · Spring Boot 4.1 · Spring Data JPA · Bean Validation · Flyway · PostgreSQL 17 · Gradle

## Run it locally (Mac)

You need **Docker Desktop** (for the database). Java 21 is downloaded automatically by Gradle if you don't have it.

```bash
cd backend
docker compose up -d      # start PostgreSQL
./gradlew bootRun         # start the API on http://localhost:8080
```

`bootRun` uses the **dev** profile, which loads made-up sample students and lessons. Try it:

```bash
curl http://localhost:8080/api/students
```

Or open `requests.http` in VS Code (REST Client extension) or IntelliJ and click **Send Request**.

Run the tests:

```bash
./gradlew test
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
| GET | `/api/lessons?studentId=` | List lessons in week order (optionally for one student) |
| GET | `/api/lessons/{id}` | One lesson |
| POST | `/api/lessons` | Schedule a lesson → 201 |
| PUT | `/api/lessons/{id}` | Update a lesson |
| DELETE | `/api/lessons/{id}` | Delete a lesson → 204 |

Errors come back as JSON "problem details": **400** for invalid input (with the field errors) and **404** for unknown IDs.

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
2. Run `./gradlew test` and watch 5 of its 6 tests fail (red). The "no lessons" one already passes.
3. Implement `NextLessonCalculator.findNext()` until they all pass (green).
4. Run the app and `GET /api/students`: each student's `nextLesson` is now filled in.

## Notes

- `compose.yaml` passwords are for local development only. Use environment variables (`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`) when deploying.
- The dev sample data is a Flyway migration, so use the dev database only for development. Start production with a fresh database.
- The iPhone app doesn't call this API yet. Connecting them is a later step.
