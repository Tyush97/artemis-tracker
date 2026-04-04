export interface SpaceDevsEntry {
  title: string
  description: string
  publishedUtc: Date
  source: 'spacedevs'
}

export async function fetchMissionEvents(): Promise<SpaceDevsEntry[]> {
  try {
    const response = await fetch(
      'https://ll.thespacedevs.com/2.2.0/event/?search=artemis+ii'
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data || !Array.isArray(data.results)) {
      return []
    }

    return data.results
      .filter((event: { name: string; description: string }) => {
        const hay = (event.name + ' ' + event.description).toLowerCase()
        return hay.includes('artemis ii') || hay.includes('artemis 2')
      })
      .map(
        (event: { name: string; description: string; date: string }) => ({
          title: event.name,
          description:
            event.description.length > 160
              ? event.description.slice(0, 157) + '...'
              : event.description,
          publishedUtc: new Date(event.date),
          source: 'spacedevs' as const,
        })
      )
  } catch (error) {
    console.error('Error fetching mission events from Launch Library:', error)
    return []
  }
}
