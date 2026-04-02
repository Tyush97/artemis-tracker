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

const SHIP_OFFSET = new THREE.Vector3(2, 2, 2)
const TOP_DOWN_TGT = new THREE.Vector3(0, 0, -150)

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
  const splitIdx = Math.round((idx / LAST) * (CURVE_PTS.length - 1))

  const pastPts = useMemo(() => CURVE_PTS.slice(0, Math.max(splitIdx + 1, 2)), [splitIdx])
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

function CameraController({ controlsRef }: { controlsRef: ControlsRef }) {
  const { camera } = useThree()
  const shipPos = useRef(new THREE.Vector3())
  const prevMode = useRef('')
  const settled = useRef(false)
  const prevZoom = useRef(-1)

  useFrame((_, delta) => {
    if (!controlsRef.current) return

    const { cameraMode, zoomLevel, setZoomLevel, currentMissionTime } = useMissionStore.getState()
    const t = currentMissionTime / LAST
    missionCurve.getPoint(t, shipPos.current)

    // ── Mode transition ────────────────────────────────
    if (cameraMode !== prevMode.current) {
      prevMode.current = cameraMode
      settled.current = false
    }

    // ── Ship mode ──────────────────────────────────────
    if (cameraMode === 'ship') {
      // Transition: fly camera toward the ship on mode entry
      if (!settled.current) {
        const spd = delta * 3
        const targetCamPos = shipPos.current.clone().add(SHIP_OFFSET)
        camera.position.lerp(targetCamPos, spd)
        controlsRef.current.target.lerp(shipPos.current, spd)
        if (
          camera.position.distanceTo(targetCamPos) < 2 &&
          controlsRef.current.target.distanceTo(shipPos.current) < 2
        ) {
          settled.current = true
        }
      } else {
        // Keep the orbit pivot on the ship; translate camera by the same delta
        // so the user's view angle and distance are preserved while following.
        const prevTarget = controlsRef.current.target.clone()
        const spd = Math.min(delta * 4, 0.15)
        controlsRef.current.target.lerp(shipPos.current, spd)
        const targetDelta = controlsRef.current.target.clone().sub(prevTarget)
        camera.position.add(targetDelta)
        controlsRef.current.update()
      }
    }

    // ── Overview mode ──────────────────────────────────
    if (cameraMode === 'overview') {
      if (!settled.current) {
        const height = ZOOM_MAX_DIST - (zoomLevel / 100) * (ZOOM_MAX_DIST - ZOOM_MIN_DIST)
        const overviewCamPos = new THREE.Vector3(0, height, -150)

        camera.position.lerp(overviewCamPos, delta * 2)
        controlsRef.current.target.lerp(TOP_DOWN_TGT, delta * 2)

        if (
          camera.position.distanceTo(overviewCamPos) < 2 &&
          controlsRef.current.target.distanceTo(TOP_DOWN_TGT) < 2
        ) {
          settled.current = true
          prevZoom.current = zoomLevel
        }
      }
    }

    // ── Zoom slider response (works in both modes, only on change) ──
    if (zoomLevel !== prevZoom.current) {
      prevZoom.current = zoomLevel
      const target = controlsRef.current.target
      const dir = camera.position.clone().sub(target)
      const currentDist = dir.length()
      if (currentDist > 0.01) {
        dir.normalize()
        const desiredDist = ZOOM_MAX_DIST - (zoomLevel / 100) * (ZOOM_MAX_DIST - ZOOM_MIN_DIST)
        camera.position.copy(target).addScaledVector(dir, desiredDist)
      }
    } else {
      // ── Sync scroll/dolly back to slider ──────────────────────────
      const dist = camera.position.distanceTo(controlsRef.current.target)
      const synced = Math.round((1 - (dist - ZOOM_MIN_DIST) / (ZOOM_MAX_DIST - ZOOM_MIN_DIST)) * 100)
      const clamped = Math.max(0, Math.min(100, synced))
      if (Math.abs(clamped - prevZoom.current) >= 1) {
        prevZoom.current = clamped
        setZoomLevel(clamped)
      }
    }
  })

  return null
}

export default function SceneCanvas() {
  const controlsRef = useRef<{ target: THREE.Vector3; update: () => void } | null>(null)
  const { controlMode } = useMissionStore()

  const cursorStyle = controlMode === 'pan' ? 'grab' : 'auto'

  return (
    <Canvas
      camera={{ position: [0, 800, -150], fov: 45, near: 0.1, far: 5000 }}
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

      <CameraController controlsRef={controlsRef} />
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
