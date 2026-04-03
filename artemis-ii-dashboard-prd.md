# Product Requirements Document (PRD)
## Artemis II "Integrity" Interactive Mission Dashboard

### 1. Executive Vision and Strategic Context
**Product Purpose:** To provide a synchronized 3D mission chronology and real-time telemetry feed of the historic Artemis II flight. This dashboard translates complex aerospace data into a premium, interactive data visualization experience using real NASA OEM trajectory data and live JPL Horizons state vectors.

**Target Audience:** Tech professionals, Product Managers, Founders, and Designers (e.g., the LinkedIn tech community).

---

### 2. Visual Identity & Telemetry UI Framework

**Implemented aesthetic: Terminal Mission Control**

- **Color Palette:** Pure black (`#000000`) background, white text, layered grey accents. Red (`#ff3333`) for live/active states.
- **Typography:** Monospace throughout. All labels in uppercase with wide letter-spacing. 
- **3D Spacecraft:** A procedural directional chevron. When in **LIVE** mode, the ship emits concentric white ripples to signify active data transmission.

---

### 3. The Interactive 3D Canvas & Navigation Engine

#### Coordinate System
- `1 scene unit = 1,000 km`
- Earth radius: `6.371` units, Moon radius: `1.737` units (physical proportionality).
- Moon position: `(0, 0, -384.4)` units.

#### Trajectory Rendering
- 3,212-point high-fidelity NASA OEM trajectory.
- **Historic Segment**: Flown arc or past planned path.
- **Future Segment**: Transparent/hidden or represented as projected path.

---

### 4. HUD Layout & Component Map

#### `TelemetryStrip` (top-left)
- **Data Modes**:
  - **HISTORIC**: Shows planned data for past timestamps.
  - **LIVE**: Displays real-time state vectors from JPL Horizons.
  - **PROJECTED**: Displays planned future data (access restricted via scrubber cap).
- **Metrics**: Dist Earth, Dist Moon, Velocity, Phase, Status.

#### `PhaseScrubber` (bottom-center)
- **Scrubber Restriction**: User is restricted from scrubbing into the future. The handle caps at the "Live" position.
- **Visuals**: Track shows full 10-day journey, but only the active portion is highlighted. 
- **Live Pin**: The scrubber pin pulses red when tracking the current real-time mission position.

---

### 5. Telemetry Data & Backend

- **JPL Horizons Integration**: Fetches real-time geocentric state vectors via Vercel Serverless proxy.
- **NASA TrackArtemis Integration**: Optional polling for official distance metrics.
- **Trajectory Data**: 3,212 high-fidelity waypoints providing 1-minute resolution for the Artemis II mission.

---

### 6. Success Criteria

The dashboard succeeds if a professional can answer:
1. **Where is Orion right now?** (using live JPL data)
2. **Is it on the planned path?** (comparing historic against live)
3. **What is the current velocity and distance to Earth/Moon?**
4. **Where is it in the 10-day mission timeline?**

---

### 7. Deployment

- **Hosting**: Vercel
- **Auto-Deploy**: Enabled for `main` branch.
