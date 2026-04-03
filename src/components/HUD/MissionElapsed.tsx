import { useEffect, useState } from 'react'
import trajectory from '../../data/trajectory.json'

const LAUNCH_MS = new Date(trajectory[0].timestamp + 'Z').getTime()

export default function MissionElapsed() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // MET always from real wall clock — never from scrubber
  const diff  = Math.max(0, now.getTime() - LAUNCH_MS)
  const days  = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const mins  = Math.floor((diff % 3_600_000) / 60_000)
  const secs  = Math.floor((diff % 60_000) / 1000)

  const utcDate = now.toISOString().slice(0, 10)
  const utcTime = now.toISOString().slice(11, 19) + ' UTC'

  return (
    <div style={{ fontFamily: 'monospace', textAlign: 'right', pointerEvents: 'auto' }}>
      <div style={{ fontSize: '0.5rem', color: '#555', letterSpacing: '0.1rem', marginBottom: '0.2rem' }}>
        MISSION ELAPSED
      </div>
      <div style={{ fontSize: '0.9rem', color: '#fff', letterSpacing: '0.08rem' }}>
        {`DAY ${days + 1} — T+${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`}
      </div>
      <div style={{ fontSize: '0.5rem', color: '#555', letterSpacing: '0.06rem', marginTop: '0.25rem' }}>
        {utcDate}
      </div>
      <div style={{ fontSize: '0.55rem', color: '#666', letterSpacing: '0.06rem' }}>
        {utcTime}
      </div>
    </div>
  )
}
