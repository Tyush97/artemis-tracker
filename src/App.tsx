import { useEffect } from 'react'
import SceneCanvas from './components/SceneCanvas'
import TelemetryStrip from './components/HUD/TelemetryStrip'
import MissionIdentity from './components/HUD/MissionIdentity'
import MissionElapsed from './components/HUD/MissionElapsed'
import HardwareControls from './components/HUD/HardwareControls'
import EventTimeline from './components/HUD/EventTimeline'
import PhaseScrubber from './components/HUD/PhaseScrubber'
import { useMissionStore } from './store/missionStore'
import './index.css'

export default function App() {
  const { isPlaying, setIsPlaying } = useMissionStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        setIsPlaying(!isPlaying)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, setIsPlaying])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000000',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <SceneCanvas />

      {/* VIGNETTE: darkens edges so HUD text is readable over the 3D scene */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 9,
        pointerEvents: 'none',
        background: [
          'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)',
          'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.6) 100%)',
          'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.5) 100%)'
        ].join(', ')
      }} />

      {/*
         HUD SHELL: Flexbox Layering using REM for fluid responsiveness
      */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        boxSizing: 'border-box'
      }}>
        {/* TOP BAR — 3-column so MissionIdentity is at true center */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 3fr 1fr',
          alignItems: 'flex-start',
          width: '100%',
          marginBottom: '0.625rem'
        }}>
          <div style={{ pointerEvents: 'auto' }}><TelemetryStrip /></div>
          <div style={{ pointerEvents: 'auto', display: 'flex', justifyContent: 'center' }}><MissionIdentity /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', pointerEvents: 'auto' }}><MissionElapsed /></div>
        </div>

        {/* MID SECTION (Sidebars) */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          minHeight: 0,
          width: '100%'
        }}>
          <div style={{ pointerEvents: 'auto', height: 'fit-content', alignSelf: 'center' }}><HardwareControls /></div>
          <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}><EventTimeline /></div>
        </div>

        {/* BOTTOM BAR */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          width: '100%',
          paddingTop: '0.625rem'
        }}>
          <div style={{ pointerEvents: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <PhaseScrubber />
          </div>
        </div>
      </div>
    </div>
  )
}
