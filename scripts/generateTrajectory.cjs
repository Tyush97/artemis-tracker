#!/usr/bin/env node
/**
 * Reads the Artemis II OEM file and writes src/data/trajectory.json.
 * Run from the repo root:  node scripts/generateTrajectory.js <path-to-oem>
 */
const fs   = require('fs')
const path = require('path')

const oemPath = process.argv[2]
if (!oemPath) {
  console.error('Usage: node scripts/generateTrajectory.js <path-to-oem.asc>')
  process.exit(1)
}

const text    = fs.readFileSync(oemPath, 'utf8')
const vectors = []

for (const raw of text.split('\n')) {
  const line = raw.trim()
  if (!line || !/^\d/.test(line)) continue

  const cols = line.split(/\s+/)
  if (cols.length < 7) continue

  const [ts, x, y, z, vx, vy, vz] = cols
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

const outPath = path.resolve(__dirname, '../src/data/trajectory.json')
fs.writeFileSync(outPath, JSON.stringify(vectors, null, 2))
console.log(`Wrote ${vectors.length} vectors → ${outPath}`)
