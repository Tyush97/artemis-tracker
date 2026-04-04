import { useEffect, useRef, useState } from 'react'
import { fetchNasaBlogFeed, formatMet, formatUtcShort, type BlogEntry } from '../../lib/fetchNasaBlogFeed'
import { fetchMissionEvents, type SpaceDevsEntry } from '../../lib/fetchMissionEvents'
import { useMissionStore } from '../../store/missionStore'
import trajectoryData from '../../data/trajectory.json'
import { LAUNCH_N } from '../../data/missionCurve'

type FeedEntry = (BlogEntry | SpaceDevsEntry) & { critical?: boolean; trajectoryIdx: number }

const LAUNCH_TIME_MS = new Date('2026-04-01T23:44:00Z').getTime()

/** Maps a UTC timestamp to a store index in [-LAUNCH_N, LAST]. */
function findTrajectoryIdx(utc: Date): number {
  const target = utc.getTime()
  const oemStart = new Date((trajectoryData[0] as { timestamp: string }).timestamp + 'Z').getTime()
  const oemEnd   = new Date((trajectoryData[trajectoryData.length - 1] as { timestamp: string }).timestamp + 'Z').getTime()

  if (target <= LAUNCH_TIME_MS) return -LAUNCH_N

  // In launch arc (between liftoff and first OEM point)
  if (target < oemStart) {
    const frac = (target - LAUNCH_TIME_MS) / (oemStart - LAUNCH_TIME_MS)
    return Math.round(-LAUNCH_N + frac * LAUNCH_N)
  }

  if (target >= oemEnd) return trajectoryData.length - 1

  let lo = 0, hi = trajectoryData.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    const t = new Date((trajectoryData[mid] as { timestamp: string }).timestamp + 'Z').getTime()
    if (t < target) lo = mid + 1
    else hi = mid
  }
  return lo
}

const CRITICAL_KEYWORDS = /abort|anomaly|hold|scrub|emergency|failure|contingency|off-nominal|troubleshoot/i

const SOURCE_LABELS: Record<FeedEntry['source'], string> = {
  'artemis-blog': 'NASA ARTEMIS BLOG',
  'nasa-news': 'NASA NEWS',
  'spacedevs': 'SPACE DEVS',
}

