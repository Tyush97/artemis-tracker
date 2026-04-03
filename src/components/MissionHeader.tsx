import { useMissionStore } from '../store/missionStore'

export default function MissionHeader() {
  const { cameraMode, setCameraMode } = useMissionStore()

  const btnBase: React.CSSProperties = {
    padding:        '5px 13px',
    borderRadius:   '4px',
    cursor:         'pointer',
    fontSize:       '10px',
    fontWeight:     600,
    letterSpacing:  '1.5px',
    textTransform:  'uppercase',
    outline:        'none',
    transition:     'all 0.18s',
    fontFamily:     'system-ui, sans-serif',
  }

  const active: React.CSSProperties = {
    ...btnBase,
    background: 'rgba(74,138,255,0.18)',
    border:     '1px solid rgba(74,138,255,0.55)',
    color:      '#7ab0ff',
    boxShadow:  '0 0 10px rgba(74,138,255,0.25)',
  }

  const inactive: React.CSSProperties = {
    ...btnBase,
    background: 'transparent',
    border:     '1px solid rgba(74,138,255,0.2)',
    color:      '#3a5a7a',
  }

  return (
    <header style={{
      position:       'absolute',
      top:            0,
      left:           0,
      right:          '260px',
      height:         '56px',
      background:     'rgba(5, 10, 25, 0.75)',
      borderBottom:   '1px solid rgba(80, 140, 255, 0.2)',
      backdropFilter: 'blur(12px)',
      display:        'flex',
      alignItems:     'center',
      padding:        '0 24px',
      gap:            '16px',
      zIndex:         10,
    }}>
      {/* Live indicator */}
      <div style={{
        width:     '8px',
        height:    '8px',
        borderRadius: '50%',
        background: '#4aff8a',
        boxShadow:  '0 0 8px #4aff8a',
        animation:  'pulse 2s infinite',
        flexShrink: 0,
      }} />

      <span style={{ fontSize: '11px', letterSpacing: '3px', color: '#4a8aff', textTransform: 'uppercase' }}>
        Artemis II
      </span>
      <span style={{ fontSize: '11px', color: '#3a5a7a', letterSpacing: '1px' }}>
        10-Day Lunar Flyby
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Camera mode buttons */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          style={cameraMode === 'ship' ? active : inactive}
          onClick={() => setCameraMode('ship')}
          aria-pressed={cameraMode === 'ship'}
        >
          ⊙ Ship
        </button>
        <button
          style={cameraMode === 'topdown' ? active : inactive}
          onClick={() => setCameraMode('topdown')}
          aria-pressed={cameraMode === 'topdown'}
        >
          ◈ Top-Down
        </button>
        <button
          style={cameraMode === 'perspective' ? active : inactive}
          onClick={() => setCameraMode('perspective')}
          aria-pressed={cameraMode === 'perspective'}
        >
          ◈ 3D
        </button>
      </div>

      <span style={{ fontSize: '10px', color: '#3a5a7a', letterSpacing: '2px', textTransform: 'uppercase' }}>
        Status: <span style={{ color: '#4aff8a' }}>Nominal</span>
      </span>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </header>
  )
}
