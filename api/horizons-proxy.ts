// Vercel serverless function — proxies JPL HORIZONS API for Artemis II (COMMAND = -1024)
// Returns parsed geocentric EME2000 state vectors as JSON so the frontend
// never needs to touch the raw HORIZONS text format.

interface StateVector {
  timestamp: string  // ISO-8601 UTC
  x: number          // km, geocentric EME2000
  y: number
  z: number
  vx: number         // km/s
  vy: number
  vz: number
}

const MONTH: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
}

function formatHorizonsDate(d: Date): string {
  // HORIZONS accepts 'YYYY-MM-DD HH:MM'
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mn = String(d.getUTCMinutes()).padStart(2, '0')
  return `${d.getUTCFullYear()}-${mm}-${dd} ${hh}:${mn}`
}

// Parse the text block between $$SOE and $$EOE in a HORIZONS CSV response.
// VEC_TABLE=2, CSV_FORMAT=YES gives one line per epoch:
//   JDTDB, "A.D. YYYY-Mon-DD HH:MM:SS.ssss", X, Y, Z, VX, VY, VZ,
function parseHorizonsBlock(resultText: string): StateVector[] {
  const soe = resultText.indexOf('$$SOE')
  const eoe = resultText.indexOf('$$EOE')
  if (soe === -1 || eoe === -1) return []

  const block = resultText.slice(soe + 5, eoe)
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean)

  const vectors: StateVector[] = []
  for (const line of lines) {
    // Skip header rows
    if (line.startsWith('JDTDB') || line.startsWith('*') || line.startsWith('$$')) continue

    const parts = line.split(',').map(p => p.trim())
    if (parts.length < 8) continue

    // parts[1]: "A.D. 2026-Apr-03 03:00:00.0000"
    const calRaw = parts[1].replace('A.D.', '').trim()
    // calRaw: "2026-Apr-03 03:00:00.0000"
    const spIdx = calRaw.indexOf(' ')
    const datePart = calRaw.slice(0, spIdx)   // "2026-Apr-03"
    const timePart = calRaw.slice(spIdx + 1)  // "03:00:00.0000"
    const [year, mon, day] = datePart.split('-')
    const monthNum = MONTH[mon]
    if (!monthNum) continue

    const x  = parseFloat(parts[2])
    const y  = parseFloat(parts[3])
    const z  = parseFloat(parts[4])
    const vx = parseFloat(parts[5])
    const vy = parseFloat(parts[6])
    const vz = parseFloat(parts[7])
    if ([x, y, z, vx, vy, vz].some(isNaN)) continue

    vectors.push({
      timestamp: `${year}-${monthNum}-${day}T${timePart.slice(0, 8)}`,
      x, y, z, vx, vy, vz,
    })
  }
  return vectors
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  const mode = req.query.mode ?? 'current'
  const now = new Date()

  // Mission opened in the OEM on 2026-04-02T03:07 UTC
  const MISSION_OPEN = '2026-04-02 03:07'

  let startTime: string
  let stopTime: string
  let stepSize: string

  if (mode === 'history') {
    // Full flown arc: mission open → now, sampled every 30 min
    startTime = MISSION_OPEN
    stopTime  = formatHorizonsDate(now)
    stepSize  = '30 m'
  } else {
    // Current telemetry: 10-min window ending now, sampled every 5 min
    const tenMinAgo = new Date(now.getTime() - 10 * 60_000)
    startTime = formatHorizonsDate(tenMinAgo)
    stopTime  = formatHorizonsDate(now)
    stepSize  = '5 m'
  }

  // HORIZONS requires single-quoted values for dates/strings — build manually
  const params = [
    `format=json`,
    `COMMAND=%27-1024%27`,
    `OBJ_DATA=NO`,
    `MAKE_EPHEM=YES`,
    `EPHEM_TYPE=VECTORS`,
    `CENTER=%27500%40399%27`,
    `REF_SYSTEM=J2000`,
    `START_TIME=%27${encodeURIComponent(startTime)}%27`,
    `STOP_TIME=%27${encodeURIComponent(stopTime)}%27`,
    `STEP_SIZE=%27${encodeURIComponent(stepSize)}%27`,
    `OUT_UNITS=KM-S`,
    `VEC_TABLE=2`,
    `VEC_CORR=NONE`,
    `CSV_FORMAT=YES`,
    `VEC_LABELS=NO`,
  ].join('&')

  try {
    const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`
    const response = await fetch(url)
    if (!response.ok) {
      let body = ''
      try { body = await response.text() } catch {}
      return res.status(502).json({ error: 'HORIZONS returned non-OK', status: response.status, body, url })
    }
    const data = await response.json()
    if (data.error) {
      return res.status(400).json({ error: data.error, raw: data, url })
    }
    const vectors = parseHorizonsBlock(data.result ?? '')
    return res.status(200).json({ vectors, count: vectors.length, mode })
  } catch (err: any) {
    console.error('HORIZONS proxy error:', err)
    return res.status(502).json({ error: 'Failed to fetch HORIZONS data', message: err.message })
  }
}