export default function EventTimeline({ onEventClick, fullWidth = false }: { onEventClick?: () => void; fullWidth?: boolean } = {}) {
  const { setMissionTime, setIsPlaying, currentMissionTime } = useMissionStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [feed, setFeed] = useState<FeedEntry[]>([])
  const [loading, setLoading] = useState(true)

  const handleEntryClick = (idx: number) => {
    setIsPlaying(false)
    setMissionTime(idx)
    onEventClick?.()
  }

  // Feed sorted descending by time. Active = first entry whose moment has been reached.
  const activeIdx = feed.findIndex(e => e.trajectoryIdx <= currentMissionTime)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [blogEntries, sdEntries] = await Promise.all([
        fetchNasaBlogFeed(),
        fetchMissionEvents(),
      ])

      if (cancelled) return

      const all: FeedEntry[] = [...blogEntries, ...sdEntries].map((e) => ({
        ...e,
        critical: CRITICAL_KEYWORDS.test(e.title) || CRITICAL_KEYWORDS.test(e.description),
        trajectoryIdx: findTrajectoryIdx(e.publishedUtc),
      }))

      // Sort descending by timestamp (newest first)
      all.sort((a, b) => b.publishedUtc.getTime() - a.publishedUtc.getTime())

      // Deduplicate by normalized title (same headline from multiple feeds)
      const seen = new Set<string>()
      const deduped = all.filter((e) => {
        const key = e.title.toLowerCase().replace(/\s+/g, ' ').trim()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      setFeed(deduped)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  // Auto-scroll to top (most recent) on load
  useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0 })
    }
  }, [loading])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'monospace',
      pointerEvents: 'auto',
      width: fullWidth ? '100%' : '16rem',
      alignSelf: 'flex-start',
      height: '100%',
    }}>
      {/* Header — hidden in fullWidth mode (drawer has its own header) */}
      {!fullWidth && (
        <div style={{
          fontSize: '0.5rem',
          color: '#444',
          letterSpacing: '0.18rem',
          textAlign: 'right',
          paddingBottom: '0.625rem',
          borderBottom: '1px solid #1a1a1a',
          marginBottom: '0.75rem',
          flexShrink: 0,
        }}>
          LIVE UPDATES
        </div>
      )}

      <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div
          ref={scrollRef}
          style={{
            height: '100%',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
            paddingBottom: '5rem',
          }}
        >
          {loading && (
            <div style={{
              fontSize: '0.5rem',
              color: '#555',
              textAlign: 'right',
              paddingRight: '0.75rem',
              paddingTop: '1rem',
            }}>
              FETCHING FEED...
            </div>
          )}

          {!loading && feed.length === 0 && (
            <div style={{
              fontSize: '0.5rem',
              color: '#555',
              textAlign: 'right',
              paddingRight: '0.75rem',
              paddingTop: '1rem',
            }}>
              NO UPDATES AVAILABLE
            </div>
          )}

          {feed.map((entry, i) => {
            const isLatest = i === 0
            const isActive = i === activeIdx

            return (
              <div
                key={`${entry.source}-${entry.publishedUtc.getTime()}-${i}`}
                onClick={() => handleEntryClick(entry.trajectoryIdx)}
                style={{
                  cursor: 'pointer',
                  paddingBottom: '1rem',
                  marginBottom: '1rem',
                  borderBottom: '1px solid #141414',
                  opacity: isActive ? 1 : 0.45,
                  transition: 'opacity 0.3s',
                }}
              >
                {/* MET timestamp row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.4rem',
                  marginBottom: '0.15rem',
                }}>
                  {isLatest && (
                    <span style={{
                      width: '0.35rem', height: '0.35rem',
                      backgroundColor: '#ff3333',
                      borderRadius: '50%',
                      animation: 'pulse 1s infinite',
                      flexShrink: 0,
                    }} />
                  )}
                  <span style={{ fontSize: '0.5rem', color: '#666', letterSpacing: '0.08rem' }}>
                    {formatMet(entry.publishedUtc)}
                  </span>
                </div>

                {/* UTC timestamp */}
                <div style={{
                  fontSize: '0.45rem',
                  color: '#3a3a3a',
                  letterSpacing: '0.06rem',
                  textAlign: 'right',
                  marginBottom: '0.3rem',
                }}>
                  {formatUtcShort(entry.publishedUtc)}
                </div>

                {/* Title — with optional amber chip for critical */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  gap: '0.35rem',
                  marginBottom: '0.4rem',
                  paddingRight: '0.75rem',
                  borderRight: isActive ? '2px solid #fff' : '1px solid #2a2a2a',
                }}>
                  {entry.critical && (
                    <span style={{
                      fontSize: '0.4rem',
                      backgroundColor: '#b8860b',
                      color: '#000',
                      padding: '0.08rem 0.3rem',
                      borderRadius: '2px',
                      fontWeight: 700,
                      letterSpacing: '0.06rem',
                      flexShrink: 0,
                      lineHeight: '1.4',
                    }}>
                      CRITICAL
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.625rem',
                    color: isActive ? '#fff' : '#aaa',
                    letterSpacing: '0.1rem',
                    fontWeight: isActive ? 700 : 400,
                    textAlign: 'right',
                    lineHeight: '1.3',
                    textTransform: 'uppercase',
                  }}>
                    {entry.title}
                  </span>
                </div>

                {/* Description — show for active entry and 2 below it */}
                {i < 3 && entry.description && (
                  <div style={{
                    fontSize: '0.5625rem',
                    color: isActive ? '#888' : '#444',
                    lineHeight: '1.6',
                    textAlign: 'right',
                    paddingRight: '0.75rem',
                  }}>
                    {entry.description}
                  </div>
                )}

                {/* Source badge */}
                <div style={{
                  fontSize: '0.375rem',
                  color: '#333',
                  textAlign: 'right',
                  paddingRight: '0.75rem',
                  marginTop: '0.25rem',
                  letterSpacing: '0.06rem',
                }}>
                  {SOURCE_LABELS[entry.source]}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '6rem',
          background: 'linear-gradient(to bottom, transparent, #000)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}
