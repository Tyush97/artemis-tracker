import { useRef } from 'react'
import { useMissionStore } from '../../store/missionStore'
import { C } from '../../design/tokens'

export const FeedIcon = ({ color }: { color: string }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11a9 9 0 0 1 9 9" />
    <path d="M4 4a16 16 0 0 1 16 16" />
    <circle cx="5" cy="19" r="1" fill={color} stroke="none" />
  </svg>
)

// Hand / pan
const HandIcon = ({ color }: { color: string }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
)

// Mouse cursor / pointer arrow
const CursorIcon = ({ color }: { color: string }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l7.07 17 2.51-7.39L21 11.07 4 4z" />
  </svg>
)

// Crosshair target
const TargetIcon = ({ color }: { color: string }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="2.5" />
    <line x1="12" y1="2" x2="12" y2="5.5" />
    <line x1="12" y1="18.5" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5.5" y2="12" />
    <line x1="18.5" y1="12" x2="22" y2="12" />
  </svg>
)

// 3D cube
const CubeIcon = ({ color }: { color: string }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

// Top-down grid (square)
const TopDownIcon = ({ color }: { color: string }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
)

export default function HardwareControls({ horizontal = false, onFeedOpen }: { horizontal?: boolean; onFeedOpen?: () => void }) {
  const { cameraMode, setCameraMode, controlMode, setControlMode, zoomLevel, setZoomLevel } = useMissionStore()

  const sliderRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    updateZoom(e.clientY)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current) updateZoom(e.clientY)
  }
  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }
  const updateZoom = (clientY: number) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    let pct = 1 - (clientY - rect.top) / rect.height
    setZoomLevel(Math.round(Math.max(0, Math.min(1, pct)) * 100))
  }
  const nudgeZoom = (delta: number) =>
    setZoomLevel(Math.max(0, Math.min(100, zoomLevel + delta)))

  const nudgeStyle: React.CSSProperties = {
    background: 'transparent',
    border: `1px solid ${C.btnBorder}`,
    color: C.btnIcon,
    width: '2.5rem',
    height: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1rem',
    lineHeight: 1,
    padding: 0,
    fontFamily: 'monospace',
  }

  // Shared square icon button style
  const sq = (active: boolean): React.CSSProperties => ({
    background: active ? C.primary : 'transparent',
    border: `1px solid ${active ? C.primary : C.btnBorder}`,
    width: '2.5rem',
    height: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  })

  const buttons = (
    <>
      <button title="Pan" onClick={() => setControlMode('pan')} style={sq(controlMode === 'pan')}>
        <HandIcon color={controlMode === 'pan' ? C.btnIconOn : C.btnIcon} />
      </button>
      <button title="Rotate / Orbit" onClick={() => setControlMode('rotate')} style={sq(controlMode === 'rotate')}>
        <CursorIcon color={controlMode === 'rotate' ? C.btnIconOn : C.btnIcon} />
      </button>
      <button
        title="Sync to Ship"
        onClick={() => { setCameraMode('ship'); setControlMode('rotate'); }}
        style={sq(cameraMode === 'ship')}
      >
        <TargetIcon color={cameraMode === 'ship' ? C.btnIconOn : C.btnIcon} />
      </button>
      <button
        title="Top-Down View"
        onClick={() => setCameraMode('topdown')}
        style={sq(cameraMode === 'topdown')}
      >
        <TopDownIcon color={cameraMode === 'topdown' ? C.btnIconOn : C.btnIcon} />
      </button>
      <button
        title="3D Perspective"
        onClick={() => setCameraMode('perspective')}
        style={sq(cameraMode === 'perspective')}
      >
        <CubeIcon color={cameraMode === 'perspective' ? C.btnIconOn : C.btnIcon} />
      </button>
    </>
  )

  if (horizontal) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '0.5rem',
        pointerEvents: 'auto',
        justifyContent: 'center',
      }}>
        {buttons}
        {onFeedOpen && (
          <button title="Live Updates" onClick={onFeedOpen} style={sq(false)}>
            <FeedIcon color={C.btnIcon} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '0.75rem',
      pointerEvents: 'auto',
    }}>
      {buttons}

      {/* Spacer */}
      <div style={{ height: '0.5rem' }} />

      {/* Zoom slider */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
        <button onClick={() => nudgeZoom(10)} style={nudgeStyle}>+</button>
        <div
          ref={sliderRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            position: 'relative',
            height: '7rem',
            width: '2rem',
            cursor: 'ns-resize',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '1px', height: '100%', background: C.btnBorder }} />
          <div style={{ position: 'absolute', bottom: 0, width: '1px', height: `${zoomLevel}%`, background: C.secondary }} />
          <div style={{
            position: 'absolute',
            bottom: `${zoomLevel}%`,
            transform: 'translateY(50%)',
            width: '0.625rem',
            height: '0.625rem',
            background: '#fff',
            pointerEvents: 'none',
          }} />
        </div>
        <button onClick={() => nudgeZoom(-10)} style={nudgeStyle}>−</button>
      </div>
    </div>
  )
}
