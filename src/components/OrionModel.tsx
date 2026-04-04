import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMissionStore } from '../store/missionStore'
import { missionCurve, idxToT } from '../data/missionCurve'

const _pos = new THREE.Vector3()
const _tangent = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _mat = new THREE.Matrix4()
const _qTarget = new THREE.Quaternion()

// Build a 3D chevron as a BufferGeometry.
// The chevron points along +Y, has depth along Z.
// Outline pass uses the same geometry with inverted/scaled normals.
function buildChevronGeometry() {
  // 2D chevron outline points (XY plane)
  // tip at top, swept wings, notch at back center
  const W = 0.28  // half-width
  const TIP = 0.45  // forward tip Y
  const BACK = -0.35 // back Y
  const NOTCH = -0.1  // notch Y (inner V)
  const THICK = 0.01   // half-depth Z

  // 6 verts per face × 2 faces (front/back) + sides
  // Front face (z = +THICK)
  const tip = [0, TIP, THICK]
  const wingR = [W, BACK, THICK]
  const notch = [0, NOTCH, THICK]
  const wingL = [-W, BACK, THICK]
  // Back face (z = -THICK)
  const tipB = [0, TIP, -THICK]
  const wingRB = [W, BACK, -THICK]
  const notchB = [0, NOTCH, -THICK]
  const wingLB = [-W, BACK, -THICK]

  // Front: two triangles forming the chevron
  // Right wing: tip → wingR → notch
  // Left wing:  tip → notch → wingL
  const verts: number[] = []
  const norms: number[] = []

  const faceNF = [0, 0, 1]
  const faceNB = [0, 0, -1]

  // front face — right wing
  verts.push(...tip, ...wingR, ...notch)
  norms.push(...faceNF, ...faceNF, ...faceNF)
  // front face — left wing
  verts.push(...tip, ...notch, ...wingL)
  norms.push(...faceNF, ...faceNF, ...faceNF)

  // back face — right wing (winding reversed)
  verts.push(...tipB, ...notchB, ...wingRB)
  norms.push(...faceNB, ...faceNB, ...faceNB)
  // back face — left wing
  verts.push(...tipB, ...wingLB, ...notchB)
  norms.push(...faceNB, ...faceNB, ...faceNB)

  // Side quads (each as 2 triangles)
  // Each edge: front[a→b] + back[b→a]
  const edges: [number[], number[], number[], number[]][] = [
    [tip, wingR, wingRB, tipB],   // right outer edge
    [wingR, notch, notchB, wingRB], // right inner edge
    [notch, wingL, wingLB, notchB], // left inner edge
    [wingL, tip, tipB, wingLB], // left outer edge (tip to wingL)
  ]

  for (const [a, b, c, d] of edges) {
    // quad: a b c  +  a c d
    const ax = a[0], ay = a[1], az = a[2]
    const bx = b[0], by = b[1], bz = b[2]
    const cx = c[0], cy = c[1], cz = c[2]
    const dx = d[0], dy = d[1], dz = d[2]

    // compute face normal from a,b,c
    const ab = new THREE.Vector3(bx - ax, by - ay, bz - az)
    const ac = new THREE.Vector3(cx - ax, cy - ay, cz - az)
    const n = new THREE.Vector3().crossVectors(ab, ac).normalize()
    const nx = n.x, ny = n.y, nz = n.z

    verts.push(ax, ay, az, bx, by, bz, cx, cy, cz)
    norms.push(nx, ny, nz, nx, ny, nz, nx, ny, nz)
    verts.push(ax, ay, az, cx, cy, cz, dx, dy, dz)
    norms.push(nx, ny, nz, nx, ny, nz, nx, ny, nz)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3))
  return geo
}

// Outline geometry: same verts but expanded along normals in vertex shader
const outlineVertexShader = /* glsl */`
  uniform float outlineThickness;
  void main() {
    vec3 expanded = position + normal * outlineThickness;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(expanded, 1.0);
  }
`
const outlineFragmentShader = /* glsl */`
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`

function RippleRing({ index }: { index: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const startTime = index * 0.6

  useFrame(({ clock }) => {
    if (!ref.current) return
    const { isLive } = useMissionStore.getState()

    const time = (clock.getElapsedTime() + startTime) % 1.8
    const t = time / 1.8

    if (!isLive && t < 0.1) {
      ref.current.visible = false
      return
    }

    ref.current.visible = true
    const scale = 0.5 + t * 4
    ref.current.scale.set(scale, scale, 1)
    if (ref.current.material instanceof THREE.MeshBasicMaterial) {
      ref.current.material.opacity = (1 - t) * 0.5
    }
  })

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.9, 1.0, 32]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  )
}

export default function OrionModel() {
  const groupRef = useRef<THREE.Group>(null)
  const { isLive } = useMissionStore()

  missionCurve.getPoint(0, _pos)
  const visualPos = useRef(_pos.clone())

  const chevronGeo = useMemo(() => buildChevronGeometry(), [])

  const fillMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.FrontSide,
  }), [])

  const outlineMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { outlineThickness: { value: 0 } }, // Added some thickness
    vertexShader: outlineVertexShader,
    fragmentShader: outlineFragmentShader,
    side: THREE.BackSide,
  }), [])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    const { currentMissionTime } = useMissionStore.getState()
    const t = idxToT(currentMissionTime)

    missionCurve.getPoint(t, _pos)
    missionCurve.getTangent(t, _tangent)

    visualPos.current.lerp(_pos, Math.min(delta * 12, 1))
    groupRef.current.position.copy(visualPos.current)

    if (_tangent.lengthSq() > 1e-6) {
      _mat.lookAt(new THREE.Vector3(0, 0, 0), _tangent.clone().negate(), _up)
      _qTarget.setFromRotationMatrix(_mat)
      groupRef.current.quaternion.slerp(_qTarget, Math.min(delta * 8, 1))
    }
  })

  return (
    <group ref={groupRef}>
      {/* Ripples beneath the ship */}
      {isLive && (
        <group position={[0, 0, 0]}>
          <RippleRing index={0} />
          <RippleRing index={1} />
          <RippleRing index={2} />
        </group>
      )}

      {/* Rotate so +Y tip aligns with Three.js -Z forward */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        {/* Black fill */}
        <mesh geometry={chevronGeo} material={fillMat} />
        {/* White outline via back-face expansion */}
        <mesh geometry={chevronGeo} material={outlineMat} />
      </group>
    </group>
  )
}
