# Running SkatePod locally

Quick notes for starting the database, the backend and the iPhone app on my Mac.
Use one Terminal tab for the backend and one for the app.

## 1. Database (PostgreSQL 17, installed with Homebrew)

PostgreSQL starts by itself when I log in. To check it's running:

```bash
pg_isready -h localhost          # should say "accepting connections"
```

If it isn't running:

```bash
brew services start postgresql@17
```

Stop it with `brew services stop postgresql@17`.

**Connection details** (the same in the backend config and the VS Code PostgreSQL extension):

| Field | Value |
| --- | --- |
| Host | `localhost` |
| Port | `5432` |
| Database | `skatepod` |
| User | `skatepod` |
| Password | `skatepod` |

**One-time setup** (already done on this Mac, only needed on a new one):

```bash
brew install postgresql@17
brew services start postgresql@17
psql postgres -c "CREATE ROLE skatepod WITH LOGIN PASSWORD 'skatepod';"
psql postgres -c "CREATE DATABASE skatepod OWNER skatepod;"
```

**Start over with fresh sample data:**

```bash
dropdb skatepod && createdb -O skatepod skatepod
```

Then start the backend again. It recreates the tables and the sample students and lessons.

## 2. Backend (Spring Boot API)

```bash
cd ~/SkatePod/backend
./mvnw spring-boot:run           # API on http://localhost:8080/api
```

Check it at http://localhost:8080/api/students. Stop it with **Ctrl+C**.

On the first start, Flyway creates the tables and loads the sample data.

Run the tests with `./mvnw test`.

## 3. Front end (Expo iPhone app)

```bash
cd ~/SkatePod/mobile
npx expo start                   # scan the QR code with the iPhone camera
```

My Mac and iPhone need to be on the same Wi-Fi. If the phone can't connect, use `npx expo start --tunnel`.
Stop it with **Ctrl+C**.

**Students on the backend (optional).** Without setup, the app keeps everything on the phone. To save students on the backend instead:

1. Find my Mac's Wi-Fi address: **System Settings → Wi-Fi → Details** (something like `192.168.1.20`).
2. In `mobile/`, copy `.env.example` to `.env` and put that address in it: `EXPO_PUBLIC_API_URL=http://192.168.1.20:8080/api`
3. Start the backend (step 2), then restart Expo (`npx expo start`). Expo only reads `.env` when it starts.
4. In the app: **Settings → Test connection**. It should say "Connected".

Every tap that saves a student prints a line in both terminals: `→ POST /students 201` in the Expo terminal and `POST /api/students → 201` in the backend terminal. Lessons, notes and programs still stay on the phone, so lessons of the phone's old sample students show as "Removed student" for now. The phone has to be on the same Wi-Fi as the Mac, even with `--tunnel`. Delete `.env` (and restart Expo) to go back to phone-only.

UI tests (Maestro, on the iOS Simulator): with `npx expo start` running and the app open in the Simulator (press **i**), run `sh run-ui-tests.sh` from `mobile/` in a second terminal. It resets the app to sample data. Setup steps are in `mobile/README.md`.

## Seeing the database

In VS Code, open the **PostgreSQL** (elephant) icon in the sidebar and use the connection details above. The tables are under
**Databases → skatepod → Schemas → public → Tables**.

## If something goes wrong

| Problem | Fix |
| --- | --- |
| "Connection refused" on port 5432 | PostgreSQL isn't running: `brew services start postgresql@17` |
| "password authentication failed" | The `skatepod` user is missing or has a different password. Run the one-time setup again. |
| No tables in the database | The backend hasn't run yet. Start it once. |
| Backend won't start: schema validation error | An entity and the database disagree. Add a new migration, don't edit an old one. |
| Port 8080 already in use | Another backend is still running. Stop it with Ctrl+C in its tab. |
