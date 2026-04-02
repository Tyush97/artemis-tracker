import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMissionStore } from '../store/missionStore'
import { missionCurve, LAST } from '../data/missionCurve'

const _pos = new THREE.Vector3()
const _tangent = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _mat = new THREE.Matrix4()
const _qTarget = new THREE.Quaternion()

export default function OrionModel() {
  const groupRef = useRef<THREE.Group>(null)

  // Initialize position to start of curve
  missionCurve.getPoint(0, _pos)
  const visualPos = useRef(_pos.clone())

  useFrame((_, delta) => {
    if (!groupRef.current) return

    const t = useMissionStore.getState().currentMissionTime / LAST
    
    // 1. Get precise position and tangent from the spline
    missionCurve.getPointAt(t, _pos) // Use getPointAt for uniform distribution
    missionCurve.getTangentAt(t, _tangent)

    // 2. Smoothly move toward the target position
    visualPos.current.lerp(_pos, Math.min(delta * 12, 1)) // Faster lerp for "snapping" feel
    groupRef.current.position.copy(visualPos.current)

    // 3. Orient the marker to look along the tangent (direction of travel)
    if (_tangent.lengthSq() > 1e-6) {
      _mat.lookAt(new THREE.Vector3(0,0,0), _tangent, _up)
      _qTarget.setFromRotationMatrix(_mat)
      groupRef.current.quaternion.slerp(_qTarget, Math.min(delta * 8, 1))
    }
  })

  // Tactical Crosshair/Chevron Shape
  const markerGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    // Main chevron point
    shape.moveTo(0, 0.4)
    shape.lineTo(0.25, -0.3)
    shape.lineTo(0, -0.15)
    shape.lineTo(-0.25, -0.3)
    shape.lineTo(0, 0.4)
    return shape
  }, [])

  return (
    <group ref={groupRef}>
      {/* 
         Directional Crosshair Marker
         Re-oriented to match Three.js world space (Z-forward)
      */}
      <group rotation={[Math.PI / 2, 0, 0]}>
         {/* Outer Ring / Crosshair Elements */}
         <mesh rotation={[0, 0, 0]}>
            <ringGeometry args={[0.3, 0.32, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
         </mesh>

         {/* Directional Chevron */}
         <mesh>
           <shapeGeometry args={[markerGeometry]} />
           <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
         </mesh>

         {/* Tactical Crosshair Lines */}
         <mesh rotation={[0, 0, Math.PI / 2]}>
            <planeGeometry args={[0.8, 0.015]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
         </mesh>
         <mesh>
            <planeGeometry args={[0.8, 0.015]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
         </mesh>
      </group>

      {/* Tracking Light Glow */}
      <pointLight color="#ffffff" intensity={0.2} distance={5} decay={2} />
    </group>
  )
}
