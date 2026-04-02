# Product Requirements Document (PRD)
## Artemis II "Integrity" Interactive Mission Dashboard

### 1. Executive Vision and Strategic Context
**Product Purpose:** To provide a synchronized 3D mission chronology and real-time telemetry feed of the historic Artemis II flight. This dashboard translates complex aerospace data into a premium, interactive data visualization experience that tells the story of human survival and technical validation in deep space.

**Target Audience:** Tech professionals, Product Managers, Founders, and Designers (e.g., the LinkedIn tech community).

**The "So What?" Layer:** The average professional does not intuitively grasp the sheer scale of the Earth-Moon system or the risks of deep space. This dashboard's core value is creating an "Aha!" moment of scale and translating raw DSN (Deep Space Network) telemetry into an accessible, gripping narrative. It is "Stripe builds Mission Control."

---

### 2. Visual Identity & Telemetry UI Framework

**Implemented aesthetic: Terminal Mission Control**

The UI uses a strictly monochromatic, monospace terminal aesthetic — no gradients, no glow effects, no color outside of functional states. This is a deliberate departure from the "Premium Fintech" direction toward something that feels more like real mission control software.

- **Color Palette:** Pure black (`#000000`) background, white text, layered grey accents (`#222`, `#444`, `#666`, `#888`, `#ccc`). Red (`#ff3333`) for live/active state only.
- **Typography:** Monospace throughout (`fontFamily: 'monospace'`). All labels in uppercase with wide letter-spacing. Numbers use tabular rendering.
- **Data Layout:** Sparse — labels are small (`0.625rem`), values are readable (`0.875rem`). No card borders, no backgrounds on HUD elements.
- **3D Spacecraft:** A procedural directional chevron + crosshair ring (white, `meshBasicMaterial`). No GLB model loaded. Orients along spline tangent in real time.

---

### 3. The Interactive 3D Canvas & Navigation Engine

**Implemented in `SceneCanvas.tsx` and `OrionModel.tsx`.**

#### Coordinate System
- `1 scene unit = 1,000 km`
- Trajectory `y` → scene `-Z` (Earth→Moon depth axis)
- Trajectory `z` → scene `Y` (orbital inclination / out-of-plane)
- Trajectory `x` → scene `X` (lateral drift)
- Earth radius: `6.371` scene units (true proportional)
- Moon radius: `3.5` scene units (exaggerated for visibility; real ≈ 1.737)
- Moon position: `(0, 0, -384.4)` scene units

#### Dual-Mode Camera System (implemented)
1. **Ship Mode (`cameraMode: 'ship'`):** OrbitControls target lerps to spacecraft position each frame. User can orbit/zoom around the ship freely.
2. **Overview Mode (`cameraMode: 'overview'`):** Camera lerps toward `OVERVIEW_CAM = (5, 15, 18)`, target lerps to `OVERVIEW_TGT = (0.5, -1.5, -30)`. Frames Earth and the beginning of the trajectory arc.

#### Trajectory Rendering
- 300-point pre-sampled `CatmullRomCurve3` drawn with `@react-three/drei Line`
- Past segment: `#5090ff`, `lineWidth 1.8`, `opacity 0.9`
- Future segment: `#1a3070`, `lineWidth 1.0`, `opacity 0.35`
- Split point updates each frame based on `currentMissionTime`

---

### 4. HUD Layout & Component Map

**Implemented in `App.tsx` as an absolute overlay using flexbox.**

```
┌─────────────────────────────────────────────┐
│ TelemetryStrip          MissionIdentity      │  ← Top bar
├──────────┬──────────────────────┬────────────┤
│          │                      │            │
│ Hardware │     3D Scene         │  Event     │  ← Mid section
│ Controls │                      │  Timeline  │
│          │                      │            │
├──────────┴──────────────────────┴────────────┤
│              PhaseScrubber                   │  ← Bottom bar
└─────────────────────────────────────────────┘
```

