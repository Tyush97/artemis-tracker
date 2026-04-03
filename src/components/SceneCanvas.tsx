import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Line, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useMissionStore } from '../store/missionStore'
import OrionModel from './OrionModel'
import {
  missionCurve, LAST,
  EARTH_R, MOON_R, MOON_POS,
} from '../data/missionCurve'

const CURVE_PTS = missionCurve.getPoints(300)

// Compute orbital plane: use two well-separated arc positions and cross them.
// CURVE_PTS[30] = early arc, CURVE_PTS[220] = approaching flyby.
const _op1 = CURVE_PTS[30].clone()
const _op2 = CURVE_PTS[220].clone()
const ORBITAL_NORMAL = new THREE.Vector3().crossVectors(_op1, _op2).normalize()
if (ORBITAL_NORMAL.y < 0) ORBITAL_NORMAL.negate()
// Quaternion that rotates the ring group's local Y-up into the orbital plane normal
const ORBITAL_PLANE_QUAT = new THREE.Quaternion().setFromUnitVectors(
  new THREE.Vector3(0, 1, 0),
  ORBITAL_NORMAL,
)

// Direction toward the Moon in the ring group's local space (for label placement)
// Project Moon world position into local space, flatten to XZ, normalize
const _moonLocal = MOON_POS.clone().applyQuaternion(ORBITAL_PLANE_QUAT.clone().invert())
const LABEL_DIR = new THREE.Vector3(_moonLocal.x, 0, _moonLocal.z).normalize()

// Centroid of the real EME2000 trajectory in scene XZ (midpoint Earth→flyby):
// flyby scene coords ≈ (-131.9, -188.6, 343.1) → XZ centre ≈ (-64, 0, 170)
const TRAJ_CENTER = new THREE.Vector3(-64, 0, 170)
// 3D perspective: angled view looking down at trajectory from behind/above
const PERSP_CAM_POS = new THREE.Vector3(300, 200, 900)
// Top-down: directly above trajectory center
const TOPDOWN_CAM_POS = new THREE.Vector3(TRAJ_CENTER.x, 900, TRAJ_CENTER.z)
// Ship follow: units behind along travel direction, and up
const SHIP_BACK_DIST = 12   // scene units behind ship
const SHIP_UP_OFFSET = 3    // scene units above ship

// Sun: ~2000 scene units away, roughly April 2026 solar direction in scene space
// (EME2000 +X ≈ vernal equinox; scene X = EME X, scene Y = EME Z, scene Z = -EME Y)
const SUN_POS = new THREE.Vector3(3000, 600, -1000)

// Seeded pseudo-random so stars are stable across renders
function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 43758.5453123
  return x - Math.floor(x)
}

function Starfield() {
  const ref = useRef<THREE.Points>(null)
  const { camera } = useThree()

  const COUNT = 2000
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const r = 4500 + seededRand(i * 3) * 500
      const theta = seededRand(i * 3 + 1) * Math.PI * 2
      const phi   = Math.acos(2 * seededRand(i * 3 + 2) - 1)
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [])

  // Lock starfield to camera position so it never moves — only rotation affects it
  useFrame(() => {
    if (ref.current) ref.current.position.copy(camera.position)
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#888888" size={1.8} sizeAttenuation={false} transparent opacity={0.6} depthWrite={false} />
    </points>
  )
}

const RING_INFO: Record<string, { dist: string; desc: string }> = {
  'LEO BOUNDARY':     { dist: '~2,000 km',    desc: 'Upper edge of Low Earth Orbit. Most satellites and the ISS operate below this altitude.' },
  'VAN ALLEN BELTS':  { dist: '~60,000 km',   desc: 'Radiation belts of high-energy particles trapped by Earth\'s magnetic field. Artemis II passes through rapidly.' },
  'LUNAR SOI':        { dist: '~318,000 km',  desc: 'Sphere of Influence where the Moon\'s gravity dominates over Earth\'s. Artemis II enters lunar space here.' },
  'MOON ORBIT':       { dist: '~413,200 km',  desc: 'Position of the Moon during the Artemis II flyby. The Moon\'s elliptical orbit ranges from ~356,500 km (perigee) to ~406,700 km (apogee) — it sits further out on this date.' },
  'APOLLO 13 RECORD': { dist: '~400,171 km',  desc: 'Farthest distance from Earth ever reached by humans, set during Apollo 13\'s emergency free-return trajectory in April 1970. Apollo 17 landed on the surface at ~384,400 km.' },
}

