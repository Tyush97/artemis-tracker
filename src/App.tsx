import { useEffect, useState } from 'react'
import SceneCanvas from './components/SceneCanvas'
import TelemetryStrip from './components/HUD/TelemetryStrip'
import MissionIdentity from './components/HUD/MissionIdentity'
import MissionElapsed from './components/HUD/MissionElapsed'
import HardwareControls from './components/HUD/HardwareControls'
import EventTimeline from './components/HUD/EventTimeline'
import EventDrawer from './components/HUD/EventDrawer'
import PhaseScrubber from './components/HUD/PhaseScrubber'
import { useMissionStore } from './store/missionStore'
import { useARTOWTelemetry } from './hooks/useARTOWTelemetry'
import { useHorizonsTelemetry } from './hooks/useHorizonsTelemetry'
import { useIsMobile } from './hooks/useIsMobile'
import './index.css'

function syncToRealTime() {
  useMissionStore.getState().goLive()
}

export default function App() {
  const { isPlaying, setIsPlaying } = useMissionStore()
  const isMobile = useIsMobile()
  const [feedOpen, setFeedOpen] = useState(false)

  // Mount telemetry polling hooks
  useARTOWTelemetry()
  useHorizonsTelemetry()

  // Sync trajectory position to real wall-clock time
  useEffect(() => {
    syncToRealTime()
    const id = setInterval(syncToRealTime, 60_000)
    return () => clearInterval(id)
  }, [])


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
      height: '100svh',
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
        padding: isMobile
          ? '0.875rem 1rem calc(1.25rem + env(safe-area-inset-bottom)) 1rem'
          : '1.5rem',
        boxSizing: 'border-box'
      }}>
        {isMobile ? (
          <>
            {/* MOBILE TOP ROW: telemetry left | identity+time right */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              width: '100%',
              pointerEvents: 'auto',
              gap: '1rem',
            }}>
              <TelemetryStrip />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                <MissionIdentity />
                <MissionElapsed />
              </div>
            </div>

            {/* MOBILE MID: space for 3D scene — ship fills this area */}
            <div style={{ flex: 1 }} />

            {/* MOBILE BOTTOM: scrubber then camera buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', width: '100%', pointerEvents: 'auto' }}>
              <PhaseScrubber />
              <HardwareControls horizontal onFeedOpen={() => {
                useMissionStore.getState().setCameraMode('ship')
                useMissionStore.getState().setMobileDrawerOpen(true)
                setFeedOpen(true)
              }} />
            </div>

          </>
        ) : (
          <>
            {/* DESKTOP TOP BAR */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2.5fr 1fr',
              alignItems: 'flex-start',
              width: '100%',
              marginBottom: '0.625rem'
            }}>
              <div style={{ pointerEvents: 'auto' }}><TelemetryStrip /></div>
              <div style={{ pointerEvents: 'auto', display: 'flex', justifyContent: 'center' }}><MissionIdentity /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', pointerEvents: 'auto' }}><MissionElapsed /></div>
            </div>

            {/* DESKTOP MID SECTION (Sidebars) */}
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

            {/* DESKTOP BOTTOM BAR */}
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
          </>
        )}
      </div>

      {/* EventDrawer outside HUD shell so it inherits pointerEvents correctly */}
      {isMobile && (
        <EventDrawer
          open={feedOpen}
          onClose={() => {
            setFeedOpen(false)
            useMissionStore.getState().setMobileDrawerOpen(false)
            useMissionStore.getState().setCameraMode('topdown')
          }}
        />
      )}
    </div>
  )
}
