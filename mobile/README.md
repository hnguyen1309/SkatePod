# SkatePod iPhone app (Expo)

The iPhone version of the Figma Make prototype, built with Expo (React Native + TypeScript). The same code can run on Android later.

## Screens

| Tab | What you can do |
| --- | --- |
| **Home** | Today’s lesson count, search students, upcoming lessons |
| **Students** | Search and filter by discipline category, view a student’s snapshot, add, edit or delete students. Each student can have several disciplines (Learn to Skate, Freeskate, Skills, Pattern Dance…), each with its own level picked from a dropdown. |
| **Calendar** | Weekly schedule in Week or Day view, add or delete lessons, jump to notes. A lesson can’t be booked over another one (the app tells you whose lesson is in the way). |
| **Programs** | Pick track and level, build a program components sheet, draw the skating path on a rink with your finger and place elements |
| **Notes** | Lesson notes (newest first), search, write and share notes, skills, next steps |
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
