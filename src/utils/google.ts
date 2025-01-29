declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

export async function getVisitedPlaces(map: google.maps.Map, locationHistory: Array<{lat: number, lng: number}> = []) {
  const service = new google.maps.places.PlacesService(map);
  
  return new Promise((resolve) => {
    if (locationHistory.length === 0) {
      console.log('No location history available');
      resolve([]);
      return;
    }

    // Process locations in batches to avoid rate limits
    const batchSize = 5;
    const places = new Set();
    let processedCount = 0;

    const processNextBatch = (startIndex: number) => {
      const batch = locationHistory.slice(startIndex, startIndex + batchSize);
      let completedInBatch = 0;

      batch.forEach(location => {
        const latLng = new google.maps.LatLng(location.lat, location.lng);
        
        service.nearbySearch({
          location: latLng,
          radius: 1000, // 1km radius
          type: 'point_of_interest',
        }, (results, status) => {
          completedInBatch++;

          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach(place => {
              if (place.geometry?.location && place.name) {
                places.add({
                  location: place.geometry.location,
                  name: place.name,
                  type: place.types?.[0] || 'unknown',
                  vicinity: place.vicinity || '',
                  explored: true,
                  placeId: place.place_id
                });
              }
            });
          }

          // Check if batch is complete
          if (completedInBatch === batch.length) {
            processedCount += batch.length;
            
            if (processedCount < locationHistory.length) {
              // Process next batch after a delay to respect rate limits
              setTimeout(() => processNextBatch(startIndex + batchSize), 1000);
            } else {
              // All locations processed
              console.log(`Found ${places.size} unique places`);
              resolve(Array.from(places));
            }
          }
        });
      });
    };

    // Start processing first batch
    processNextBatch(0);
  });
}

interface LocationData {
  lat: number;
  lng: number;
  timestamp: string;
}

export async function getLocationHistory(accessToken: string) {
  console.log('Starting location history fetch with token:', accessToken.substring(0, 10) + '...');
  
  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?' +
      'maxResults=2500&' +
      'orderBy=startTime&' +
      'singleEvents=true&' +
      'timeMin=2000-01-01T00:00:00Z',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Response status:', response.status);
      throw new Error('Failed to fetch location history');
    }

    const data = await response.json();

    // Extract locations from events and geocode them
    const locations = await Promise.all(
      data.items
        .filter((event: any) => event.location)
        .map(async (event: any) => {
          const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(event.location)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );
          const geocodeData = await geocodeResponse.json();

          if (geocodeData.results && geocodeData.results[0]) {
            const { lat, lng } = geocodeData.results[0].geometry.location;
            return { lat, lng };
          }
          return null;
        })
    );

    // Filter out any null results from failed geocoding
    const validLocations = locations.filter(loc => loc !== null);
    console.log(`Processed ${validLocations.length} locations`);
    return validLocations;
  } catch (error) {
    console.error('Error fetching location history:', error);
    return [];
  }
}
