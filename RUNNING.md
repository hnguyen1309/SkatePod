# Running SkatePod locally

Quick notes for starting the database, the backend and the iPhone app on my Mac.

Pick a setup:

- **[A. UI only](#a-ui-only-no-backend)**: just the app on the phone. Everything is saved on the phone. Use this to check screens, layout and text.
- **[B. Front to back](#b-front-to-back-app--backend--database)**: the app saves students, lessons, notes and programs on the backend (PostgreSQL). Use this to check that data really goes through the API.

The app picks the mode from one line in `mobile/.env`, `EXPO_PUBLIC_API_URL`. If the line is there, the app uses the backend. If it's missing or commented out with `#`, everything stays on the phone. Expo only reads `.env` when it starts, so **restart Expo after every change to it**.

## A. UI only (no backend)

One Terminal tab.

1. **Turn the backend off in the app.** Open `mobile/.env` and put a `#` in front of the `EXPO_PUBLIC_API_URL=` line, or delete the file. (No `.env` at all is fine too.)
2. **Start Expo:**

   ```bash
   cd ~/SkatePod/mobile && npx expo start
   ```

   If the phone isn't on the Mac's Wi-Fi, or can't connect, use `npx expo start --tunnel`.
3. **Open the app:** scan the QR code with the iPhone camera. It opens in Expo Go.
4. **Check the mode:** in the app, **Settings → Backend** should say "Not set up: everything is stored on this phone."

Good to know:
- The phone starts with made-up sample data. **Settings → Reset to sample data** brings it back.
- Changes to the code show on the phone as soon as you save the file. Shake the phone (or press **r** in the Expo tab) to reload.
- Music file upload on Programs needs the backend, so it doesn't work here. Music links do.
- Stop with **Ctrl+C** in the Expo tab.

## B. Front to back (app → backend → database)

Three Terminal tabs: **backend**, **tunnel** and **Expo**. The tunnel lets the phone reach the backend from any network, so this works on any Wi-Fi, or on mobile data.

1. **Database.** It usually starts on its own when I log in. Check it:

   ```bash
   pg_isready -h localhost
   ```

   It should say "accepting connections". If it doesn't: `brew services start postgresql@17`.
2. **Backend** (tab 1):

   ```bash
   cd ~/SkatePod/backend && ./mvnw spring-boot:run
   ```

   Wait for "Started SkatePodApplication". To check it, open http://localhost:8080/api/students on the Mac.
3. **Tunnel** (tab 2):

   ```bash
   cloudflared tunnel --url http://localhost:8080
   ```

   Look for the box that says "Your quick Tunnel has been created!" and copy the address in it, like `https://something-random.trycloudflare.com`. **Leave this tab open.** Closing it ends the tunnel. (The first time on a Mac, run `brew install cloudflared` first.)
4. **Put the address in `mobile/.env`**, adding `/api` to the end, and remove any `#` in front:

   ```
   EXPO_PUBLIC_API_URL=https://something-random.trycloudflare.com/api
   ```

5. **Expo** (tab 3). If it's already running, stop it with Ctrl+C first, so it reads the new `.env`:

   ```bash
   cd ~/SkatePod/mobile && npx expo start --tunnel
   ```

   Scan the QR code with the iPhone camera.
6. **Check the connection:** in the app, **Settings → Test connection**. It should say "Connected" and how many students the backend has.

**Every time, the tunnel address is new.** Each time `cloudflared` starts it gets a different address, so redo steps 3–5 (new address in `.env`, restart Expo). The backend and the database can keep running.

What you'll see:
- Every save prints a line in two tabs: `→ PUT /lessons/… 200` in the Expo tab and `PUT /api/lessons/… → 200` in the backend tab.
- The app shows the backend's data (the sample data in the dev database), not the phone's.
- The Lessons tab asks the backend for notes once a minute (`GET /api/notes`). That's when the backend adds an entry for each lesson that has started.
- Programs save when you tap **Save program** (`POST` or `PUT /api/programs`). An uploaded music file shows as `POST /api/music` and is kept in `backend/uploads/music`.
- Availability and settings still stay on the phone for now.

When you're done, press **Ctrl+C** in the tunnel tab. Anyone with the link can reach the dev backend (there's no login), so keep only made-up sample data in it and don't leave the tunnel running. To go back to UI only, follow guide A, step 1 and restart Expo.

**Same Wi-Fi instead of a tunnel?** If the phone and the Mac are on the same Wi-Fi, you can skip the tunnel. In step 4, use the Mac's Wi-Fi address (**System Settings → Wi-Fi → Details**, like `192.168.1.20`): `EXPO_PUBLIC_API_URL=http://192.168.1.20:8080/api`. Then start Expo with `npx expo start` (no `--tunnel`). The iOS Simulator can use `http://localhost:8080/api`.

The sections below have more detail on each part.

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

Do this after pulling a change with a new migration (a new `V…sql` file) too. Otherwise the backend stops with "Detected resolved migration not applied to database", because the sample data is already in.

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

To use the backend from the app, see [guide B](#b-front-to-back-app--backend--database) at the top.

UI tests (Maestro, on the iOS Simulator): with `npx expo start` running and the app open in the Simulator (press **i**), run `sh run-ui-tests.sh` from `mobile/` in a second terminal (regression + edge cases; add a folder or file to run less, like `.maestro/edge-cases`). It resets the app to sample data. Setup steps are in `mobile/README.md`.

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
