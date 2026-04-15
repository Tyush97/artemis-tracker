import { useEffect } from 'react'
import { useMissionStore } from '../store/missionStore'
import { horizonsToOEM } from '../data/missionCurve'

const POLL_INTERVAL_MS = 5 * 60_000  // re-fetch current vector every 5 min

function convertVecs(vecs: any[]) {
  return vecs.map(v => {
    const c = horizonsToOEM(v.x, v.y, v.z)
    const cv = horizonsToOEM(v.vx, v.vy, v.vz)
    return { ...v, x: c.x, y: c.y, z: c.z, vx: cv.x, vy: cv.y, vz: cv.z }
  })
}

async function fetchVectors(mode: 'history' | 'current') {
  const res = await fetch(`/api/horizons-proxy?mode=${mode}`)
  if (!res.ok) return null
  const data = await res.json()
  if (!data.vectors?.length) return null
  return convertVecs(data.vectors)
}

export function useHorizonsTelemetry() {
  useEffect(() => {
    const { setActualTrajectory, setActualCurrentVector, isMissionComplete } = useMissionStore.getState()

    // 1. Fetch full flown arc once on mount (history: mission start → now, 30 min steps)
    fetchVectors('history').then(vecs => {
      if (vecs) setActualTrajectory(vecs)
    })

    // Mission already ended → fetch the final vector once, skip polling.
    if (isMissionComplete) {
      fetchVectors('current').then(vecs => {
        if (vecs?.length) setActualCurrentVector(vecs[vecs.length - 1])
      })
      return
    }

    // 2. Fetch current state vector now, then on interval
    const pollCurrent = () => {
      fetchVectors('current').then(vecs => {
        if (vecs?.length) {
          // Last vector in the window is the most recent
          setActualCurrentVector(vecs[vecs.length - 1])
        }
      })
    }

    pollCurrent()
    const id = setInterval(pollCurrent, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])
}
