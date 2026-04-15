import { useMissionStore } from '../../store/missionStore'
import { MOON_EME } from '../../data/missionCurve'
import { useIsMobile } from '../../hooks/useIsMobile'
import { C, FS, LS } from '../../design/tokens'

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
    isLive,
    isMissionComplete,
    getRealTimeIndex
  } = useMissionStore()

  const realIdx = getRealTimeIndex()
  const isFuture = currentMissionTime > realIdx
  const atEnd = currentMissionTime >= realIdx

  let vec = currentVector
  let status = 'HISTORIC'

  if (isMissionComplete) {
    if (atEnd) {
      vec = actualCurrentVector ?? currentVector
      status = 'COMPLETE'
    }
    // else: scrubbed back into the mission → HISTORIC
  } else if (isLive && actualCurrentVector) {
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

  const metrics = [
    { label: 'DIST. EARTH', value: `${distEarth.toLocaleString()} km` },
    { label: 'DIST. MOON', value: `${distMoon.toLocaleString()} km` },
    { label: 'VELOCITY', value: `${velocity.toFixed(2)} km/s` },
    { label: 'STATUS', value: status },
    ...(!isMobile ? [
      { label: 'PHASE', value: getPhase(currentMissionTime) },
    ] : []),
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: isMobile ? '0.4rem 0.75rem' : '0.625rem 1.25rem',
      color: C.primary,
      fontFamily: 'monospace',
      pointerEvents: 'auto',
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
          borderLeft: m.label === 'STATUS' && status === 'LIVE' ? `1px solid ${C.live}` : 'none',
          paddingLeft: m.label === 'STATUS' && status === 'LIVE' ? '0.5rem' : '0'
        }}>
          <div style={{ fontSize: FS.xs, color: C.muted, letterSpacing: LS.normal }}>{m.label}</div>
          <div style={{
            fontSize: isMobile ? FS.md : FS.lg,
            color: m.label === 'STATUS' && status === 'LIVE' ? C.live : C.primary,
            letterSpacing: LS.tight,
            fontWeight: m.label === 'STATUS' ? 'bold' : 'normal'
          }}>{m.value}</div>
        </div>
      ))}
    </div>
  )
}
