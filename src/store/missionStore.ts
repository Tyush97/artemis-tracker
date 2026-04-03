import { create } from 'zustand'
import trajectoryData from '../data/trajectory.json'

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

export interface TelemetryData {
  distanceFromEarth: number;
  distanceFromMoon: number;
  velocity: number;
  missionElapsedTime: string;
}

interface MissionState {
  currentMissionTime: number
  isPlaying: boolean
  isLive: boolean
  telemetry: TelemetryData | null

  trajectory: StateVector[]
  currentVector: StateVector

  // HORIZONS live data — null until first fetch succeeds
  actualTrajectory: StateVector[]       // flown arc from HORIZONS (history mode)
  actualCurrentVector: StateVector | null  // latest HORIZONS state vector
  lastHorizonsUpdate: Date | null       // wall-clock time of last successful HORIZONS current poll

  cameraMode: 'topdown' | 'perspective' | 'ship'

  // HUD interaction states
  controlMode: 'pan' | 'rotate'
  zoomLevel: number // 0 (Out) to 100 (In)

  setMissionTime:  (index: number) => void
  setIsPlaying:    (playing: boolean) => void
  tick:            () => void
  setCameraMode:   (mode: 'topdown' | 'perspective' | 'ship') => void
  setControlMode:  (mode: 'pan' | 'rotate') => void
  setZoomLevel:    (level: number) => void
  setTelemetry:    (data: TelemetryData) => void
  setActualTrajectory:     (vecs: StateVector[]) => void
  setActualCurrentVector:  (vec: StateVector) => void
  getRealTimeIndex: () => number
  goLive:          () => void
}

export const useMissionStore = create<MissionState>((set, get) => ({
  currentMissionTime: 0,
  isPlaying:          false,
  isLive:             false,
  telemetry:          null,
  trajectory,
  currentVector:      trajectory[0],
  actualTrajectory:        [],
  actualCurrentVector:     null,
  lastHorizonsUpdate:      null,
  cameraMode:         'perspective',
  controlMode:        'rotate',
  zoomLevel:          50,

  setMissionTime: (index) => {
    const realIdx = get().getRealTimeIndex()
    const cappedIdx = Math.min(index, realIdx)
    const isNowLive = cappedIdx >= realIdx
    
    set({
      currentMissionTime: cappedIdx,
      currentVector: trajectory[cappedIdx] ?? trajectory[trajectory.length - 1],
      isLive: isNowLive,
      isPlaying: isNowLive ? false : get().isPlaying // Stop playing if we hit live
    })
  },

  setIsPlaying: (playing) => {
    const { currentMissionTime, getRealTimeIndex } = get()
    const realIdx = getRealTimeIndex()
    // Don't start playing if we're already at or past live
    if (playing && currentMissionTime >= realIdx) return
    set({ isPlaying: playing })
  },

  tick: () => {
    const { currentMissionTime, trajectory, getRealTimeIndex } = get()
    const realIdx = getRealTimeIndex()
    
    if (currentMissionTime >= realIdx) {
      set({ isPlaying: false, isLive: true })
      return
    }

    const next = currentMissionTime + 1
    if (next >= trajectory.length) { 
      set({ isPlaying: false, isLive: true }); 
      return 
    }
    
    set({ 
      currentMissionTime: next, 
      currentVector: trajectory[next], 
      isLive: next >= realIdx 
    })
  },

  setCameraMode: (mode) => set({ cameraMode: mode }),

  setControlMode: (mode) => set({ controlMode: mode }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setTelemetry: (data) => set({ telemetry: data }),
  setActualTrajectory: (vecs) => set({ actualTrajectory: vecs }),
  setActualCurrentVector: (vec) => set({ actualCurrentVector: vec, lastHorizonsUpdate: new Date() }),

  getRealTimeIndex: () => {
    const traj = get().trajectory
    const now = Date.now()
    const start = new Date(traj[0].timestamp + 'Z').getTime()
    const end   = new Date(traj[traj.length - 1].timestamp + 'Z').getTime()
    if (now <= start) return 0
    if (now >= end)   return traj.length - 1
    
    // Find the current point based on system clock
    let lo = 0, hi = traj.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (new Date(traj[mid].timestamp + 'Z').getTime() < now) lo = mid + 1
      else hi = mid
    }
    return lo
  },

  goLive: () => {
    const { getRealTimeIndex, trajectory } = get()
    const idx = getRealTimeIndex()
    set({ currentMissionTime: idx, currentVector: trajectory[idx], isLive: true, isPlaying: false })
  },
}))
