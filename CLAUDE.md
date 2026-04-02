# Artemis II Mission Tracker

## Project Overview
A live mission tracking canvas for NASA's Artemis II 10-day crewed lunar flyby mission. Displays a 3D interactive spacecraft marker alongside real-time mission telemetry, timeline, and event data. Built as a single-page "Mission Control" dashboard.

## Tech Stack
- **Framework**: React 18 + TypeScript (strict mode)
- **Build tool**: Vite
- **3D rendering**: React Three Fiber (R3F) + Three.js
- **3D helpers**: @react-three/drei (OrbitControls, Stars, Line, etc.)
- **State management**: Zustand (`useMissionStore`)
- **Deployment**: Netlify (static site, no SSR)

## Project Structure
```
src/
  components/
    SceneCanvas.tsx        # R3F Canvas, Earth, Moon, TrajectoryLine, CameraController
    OrionModel.tsx         # Directional chevron/crosshair marker (no GLB)
    HUD/
      TelemetryStrip.tsx   # Top-left: dist/velocity/phase metrics strip
      MissionIdentity.tsx  # Top-center: mission name, phase, MET
      HardwareControls.tsx # Left-mid: camera mode, pan/rotate toggle, zoom slider
      EventTimeline.tsx    # Right-mid: clickable mission event list
      PhaseScrubber.tsx    # Bottom-center: play/pause + timeline scrubber
  store/
    missionStore.ts        # Zustand store: currentMissionTime, cameraMode, controlMode, etc.
  data/
    mockTrajectory.json    # 50 waypoints over 10 days (km coordinates)
    missionCurve.ts        # CatmullRomCurve3 + coordinate mapping (1 unit = 1,000 km)
  App.tsx                  # Root: absolute HUD shell layered over SceneCanvas
  main.tsx
  index.css
public/
  models/
    orion.glb              # (present but not used — marker shape used instead)
```

## Coordinate System
- `1 scene unit = 1,000 km`
- `traj.y → scene -Z` (Earth→Moon depth axis)
- `traj.z → scene Y` (orbital inclination)
- `traj.x → scene X` (lateral drift)
- Earth radius: `6.371 units`, Moon radius: `3.5 units` (exaggerated for visibility)
- Moon position: `(0, 0, -384.4)` scene units

## HUD Layout (App.tsx)
Absolute-positioned overlay using flexbox with `pointerEvents: none` on the container, `pointerEvents: auto` on each child:
- **Top bar**: `TelemetryStrip` (left) + `MissionIdentity` (center/right)
- **Mid section**: `HardwareControls` (left) + `EventTimeline` (right)
- **Bottom bar**: `PhaseScrubber` (centered, max-width 60rem)

## Store Shape (`missionStore.ts`)
```ts
currentMissionTime: number      // 0–49, index into trajectory
isPlaying: boolean
trajectory: StateVector[]
currentVector: StateVector
cameraMode: 'ship' | 'overview'
controlMode: 'pan' | 'rotate'
zoomLevel: number               // 0–100 (visual only, not wired to camera)
```

## Conventions
- All components are TypeScript `.tsx` — no `.js` or `.jsx`
- No class components — hooks only
- Global styles in `src/index.css` — no CSS modules
- Do not add error boundaries or retry logic beyond what the task needs
- HUD components live in `src/components/HUD/`
- All inline styles use `rem` units for fluid responsiveness (not `px`)
- `OrionModel` renders a procedural chevron + crosshair ring — no GLB loading
- Camera controller uses `useFrame` lerp; do not use `setInterval` for animation

## Design Direction
- Terminal / mission control monospace aesthetic (no gradients, no glows in HUD)
- Black background (`#000000`), white text, grey accents (`#444`, `#666`, `#888`)
- Active states: white fill with black text (inverted)
- Live indicator: pulsing red dot (`#ff3333`)
- 3D scene: deep navy Earth, grey Moon, blue trajectory line, white crosshair marker

## Camera Modes
- **overview**: Lerps camera and OrbitControls target toward `OVERVIEW_CAM / OVERVIEW_TGT`
- **ship**: OrbitControls target lerps to ship position each frame; user orbits freely around it

## Deployment Notes
- Netlify auto-deploys from the `main` branch
- Build command: `npm run build`
- Publish directory: `dist`
- No environment variables required
