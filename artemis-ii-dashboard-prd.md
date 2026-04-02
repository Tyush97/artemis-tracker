# Product Requirements Document (PRD)
## Artemis II "Integrity" Interactive Mission Dashboard

### 1. Executive Vision and Strategic Context
**Product Purpose:** To provide a synchronized 3D mission chronology and real-time telemetry feed of the historic Artemis II flight. This dashboard translates complex aerospace data into a premium, interactive data visualization experience that tells the story of human survival and technical validation in deep space.

**Target Audience:** Tech professionals, Product Managers, Founders, and Designers (e.g., the LinkedIn tech community).

**The "So What?" Layer:** The average professional does not intuitively grasp the sheer scale of the Earth-Moon system or the risks of deep space. This dashboard's core value is creating an "Aha!" moment of scale and translating raw DSN (Deep Space Network) telemetry into an accessible, gripping narrative. It is "Stripe builds Mission Control."

---

### 2. Visual Identity & Telemetry UI Framework
We are targeting a "Premium Fintech in Space" aesthetic. The UI must replicate the high-stakes environment of a modern Mission Control Center but with the polish of high-end SaaS (think Vercel, Linear, or Stripe).

- **Color Palette:** Minimalist dark mode. Space Black (`#050505`), Slate Grey (`#1A1A1A`), with high-contrast text. Use subtle Warning Yellow or Action Red only for critical states.
- **Typography:** Tabular, monospaced fonts (e.g., JetBrains Mono, Geist Mono, or Space Mono) for live numbers so they animate smoothly without horizontal jitter. Sans-serif fonts (e.g., Inter, Satoshi) for labels.
- **Data Restraint:** Do not overwhelm the user with engineering noise. Display 4–5 large, beautifully set data points such as Mission Elapsed Time, Distance to Moon, and Speed.
- **Asset Styling:** The 3D Orion spacecraft should feature a tactile retro-future metallic sheen. Avoid a toy/cartoon look; lean into realistic materials like ceramic off-white, heat-shield scoring, and soft UI reflections.

---

### 3. The Interactive 3D Canvas & Navigation Engine
The spatial engine must seamlessly convey the transition from Earth orbit to deep space.

#### Dual-Mode Camera System
1. **Ship Focus Mode:** A cinematic follow-cam locked onto the Orion spacecraft. Allows users to orbit the ship closely, inspect the Solar Array Wings, and watch the background move.
2. **System Overview Mode:** The camera pulls far back to frame Earth, the Moon, and the 400,000 km trajectory void. This is the key "wow" feature that visually demonstrates how far the Moon is compared to low Earth orbit.

#### Trajectory as a Progress Bar
The orbital path itself acts as a glowing spline in 3D space. As the timeline progresses, the ship moves along this path, effectively making the 3D trajectory a spatial progress bar.

---

### 4. Temporal Navigation & Storytelling
The timeline scrubber at the bottom allows users to move through the 10-day itinerary. NASA jargon should be translated into accessible product-style storytelling while keeping the underlying data accurate.

#### Phase 1: Launch & Undocking (Day 1)
- **Technical Phase:** SLS Liftoff & ICPS 6DOF Proximity Ops
- **User-Facing Translation:** "Undocking & Maneuver Tests"
- **Plain-English Subtitle:** Testing manual controls before heading to deep space.
- **Key Metric:** Distance to upper stage (meters)

#### Phase 2: Trans-Lunar Injection (Day 2)
- **Technical Phase:** TLI Burn
- **User-Facing Translation:** "Leaving Earth Orbit"
- **Plain-English Subtitle:** Firing engines to break Earth's gravity.
- **Key Metric:** Velocity spike (km/s)

#### Phase 3: Outbound Transit (Days 3–5)
- **Technical Phase:** Lunar Sphere of Influence & AVATAR payload radiation flux
- **User-Facing Translation:** "Deep Space Coast & Radiation Testing"
- **Key Metric:** Radiation exposure
- **Visualization Note:** Show comparatively, for example current dose vs. a chest X-ray vs. a 6-month ISS stay.

