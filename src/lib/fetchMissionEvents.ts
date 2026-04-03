import trajectoryData from '../data/trajectory.json';

export interface TimelineMilestone {
  idx: number;
  label: string;
  detail: string;
}

export async function fetchMissionEvents(): Promise<TimelineMilestone[]> {
  try {
    const response = await fetch('https://ll.thespacedevs.com/2.2.0/event/?launch__program=artemis-ii');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data.results)) {
      return [];
    }

    // Map the returned events to the milestone markers shape on the timeline scrubber
    // Each event object from Space Devs has a name, description, and date field.
    return data.results.map((event: { name: string; description: string; date: string }) => {
      const eventTime = new Date(event.date).getTime();
      
      let closestIdx = 0;
      let minDiff = Infinity;
      
      // Find the trajectory index that most closely matches the event date
      for (let i = 0; i < trajectoryData.length; i++) {
        const tTime = new Date((trajectoryData[i] as any).timestamp).getTime();
        const diff = Math.abs(tTime - eventTime);
        
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }

      return {
        idx: closestIdx,
        label: event.name,
        detail: event.description,
      };
    });
  } catch (error) {
    console.error('Error fetching mission events from Launch Library:', error);
    return [];
  }
}
