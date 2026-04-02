import { useMissionStore } from '../../store/missionStore'
import trajectory from '../../data/mockTrajectory.json'

const LAST_IDX = trajectory.length - 1

const PHASES: Array<[number, string]> = [
  [4, 'LAUNCH & UNDOCKING'],
  [9, 'TRANSLUNAR INJECTION'],
  [24, 'TRANSLUNAR COAST'],
  [29, 'LUNAR FLYBY'],
  [LAST_IDX, 'RETURN & REENTRY'],
]

function getPhase(idx: number): string {
  return PHASES.find(([max]) => idx <= max)?.[1] ?? 'RETURN & REENTRY'
}

function getMet(timestamp: string) {
  const t = new Date(timestamp)
  const start = new Date(trajectory[0].timestamp)
  const diff = t.getTime() - start.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `T+${days}d ${hours}h ${mins}m`
}

export default function MissionIdentity() {
  const { currentMissionTime } = useMissionStore()
  const isLive = currentMissionTime === LAST_IDX
  const currentVector = trajectory[currentMissionTime]

  return (
    <div style={{
      color: '#ffffff',
      fontFamily: 'monospace',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      pointerEvents: 'auto',
    }}>
      <span style={{ fontSize: '1.125rem', letterSpacing: '0.25rem', fontWeight: 600 }}>ARTEMIS II — INTEGRITY</span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
        {isLive ? (
          <>
            <span style={{
              width: '0.625rem', height: '0.625rem', backgroundColor: '#ff3333', borderRadius: '50%',
              animation: 'pulse 1s infinite'
            }} />
            <span style={{ fontSize: '0.875rem', color: '#ccc', letterSpacing: '0.125rem' }}>
              {getPhase(currentMissionTime)}
            </span>
          </>
        ) : (
          <>
            <span style={{ fontSize: '0.875rem', color: '#888', letterSpacing: '0.125rem' }}>
              {getPhase(currentMissionTime)}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#444' }}>|</span>
            <span style={{ fontSize: '0.875rem', color: '#aaa' }}>
              {getMet(currentVector.timestamp)}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