function RangeRings() {
  const [hovered, setHovered] = useState<string | null>(null)

  // Moon distance at Artemis II flyby — ring matches the Moon sphere exactly
  const MOON_DIST = MOON_POS.length()
  const ringsData = [
    { r: EARTH_R + 2.0, label: 'LEO BOUNDARY' },
    { r: 60.0,          label: 'VAN ALLEN BELTS' },
    { r: 318.0,         label: 'LUNAR SOI' },
    { r: 400.17,        label: 'APOLLO 13 RECORD' },
    { r: MOON_DIST,     label: 'MOON ORBIT' },
  ]

  const pointsForRadius = (r: number) => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 128; i++) {
      const theta = (i / 128) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(theta) * r, 0, Math.sin(theta) * r))
    }
    return pts
  }

  return (
    <group quaternion={ORBITAL_PLANE_QUAT}>
      {ringsData.map(({ r, label }) => {
        const isHovered = hovered === label
        const info = RING_INFO[label]
        return (
          <group key={label}>
            <Line
              points={pointsForRadius(r)}
              color={isHovered ? '#aaaaaa' : '#555555'}
              lineWidth={isHovered ? 1.5 : 1}
              dashed
              dashSize={r > 50 ? 5 : 1}
              gapSize={r > 50 ? 5 : 1}
              opacity={isHovered ? 0.7 : 0.4}
              transparent
            />
            <Html
              position={[LABEL_DIR.x * r, 0, LABEL_DIR.z * r]}
              center
              zIndexRange={[100, 100]}
              style={{ pointerEvents: 'auto' }}
            >
              <div
                onMouseEnter={() => setHovered(label)}
                onMouseLeave={() => setHovered(null)}
                style={{ position: 'relative', cursor: 'default' }}
              >
                {/* Label */}
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  fontWeight: 400,
                  lineHeight: '1',
                  color: isHovered ? '#cccccc' : '#555555',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  letterSpacing: '0.1em',
                  transition: 'color 0.15s',
                }}>
                  {label}
                </span>

                {/* Info card */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    bottom: '18px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '200px',
                    background: 'rgba(0,0,0,0.85)',
                    border: '1px solid #333',
                    padding: '8px 10px',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#888', letterSpacing: '0.12em', marginBottom: '4px' }}>
                      {label}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#ffffff', marginBottom: '5px', letterSpacing: '0.04em' }}>
                      {info.dist}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#777', lineHeight: '1.5', letterSpacing: '0.03em' }}>
                      {info.desc}
                    </div>
                  </div>
                )}
              </div>
            </Html>
          </group>
        )
      })}
      <Line points={[new THREE.Vector3(-1500,0,0), new THREE.Vector3(1500,0,0)]} color="#111111" lineWidth={1} />
      <Line points={[new THREE.Vector3(0,0,-1200), new THREE.Vector3(0,0,500)]} color="#111111" lineWidth={1} />
    </group>
  )
}

function Sun() {
  return (
    <group position={SUN_POS.toArray()}>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[30, 24, 24]} />
        <meshBasicMaterial color="#fff9e0" />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[44, 24, 24]} />
        <meshBasicMaterial color="#ffe97a" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* Mid glow */}
      <mesh>
        <sphereGeometry args={[65, 24, 24]} />
        <meshBasicMaterial color="#ffcc44" transparent opacity={0.08} depthWrite={false} />
      </mesh>
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[100, 24, 24]} />
        <meshBasicMaterial color="#ff9900" transparent opacity={0.03} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Earth() {
  return (
    <group>
      {/* Solid sphere — receives directional light so terminator is visible */}
      <mesh>
        <sphereGeometry args={[EARTH_R, 40, 40]} />
        <meshStandardMaterial color="#1a4a99" roughness={1} metalness={0} />
      </mesh>
      {/* Wireframe overlay for the sci-fi grid aesthetic */}
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.002, 40, 40]} />
        <meshBasicMaterial color="#4a8aff" wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

