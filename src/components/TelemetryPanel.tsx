import { useMissionStore } from '../store/missionStore'
import { MOON_KM } from '../data/missionCurve'
import trajectory from '../data/mockTrajectory.json'

const LAUNCH_MS = new Date(trajectory[0].timestamp).getTime()
const LAST_IDX = trajectory.length - 1

// Storytelling translation of PRD - no dense jargon for primary labels 
const PHASES: Array<[number, string]> = [
  [4, 'Launch & Undocking'],
  [9, 'Leaving Earth Orbit'],
  [24, 'Deep Space Coast & Radiation Testing'],
  [29, 'Closest Lunar Approach'],
  [LAST_IDX, 'High-Speed Reentry'],
]

function missionPhase(idx: number): string {
  return PHASES.find(([max]) => idx <= max)?.[1] ?? 'High-Speed Reentry'
}

function nextMilestone(idx: number): string {
  if (idx <= 4) return 'Earth Departure Burn'
  if (idx <= 9) return 'Deep Space Coast'
  if (idx <= 24) return 'Lunar Flyby'
  if (idx <= 29) return 'Earth Return Phase'
  return 'Pacific Splashdown'
}

function fmt(n: number, dec = 0): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })
}

export default function TelemetryPanel() {
  const { currentVector, currentMissionTime } = useMissionStore()

  const elapsed = new Date(currentVector.timestamp).getTime() - LAUNCH_MS
  const days = Math.floor(elapsed / 864e5)
  const hours = Math.floor((elapsed % 864e5) / 36e5)

  // Euclidean math for absolute efficiency
  const dx = currentVector.x - MOON_KM.x
  const dy = currentVector.y - MOON_KM.y
  const dz = currentVector.z - MOON_KM.z
  const distToMoon = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz))

  // Contextual Dynamic Metric based heavily on PRD Day tracking
  let dynamicLabel = ''
  let dynamicValue = ''
  let dynamicUnit = ''
  let dynamicSub = ''
  let dynamicAccent = '#ffffff'

  if (currentMissionTime <= 4) { // Day 1
    dynamicLabel = 'Upper-Stage Distance'
    dynamicValue = fmt(15 + (hours * 12.5), 1)
    dynamicUnit = 'm'
    dynamicSub = 'Proximity Operations'
    dynamicAccent = '#4aff8a'
  } else if (currentMissionTime <= 9) { // Day 2
    dynamicLabel = 'Translunar Injection'
    dynamicValue = '+3.14'
    dynamicUnit = 'km/s'
    dynamicSub = 'Breaking Earth Gravity'
    dynamicAccent = '#ffcc00'
  } else if (currentMissionTime <= 24) { // Days 3-5
    dynamicLabel = 'Radiation Exposure'
    const dose = 0.5 + (days - 2) * 0.15
    dynamicValue = fmt(dose, 2)
    dynamicUnit = 'mSv'
    dynamicSub = `~${fmt(dose/0.1 * 10, 0)} Chest X-Rays`
    dynamicAccent = '#ff8844'
  } else if (currentMissionTime <= 29) { // Day 6
    dynamicLabel = 'Apollo 13 Distance Record'
    dynamicValue = '400,171' // The record distance
    dynamicUnit = 'km'
    dynamicSub = 'MAXIMUM DISTANCE REACHED'
    dynamicAccent = '#ff4a4a'
  } else { // Days 7-10
    dynamicLabel = 'Reentry Heat Load'
    const heat = currentMissionTime > 47 ? 2760 : -150
    dynamicValue = fmt(heat)
    dynamicUnit = '°C'
    dynamicSub = 'Thermal Protection Active'
    dynamicAccent = heat > 0 ? '#ff4a4a' : '#a8c4ff'
  }

  // Large beautifully set data points per PRD
  const rows = [
    { label: 'Mission Elapsed Time', value: `T+ ${days}d ${String(hours).padStart(2, '0')}h`, unit: '' },
    { label: 'Mission Phase', value: missionPhase(currentMissionTime), unit: '', accent: '#ffffff' },
    { label: 'Next Milestone', value: nextMilestone(currentMissionTime), unit: '', accent: '#4a8aff' },
    { label: 'Distance from Earth', value: fmt(currentVector.distanceFromEarth), unit: 'km' },
    { label: 'Distance to Moon', value: fmt(distToMoon), unit: 'km' },
    { label: 'Relative Velocity', value: fmt(currentVector.velocity, 2), unit: 'km/s' },
  ]

  return (
    <aside style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '300px',
      height: '100%',
      background: '#050505',
      borderLeft: '1px solid #1A1A1A',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      gap: '12px',
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      zIndex: 10,
    }}>
      <div style={{ marginBottom: '8px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#666', textTransform: 'uppercase' }}>
          Mission Control
        </p>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>
          Live Telemetry
        </p>
      </div>

      {rows.map(({ label, value, unit, accent }) => (
        <div key={label} style={{
          padding: '12px 14px',
          background: '#1A1A1A',
          borderRadius: '4px',
          border: '1px solid #2a2a2a',
        }}>
          <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
            {label}
          </p>
          <p style={{ 
            fontSize: '20px', 
            fontWeight: 500, 
            color: accent ?? '#fff', 
            lineHeight: 1.1,
            // Premium Fintech Monospaced Numbers
            fontFamily: 'JetBrains Mono, Geist Mono, Space Mono, monospace'
          }}>
            {value}
            {unit && <span style={{ fontSize: '12px', color: '#666', marginLeft: '6px' }}>{unit}</span>}
          </p>
        </div>
      ))}

      {/* Dynamic Contextual Metric Card based on Mission Timeline Days */}
      <div style={{
          marginTop: '8px',
          padding: '16px 14px',
          background: 'linear-gradient(145deg, #1A1A1A 0%, #050505 100%)',
          borderRadius: '4px',
          border: `1px solid ${dynamicAccent}40`,
          borderLeft: `3px solid ${dynamicAccent}`,
        }}>
          <p style={{ fontSize: '11px', color: dynamicAccent, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {dynamicLabel}
          </p>
          <p style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: '#fff', 
            lineHeight: 1.1,
            fontFamily: 'JetBrains Mono, Geist Mono, Space Mono, monospace'
          }}>
            {dynamicValue}
            {dynamicUnit && <span style={{ fontSize: '12px', color: '#888', marginLeft: '6px' }}>{dynamicUnit}</span>}
          </p>
          {dynamicSub && (
            <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>{dynamicSub}</p>
          )}
      </div>
    </aside>
  )
}
