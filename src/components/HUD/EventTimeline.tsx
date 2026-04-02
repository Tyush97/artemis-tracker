import { useEffect, useRef } from 'react'
import { useMissionStore } from '../../store/missionStore'

const EVENTS = [
  { idx: 0,  label: 'SLS LAUNCH / CORE JETTISON' },
  { idx: 9,  label: 'TRANSLUNAR INJECTION BURN' },
  { idx: 15, label: 'T-COAST / PERIAPSIS PASS' },
  { idx: 24, label: 'LUNAR SOI ENTRY' },
  { idx: 29, label: 'LUNAR FLYBY / FREE RETURN' },
  { idx: 40, label: 'EARTH RETURN PHASE' },
  { idx: 48, label: 'REENTRY / SPLASHDOWN' },
]

import trajectory from '../../data/mockTrajectory.json'

function getMet(trajectoryIdx: number): string {
  const t = new Date(trajectory[trajectoryIdx].timestamp)
  const start = new Date(trajectory[0].timestamp)
  const diff = t.getTime() - start.getTime()
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `T+${days}d ${hours}h ${mins}m`
}

export default function EventTimeline() {
  const { currentMissionTime, setMissionTime, setIsPlaying } = useMissionStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Past events, most recent first
  const pastEvents = [...EVENTS]
    .filter(ev => currentMissionTime >= ev.idx)
    .reverse()

  // Future events, soonest first
  const futureEvents = [...EVENTS]
    .filter(ev => currentMissionTime < ev.idx)

  const handleClick = (idx: number) => {
    setIsPlaying(false)
    setMissionTime(idx)
  }

  // Scroll to top whenever the current event changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentMissionTime])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'monospace',
      pointerEvents: 'auto',
      width: '15rem',
      // Fill from top all the way to near-bottom
      alignSelf: 'flex-start',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        fontSize: '0.5625rem',
        color: '#555',
        letterSpacing: '0.15rem',
        textAlign: 'right',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #222',
        marginBottom: '0.75rem',
        flexShrink: 0,
      }}>
        MISSION TIMELINE
      </div>

      {/* Scrollable feed with bottom mask */}
      <div style={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}>
        <div
          ref={scrollRef}
          style={{
            height: '100%',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            paddingBottom: '4rem',
          }}
        >
          {/* Past events — top of feed (most recent at top) */}
          {pastEvents.map((ev, i) => {
            const isCurrent = i === 0
            return (
              <div
                key={ev.idx}
                onClick={() => handleClick(ev.idx)}
                style={{
                  textAlign: 'right',
                  cursor: 'pointer',
                  transition: 'opacity 0.3s',
                  opacity: isCurrent ? 1 : 0.55,
                }}
              >
                <div style={{
                  fontSize: '0.5625rem',
                  color: '#888',
                  marginBottom: '0.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.4rem',
                }}>
                  {isCurrent && (
                    <span style={{
                      display: 'inline-block',
                      width: '0.4rem',
                      height: '0.4rem',
                      backgroundColor: '#ff3333',
                      borderRadius: '50%',
                      animation: 'pulse 1s infinite',
                      flexShrink: 0,
                    }} />
                  )}
                  {getMet(ev.idx)}
                </div>
                <div style={{
                  fontSize: '0.6875rem',
                  color: isCurrent ? '#fff' : '#aaa',
                  letterSpacing: '0.05rem',
                  borderRight: isCurrent ? '2px solid #fff' : '1px solid #333',
                  paddingRight: '0.75rem',
                  lineHeight: '1.4',
                }}>
                  {ev.label}
                </div>
              </div>
            )
          })}

          {/* Divider between past and upcoming */}
          {pastEvents.length > 0 && futureEvents.length > 0 && (
            <div style={{
              borderTop: '1px solid #222',
              paddingTop: '0.75rem',
              fontSize: '0.5rem',
              color: '#444',
              letterSpacing: '0.15rem',
              textAlign: 'right',
            }}>
              UPCOMING
            </div>
          )}

          {/* Future events */}
          {futureEvents.map((ev) => (
            <div
              key={ev.idx}
              onClick={() => handleClick(ev.idx)}
              style={{
                textAlign: 'right',
                cursor: 'pointer',
                opacity: 0.28,
                transition: 'opacity 0.3s',
              }}
            >
              <div style={{ fontSize: '0.5625rem', color: '#888', marginBottom: '0.3rem' }}>
                {getMet(ev.idx)}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                color: '#ccc',
                letterSpacing: '0.05rem',
                borderRight: '1px solid #333',
                paddingRight: '0.75rem',
                lineHeight: '1.4',
              }}>
                {ev.label}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom fade-out gradient */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '7rem',
          background: 'linear-gradient(to bottom, transparent, #000000)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}
