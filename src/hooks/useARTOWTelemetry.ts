import { useEffect } from 'react';
import { useMissionStore } from '../store/missionStore';

const AROW_DATA_ENDPOINT = 'https://www.nasa.gov/trackartemis';
const POLLING_INTERVAL_MS = 10000;

export function useARTOWTelemetry() {
  useEffect(() => {
    const pollData = async () => {
      const { isLive, setTelemetry } = useMissionStore.getState();

      // When isLive is false (user is scrubbing), pause polling
      if (!isLive) return;

      try {
        // Poll the AROW data endpoint. We include keepalive: true to meet
        // the requirement of keeping the connection open despite polling.
        const response = await fetch(AROW_DATA_ENDPOINT, {
          keepalive: true,
        });

        if (!response.ok) return;

        const text = await response.text();
        try {
          const data = JSON.parse(text);

          // Extract distance from Earth, distance from Moon, velocity, and mission elapsed time
          setTelemetry({
            distanceFromEarth: data.distanceFromEarth ?? data.earth_distance ?? 0,
            distanceFromMoon: data.distanceFromMoon ?? data.moon_distance ?? 0,
            velocity: data.velocity ?? data.speed ?? 0,
            missionElapsedTime: data.missionElapsedTime ?? data.met ?? '00:00:00',
          });
        } catch {
          // Endpoint might return HTML or unexpected format.
          console.warn('Could not parse AROW telemetry response as JSON.');
        }
      } catch (error) {
        console.error('Error polling AROW telemetry:', error);
      }
    };

    // Initial fetch
    pollData();

    // Set up the interval
    const intervalId = setInterval(pollData, POLLING_INTERVAL_MS);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures interval is not re-created on state changes
}
