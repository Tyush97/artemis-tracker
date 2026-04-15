import { create } from 'zustand'
import trajectoryData from '../data/trajectory.json'
import { LAUNCH_N, LAUNCH_TIME_MS } from '../data/missionCurve'

export interface StateVector {
  timestamp: string
  x: number   // km, EME2000
  y: number   // km, EME2000
  z: number   // km, EME2000
  vx: number  // km/s
  vy: number  // km/s
  vz: number  // km/s
}

const trajectory: StateVector[] = trajectoryData

interface MissionState {
  currentMissionTime: number
  isPlaying: boolean
  isLive: boolean
  isMissionComplete: boolean

  trajectory: StateVector[]
  currentVector: StateVector

  actualTrajectory: StateVector[]
  actualCurrentVector: StateVector | null
  lastHorizonsUpdate: Date | null

  cameraMode: 'topdown' | 'reset' | 'ship' | 'free'
  controlMode: 'pan' | 'rotate'
  zoomLevel: number
  mobileDrawerOpen: boolean

  setMissionTime:  (index: number) => void
  setIsPlaying:    (playing: boolean) => void
  tick:            () => void
  setCameraMode:   (mode: 'topdown' | 'reset' | 'ship' | 'free') => void
  setControlMode:  (mode: 'pan' | 'rotate') => void
  setZoomLevel:    (level: number) => void
  setMobileDrawerOpen: (open: boolean) => void
  setActualTrajectory:     (vecs: StateVector[]) => void
  setActualCurrentVector:  (vec: StateVector) => void
  getRealTimeIndex: () => number
  goLive:          () => void
}

// Safe trajectory lookup: clamps idx into [0, length-1]
function safeVec(idx: number): StateVector {
  return trajectory[Math.max(0, Math.min(idx, trajectory.length - 1))]
}

// Mission end wall-clock: Artemis II splashdown, 2026-04-11T00:07:00Z
// (Pacific Ocean off San Diego, 8:07 p.m. EDT / 5:07 p.m. PDT on 2026-04-10).
const MISSION_END_MS = new Date('2026-04-11T00:07:00Z').getTime()
function missionIsComplete(): boolean {
  return Date.now() >= MISSION_END_MS
}

export const useMissionStore = create<MissionState>((set, get) => ({
  currentMissionTime: -LAUNCH_N,   // start at liftoff; App.syncToRealTime overrides on mount
  isPlaying:          false,
  isLive:             false,
  isMissionComplete:  missionIsComplete(),
  trajectory,
  currentVector:      trajectory[0],
  actualTrajectory:        [],
  actualCurrentVector:     null,
  lastHorizonsUpdate:      null,
  cameraMode:         'reset',
  controlMode:        'rotate',
  zoomLevel:          50,
  mobileDrawerOpen:   false,

  setMissionTime: (index) => {
    const realIdx = get().getRealTimeIndex()
    const cappedIdx = Math.min(index, realIdx)
    const atEnd = cappedIdx >= realIdx
    const complete = missionIsComplete()
    set({
      currentMissionTime: cappedIdx,
      currentVector: safeVec(cappedIdx),
      isLive: atEnd && !complete,
      isMissionComplete: complete,
      isPlaying: atEnd ? false : get().isPlaying,
    })
  },

  setIsPlaying: (playing) => {
    const { currentMissionTime, getRealTimeIndex } = get()
    const realIdx = getRealTimeIndex()
    if (playing && currentMissionTime >= realIdx) return
    set({ isPlaying: playing })
  },

  tick: () => {
    const { currentMissionTime, getRealTimeIndex } = get()
    const realIdx = getRealTimeIndex()
    const complete = missionIsComplete()
    if (currentMissionTime >= realIdx) {
      set({ isPlaying: false, isLive: !complete, isMissionComplete: complete })
      return
    }
    const next = currentMissionTime + 1
    if (next >= trajectory.length) {
      set({ isPlaying: false, isLive: !complete, isMissionComplete: complete })
      return
    }
    set({
      currentMissionTime: next,
      currentVector: safeVec(next),
      isLive: next >= realIdx && !complete,
      isMissionComplete: complete,
    })
  },

  setCameraMode: (mode) => set({ cameraMode: mode }),
  setControlMode: (mode) => set({ controlMode: mode }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
  setActualTrajectory: (vecs) => set({ actualTrajectory: vecs }),
  setActualCurrentVector: (vec) => set({ actualCurrentVector: vec, lastHorizonsUpdate: new Date() }),

  getRealTimeIndex: () => {
    const traj = get().trajectory
    const now = Date.now()
    const oemStart = new Date(traj[0].timestamp + 'Z').getTime()
    const oemEnd   = new Date(traj[traj.length - 1].timestamp + 'Z').getTime()

    // Before liftoff — at launch pad
    if (now <= LAUNCH_TIME_MS) return -LAUNCH_N

    // Between liftoff and OEM data start — in launch arc
    if (now < oemStart) {
      const frac = (now - LAUNCH_TIME_MS) / (oemStart - LAUNCH_TIME_MS)
      return Math.round(-LAUNCH_N + frac * LAUNCH_N)
    }

    if (now >= oemEnd) return traj.length - 1

    // Binary search within OEM data
    let lo = 0, hi = traj.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (new Date(traj[mid].timestamp + 'Z').getTime() < now) lo = mid + 1
      else hi = mid
    }
    return lo
  },

  goLive: () => {
    const { getRealTimeIndex } = get()
    const idx = getRealTimeIndex()
    const complete = missionIsComplete()
    set({
      currentMissionTime: idx,
      currentVector: safeVec(idx),
      isLive: !complete,
      isMissionComplete: complete,
      isPlaying: false,
    })
  },
}))
