import { useMissionStore } from '../../store/missionStore'
import trajectory from '../../data/trajectory.json'
import { useIsMobile } from '../../hooks/useIsMobile'
import { C, FS, LS } from '../../design/tokens'

const LAST_IDX = trajectory.length - 1  // 3211

// Phase boundaries aligned to the 3212-point real OEM trajectory
const PHASES: Array<[number, string]> = [
  [324, 'Outbound Coast'],
  [399, 'Earth Close Pass'],
  [1114, 'Translunar Coast'],
  [1756, 'Lunar Approach'],
  [2415, 'Lunar Flyby'],
  [3099, 'Return Coast'],
  [LAST_IDX, 'Return & Reentry'],
]

function getPhase(idx: number): string {
  return PHASES.find(([max]) => idx <= max)?.[1] ?? 'Return & Reentry'
}

export default function MissionIdentity() {
  const isMobile = useIsMobile()
  const { currentMissionTime, isMissionComplete } = useMissionStore()
  const atEnd = currentMissionTime === LAST_IDX
  const showLiveDot = atEnd && !isMissionComplete

  return (
    <div style={{
      color: C.primary,
      fontFamily: 'monospace',
      textAlign: isMobile ? 'right' : 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: isMobile ? 'flex-end' : 'center',
      gap: '0.25rem',
      pointerEvents: 'auto',
    }}>
      {/* Mission name */}
      <span style={{ fontSize: isMobile ? FS.xl : FS.xxl, letterSpacing: LS.normal, fontWeight: 300 }}>
        Artemis II — Integrity
      </span>

      {/* Phase */}
      <span style={{ fontSize: FS.md, color: C.secondary, letterSpacing: LS.normal }}>
        Phase - {isMissionComplete && atEnd ? 'Mission Complete' : getPhase(currentMissionTime)}
        {showLiveDot && (
          <span style={{
            display: 'inline-block',
            width: '0.4rem', height: '0.4rem',
            backgroundColor: C.live,
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