function MoonSphere() {
  return (
    <group position={MOON_POS.toArray()}>
      <mesh>
        <sphereGeometry args={[MOON_R, 24, 24]} />
        <meshStandardMaterial color="#555555" roughness={1} metalness={0} />
      </mesh>
      <mesh>
        <sphereGeometry args={[MOON_R * 1.002, 24, 24]} />
        <meshBasicMaterial color="#888888" wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

function TrajectoryLine() {
  const idx = useMissionStore(s => s.currentMissionTime)

  const splitIdx  = Math.round((idx / LAST) * (CURVE_PTS.length - 1))
  const pastPts   = useMemo(() => CURVE_PTS.slice(0, Math.max(splitIdx + 1, 2)), [splitIdx])
  const futurePts = useMemo(() => CURVE_PTS.slice(Math.max(splitIdx, 0)), [splitIdx])

  return (
    <>
      {pastPts.length >= 2 && (
        <Line points={pastPts} color="#ffffff" lineWidth={1.5} />
      )}
      {futurePts.length >= 2 && (
        <Line points={futurePts} color="#333333" lineWidth={1} dashed dashSize={2} gapSize={4} />
      )}
    </>
  )
}

type ControlsRef = React.MutableRefObject<{
  target: THREE.Vector3
  update: () => void
} | null>

const ZOOM_MIN_DIST = 5
const ZOOM_MAX_DIST = 1400

function CameraController({ controlsRef, animatingRef }: { controlsRef: ControlsRef; animatingRef: React.MutableRefObject<boolean> }) {
  const { camera } = useThree()
  const shipPos = useRef(new THREE.Vector3())
  const prevMode = useRef('')
  const prevZoom = useRef(-1)

  useFrame((_, delta) => {
    if (!controlsRef.current) return

    const { cameraMode, zoomLevel, setZoomLevel, currentMissionTime } = useMissionStore.getState()
    const t = currentMissionTime / LAST
    missionCurve.getPoint(t, shipPos.current)

    // ── Mode transition: kick off animation ───────────
    if (cameraMode !== prevMode.current) {
      prevMode.current = cameraMode
      animatingRef.current = true
      if (cameraMode !== 'topdown') camera.up.set(0, 1, 0)
    }

    // ── Transition animation (topdown / perspective) ───
    if (animatingRef.current && (cameraMode === 'topdown' || cameraMode === 'perspective')) {
      const targetPos = cameraMode === 'topdown' ? TOPDOWN_CAM_POS : PERSP_CAM_POS
      if (cameraMode === 'topdown') camera.up.set(0, 0, -1)

      const alpha = 1 - Math.pow(0.005, delta)
      camera.position.lerp(targetPos, alpha)
      controlsRef.current.target.lerp(TRAJ_CENTER, alpha)
      controlsRef.current.update()

      if (camera.position.distanceTo(targetPos) < 2 && controlsRef.current.target.distanceTo(TRAJ_CENTER) < 2) {
        camera.position.copy(targetPos)
        controlsRef.current.target.copy(TRAJ_CENTER)
        controlsRef.current.update()
        animatingRef.current = false
        prevZoom.current = zoomLevel
      }
      return // don't touch zoom while animating
    }

    // ── Ship mode: animate in then follow ─────────────
    if (cameraMode === 'ship') {
      const tangent = missionCurve.getTangent(t).normalize()
      const up = new THREE.Vector3(0, 1, 0)
      const targetCamPos = shipPos.current.clone()
        .addScaledVector(tangent, -SHIP_BACK_DIST)
        .addScaledVector(up, SHIP_UP_OFFSET)
      if (animatingRef.current) {
        const alpha = 1 - Math.pow(0.005, delta)
        camera.position.lerp(targetCamPos, alpha)
        controlsRef.current.target.lerp(shipPos.current, alpha)
        controlsRef.current.update()
        if (camera.position.distanceTo(targetCamPos) < 2) {
          animatingRef.current = false
          prevZoom.current = zoomLevel
        }
        return // still animating — skip zoom sync
      }
      // Non-animating: follow ship, then fall through to zoom sync below
      const prevTarget = controlsRef.current.target.clone()
      controlsRef.current.target.lerp(shipPos.current, Math.min(delta * 4, 0.15))
      const d = controlsRef.current.target.clone().sub(prevTarget)
      camera.position.add(d)
      controlsRef.current.update()
    }

    // ── Zoom sync (topdown / perspective, after settled) ──
    if (!animatingRef.current) {
      if (zoomLevel !== prevZoom.current) {
        prevZoom.current = zoomLevel
        const target = controlsRef.current.target
        const dir = camera.position.clone().sub(target)
        if (dir.length() > 0.01) {
          dir.normalize()
          const desiredDist = ZOOM_MAX_DIST - (zoomLevel / 100) * (ZOOM_MAX_DIST - ZOOM_MIN_DIST)
          camera.position.copy(target).addScaledVector(dir, desiredDist)
          controlsRef.current.update()
        }
      } else {
        const dist = camera.position.distanceTo(controlsRef.current.target)
        const synced = Math.round((1 - (dist - ZOOM_MIN_DIST) / (ZOOM_MAX_DIST - ZOOM_MIN_DIST)) * 100)
        const clamped = Math.max(0, Math.min(100, synced))
        if (Math.abs(clamped - prevZoom.current) >= 1) {
          prevZoom.current = clamped
          setZoomLevel(clamped)
        }
      }
    }
  })

  return null
}

export default function SceneCanvas() {
  const controlsRef = useRef<{ target: THREE.Vector3; update: () => void } | null>(null)
  const animatingRef = useRef(false)
  const { controlMode, cameraMode, setCameraMode } = useMissionStore()
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)

  const cursorStyle = controlMode === 'pan' ? 'grab' : 'auto'

  const handlePointerDown = (e: React.PointerEvent) => {
    // Abort any in-progress transition so the camera doesn't snap back
    if (animatingRef.current) {
      animatingRef.current = false
    }
    dragStartPos.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartPos.current) return
    // Only switch topdown→perspective on rotate drag, not pan
    if (useMissionStore.getState().controlMode !== 'rotate') return
    const dx = e.clientX - dragStartPos.current.x
    const dy = e.clientY - dragStartPos.current.y
    if (Math.sqrt(dx * dx + dy * dy) > 8 && useMissionStore.getState().cameraMode === 'topdown') {
      setCameraMode('perspective')
      dragStartPos.current = null
    }
  }

  const handlePointerUp = () => {
    dragStartPos.current = null
  }

  // Suppress unused warning — cameraMode read for reactivity
  void cameraMode

  return (
    <Canvas
      camera={{ position: [200, 500, 600], fov: 45, near: 0.1, far: 12000 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, background: '#000', cursor: cursorStyle, zIndex: 0 }}
    >
      <ambientLight intensity={0.05} />
      <directionalLight position={SUN_POS.toArray()} intensity={2.2} color="#fff8e7" />
      <Starfield />
      <Sun />
      <RangeRings />
      <Earth />
      <MoonSphere />
      <TrajectoryLine />

      <Suspense fallback={<group />}>
        <OrionModel />
      </Suspense>

      <CameraController controlsRef={controlsRef} animatingRef={animatingRef} />
      <OrbitControls
        ref={controlsRef as React.MutableRefObject<any>}
        enablePan
        enableZoom
        enableRotate={controlMode === 'rotate'}
        mouseButtons={{
           LEFT: controlMode === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
           MIDDLE: THREE.MOUSE.DOLLY,
           RIGHT: THREE.MOUSE.ROTATE
        }}
        minDistance={ZOOM_MIN_DIST}
        maxDistance={ZOOM_MAX_DIST}
      />
    </Canvas>
  )
}
