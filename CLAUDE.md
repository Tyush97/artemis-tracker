# Artemis II Mission Tracker

## Project Overview
A live mission tracking canvas for NASA's Artemis II 10-day crewed lunar flyby mission. Displays a 3D interactive Orion spacecraft model alongside real-time mission updates, telemetry, and timeline data.

## Tech Stack
- **Framework**: React 18 + TypeScript (strict mode)
- **Build tool**: Vite
- **3D rendering**: React Three Fiber (R3F) + Three.js
- **3D helpers**: @react-three/drei (OrbitControls, Stars, Environment, useGLTF, etc.)
- **Deployment**: Netlify (static site, no SSR)

## Project Structure
```
src/
  components/      # React components (3D scene, UI overlays)
  App.tsx          # Root component
  main.tsx         # Entry point
  index.css        # Global reset + base styles
public/
  models/
    orion.glb      # NASA Orion spacecraft 3D model (GLB format)
```

## Conventions
- All components are TypeScript `.tsx` files — no `.js` or `.jsx`
- Keep 3D scene logic inside `src/components/` — one component per concern
- Use `useGLTF` from `@react-three/drei` to load the Orion model from `/models/orion.glb`
- Wrap async 3D content in `<Suspense>` with a lightweight fallback mesh
- Global styles live in `src/index.css` — no CSS modules unless complexity demands it
- No class components — hooks only
- Do not add error boundaries, retry logic, or fallbacks beyond what the task needs

## Design Direction
- Dark space aesthetic: deep black/navy backgrounds, cool blue accent lights
- Premium feel: smooth animations, subtle glow effects
- Minimal UI chrome — let the 3D model breathe
- Typography: system-ui / Inter

## Deployment Notes
- Netlify auto-deploys from the `main` branch
- Build command: `npm run build`
- Publish directory: `dist`
- No environment variables required for the base 3D canvas
