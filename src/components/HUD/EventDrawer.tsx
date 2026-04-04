import EventTimeline from './EventTimeline'

interface Props {
  open: boolean
  onClose: () => void
}

export default function EventDrawer({ open, onClose }: Props) {


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
        background: '#0a0a0a',
        borderTop: '1px solid #222',
        display: 'flex',
        flexDirection: 'column',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        willChange: 'transform',
      }}>
        {/* Drag handle pill */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '0.5rem',
          flexShrink: 0,
        }}>
          <div style={{ width: '2.5rem', height: '3px', background: '#333', borderRadius: '2px' }} />
        </div>

        {/* Header row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.4rem 1rem 0.4rem',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.5rem', color: '#444', letterSpacing: '0.18rem' }}>
            LIVE UPDATES
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              color: '#666',
              width: '1.75rem',
              height: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              padding: 0,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Timeline — full width, fills remaining height */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', width: '100%' }}>
          <EventTimeline onEventClick={onClose} fullWidth />
        </div>
      </div>
    </>
  )
}
