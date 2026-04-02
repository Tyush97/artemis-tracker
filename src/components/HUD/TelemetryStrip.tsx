import { useMissionStore } from '../../store/missionStore'

function getPhase(idx: number): string {
  if (idx < 5) return 'LAUNCH'
  if (idx < 10) return 'TLI STAGE'
  if (idx < 25) return 'T-CRUISE'
  if (idx < 30) return 'FLYBY'
  return 'ENTRY'
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
      display: 'flex',
      gap: '2.5rem',
      color: '#ffffff',
      fontFamily: 'monospace',
      pointerEvents: 'auto',
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ fontSize: '0.625rem', color: '#666', letterSpacing: '0.1rem' }}>{m.label}</div>
          <div style={{ fontSize: '0.875rem', letterSpacing: '0.06rem' }}>{m.value}</div>
        </div>
      ))}
    </div>
  )
}