#### `TelemetryStrip` (top-left)
Four always-visible metrics in a horizontal row:
- DIST. EARTH (km)
- DIST. MOON (km, calculated as `384,400 − distanceFromEarth`)
- VELOCITY (km/s)
- PHASE (abbreviated: LAUNCH / TLI STAGE / T-CRUISE / FLYBY / ENTRY)

#### `MissionIdentity` (top-center)
- Mission name: `ARTEMIS II — INTEGRITY`
- When at `LAST` index: pulsing red dot + phase label (LIVE state)
- Otherwise: phase label | MET formatted as `T+Xd Xh Xm`

#### `HardwareControls` (left-mid)
- PAN / ROTATE toggle buttons (active = white fill, black text)
- Vertical zoom slider (drag-to-scrub, `ns-resize`, visual only)
- SYNC TO SHIP button → sets `cameraMode: 'ship'`
- 3D PERSPECTIVE / TOP-DOWN RADAR toggle → toggles `cameraMode`

#### `EventTimeline` (right-mid)
Seven clickable mission events. Clicking jumps `currentMissionTime` to that index and pauses playback. Past events at full opacity, future at 30%. Current event marked with `▓` and white right-border.

Events:
- idx 0 — SLS LAUNCH / CORE JETTISON
- idx 9 — TRANSLUNAR INJECTION BURN
- idx 15 — T-COAST / PERIAPSIS PASS
- idx 24 — LUNAR SOI ENTRY
- idx 29 — LUNAR FLYBY / FREE RETURN
- idx 40 — EARTH RETURN PHASE
- idx 48 — REENTRY / SPLASHDOWN

#### `PhaseScrubber` (bottom-center, max-width 60rem)
- PLAY / PAUSE button (800 ms per step via `setInterval`)
- Invisible `<input type="range">` overlaid on a custom track
- White vertical thumb at current progress
- Six phase tick marks (LAUNCH, TLI, TRANSIT, FLYBY, RETURN, REENTRY)
- LIVE dot (pulsing red when at last index)

---

### 5. Telemetry Data

**50 waypoints in `mockTrajectory.json`** spanning 2025-04-07 to 2025-04-17 (10 days, one point per ~4.8 hours).

Each waypoint:
```json
{ "timestamp": "ISO8601", "x": km, "y": km, "z": km, "velocity": km/s, "distanceFromEarth": km }
```

Trajectory covers: LEO departure → TLI → deep space coast → lunar closest approach (~460,000 km apogee) → free return → reentry corridor.

---

### 6. State Management

**Zustand store (`missionStore.ts`)**

| Field | Type | Description |
|---|---|---|
| `currentMissionTime` | `number` | Current waypoint index (0–49) |
| `isPlaying` | `boolean` | Playback active |
| `trajectory` | `StateVector[]` | Full 50-point array |
| `currentVector` | `StateVector` | Waypoint at current index |
| `cameraMode` | `'ship' \| 'overview'` | Camera follow mode |
| `controlMode` | `'pan' \| 'rotate'` | Active mouse mode (visual only) |
| `zoomLevel` | `number` | 0–100 visual zoom indicator |

---

### 7. Technical Requirements & WebGL Notes

- Camera `near: 0.1`, `far: 1000` (sufficient for 1 unit = 1,000 km scene; Moon at 384.4 units)
- OrbitControls: `minDistance: 0.08`, `maxDistance: 250`
- Stars: `radius 200`, `count 7000`, procedural via `@react-three/drei Stars`
- No HDRI, no heavy textures — Earth/Moon are `meshPhongMaterial` colored spheres
- Lighting: directional sun `(500, 200, 300)` intensity 2.8, ambient `0.12`, rim point light
- `OrionModel` uses scratch `THREE.Vector3` refs to avoid GC pressure in `useFrame`

---

### 8. Success Criteria

The dashboard succeeds if a non-space-professional can answer these questions within a few seconds:

1. Where is Orion right now?
2. Is it going to the Moon or coming back?
3. How far is it from Earth and the Moon?
4. What major milestone just happened or is coming next?
5. Why is this moment significant?

If the visualization answers those questions without needing aerospace knowledge, the product is working.
