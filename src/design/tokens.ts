/**
 * Artemis II HUD Design Tokens
 *
 * Terminal Mission Control aesthetic — monochrome monospace.
 * All inline styles should reference these tokens, never raw values.
 */

// ---------------------------------------------------------------------------
// Color tokens
// ---------------------------------------------------------------------------
export const C = {
  /** Main values, active headings, white-fill button icons */
  primary:   '#ffffff',
  /** Readable supporting text — UTC time, event descriptions, phase name */
  secondary: '#888888',
  /** Field labels — DIST. EARTH, STATUS, MISSION ELAPSED, etc. */
  muted:     '#555555',
  /** Very subtle context text — source badges, future scrubber ticks */
  ghost:     '#444444',

  /** All dividers and separators */
  border:    '#1e1e1e',
  /** Elevated surfaces — drawer, overlays */
  surface:   '#0a0a0a',

  /** Live-state indicator (pulsing red) */
  live:      '#ff3333',

  /** Inactive button border */
  btnBorder: '#333333',
  /** Inactive button icon / text */
  btnIcon:   '#666666',
  /** Icon on active (white-filled) button */
  btnIconOn: '#000000',
} as const

// ---------------------------------------------------------------------------
// Font-size tokens  (monospace HUD scale, rem-based)
// ---------------------------------------------------------------------------
export const FS = {
  /** 8px  — field labels, section headers, source badges, micro text */
  xs:      '0.5rem',
  /** 10px — event titles, description body, small data values */
  sm:      '0.625rem',
  /** 12px — standard data values (mobile), phase text */
  md:      '0.75rem',
  /** 14px — primary desktop data values, mobile MET line */
  lg:      '0.875rem',
  /** 16px — MET desktop primary line */
  display: '1.0rem',
  /** 20px — mission name mobile */
  xl:      '1.25rem',
  /** 24px — mission name desktop */
  xxl:     '1.5rem',
} as const

// ---------------------------------------------------------------------------
// Letter-spacing tokens
// ---------------------------------------------------------------------------
export const LS = {
  /** Numeric data values */
  tight:  '0.04rem',
  /** Field labels (DIST. EARTH, STATUS…) */
  normal: '0.08rem',
  /** Section headers (LIVE UPDATES, MISSION TIMELINE…) */
  wide:   '0.15rem',
} as const
