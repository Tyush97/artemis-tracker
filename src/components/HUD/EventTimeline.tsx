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

function getMet(timestamp: string) {
  const d = new Date(timestamp)
  return `T+${d.getDate()-1}d ${d.getHours()}h ${d.getMinutes()}m`
}

export default function EventTimeline() {
  const { currentMissionTime, trajectory, setMissionTime, setIsPlaying } = useMissionStore()

  const handleMilestoneClick = (idx: number) => {
    setIsPlaying(false)
    setMissionTime(idx)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      fontFamily: 'monospace',
      pointerEvents: 'auto',
      maxWidth: '15rem',
    }}>
      <div style={{ fontSize: '0.625rem', color: '#666', letterSpacing: '0.125rem', textAlign: 'right' }}>MISSION TIMELINE</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {EVENTS.map((ev, i) => {
          const isPast = currentMissionTime >= ev.idx
          const isCurrent = currentMissionTime >= ev.idx && (i === EVENTS.length - 1 || currentMissionTime < EVENTS[i+1].idx)
          
          return (
            <div 
              key={i} 
              onClick={() => handleMilestoneClick(ev.idx)}
              style={{
                opacity: isPast ? 1 : 0.3,
                textAlign: 'right',
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '0.625rem', color: '#888', marginBottom: '0.375rem' }}>
                {isCurrent && <span style={{color: '#fff', marginRight: '0.375rem'}}>▓</span>}
                {getMet(trajectory[ev.idx].timestamp)}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                color: isCurrent ? '#fff' : '#ccc',
                letterSpacing: '0.06rem',
                borderRight: isCurrent ? '2px solid #fff' : '1px solid #333',
                paddingRight: '0.75rem',
                lineHeight: '1.4',
                transition: 'border 0.2s'
              }}>
                {ev.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
