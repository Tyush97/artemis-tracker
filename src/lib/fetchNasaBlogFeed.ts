const LAUNCH_TIME = new Date('2026-04-01T23:44:00Z').getTime()  // actual liftoff

export interface BlogEntry {
  title: string
  description: string
  publishedUtc: Date
  source: 'artemis-blog' | 'nasa-news'
}

const ARTEMIS_KEYWORDS = /artemis\s*ii|artemis\s*2|orion|sls|lunar\s*flyby|translunar|moon\s*mission/i

function parseRssFeed(
  xml: string,
  source: BlogEntry['source'],
  filter: boolean,
): BlogEntry[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const items = doc.querySelectorAll('item')
  const entries: BlogEntry[] = []

  items.forEach((item) => {
    const title = item.querySelector('title')?.textContent?.trim() ?? ''
    const pubDate = item.querySelector('pubDate')?.textContent?.trim() ?? ''
    const descRaw = item.querySelector('description')?.textContent?.trim() ?? ''

    const descPlain = descRaw.replace(/<[^>]+>/g, '').trim()
    const description = descPlain.length > 160
      ? descPlain.slice(0, 157) + '...'
      : descPlain

    if (!pubDate) return

    if (filter) {
      const haystack = title + ' ' + descPlain
      if (!ARTEMIS_KEYWORDS.test(haystack)) return
    }

    entries.push({
      title,
      description,
      publishedUtc: new Date(pubDate),
      source,
    })
  })

  return entries
}

/**
 * Primary source: dedicated Artemis mission blog (flight day updates).
 * Secondary source: main NASA news feed, filtered to Artemis II / Orion keywords.
 */
export async function fetchNasaBlogFeed(): Promise<BlogEntry[]> {
  const feeds = [
    {
      url: 'https://www.nasa.gov/blogs/artemis/feed/',
      source: 'artemis-blog' as const,
      filter: false, // dedicated blog — every post is relevant
    },
    {
      url: 'https://www.nasa.gov/feed/',
      source: 'nasa-news' as const,
      filter: true, // general feed — filter to Artemis/Orion only
    },
  ]

  const results = await Promise.all(
    feeds.map(async ({ url, source, filter }) => {
      try {
        // NASA feeds serve Access-Control-Allow-Origin: * so fetch directly first
        let res = await fetch(url)

        // Fall back to proxy if direct fetch fails (e.g. stricter CORS in some envs)
        if (!res.ok) {
          const proxyUrl = '/api/nasa-proxy?url=' + encodeURIComponent(url)
          res = await fetch(proxyUrl)
        }

        if (!res.ok) return []
        const xml = await res.text()
        return parseRssFeed(xml, source, filter)
      } catch {
        // Direct fetch may throw on CORS — try proxy
        try {
          const proxyUrl = '/api/nasa-proxy?url=' + encodeURIComponent(url)
          const res = await fetch(proxyUrl)
          if (!res.ok) return []
          const xml = await res.text()
          return parseRssFeed(xml, source, filter)
        } catch {
          return []
        }
      }
    }),
  )

  return results.flat()
}

export function formatMet(utcDate: Date): string {
  const diff = utcDate.getTime() - LAUNCH_TIME
  const pre = diff < 0 ? '-' : '+'
  const abs = Math.abs(diff)
  const days = Math.floor(abs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60))
  return `T${pre}${days}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`
}

export function formatUtcShort(d: Date): string {
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mn = String(d.getUTCMinutes()).padStart(2, '0')
  return `${d.getUTCFullYear()}-${mm}-${dd} ${hh}:${mn} UTC`
}
