import { useMissionStore } from '../../store/missionStore'
import trajectory from '../../data/mockTrajectory.json'

const LAST_IDX = trajectory.length - 1

const PHASES: Array<[number, string]> = [
  [4,        'Launch'],
  [9,        'Translunar Injection'],
  [24,       'Translunar Coast'],
  [29,       'Lunar Flyby'],
  [LAST_IDX, 'Return & Reentry'],
]

function getPhase(idx: number): string {
  return PHASES.find(([max]) => idx <= max)?.[1] ?? 'RETURN & REENTRY'
}

export default function MissionIdentity() {
  const { currentMissionTime } = useMissionStore()
  const isLive = currentMissionTime === LAST_IDX

  return (
    <div style={{
      color: '#ffffff',
      fontFamily: 'monospace',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      pointerEvents: 'auto',
    }}>
      {/* Mission name */}
      <span style={{ fontSize: '1.5rem', letterSpacing: '0.15rem', fontWeight: 300 }}>
        Artemis II - Live Trajectory
      </span>

      {/* Phase */}
      <span style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '0.125rem' }}>
        Phase - {getPhase(currentMissionTime)}
        {isLive && (
          <span style={{
            display: 'inline-block',
            width: '0.4rem', height: '0.4rem',
            backgroundColor: '#ff3333',
            borderRadius: '50%',
            animation: 'pulse 1s infinite',
            marginLeft: '0.5rem',
            verticalAlign: 'middle',
          }} />
        )}
      </span>
    </div>
  )
}
