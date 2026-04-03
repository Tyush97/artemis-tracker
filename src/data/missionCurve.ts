import * as THREE from 'three'
import trajectory from './trajectory.json'

// ── PRD: 1 unit = 1,000 km ─────────────────────────────────────────────────
// Coordinates are in the EME2000 Earth-centred inertial frame (km).
// Earth is at the origin; all positions are geocentric.
export const SCENE_SCALE = 1 / 1_000
export const Y_COMPRESS  = 1.0

export const LAST = trajectory.length - 1  // 3211

// ── Planet radii (scene units) ──────────────────────────────────────────────
export const EARTH_R = 6.371           // proportional (km → units)
export const MOON_R  = 3.5             // exaggerated for visibility (real = 1.737)

// ── Moon position ────────────────────────────────────────────────────────────
// Approximate EME2000 position at closest approach (2026-04-06T23:07, idx 1757).
// The spacecraft reaches ~413,146 km from Earth at flyby; the Moon is ~8,900 km
// from the surface at that point, so this is a very close approximation.
export const MOON_EME = { x: -131_863, y: -343_137, z: -188_571 } // km

// Moon in scene space: same toSceneVec mapping as trajectory points
export const MOON_POS = new THREE.Vector3(
  MOON_EME.x * SCENE_SCALE,           // scene X
  MOON_EME.z * SCENE_SCALE,           // scene Y  (EME2000 Z → scene Y)
  -MOON_EME.y * SCENE_SCALE,          // scene Z  (EME2000 -Y → scene Z)
)

// ── Coordinate mapping ──────────────────────────────────────────────────────
// EME2000 X → scene  X  (lateral)
// EME2000 Z → scene  Y  (out-of-plane / up)
// EME2000 Y → scene -Z  (Earth→Moon depth)
export function toSceneVec(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(
    x * SCENE_SCALE,
    z * SCENE_SCALE * Y_COMPRESS,
    -y * SCENE_SCALE,
  )
}

// ── HORIZONS → OEM frame conversion ────────────────────────────────────────
// JPL HORIZONS returns vectors in J2000 equatorial; the OEM uses a rotated
// frame. The 2×2 rotation in the YZ plane was derived by aligning matching
// timestamps from both sources. X is identical across frames.
export function horizonsToOEM(hx: number, hy: number, hz: number): { x: number; y: number; z: number } {
  return {
    x:  hx,
    y:  0.9930 * hy - 1.1290 * hz,
    z:  0.4394 * hy + 0.5131 * hz,
  }
}

// ── Smooth CatmullRom spline through all 3212 waypoints ───────────────────
export const missionCurve = new THREE.CatmullRomCurve3(
  trajectory.map(p => toSceneVec(p.x, p.y, p.z)),
  false,
  'catmullrom',
  0.5,
)