#### Phase 4: Lunar Flyby (Day 6)
- **Technical Phase:** Pericynthion & Apollo 13 record break
- **User-Facing Translation:** "Closest Lunar Approach"
- **Plain-English Subtitle:** Breaking the Apollo 13 distance record.
- **Key Metric:** Distance from Earth

#### Phase 5: Return & Reentry (Days 7–10)
- **Technical Phase:** Direct Entry Profile vs. Skip Entry
- **User-Facing Translation:** "High-Speed Reentry"
- **Plain-English Subtitle:** Hitting Earth's atmosphere at 25,000 mph.
- **Key Metric:** Heat shield peak temperature (°C / °F)

---

### 5. Telemetry Panel Requirements
The telemetry UI should feel understandable at a glance for a general professional audience.

#### Always-visible Metrics
- Mission Elapsed Time
- Mission Phase
- Distance to Earth
- Distance to Moon
- Velocity
- Next Milestone

#### Dynamic Contextual Metric
Swap one card based on the mission phase:
- Day 1: Upper-stage distance
- Day 2: Burn delta-v / acceleration moment
- Days 3–5: Radiation exposure
- Day 6: Record distance marker / lunar proximity
- Days 7–10: Reentry heat load

#### Remove or Avoid
- Altitude in space
- Dense engineering acronyms without explanation
- Scientist-only labels as default UI copy

---

### 6. Technical Requirements & WebGL Optimization
These instructions are intended for AntiGravity or any AI coding assistant so the browser experience remains stable and visually strong.

#### Trajectory Math
- Use a continuous spline such as Three.js `CatmullRomCurve3`.
- Interpolate ship position and rotation along the curve based on Mission Elapsed Time (MET).
- Keep the path smooth and readable from both close and far zoom levels.

#### Scene Scale Management
- Do **not** use true 1:1 astronomical scale.
- Implement a proportional coordinate system, for example `1 unit = 1,000 km`.
- Tune camera `near` and `far` clipping planes to avoid z-fighting and flicker.

#### 3D Asset Optimization
- Prefer `.glb` over `.stl` for final production if possible.
- Compress geometry and textures using Draco and/or KTX2 where supported.
- Keep polygon counts web-safe and mobile-conscious.
- Reuse materials and avoid unnecessary draw calls.

#### Earth, Moon, and Starfield
- Earth and Moon should be simple optimized spheres with lightweight textures.
- The starfield should be generated procedurally or with instanced points rather than heavy HDRI backgrounds.
- Avoid giant asset downloads for environment rendering.

#### State Management
- Do not connect live APIs first.
- Use local mock mission data and a global store such as Zustand for:
  - `currentMissionTime`
  - `currentPhase`
  - `telemetry`
  - `cameraMode`
  - `isLive`

#### Camera Controls
- Support right-click pan.
- Support zoom from ship-level detail to full Earth-Moon overview.
- Add a **Center on Ship** action that recenters the camera target on Orion.
- Add an **Overview** action that frames Earth, Moon, and the full trajectory.

---

### 7. UX Principles
This experience is meant for PMs, founders, designers, and curious professionals.

- Use plain-English labels first, with technical terms as secondary context.
- Let the visualization explain the scale and mission story.
- Make the interface feel premium, calm, and cinematic.
- Prioritize clarity over realism when the two conflict.
- One screen should create an instant understanding of: where the spacecraft is, what phase it is in, and what happens next.

---

### 8. Success Criteria
The dashboard succeeds if a non-space-professional can answer these questions within a few seconds:

1. Where is Orion right now?
2. Is it going to the Moon or coming back?
3. How far is it from Earth and the Moon?
4. What major milestone just happened or is coming next?
5. Why is this moment significant?

If the visualization answers those questions without needing aerospace knowledge, the product is working.