import SceneCanvas from './components/SceneCanvas'
import TelemetryStrip from './components/HUD/TelemetryStrip'
import MissionIdentity from './components/HUD/MissionIdentity'
import HardwareControls from './components/HUD/HardwareControls'
import EventTimeline from './components/HUD/EventTimeline'
import PhaseScrubber from './components/HUD/PhaseScrubber'
import './index.css'

export default function App() {
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
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'flex-start',
            width: '100%',
            marginBottom: '0.625rem'
        }}>
          <div style={{ pointerEvents: 'auto' }}><TelemetryStrip /></div>
          <div style={{ pointerEvents: 'auto', display: 'flex', justifyContent: 'center' }}><MissionIdentity /></div>
          <div />{/* spacer to keep center column truly centred */}
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
