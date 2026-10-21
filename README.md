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
| [`prototype/figma-make/`](prototype/figma-make/) | Web prototype exported from Figma Make (React + Vite + Tailwind). A visual reference, not the final app. |

Coming next: an iPhone-first app built with Expo (React Native + TypeScript), with Android support later.

## Run the prototype

```bash
cd prototype/figma-make
npm install
npm run dev
```

Then open the local link it prints (usually http://localhost:5173). Data is stored in your browser only, and all students and notes are made-up sample data.

## Roadmap

- [x] Customer discovery survey for coaches
- [x] Competitive analysis and product strategy
- [x] Paper sketches and Figma Make prototype
- [ ] Review survey results and talk with coaches
- [ ] Build v0 in Expo (student list, notes, checklist, links)
- [ ] Test with home-rink coaches via TestFlight
- [ ] Add backend and share links
- [ ] Launch (free) on the App Store

## Privacy

Many skaters are minors. SkatePod keeps student data minimal (first names or initials) and never needs student accounts in the MVP.
