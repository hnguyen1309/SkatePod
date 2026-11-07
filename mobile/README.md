# SkatePod iPhone app (Expo)

The iPhone version of the Figma Make prototype, built with Expo (React Native + TypeScript). The same code can run on Android later.

## Screens

| Tab | What you can do |
| --- | --- |
| **Home** | Today’s lesson count, search students, upcoming lessons |
| **Students** | Search and filter by discipline category, view a student’s snapshot, add, edit or delete students. Each student can have several disciplines (Learn to Skate, Freeskate, Skills, Pattern Dance…), each with its own level picked from a dropdown. |
| **Calendar** | Weekly schedule in Week or Day view, add or delete lessons, jump to notes. A lesson can’t be booked over another one (the app tells you whose lesson is in the way). Optional availability blocks: time outside them is greyed out a little, but you can still book there. The calendar fits the screen and scrolls inside: the hour labels stay on the left and the day names stay on top. Pinch (or tap − / +) to zoom, out to 12 hours × 7 days. |
| **Programs** | Pick track and level, build a program components sheet, draw the skating path on a rink with your finger and place elements |
| **Lessons** | Training history: every calendar lesson shows up once it starts, with or without notes. Add a past lesson with its note. Filter by student, time and level; select several to share or delete; write notes, skills and next steps |
| **Settings** (gear icon) | Coach profile, default lesson length, sharing default, export a backup, reset sample data |

Data is saved on the phone only. Every student and note in it is made-up sample data.

## First-time setup (Mac)

1. Install **Node.js LTS** from nodejs.org.
2. On your iPhone, install **Expo Go** from the App Store and create a free Expo account.
3. In Terminal:

```bash
cd SkatePod/mobile
sh setup.sh          # installs Expo and matching packages (one time)
npx expo login       # sign in with the same account as Expo Go
npx expo start
```

4. Scan the QR code with your iPhone camera. It opens SkatePod in Expo Go.

Your Mac and iPhone need to be on the same Wi-Fi. If they can’t see each other, run `npx expo start --tunnel`.

## Run the tests

```bash
npm test
```

This runs the unit tests in `src/*.test.ts` (for example `src/data.test.ts`) with Node's built-in test runner. They check the app's rules without opening the app, and GitHub runs them on every push too.

### UI tests on the iOS Simulator (Maestro)

The UI regression suite in `.maestro/` taps through the real app in Expo Go on the Simulator: tabs, students, calendar lessons and availability, the Lessons history, programs and settings. Each flow first resets the app to the sample data.

1. Install Maestro once. Either `brew install mobile-dev-inc/tap/maestro`, or download `maestro.zip` from github.com/mobile-dev-inc/maestro/releases and unzip it into `~/.maestro` (the script finds it there).
2. Start the app: `npx expo start`, then press **i** to open it in the iOS Simulator.
3. In a second terminal, from `mobile/`:

```bash
sh run-ui-tests.sh
```

Run one flow with `sh run-ui-tests.sh .maestro/03-students.yaml`. A full run takes about 10 minutes. Results (a JUnit report, plus screenshots of any failure) go to `ui-test-results/`, which git ignores. GitHub doesn't run these yet; they need a Mac with the Simulator.

What the first run found is in `UI-TEST-FINDINGS.md`. Dragging lessons, the time wheels, the rink map and the share sheet still need a check by hand.

## Why a setup script?

`setup.sh` installs the newest Expo SDK and lets Expo choose package versions that match it, so the app keeps working with the current Expo Go app. After it runs, `package.json` will list the exact versions. Commit that change.

## Project layout

```
mobile/
  App.tsx              header, bottom tabs, screen switching
  index.ts             app entry point
  src/data.ts          types, sample data, skating element catalog
  src/store.tsx        shared app data, saved on the phone
  src/components/      icons, buttons, fields, sheets, rink drawing
  src/screens/         one file per tab
```

## Known limits

- Notes, students and programs aren’t synced between phones yet (that needs a backend).
- “Share” sends the note as text through the iPhone share sheet. A real read-only link comes with the backend.
- The skating element rules are a sample catalog. Always check the current rulebook.
