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

interface MissionState {
  currentMissionTime: number
  isPlaying: boolean
  trajectory: StateVector[]
  currentVector: StateVector
  cameraMode: 'ship' | 'overview'
  
  // HUD interaction states
  controlMode: 'pan' | 'rotate'
  zoomLevel: number // 0 (Out) to 100 (In)

  setMissionTime:  (index: number) => void
  setIsPlaying:    (playing: boolean) => void
  tick:            () => void
  setCameraMode:   (mode: 'ship' | 'overview') => void
  setControlMode:  (mode: 'pan' | 'rotate') => void
  setZoomLevel:    (level: number) => void
}

export const useMissionStore = create<MissionState>((set, get) => ({
  currentMissionTime: 0,
  isPlaying:          false,
  trajectory,
  currentVector:      trajectory[0],
  cameraMode:         'overview',
  controlMode:        'rotate',
  zoomLevel:          50, 

  setMissionTime: (index) =>
    set({
      currentMissionTime: index,
      currentVector: trajectory[index] ?? trajectory[trajectory.length - 1],
    }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  tick: () => {
    const { currentMissionTime, trajectory } = get()
    const next = currentMissionTime + 1
    if (next >= trajectory.length) { set({ isPlaying: false }); return }
    set({ currentMissionTime: next, currentVector: trajectory[next] })
  },

  setCameraMode: (mode) => set({ cameraMode: mode }),
  
  setControlMode: (mode) => set({ controlMode: mode }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
}))
