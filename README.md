# ⛸️ SkatePod

> *Because your love is on the ice, not the shuffle.*

SkatePod is a coach-first app for figure skating coaches: one home for each student's lesson notes, practice checklist, music and program files, and competition links, so coaches spend less time hunting for details and more time teaching.

**Status:** Early stage personal project (discovery and prototyping). Not yet released.

## Vision

Skating away from endless juggling of details, so coaches can be on the ice teaching.

## Who it's for

1. **Coaches at our home rink** who teach private lessons (first users)
2. **Their students**, starting with a read-only share link
3. **Later:** coaches at other Atlanta-area rinks

## Strategies

- **Coach-experience centric**, because existing apps are mostly built around skaters or billing.
- **Keep it simple and organized**, because coaches have many students to manage.
- **Work alongside existing tools** (Google Drive, Skater Stats), because coaches already have habits, which makes adoption easier.

## MVP scope

**In:** student list · quick lesson notes (newest first) · practice checklist · links to Drive files, music and competition documents · read-only share link

**Not now:** live competition-requirements lookup · payments and invoicing · skater accounts · wearables · hosting music files

## What's in this repo

| Folder | What it is |
| --- | --- |
| [`mobile/`](mobile/) | **The iPhone app** (Expo, React Native + TypeScript). Android-ready later. |
| [`backend/`](backend/) | **REST API** (Spring Boot 4 + PostgreSQL): students and lessons with DTOs, validation and Flyway migrations. |
| [`prototype/figma-make/`](prototype/figma-make/) | Original web prototype from Figma Make (React + Vite + Tailwind). Kept as a design reference. |

## Run the iPhone app

Install Expo Go on your iPhone, then on your Mac:

```bash
cd mobile
sh setup.sh        # one-time install
npx expo login     # same account as Expo Go
npx expo start     # scan the QR code with your iPhone
```

Full steps are in [`mobile/README.md`](mobile/README.md). All students and notes are made-up sample data, stored on the phone only.

## Run the backend

```bash
cd backend
docker compose up -d   # PostgreSQL
./gradlew bootRun      # API on http://localhost:8080
```

Details in [`backend/README.md`](backend/README.md).

## Run the web prototype

```bash
cd prototype/figma-make
npm install
npm run dev
```

## Roadmap

- [x] Customer discovery survey for coaches
- [x] Competitive analysis and product strategy
- [x] Paper sketches and Figma Make prototype
- [ ] Review survey results and talk with coaches
- [x] Port the Figma Make prototype to an Expo iPhone app
- [ ] Try it on a real iPhone and fix what feels off
- [ ] Trim to the coach MVP based on survey results
- [ ] Test with home-rink coaches via TestFlight
- [x] Backend scaffold: Spring Boot + PostgreSQL (students, lessons)
- [ ] Feature #2: next lesson from the calendar
- [ ] Connect the app to the backend, then add share links
- [ ] Launch (free) on the App Store

## Privacy

Many skaters are minors. SkatePod keeps student data minimal (first names or initials) and never needs student accounts in the MVP.
