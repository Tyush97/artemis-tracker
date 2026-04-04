import { useMissionStore } from '../../store/missionStore'
import { MOON_EME } from '../../data/missionCurve'
import { useIsMobile } from '../../hooks/useIsMobile'

// Phase thresholds mapped to the 3212-point real OEM trajectory
function getPhase(idx: number): string {
  if (idx < 325) return 'OUTBOUND'
  if (idx < 400) return 'EARTH PASS'
  if (idx < 1115) return 'T-CRUISE'
  if (idx < 1757) return 'LUNAR APPROACH'
  if (idx < 2416) return 'LUNAR FLYBY'
  if (idx < 3100) return 'RETURN'
  return 'REENTRY'
}

export default function TelemetryStrip() {
  const isMobile = useIsMobile()
  const {
    currentVector,
    currentMissionTime,
    actualCurrentVector,
    lastHorizonsUpdate,
    isLive,
    getRealTimeIndex
  } = useMissionStore()

  const realIdx = getRealTimeIndex()
  const isFuture = currentMissionTime > realIdx

  let vec = currentVector
  let status = 'HISTORIC'

  if (isLive && actualCurrentVector) {
    vec = actualCurrentVector
    status = 'LIVE'
  } else if (isFuture) {
    status = 'PROJECTED'
  } else if (isLive) {
    status = 'LIVE'
  }

  const distEarth = Math.round(Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2))

  const distMoon = Math.round(Math.sqrt(
    (vec.x - MOON_EME.x) ** 2 +
    (vec.y - MOON_EME.y) ** 2 +
    (vec.z - MOON_EME.z) ** 2,
  ))

  const velocity = Math.sqrt(vec.vx ** 2 + vec.vy ** 2 + vec.vz ** 2)

  const updatedLabel = lastHorizonsUpdate
    ? lastHorizonsUpdate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }) + ' UTC'
    : '—'

  // On mobile: drop JPL UPDATED row to keep it compact
  const metrics = [
    { label: 'DIST. EARTH', value: `${distEarth.toLocaleString()} km` },
    { label: 'DIST. MOON', value: `${distMoon.toLocaleString()} km` },
    { label: 'VELOCITY', value: `${velocity.toFixed(2)} km/s` },
    { label: 'STATUS', value: status },
    ...(!isMobile ? [
      { label: 'PHASE', value: getPhase(currentMissionTime) },
      { label: 'JPL UPDATED', value: updatedLabel },
    ] : []),
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
      gap: isMobile ? '0.4rem 0.75rem' : '0.625rem 1.25rem',
      color: '#ffffff',
      fontFamily: 'monospace',
      pointerEvents: 'auto',
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
          borderLeft: m.label === 'STATUS' && status === 'LIVE' ? '1px solid #ff3333' : 'none',
          paddingLeft: m.label === 'STATUS' && status === 'LIVE' ? '0.5rem' : '0'
        }}>
          <div style={{ fontSize: '0.45rem', color: '#555', letterSpacing: '0.08rem' }}>{m.label}</div>
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.8rem',
            color: m.label === 'STATUS' && status === 'LIVE' ? '#ff3333' : '#fff',
            letterSpacing: '0.04rem',
            fontWeight: m.label === 'STATUS' ? 'bold' : 'normal'
          }}>{m.value}</div>
        </div>
      ))}
    </div>
  )
}
