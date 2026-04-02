import * as THREE from 'three'
import trajectory from './mockTrajectory.json'

// ── PRD: 1 unit = 1,000 km ─────────────────────────────────────────────────
// Earth radius  → 6.371 units (true proportional scale)
// Moon distance → 384.4 units
// Max trajectory→ ~460 units
export const SCENE_SCALE = 1 / 1_000
export const Y_COMPRESS  = 1.0   // no compression; traj.z maps 1:1 to scene Y

export const LAST = trajectory.length - 1  // 49

// ── Planet radii (scene units) ──────────────────────────────────────────────
export const EARTH_R = 6.371           // real proportional radius
export const MOON_R  = 3.5            // exaggerated for visibility (real = 1.737)

// Moon scene-space position (Earth→Moon axis maps to scene -Z)
export const MOON_POS = new THREE.Vector3(0, 0, -384.4)

// Moon km-coordinates for Distance·Moon telemetry calculation
export const MOON_KM = { x: 0, y: 384_400, z: 0 }

// ── Coordinate mapping ──────────────────────────────────────────────────────
// traj.y  →  scene -Z  (primary Earth→Moon depth axis)
// traj.z  →  scene  Y  (orbital inclination, out-of-plane)
// traj.x  →  scene  X  (lateral / cross-track drift)
export function toSceneVec(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(
    x * SCENE_SCALE,
    z * SCENE_SCALE * Y_COMPRESS,
    -y * SCENE_SCALE,
  )
}

// ── Smooth CatmullRom spline through all 50 waypoints ──────────────────────
export const missionCurve = new THREE.CatmullRomCurve3(
  trajectory.map(p => toSceneVec(p.x, p.y, p.z)),
  false,
  'catmullrom',
  0.5,
)
