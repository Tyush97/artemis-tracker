import { useMissionStore } from '../../store/missionStore'

function getPhase(idx: number): string {
  if (idx < 5) return 'LAUNCH'
  if (idx < 10) return 'TLI BURN'
  if (idx < 25) return 'T-CRUISE'
  if (idx < 30) return 'FLYBY'
  return 'RETURN'
}

export default function TelemetryStrip() {
  const { currentVector, currentMissionTime } = useMissionStore()

  const metrics = [
    { label: 'DIST. EARTH', value: `${currentVector.distanceFromEarth.toLocaleString()} km` },
    { label: 'DIST. MOON', value: `${Math.round(384400 - currentVector.distanceFromEarth).toLocaleString()} km` },
    { label: 'VELOCITY', value: `${currentVector.velocity.toFixed(1)} km/s` },
    { label: 'PHASE', value: getPhase(currentMissionTime) },
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
