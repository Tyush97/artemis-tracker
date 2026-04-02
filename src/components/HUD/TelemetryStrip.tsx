import { useMissionStore } from '../../store/missionStore'
import { MOON_EME } from '../../data/missionCurve'

// Phase thresholds mapped to the 3212-point real OEM trajectory
// Key indices: ~325 earth close-pass, 1115 lunar SOI, 1757 flyby, 2416 SOI exit
function getPhase(idx: number): string {
  if (idx < 325)  return 'OUTBOUND'
  if (idx < 400)  return 'EARTH PASS'
  if (idx < 1115) return 'T-CRUISE'
  if (idx < 1757) return 'LUNAR APPROACH'
  if (idx < 2416) return 'LUNAR FLYBY'
  if (idx < 3100) return 'RETURN'
  return 'REENTRY'
}

export default function TelemetryStrip() {
  const { currentVector, currentMissionTime } = useMissionStore()

  const distEarth = Math.round(Math.sqrt(
    currentVector.x ** 2 + currentVector.y ** 2 + currentVector.z ** 2,
  ))

  const distMoon = Math.round(Math.sqrt(
    (currentVector.x - MOON_EME.x) ** 2 +
    (currentVector.y - MOON_EME.y) ** 2 +
    (currentVector.z - MOON_EME.z) ** 2,
  ))

  const velocity = Math.sqrt(
    currentVector.vx ** 2 + currentVector.vy ** 2 + currentVector.vz ** 2,
  )

  const metrics = [
    { label: 'DIST. EARTH', value: `${distEarth.toLocaleString()} km` },
    { label: 'DIST. MOON',  value: `${distMoon.toLocaleString()} km` },
    { label: 'VELOCITY',    value: `${velocity.toFixed(2)} km/s` },
    { label: 'PHASE',       value: getPhase(currentMissionTime) },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.625rem 1.25rem',
      color: '#ffffff',
      fontFamily: 'monospace',
      pointerEvents: 'auto',
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ fontSize: '0.5rem', color: '#555', letterSpacing: '0.1rem' }}>{m.label}</div>
          <div style={{ fontSize: '0.8rem', color: '#fff', letterSpacing: '0.04rem' }}>{m.value}</div>
        </div>
      ))}
    </div>
  )
}
