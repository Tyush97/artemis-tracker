import { useRef } from 'react'
import EventTimeline from './EventTimeline'
import { useMissionStore } from '../../store/missionStore'
import { C, FS, LS } from '../../design/tokens'

interface Props {
  open: boolean
  onClose: () => void
}

export default function EventDrawer({ open, onClose }: Props) {
  const isMissionComplete = useMissionStore(s => s.isMissionComplete)
  const dragStartY = useRef<number | null>(null)
  const dragDelta = useRef(0)

  const handleDragStart = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY
    dragDelta.current = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleDragMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return
    dragDelta.current = e.clientY - dragStartY.current
  }

  const handleDragEnd = () => {
    if (dragDelta.current > 60) {
      onClose()
    }
    dragStartY.current = null
    dragDelta.current = 0
  }

  return (
    <>
      {/* Backdrop — tap outside to close */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.3)' }}
        />
      )}

      {/* Half-sheet panel */}
      <div style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: '52dvh',
        zIndex: 50,
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        willChange: 'transform',
      }}>
        {/* Drag handle pill — interactive drag zone */}
        <div
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '0.75rem',
            paddingBottom: '0.5rem',
            flexShrink: 0,
            cursor: 'grab',
            touchAction: 'none',
          }}
        >
          <div style={{ width: '2.5rem', height: '3px', background: C.ghost, borderRadius: '2px' }} />
        </div>

        {/* Header row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.25rem 1.25rem 0.5rem',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: FS.xs, color: C.muted, letterSpacing: LS.wide }}>
            {isMissionComplete ? 'MISSION UPDATES' : 'LIVE UPDATES'}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid ${C.btnBorder}`,
              color: C.btnIcon,
              width: '1.75rem',
              height: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: FS.md,
              padding: 0,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Timeline — full width, fills remaining height */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', width: '100%' }}>
          <EventTimeline fullWidth />
        </div>
      </div>
    </>
  )
}
