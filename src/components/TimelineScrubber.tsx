import { useEffect, useRef } from 'react'
import { useMissionStore } from '../store/missionStore'
import trajectory from '../data/mockTrajectory.json'

const LAST = trajectory.length - 1

// Milestone markers: [index, label]
const MILESTONES: [number, string][] = [
  [0,  'Launch'],
  [5,  'Earth Departure'],
  [24, 'Deep Space'],
  [40, 'Lunar Orbit'],
  [49, 'Target: Reentry'],
]

function formatTimestamp(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'UTC', hour12: false,
  }) + ' UTC'
}

export default function TimelineScrubber() {
  const { currentMissionTime, isPlaying, setMissionTime, setIsPlaying, tick, currentVector } =
    useMissionStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isLive = currentMissionTime === LAST
  const progress = (currentMissionTime / LAST) * 100

  // Drive playback at 800 ms / step
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(tick, 800)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, tick])

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false)
    setMissionTime(Number(e.target.value))
  }

  const handlePlayPause = () => {
    if (currentMissionTime === LAST) {
      setMissionTime(0)
      setIsPlaying(true)
    } else {
      setIsPlaying(!isPlaying)
    }
  }

  const handleLive = () => {
    setIsPlaying(false)
    setMissionTime(LAST)
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: '260px',   // leave room for TelemetryPanel
      zIndex: 20,
      background: 'linear-gradient(to top, rgba(2,6,20,0.97) 0%, rgba(2,6,20,0.80) 80%, transparent 100%)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(74,138,255,0.18)',
      padding: '16px 28px 20px',
    }}>

      {/* ── Top row: timestamp label ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
      }}>
        <span style={{ fontSize: '10px', letterSpacing: '3px', color: '#4a6a9a', textTransform: 'uppercase' }}>
          Mission Timeline
        </span>
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#a8c4ff',
          letterSpacing: '1px',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatTimestamp(currentVector.timestamp)}
        </span>
        <span style={{ fontSize: '10px', color: '#3a5a7a', letterSpacing: '2px' }}>
          {currentMissionTime + 1} / {LAST + 1}
        </span>
      </div>

      {/* ── Middle row: play/pause · slider · LIVE ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          style={{
            flexShrink: 0,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid rgba(74,138,255,0.45)',
            background: isPlaying
              ? 'rgba(74,138,255,0.20)'
              : 'rgba(74,138,255,0.10)',
            color: '#7ab0ff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            transition: 'background 0.2s, box-shadow 0.2s',
            boxShadow: isPlaying ? '0 0 12px rgba(74,138,255,0.35)' : 'none',
            outline: 'none',
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Slider + milestone ticks */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="range"
            min={0}
            max={LAST}
            value={currentMissionTime}
            onChange={handleSlider}
            className="timeline-slider"
            style={{ '--progress': `${progress}%` } as React.CSSProperties}
          />

          {/* Milestone tick marks */}
          <div style={{ position: 'relative', height: '18px', marginTop: '4px' }}>
            {MILESTONES.map(([idx, label]) => {
              const pct = (idx / LAST) * 100
              const isActive = currentMissionTime >= idx
              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${pct}%`,
                    transform: pct < 8 ? 'translateX(0%)' : pct > 92 ? 'translateX(-100%)' : 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: pct < 8 ? 'flex-start' : pct > 92 ? 'flex-end' : 'center',
                    gap: '2px',
                  }}
                >
                  <div style={{
                    width: '1px',
                    height: '5px',
                    background: isActive ? 'rgba(74,138,255,0.7)' : 'rgba(74,138,255,0.2)',
                    transition: 'background 0.3s',
                  }} />
                  <span style={{
                    fontSize: '9px',
                    color: isActive ? '#4a8aff' : '#2a3a5a',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.3s',
                  }}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* LIVE button */}
        <button
          onClick={handleLive}
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '4px',
            border: `1px solid ${isLive ? 'rgba(74,138,255,0.6)' : 'rgba(74,138,255,0.2)'}`,
            background: isLive ? 'rgba(74,138,255,0.15)' : 'transparent',
            color: isLive ? '#7ab0ff' : '#3a5a7a',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
            outline: 'none',
            boxShadow: isLive ? '0 0 10px rgba(74,138,255,0.25)' : 'none',
          }}
          aria-label="Jump to live position"
        >
          {/* Pulsing dot */}
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isLive ? '#4a8aff' : '#2a3a5a',
            display: 'inline-block',
            animation: isLive ? 'livePulse 1.6s ease-in-out infinite' : 'none',
          }} />
          Live
        </button>
      </div>
    </div>
  )
}
