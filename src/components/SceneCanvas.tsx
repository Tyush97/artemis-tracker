import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Line, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useMissionStore } from '../store/missionStore'
import OrionModel from './OrionModel'
import {
  missionCurve, LAST,
  EARTH_R, MOON_R, MOON_POS,
} from '../data/missionCurve'

const CURVE_PTS = missionCurve.getPoints(300)

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

function RangeRings() {
  const ringsData = [
    { r: EARTH_R + 2.0, label: 'LEO BOUNDARY' },
    { r: 60.0, label: 'VAN ALLEN BELTS' },
    { r: 318.0, label: 'LUNAR SOI' },
    { r: 384.4, label: 'MOON ORBIT' },
    { r: 400.17, label: 'APOLLO 13 RECORD' },
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
    <group>
      {ringsData.map(({ r, label }, i) => (
        <group key={i}>
          <Line 
            points={pointsForRadius(r)} 
            color="#555555" 
            lineWidth={1} 
            dashed 
            dashSize={r > 50 ? 5 : 1} 
            gapSize={r > 50 ? 5 : 1}
            opacity={0.4}
            transparent
          />
          <Text 
            position={[0, 0, -r]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            fontSize={r > 50 ? 5 : 1.5} 
            color="#666666" 
            anchorX="center" 
            anchorY="bottom"
          >
            {label}
          </Text>
        </group>
      ))}
      <Line points={[new THREE.Vector3(-1500,0,0), new THREE.Vector3(1500,0,0)]} color="#111111" lineWidth={1} />
      <Line points={[new THREE.Vector3(0,0,-1200), new THREE.Vector3(0,0,500)]} color="#111111" lineWidth={1} />
    </group>
  )
}

function Earth() {
  return (
    <mesh>
      <sphereGeometry args={[EARTH_R, 40, 40]} />
      <meshBasicMaterial color="#4a8aff" wireframe transparent opacity={0.4} />
    </mesh>
  )
}

function MoonSphere() {
  return (
    <mesh position={MOON_POS.toArray()}>
      <sphereGeometry args={[MOON_R, 24, 24]} />
      <meshBasicMaterial color="#888888" wireframe transparent opacity={0.4} />
    </mesh>
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
        }
      } else {
        const prevTarget = controlsRef.current.target.clone()
        controlsRef.current.target.lerp(shipPos.current, Math.min(delta * 4, 0.15))
        const d = controlsRef.current.target.clone().sub(prevTarget)
        camera.position.add(d)
        controlsRef.current.update()
      }
      return
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
      camera={{ position: [200, 500, 600], fov: 45, near: 0.1, far: 5000 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, background: '#000', cursor: cursorStyle, zIndex: 0 }}
    >
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
        minDistance={1}
        maxDistance={2500}
      />
    </Canvas>
  )
}
