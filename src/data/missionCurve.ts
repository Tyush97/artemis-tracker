import * as THREE from 'three'
import trajectory from './trajectory.json'

// ── PRD: 1 unit = 1,000 km ─────────────────────────────────────────────────
export const SCENE_SCALE = 1 / 1_000
export const Y_COMPRESS  = 1.0

export const LAST = trajectory.length - 1  // 3211

// ── Planet radii (scene units) ──────────────────────────────────────────────
export const EARTH_R = 6.371
export const MOON_R  = 1.737

// ── Moon position ────────────────────────────────────────────────────────────
export const MOON_EME = { x: -131_863, y: -343_137, z: -188_571 }
export const MOON_POS = new THREE.Vector3(
  MOON_EME.x * SCENE_SCALE,
  MOON_EME.z * SCENE_SCALE,
  -MOON_EME.y * SCENE_SCALE,
)

// ── Coordinate mapping ──────────────────────────────────────────────────────
export function toSceneVec(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(
    x * SCENE_SCALE,
    z * SCENE_SCALE * Y_COMPRESS,
    -y * SCENE_SCALE,
  )
}

// ── HORIZONS → OEM frame conversion ────────────────────────────────────────
export function horizonsToOEM(hx: number, hy: number, hz: number): { x: number; y: number; z: number } {
  return {
    x:  hx,
    y:  0.9930 * hy - 1.1290 * hz,
    z:  0.4394 * hy + 0.5131 * hz,
  }
}

// ── Synthetic launch arc ─────────────────────────────────────────────────────
// The OEM data opens at 2026-04-02T03:07 UTC (~41,286 km).
// We prepend LAUNCH_N points from Earth's surface → OEM[0], with
// the arc epoch anchored at actual liftoff: 2026-04-01T23:44:00Z.
export const LAUNCH_N = 50
export const LAUNCH_TIME_MS = new Date('2026-04-01T23:44:00Z').getTime()

const _p0 = trajectory[0] as unknown as { x: number; y: number; z: number }
const oem0Scene = toSceneVec(_p0.x, _p0.y, _p0.z)
const oem0Dir   = oem0Scene.clone().normalize()
const oem0Dist  = oem0Scene.length()   // ≈ 41.3 scene units

// A direction perpendicular to oem0Dir — used to give the arc visible curvature.
// A rocket launches "up" from the pad then pitches prograde; we simulate
// this by starting ~55° off the OEM direction and curving in.
const _basis = Math.abs(oem0Dir.dot(new THREE.Vector3(0, 1, 0))) < 0.85
  ? new THREE.Vector3(0, 1, 0)
  : new THREE.Vector3(0, 0, 1)
const _perp = new THREE.Vector3().crossVectors(oem0Dir, _basis).normalize()
const LAUNCH_ARC_ANGLE = Math.PI * 0.30  // ~54° initial offset
const launchDir = new THREE.Vector3()
  .addScaledVector(oem0Dir, Math.cos(LAUNCH_ARC_ANGLE))
  .addScaledVector(_perp,   Math.sin(LAUNCH_ARC_ANGLE))
  .normalize()

// Arc: direction slerps from launchDir → oem0Dir; radius grows Earth_R → oem0Dist
const launchArc: THREE.Vector3[] = Array.from({ length: LAUNCH_N }, (_, i) => {
  const alpha = i / LAUNCH_N
  // sqrt slerp easing: spends more time near Earth, less near OEM handoff
  const dir = launchDir.clone().lerp(oem0Dir, Math.pow(alpha, 0.5)).normalize()
  const r   = EARTH_R + (oem0Dist - EARTH_R) * Math.pow(alpha, 0.65)
  return dir.multiplyScalar(r)
})

// ── Index → curve-t mapping ──────────────────────────────────────────────────
// Store index range: [-LAUNCH_N, LAST]
// Curve t range:     [0, 1]
export function idxToT(idx: number): number {
  return (idx + LAUNCH_N) / (LAST + LAUNCH_N)
}

// ── Full curve: launch arc + OEM trajectory ──────────────────────────────────
const allPoints: THREE.Vector3[] = [
  ...launchArc,
  ...(trajectory as unknown as { x: number; y: number; z: number }[]).map(
    p => toSceneVec(p.x, p.y, p.z),
  ),
]

// Centripetal CatmullRom (alpha=0.5): avoids cusps at uneven OEM point spacing.
export const missionCurve = new THREE.CatmullRomCurve3(
  allPoints,
  false,
  'catmullrom',
  0.5,
)
