/**
 * CCSDS OEM 2.0 parser
 *
 * Parses a plain-text Orbit Ephemeris Message file and returns an array of
 * state vectors.  Data lines follow the pattern:
 *
 *   YYYY-MM-DDThh:mm:ss.sss  X  Y  Z  Xdot  Ydot  Zdot
 *
 * where positions are in km and velocities in km/s, in the reference frame
 * declared in the OEM header (typically EME2000, Earth-centred).
 */

export interface OEMVector {
  timestamp: string  // ISO 8601, e.g. "2026-04-02T03:07:49.583"
  x: number          // km
  y: number          // km
  z: number          // km
  vx: number         // km/s
  vy: number         // km/s
  vz: number         // km/s
}

/**
 * Parse an OEM text string and return all state vectors.
 *
 * Lines that are blank, metadata headers (KEY = VALUE), or section
 * delimiters (META_START / META_STOP) are silently skipped.  Only lines
 * whose first token looks like an ISO timestamp are treated as data.
 */
export function parseOEM(text: string): OEMVector[] {
  const vectors: OEMVector[] = []

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    // Skip header / metadata lines — they never start with a digit
    if (!/^\d/.test(line)) continue

    const cols = line.split(/\s+/)
    if (cols.length < 7) continue

    const [ts, x, y, z, vx, vy, vz] = cols

    // Guard: first token must be an ISO-like timestamp
    if (!/^\d{4}-\d{2}-\d{2}T/.test(ts)) continue

    vectors.push({
      timestamp: ts,
      x:  parseFloat(x),
      y:  parseFloat(y),
      z:  parseFloat(z),
      vx: parseFloat(vx),
      vy: parseFloat(vy),
      vz: parseFloat(vz),
    })
  }

  return vectors
}
