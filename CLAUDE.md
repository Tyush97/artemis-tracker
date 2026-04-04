# Artemis II Mission Tracker

## Project Overview
A high-fidelity, live mission tracking dashboard for NASA's Artemis II 10-day crewed lunar flyby mission. Integrates real-world NASA OEM trajectory data (3,212 points) with live JPL Horizons telemetry via serverless proxies. Displays a 3D interactive spacecraft chevron alongside real-time mission telemetry, timeline, and event data.

## Mission Status
**Artemis II has launched (as of April 2026).** The mission is live/in-progress. `isLive` will be `true` for users visiting the tracker.

### Live Telemetry Architecture
- **JPL Horizons** (`/api/horizons-proxy`) is the sole live data source. It returns geocentric EME2000 state vectors (x, y, z, vx, vy, vz in km / km/s) which `TelemetryStrip` uses to compute distance-to-Earth, distance-to-Moon, and velocity magnitude directly.
- **`nasa.gov/trackartemis`** is a Unity WebGL 3D visualization — not a JSON API. It cannot be parsed for telemetry data. The `useARTOWTelemetry` hook and `/api/nasa-proxy` have been removed as dead code.
- `TelemetryData`, `telemetry`, and `setTelemetry` have been removed from the store — all live metrics come from `actualCurrentVector` (Horizons).

## Tech Stack
- **Framework**: React 18 + TypeScript (strict mode)
- **Build tool**: Vite
- **3D rendering**: React Three Fiber (R3F) + Three.js
- **State management**: Zustand (`useMissionStore`)
- **Backend/Proxies**: Vercel Serverless Functions (`/api/horizons-proxy`)
- **Deployment**: Vercel (Production)

## Project Structure
```
api/
  horizons-proxy.ts        # JPL Horizons API bridge (State Vectors)
  nasa-proxy.ts            # NASA TrackArtemis API bridge (Distances)
src/
  components/
    SceneCanvas.tsx        # R3F Canvas, Earth, Moon, TrajectoryLine
    OrionModel.tsx         # Directional chevron + white concentric ripples (LIVE mode)
    HUD/
      TelemetryStrip.tsx   # Top-left: Real-time Dist/Vel (Historic/Live/Projected)
      PhaseScrubber.tsx    # Bottom: Capped scrubber [0, Live] with status indicators
      MissionIdentity.tsx  # Top-center: Mission name + phase
      MissionElapsed.tsx   # Top-right: Live MET clock + UTC
      EventTimeline.tsx    # Right sidebar: milestone feed (desktop only)
      HardwareControls.tsx # Left sidebar: camera/zoom controls (desktop only)
  store/
    missionStore.ts        # Zustand: currentMissionTime, isLive, actualTrajectory, etc.
  hooks/
    useHorizonsTelemetry.ts # Periodic JPL Horizons polling (sole live data source)
    useIsMobile.ts          # Returns true when viewport < 640px
  data/
    trajectory.json        # 3,212-point high-fidelity mission plan
    missionCurve.ts        # CatmullRomCurve3 + coordinate mapping (1 unit = 1,000 km)
```

## Coordinate System
- `1 scene unit = 1,000 km`
- `traj.y → scene -Z` (Earth→Moon depth axis)
- `traj.z → scene Y` (orbital inclination)
- `traj.x → scene X` (lateral drift)
- Earth radius: `6.371 units`, Moon radius: `1.737 units` (proportional)
- Moon position: `(0, 0, -384.4)` scene units

## HUD Layout
### Desktop (≥640px)
- **Top left**: `TelemetryStrip` (3-col grid: Dist Earth, Dist Moon, Velocity, Status, Phase, JPL Updated)
- **Top center**: `MissionIdentity` (mission name + phase)
- **Top right**: `MissionElapsed` (DAY N — T+HHhMMmSSs, UTC date/time)
- **Left sidebar**: `HardwareControls` (camera mode + zoom slider)
- **Right sidebar**: `EventTimeline` (milestone feed, scrollable)
- **Bottom**: `PhaseScrubber` (Play/Pause, timeline, LIVE pin outside-right)

### Mobile (<640px)
- **Top**: `TelemetryStrip` (2-col grid, 4 metrics) + `MissionElapsed` (compact) side by side
- **Below top**: `MissionIdentity` centered
- `HardwareControls` and `EventTimeline` hidden (touch gestures replace camera controls)
- **Bottom**: `PhaseScrubber` (phase tick labels hidden, LIVE button positioned above bar)

## Store Shape (`missionStore.ts`)
```ts
currentMissionTime: number      // 0–3211, index into trajectory
isLive: boolean                 // True if at or past getRealTimeIndex()
isPlaying: boolean              // Playback state (stops at live mark)
actualTrajectory: StateVector[] // Flown arc from HORIZONS
actualCurrentVector: StateVector|null // Latest live vector from JPL
lastHorizonsUpdate: Date|null   // Wall-clock time of last successful HORIZONS poll
```

## Design Direction
- Terminal Mission Control aesthetic: Monochrome monospace.
- **Active state**: White fill, black text.
- **Live state**: Pulsing red indicators (`#ff3333`).
- **Telemetry Logic**: If `isLive`, use JPL data. If scrubbing back, use historic planned data.

## Deployment Notes
- Build: `npm run build`
- Deploy: `vercel --prod`
- Proxies configured in `api/` directory for Vercel deployment.
