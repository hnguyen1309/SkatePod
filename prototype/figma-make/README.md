# SkatePod (Figma Make export)

The web prototype code from the Figma Make file "Figure Skating Training Platform", exported Oct 20, 2026.

## Run it on your Mac

1. Install Node.js (LTS) from nodejs.org if you don't have it.
2. Unzip this folder, open Terminal, and go into it:
   `cd ~/Downloads/skatepod-figma-make`
3. Install packages: `npm install`
4. Start it: `npm run dev`
5. Open the link it prints (usually http://localhost:5173).

## Good to know

- This is a **web** app (React + Vite + Tailwind), not an iPhone app. Use it as a visual and logic reference for the Expo version.
- Data is saved in your browser only (localStorage). Clear site data to reset.
- All students, coaches and notes are made-up sample data.
- `vite.config.ts` was simplified so it runs outside Figma; the screens and logic are unchanged.
