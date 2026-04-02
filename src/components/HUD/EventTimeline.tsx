import { useEffect, useRef, useState } from 'react'
import { useMissionStore } from '../../store/missionStore'
import trajectory from '../../data/trajectory.json'

// Event indices mapped to the 3212-point real OEM trajectory.
// Key milestones derived from actual ephemeris timestamps:
//   idx   0  → 2026-04-02T03:07 — OEM opens, spacecraft already coasting outbound at 41,286 km
//   idx 325  → 2026-04-02T23:37 — Earth close-pass (~8,400 km geocentric, ~2,000 km altitude)
//   idx 1115 → 2026-04-05T04:19 — Crosses lunar sphere of influence (~318,300 km from Earth)
//   idx 1757 → 2026-04-06T23:07 — Lunar flyby closest approach (~413,146 km from Earth)
//   idx 2416 → 2026-04-08T19:03 — Exits lunar sphere of influence, homeward bound
//   idx 3050 → 2026-04-10T09:29 — Deep return coast, ~147,000 km from Earth
//   idx 3180 → 2026-04-10T22:45 — Reentry corridor approach
const EVENTS = [
  {
    idx: 0,
    label: 'OUTBOUND COAST',
    detail: 'OEM tracking opens. Orion/SLS has completed the Translunar Injection burn. The crew are coasting through deep space at 41,286 km, accelerating away from Earth on a hybrid free-return trajectory.',
  },
  {
    idx: 325,
    label: 'EARTH CLOSE PASS',
    detail: 'The hybrid free-return arc sweeps Orion back to within ~2,000 km of Earth\'s surface — a planned gravity-shaping maneuver. The crew experience a brief but dramatic close approach before the trajectory curves outward toward the Moon.',
  },
  {
    idx: 1115,
    label: 'LUNAR SPHERE OF INFLUENCE',
    detail: 'At ~318,300 km from Earth, the Moon\'s gravity overtakes Earth\'s. Orion begins to accelerate without any engine burn. The crew are now in lunar space — the closest humans have been to another world since Apollo 17.',
  },
  {
    idx: 1757,
    label: 'LUNAR FLYBY',
    detail: 'Orion skims ~8,900 km above the lunar surface — closer than any crewed spacecraft since Apollo. No orbit insertion. Free-return trajectory confirmed. The crew photograph the Moon at closest approach before beginning the long coast home.',
  },
  {
    idx: 2416,
    label: 'RETURN COAST BEGINS',
    detail: 'Orion exits the lunar sphere of influence and re-enters Earth\'s gravitational dominance. The service module provides a minor trajectory correction burn. Crew rest period begins. ~2 days to reentry corridor.',
  },
  {
    idx: 3050,
    label: 'DEEP RETURN',
    detail: 'Homeward bound at ~147,000 km. Orion is now falling toward Earth, velocity climbing steadily. Final systems checks are underway. Entry, Descent & Landing procedures being reviewed.',
  },
  {
    idx: 3180,
    label: 'REENTRY & SPLASHDOWN',
    detail: 'Command Module separates from the service module. 11-minute reentry at Mach 32. Skip-reentry trajectory bleeds off excess velocity. Drogue and main chutes deploy. Splashdown in the Pacific. Artemis II complete.',
  },
]

function getMet(trajectoryIdx: number): string {
  const t     = new Date(trajectory[trajectoryIdx].timestamp)
  const start = new Date(trajectory[0].timestamp)
  const diff  = t.getTime() - start.getTime()
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `T+${days}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`
}

export default function EventTimeline() {
  const { currentMissionTime, setMissionTime, setIsPlaying } = useMissionStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [peakTime, setPeakTime] = useState(currentMissionTime)
  useEffect(() => {
    if (currentMissionTime > peakTime) setPeakTime(currentMissionTime)
  }, [currentMissionTime])

  const visibleEvents = [...EVENTS].filter(ev => peakTime >= ev.idx).reverse()

  const passed    = EVENTS.filter(ev => currentMissionTime >= ev.idx)
  const activeIdx = passed.length > 0 ? passed[passed.length - 1].idx : -1

  const handleClick = (idx: number) => {
    setIsPlaying(false)
    setMissionTime(idx)
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeIdx])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'monospace',
      pointerEvents: 'auto',
      width: '16rem',
      alignSelf: 'flex-start',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        fontSize: '0.5rem',
        color: '#444',
        letterSpacing: '0.18rem',
        textAlign: 'right',
        paddingBottom: '0.625rem',
        borderBottom: '1px solid #1a1a1a',
        marginBottom: '0.75rem',
        flexShrink: 0,
      }}>
        LIVE UPDATES
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div
          ref={scrollRef}
          style={{
            height: '100%',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
            paddingBottom: '5rem',
          }}
        >
          {visibleEvents.map((ev, i) => {
            const isCurrent = ev.idx === activeIdx
            const isLatest  = i === 0
            return (
              <div
                key={ev.idx}
                onClick={() => handleClick(ev.idx)}
                style={{
                  cursor: 'pointer',
                  paddingBottom: '1rem',
                  marginBottom: '1rem',
                  borderBottom: '1px solid #141414',
                  opacity: isCurrent ? 1 : 0.45,
                  transition: 'opacity 0.3s',
                }}
              >
                {/* Timestamp row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.4rem',
                  marginBottom: '0.3rem',
                }}>
                  {isLatest && (
                    <span style={{
                      width: '0.35rem', height: '0.35rem',
                      backgroundColor: '#ff3333',
                      borderRadius: '50%',
                      animation: 'pulse 1s infinite',
                      flexShrink: 0,
                    }} />
                  )}
                  <span style={{ fontSize: '0.5rem', color: '#666', letterSpacing: '0.08rem' }}>
                    {getMet(ev.idx)}
                  </span>
                </div>

                {/* Headline */}
                <div style={{
                  fontSize: '0.625rem',
                  color: isCurrent ? '#fff' : '#aaa',
                  letterSpacing: '0.1rem',
                  fontWeight: isCurrent ? 700 : 400,
                  textAlign: 'right',
                  borderRight: isCurrent ? '2px solid #fff' : '1px solid #2a2a2a',
                  paddingRight: '0.75rem',
                  marginBottom: '0.4rem',
                  lineHeight: '1.3',
                }}>
                  {ev.label}
                </div>

                {/* Detail blurb — only show for current and 1 back */}
                {i < 2 && (
                  <div style={{
                    fontSize: '0.5625rem',
                    color: isCurrent ? '#888' : '#444',
                    lineHeight: '1.6',
                    textAlign: 'right',
                    paddingRight: '0.75rem',
                  }}>
                    {ev.detail}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '6rem',
          background: 'linear-gradient(to bottom, transparent, #000)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}
