# Interactive Keep — WebGL Interactable Websites

A 3D pixel-art medieval castle hub with a live day & night cycle, hosting 6 interactive WebGL, Three.js, and PixiJS games linked directly from the castle's towers, keep, yard, and drawbridge.

## Castle Sections & Games

| Route | Castle Section | Experience | Stack |
| :--- | :--- | :--- | :--- |
| `/bones/` | **Bell Spire** | **Spooky Bones** — interactive 3D dancing skeleton with dance routines & squat challenges | Three.js + React (pre-built) |
| `/splitshift/` | **Grand Keep** | **Splitshift** — retro CRT 4×4 wrap-around sliding tile puzzle with BFS solver | PixiJS + pixi-sound |
| `/chess2/` | **East War Tower** | **Chess 2** — throw pieces to capture, promote ranks, and trigger king waves | PixiJS + pixi-sound |
| `/poms/` | **West Bastion** | **Poms** — tap or press `QWERTYUIOP` to summon waves of Pomeranians | PixiJS |
| `/firewood/` | **Lumber Yard** | **Firewood Splitting Simulator** — 3D oak log splitting with physics kindling | Three.js + Basis WASM (pre-built) |
| `/roadtrip/` | **King's Drawbridge** | **Road trip** — drop cars into a passing pasture of dodging cows | PixiJS + pixi-sound |

## Features
- **3D Pixel Medieval Castle Hub**: Low-res pixelated Three.js castle with orbiting pixel Sun & Moon, smooth 72s day/night cycle (`Cycle / Day / Dusk / Night` toggle), dynamic 3D-projected castle pins, camera fly-to previews, and mobile-friendly zero-scroll dock.
- **Freeplay & Goals Across All 6 Games**: Unified top-right HUD with Freeplay/Goals toggle, collapsible mini-pill, and persistent best streaks (`localStorage`).
- **3-Tier Progressive Difficulty**: Every game ramps up after Round 4 — **Rounds 1–4 (`Standard`)** → **Rounds 5–8 (`Hard`)** → **Rounds 9+ (`Master`)** with tighter clocks/caps, added constraints, and unlocked Hard+ goals.
- **Editorial Photo PNG Score Cards**: Downloadable `1200×630` PNG score cards stamped with player name, round/tier, streak, and best streak over each game's photography.
- **Unified Sound & SEO**: Consistent bottom-left mute toggles across audio games, plus Open Graph / Twitter preview cards and favicons for the hub and every game.

## Run Locally

Serve the root directory over HTTP (do not open `index.html` via `file://`):

```powershell
npx serve . -l 4000
```

Then open `http://localhost:4000` — all 6 games are linked automatically via `./<folder>/`.

## Deploy on Vercel (Root Hub + Linked Subfolders)

Import this repository as a **single Vercel project** using the root directory:
1. **Root Directory**: `.` *(default)*
2. **Framework Preset**: `Other`
3. **Build Command**: *(empty)*
4. **Output Directory**: *(empty)*

[vercel.json](./vercel.json) enforces `trailingSlash: true` (so `/bones` redirects cleanly to `/bones/` and relative `./assets/` paths always resolve) and sets immutable caching for static media. Each game folder is also self-contained, and `vercelUrl` in [games.config.js](./games.config.js) can optionally point any game to an external deployment later.

## License

MIT License — see [LICENSE](./LICENSE). Third-party 3D model, audio, and open-source library attributions are preserved in their respective files.
