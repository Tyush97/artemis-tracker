import { useRef } from 'react'
import { useMissionStore } from '../../store/missionStore'

export default function HardwareControls() {
  const { cameraMode, setCameraMode, controlMode, setControlMode, zoomLevel, setZoomLevel } = useMissionStore()
  
  const sliderRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    updateZoom(e.clientY)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current) {
      updateZoom(e.clientY)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const updateZoom = (clientY: number) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    let pct = 1 - (clientY - rect.top) / rect.height
    pct = Math.max(0, Math.min(1, pct))
    setZoomLevel(Math.round(pct * 100))
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      fontFamily: 'monospace',
      pointerEvents: 'auto',
    }}>
      {/* Interaction Mode Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button 
          onClick={() => setControlMode(controlMode === 'pan' ? 'rotate' : 'pan')}
          style={{
            background: controlMode === 'pan' ? '#fff' : 'transparent',
            border: '1px solid #444',
            color: controlMode === 'pan' ? '#000' : '#888',
            padding: '0.75rem 0.875rem',
            width: '9.375rem',
            textAlign: 'left',
            fontSize: '0.6875rem',
            letterSpacing: '0.06rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          PAN {controlMode === 'pan' ? '[ACTIVE]' : '[INACTIVE]'}
        </button>

        <button 
          onClick={() => setControlMode('rotate')}
          style={{
            background: controlMode === 'rotate' ? '#fff' : 'transparent',
            border: '1px solid #444',
            color: controlMode === 'rotate' ? '#000' : '#888',
            padding: '0.75rem 0.875rem',
            width: '9.375rem',
            textAlign: 'left',
            fontSize: '0.6875rem',
            letterSpacing: '0.06rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ROTATE {controlMode === 'rotate' ? '[ACTIVE]' : '[INACTIVE]'}
        </button>
      </div>

      {/* Vertical Zoom Area */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '1.25rem', 
        paddingLeft: '0.375rem' 
      }}>
         <span style={{ fontSize: '0.625rem', color: '#666', letterSpacing: '0.125rem', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>ZOOM — ALTITUDE</span>
         
         <div 
            ref={sliderRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ 
              position: 'relative', 
              height: '11.25rem', 
              width: '2.5rem', 
              cursor: 'ns-resize',
              display: 'flex',
              justifyContent: 'center'
            }}
         >
            <div style={{ width: '2px', height: '100%', background: '#222' }} />
            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              width: '2px', 
              height: `${zoomLevel}%`, 
              background: '#fff' 
            }} />
            <div style={{
              position: 'absolute',
              bottom: `${zoomLevel}%`,
              transform: 'translateY(50%)',
              width: '0.875rem',
              height: '0.875rem',
              background: '#fff',
              pointerEvents: 'none',
            }} />
         </div>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.5625rem', color: '#666' }}>
            <span>CLOSE</span>
            <span style={{textAlign: 'center'}}>|</span>
            <span>FAR</span>
         </div>
      </div>

      {/* View Presets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button 
          onClick={() => { setCameraMode('ship'); setControlMode('rotate'); }}
          style={{
            background: 'transparent',
            border: cameraMode === 'ship' ? '1px solid #fff' : '1px solid #444',
            color: cameraMode === 'ship' ? '#fff' : '#888',
            padding: '0.75rem 0.875rem',
            width: '9.375rem',
            textAlign: 'left',
            fontSize: '0.6875rem',
            letterSpacing: '0.06rem',
            cursor: 'pointer',
          }}
        >
          SYNC TO SHIP
        </button>

        <button 
          onClick={() => setCameraMode(cameraMode === 'overview' ? 'ship' : 'overview')}
          style={{
            background: 'transparent',
            border: '1px solid #444',
            color: '#aaa',
            padding: '0.75rem 0.875rem',
            width: '9.375rem',
            textAlign: 'left',
            fontSize: '0.6875rem',
            letterSpacing: '0.06rem',
            cursor: 'pointer',
          }}
        >
           {cameraMode === 'overview' ? '⊡ 3D PERSPECTIVE' : '⊞ TOP-DOWN RADAR'}
        </button>
      </div>
    </div>
  )
}
