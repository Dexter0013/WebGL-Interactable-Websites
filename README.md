# WebGL Interactable Websites

A collection of 6 self-contained static interactive WebGL, Three.js, and PixiJS web experiences — each deployable on its own or together via the root hub.

## Projects

| Folder | Experience | Stack |
| :--- | :--- | :--- |
| `bones/` | **Spooky Bones** — interactive 3D dancing skeleton with dance challenges | Three.js + React (pre-built) |
| `chess2/` | **Chess 2** — throw, promote, and trigger king waves | PixiJS + pixi-sound |
| `firewood/` | **Firewood Splitting Simulator** — 3D wood splitting on a stump | Three.js + Basis WASM (pre-built) |
| `poms/` | **Poms** — tap or press `QWERTYUIOP` to summon running Pomeranians | PixiJS |
| `roadtrip/` | **Road trip** — drop cars into a pasture of dodging cows | PixiJS + pixi-sound |
| `splitshift/` | **Splitshift** — 4×4 wrap-around sliding tile puzzle with BFS solver | PixiJS + pixi-sound |

## Features
- **Freeplay & Challenge Modes**: Toggle between sandbox freeplay and randomized goals across `bones`, `chess2`, `firewood`, `poms`, and `roadtrip`.
- **Persistent Best Streaks & Score Cards**: Saves personal best streaks in `localStorage` and exports a `1200×630` PNG score card using each game's artwork.
- **Unified Sound Controls**: Consistent bottom-left mute toggle across `chess2`, `firewood`, `roadtrip`, and `splitshift`.
- **Responsive UI**: Safe-area mobile layout with collapsible compact HUD plus proportional scaling for large/4K screens.

## Run Locally

Each folder is a standalone static site (serve over HTTP rather than opening `index.html` via `file://`):

```powershell
npx serve bones -l 4001
npx serve chess2 -l 4002
npx serve firewood -l 4003
npx serve poms -l 4004
npx serve roadtrip -l 4005
npx serve splitshift -l 4006
# Or run the hub with all games:
npx serve . -l 4000
```

## Deploy Each Folder as a Separate Website on Vercel

Import this repository in Vercel once per site and set:
1. **Root Directory**: `bones`, `chess2`, `firewood`, `poms`, `roadtrip`, `splitshift` (or `.` for the hub)
2. **Framework Preset**: `Other`
3. **Build Command**: *(empty)*
4. **Output Directory**: *(empty / `.`)*
5. **Ignored Build Step** *(optional)*: `git diff HEAD^ HEAD --quiet .`

## License

MIT License — see [LICENSE](./LICENSE). Third-party 3D model, audio, and open-source library attributions are preserved in their respective files.
