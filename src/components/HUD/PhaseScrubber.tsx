import { useEffect, useRef } from 'react'
import { useMissionStore } from '../../store/missionStore'
import trajectory from '../../data/mockTrajectory.json'

const LAST = trajectory.length - 1
const PHASES = [
  { idx: 0, label: 'LAUNCH' },
  { idx: 9, label: 'TLI' },
  { idx: 15, label: 'TRANSIT' },
  { idx: 29, label: 'FLYBY' },
  { idx: 40, label: 'RETURN' },
  { idx: 48, label: 'REENTRY' },
]

export default function PhaseScrubber() {
  const { currentMissionTime, isPlaying, setMissionTime, setIsPlaying, tick } = useMissionStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isLive = currentMissionTime === LAST

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(tick, 800)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, tick])

  return (
    <div style={{
      width: '100%',
      maxWidth: '60rem',
      fontFamily: 'monospace',
      pointerEvents: 'auto',
      zIndex: 10,
    }}>
      {/* JOURNEY label */}
      <div style={{
        fontSize: '0.5625rem',
        color: '#555',
        letterSpacing: '0.15rem',
        textAlign: 'center',
        marginBottom: '0.5rem',
      }}>
        JOURNEY
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

        {/* Play/Pause triangle icon */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1.5rem',
            height: '1.5rem',
            flexShrink: 0,
            outline: 'none',
          }}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
              <rect x="5" y="4" width="4" height="16" />
              <rect x="15" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </button>

        <div style={{ flex: 1, position: 'relative', height: '3.75rem', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', width: '100%', height: '1px', background: '#222' }} />
          
          {/* Scrubber thumb */}
          <div style={{
            position: 'absolute',
            left: `${(currentMissionTime / LAST) * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '2px', height: '1.5rem',
            background: '#fff',
            zIndex: 5,
          }} />

          {PHASES.map((p, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${(p.idx / LAST) * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
            }}>
              <div style={{ width: '1px', height: '0.625rem', background: '#333' }} />
              <div style={{ position: 'absolute', top: '0.9375rem', fontSize: '0.5625rem', color: '#555', letterSpacing: '0.06rem' }}>
                {p.label}
              </div>
            </div>
          ))}
          
          <div 
            onClick={() => { setIsPlaying(false); setMissionTime(LAST); }}
            style={{
            position: 'absolute',
            right: '-3.75rem',
            top: '50%',
            transform: 'translate(0%, -50%)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <div style={{ 
                width: '0.375rem', height: '0.375rem', 
                background: isLive ? '#ff3333' : '#222', 
                borderRadius: '50%', 
                animation: isLive ? 'pulse 1s infinite' : 'none' 
            }} />
            <div style={{ fontSize: '0.625rem', color: isLive ? '#fff' : '#444', letterSpacing: '0.125rem' }}>
              LIVE
            </div>
          </div>

          <input 
            type="range" min={0} max={LAST} value={currentMissionTime}
            onChange={(e) => { setIsPlaying(false); setMissionTime(Number(e.target.value)) }}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
            }}
          />
        </div>
      </div>
    </div>
  )
}
