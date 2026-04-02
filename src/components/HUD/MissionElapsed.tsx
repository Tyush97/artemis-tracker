import { useMissionStore } from '../../store/missionStore'
import trajectory from '../../data/mockTrajectory.json'

export default function MissionElapsed() {
  const { currentMissionTime } = useMissionStore()
  const t = new Date(trajectory[currentMissionTime].timestamp)
  const start = new Date(trajectory[0].timestamp)
  const diff = t.getTime() - start.getTime()
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <div style={{
      fontFamily: 'monospace',
      textAlign: 'right',
      pointerEvents: 'auto',
    }}>
      <div style={{ fontSize: '0.5rem', color: '#555', letterSpacing: '0.1rem', marginBottom: '0.2rem' }}>
        MISSION ELAPSED
      </div>
      <div style={{ fontSize: '0.9rem', color: '#fff', letterSpacing: '0.08rem' }}>
        {`DAY ${days + 1} — T+${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`}
      </div>
    </div>
  )
}
