import { useEffect, useState } from 'react'
import trajectory from '../../data/trajectory.json'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useMissionStore } from '../../store/missionStore'
import { LAUNCH_N } from '../../data/missionCurve'
import { C, FS, LS } from '../../design/tokens'

// Liftoff anchor (matches missionStore.getRealTimeIndex).
const LAUNCH_MS = new Date('2026-04-01T23:44:00Z').getTime()
const OEM_START_MS = new Date(trajectory[0].timestamp + 'Z').getTime()
const OEM_END_MS = new Date(trajectory[trajectory.length - 1].timestamp + 'Z').getTime()
// Splashdown wall-clock — MET freezes here.
const SPLASHDOWN_MS = new Date('2026-04-11T00:07:00Z').getTime()
const LAST_IDX = trajectory.length - 1

/** Wall-clock UTC milliseconds corresponding to a store index in [-LAUNCH_N, LAST]. */
function idxToWallClockMs(idx: number): number {
  if (idx <= -LAUNCH_N) return LAUNCH_MS
  if (idx < 0) {
    const frac = (idx + LAUNCH_N) / LAUNCH_N
    return LAUNCH_MS + frac * (OEM_START_MS - LAUNCH_MS)
  }
  if (idx >= LAST_IDX) return OEM_END_MS
  return new Date((trajectory[idx] as { timestamp: string }).timestamp + 'Z').getTime()
}

export default function MissionElapsed() {
  const isMobile = useIsMobile()
  const { currentMissionTime, isMissionComplete } = useMissionStore()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (isMissionComplete) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [isMissionComplete])

  // MET source: scrubbed position's wall-clock, capped at splashdown when complete,
  // otherwise capped at real "now" so it never leaps past the live mark.
  const scrubbedMs = idxToWallClockMs(currentMissionTime)
  const ceilingMs = isMissionComplete ? SPLASHDOWN_MS : now.getTime()
  const referenceMs = Math.min(scrubbedMs, ceilingMs)
  const diff = Math.max(0, referenceMs - LAUNCH_MS)
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const mins = Math.floor((diff % 3_600_000) / 60_000)
  const secs = Math.floor((diff % 60_000) / 1000)

  const refDate = new Date(referenceMs)
  const utcDate = refDate.toISOString().slice(0, 10)
  const utcTime = refDate.toISOString().slice(11, 19) + ' UTC'

  if (isMobile) {
    return (
      <div style={{ fontFamily: 'monospace', textAlign: 'right', pointerEvents: 'auto' }}>
        <div style={{ fontSize: FS.xs, color: C.muted, letterSpacing: LS.normal, marginBottom: '0.25rem' }}>
          MISSION ELAPSED
        </div>
        <div style={{ fontSize: FS.md, color: C.primary, letterSpacing: LS.tight }}>
          {`D${days + 1} T+${String(hours).padStart(2, '0')}h${String(mins).padStart(2, '0')}m${String(secs).padStart(2, '0')}s`}
        </div>
        <div style={{ fontSize: FS.xs, color: C.muted, letterSpacing: LS.tight, marginTop: '0.25rem' }}>
          {utcTime}
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'monospace', textAlign: 'right', pointerEvents: 'auto' }}>
      <div style={{ fontSize: FS.xs, color: C.muted, letterSpacing: LS.normal, marginBottom: '0.2rem' }}>
        MISSION ELAPSED
      </div>
      <div style={{ fontSize: FS.display, color: C.primary, letterSpacing: LS.tight }}>
        {`DAY ${days + 1} — T+${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`}
      </div>
      <div style={{ fontSize: FS.xs, color: C.muted, letterSpacing: LS.tight, marginTop: '0.25rem' }}>
        {utcDate}
      </div>
      <div style={{ fontSize: FS.xs, color: C.secondary, letterSpacing: LS.tight }}>
        {utcTime}
      </div>
    </div>
  )
}
