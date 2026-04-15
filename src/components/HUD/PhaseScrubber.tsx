import { useEffect, useRef, useState } from 'react'
import { useMissionStore } from '../../store/missionStore'
import trajectory from '../../data/trajectory.json'
import { useIsMobile } from '../../hooks/useIsMobile'
import { LAUNCH_N, idxToT } from '../../data/missionCurve'
import { C, FS, LS } from '../../design/tokens'

const LAST = trajectory.length - 1  // 3211

// Phase tick marks — OEM indices plus liftoff at -LAUNCH_N
const PHASES = [
  { idx: -LAUNCH_N, label: 'LIFTOFF' },
  { idx: 325,       label: 'EARTH PASS' },
  { idx: 1115,      label: 'LUNAR SOI' },
  { idx: 1757,      label: 'FLYBY' },
  { idx: 2416,      label: 'RETURN' },
  { idx: 3180,      label: 'REENTRY' },
]

export default function PhaseScrubber() {
  const isMobile = useIsMobile()
  const {
    currentMissionTime,
    isPlaying,
    setMissionTime,
    setIsPlaying,
    tick,
    goLive,
    getRealTimeIndex,
    isLive: storeIsLive,
    isMissionComplete,
  } = useMissionStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [liveIdx, setLiveIdx] = useState(() => getRealTimeIndex())

  useEffect(() => {
    const id = setInterval(() => setLiveIdx(getRealTimeIndex()), 10_000)
    return () => clearInterval(id)
  }, [getRealTimeIndex])

  // Use the store's isLive or calculate locally for precision.
  // Once the mission has completed, suppress all LIVE styling.
  const atEndOfMission = Math.abs(currentMissionTime - liveIdx) <= 2
  const isCurrentlyLive = !isMissionComplete && (storeIsLive || atEndOfMission)
  const showComplete = isMissionComplete && atEndOfMission

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(tick, 200) // Faster tick for smoother playback feel
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, tick])

  const progressPercent = idxToT(currentMissionTime) * 100
  const livePercent     = idxToT(liveIdx) * 100

  return (
    <div style={{
      width: '100%',
      maxWidth: '60rem',
      fontFamily: 'monospace',
      pointerEvents: 'auto',
      zIndex: 10,
      userSelect: 'none', // Prevent text selection
      WebkitUserSelect: 'none',
      msUserSelect: 'none',
    }}>
      <style>{`
        @keyframes pulse-red {
          0% { background: #fff; }
          50% { background: #ff3333; box-shadow: 0 0 10px #ff3333; }
          100% { background: #fff; }
        }
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
      `}</style>
      
      <div style={{
        fontSize: FS.xs,
        color: C.muted,
        letterSpacing: LS.wide,
        textAlign: 'center',
        marginBottom: '0.5rem',
      }}>
        MISSION TIMELINE
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            background: 'transparent',
            border: 'none',
            color: C.primary,
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><rect x="5" y="4" width="4" height="16"/><rect x="15" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"><polygon points="6,4 20,12 6,20"/></svg>
          )}
        </button>

        <div style={{ flex: 1, position: 'relative', height: isMobile ? '2rem' : '3.75rem', display: 'flex', alignItems: 'center' }}>
          {/* Background Track (Full Journey) */}
          <div style={{ position: 'absolute', width: '100%', height: '1px', background: '#222' }} />
          
          {/* "Available" Track (Flown Part) */}
          <div style={{ 
            position: 'absolute', 
            left: 0,
            width: `${livePercent}%`, 
            height: '1px', 
            background: 'linear-gradient(90deg, #555, #888)',
            opacity: 0.5
          }} />

          {/* Current Progress Track */}
          <div style={{
            position: 'absolute',
            left: 0,
            width: `${progressPercent}%`,
            height: '1px',
            background: isCurrentlyLive ? C.live : C.primary,
            boxShadow: isCurrentlyLive ? `0 0 8px ${C.live}` : 'none',
            transition: 'background 0.3s ease'
          }} />

          {/* Scrubber thumb / Pin */}
          <div style={{
            position: 'absolute',
            left: `${progressPercent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '2px', 
            height: '1.5rem',
            background: '#fff',
            zIndex: 5,
            animation: isCurrentlyLive ? 'pulse-red 1s infinite' : 'none'
          }} />

          {PHASES.map((p, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${idxToT(p.idx) * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
            }}>
              <div style={{ width: '1px', height: '0.625rem', background: p.idx <= liveIdx ? C.btnBorder : C.border }} />
              {!isMobile && (
                <div style={{
                  position: 'absolute',
                  top: '0.9375rem',
                  fontSize: FS.xs,
                  color: p.idx <= liveIdx ? C.muted : C.ghost,
                  letterSpacing: LS.tight,
                  whiteSpace: 'nowrap'
                }}>
                  {p.label}
                </div>
              )}
            </div>
          ))}

          <div
            onClick={() => { if (!showComplete) goLive() }}
            style={{
              position: 'absolute',
              right: isMobile ? '0' : '-4.5rem',
              top: isMobile ? '50%' : '50%',
              transform: isMobile ? 'translate(0, -50%)' : 'translate(0%, -50%)',
              cursor: showComplete ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '3px 6px',
              borderRadius: '4px',
              background: isCurrentlyLive ? 'rgba(255,51,51,0.1)' : 'transparent',
              opacity: showComplete ? 0.7 : 1,
              transition: 'all 0.3s ease'
            }}>
            <div style={{
              width: '0.35rem', height: '0.35rem',
              background: isCurrentlyLive ? C.live : C.btnBorder,
              borderRadius: '50%',
              boxShadow: isCurrentlyLive ? `0 0 10px ${C.live}` : 'none'
            }} />
            <div style={{
              fontSize: FS.xs,
              color: showComplete ? C.secondary : (isCurrentlyLive ? C.primary : C.ghost),
              letterSpacing: LS.wide,
              fontWeight: isCurrentlyLive ? 'bold' : 'normal'
            }}>
              {showComplete ? 'COMPLETE' : 'LIVE'}
            </div>
          </div>

          <input
            type="range"
            min={-LAUNCH_N}
            max={LAST}
            value={currentMissionTime}
            onChange={(e) => { 
              const val = Number(e.target.value);
              // Cap at live position manually to prevent scrubbing into future
              setMissionTime(Math.min(val, liveIdx)); 
            }}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
            }}
          />
        </div>
      </div>
    </div>
  )
}
