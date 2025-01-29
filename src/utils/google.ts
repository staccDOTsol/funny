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

interface StoredLocation {
  lat: number;
  lng: number;
  timestamp: number;
}

export async function getLocationHistory(accessToken: string) {
  try {
    // Get stored locations from localStorage
    const storedLocations: StoredLocation[] = JSON.parse(
      localStorage.getItem('locationHistory') || '[]'
    );

    // Get current location
    const currentLocation = await new Promise<StoredLocation>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          };
          resolve(newLocation);
        },
        (error) => reject(error)
      );
    });

    // Add current location if it's significantly different from last stored
    const lastStored = storedLocations[storedLocations.length - 1];
    if (!lastStored || 
        Math.abs(lastStored.lat - currentLocation.lat) > 0.001 || 
        Math.abs(lastStored.lng - currentLocation.lng) > 0.001) {
      storedLocations.push(currentLocation);
      localStorage.setItem('locationHistory', JSON.stringify(storedLocations));
    }

    // Get calendar events with locations
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?' +
      'maxResults=2500&' +
      'orderBy=startTime&' +
      'singleEvents=true&' +
      'timeMin=2020-01-01T00:00:00Z',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar data');
    }

    const data = await response.json();

    // Extract and geocode calendar locations
    const calendarLocations = await Promise.all(
      data.items
        .filter((event: any) => event.location)
        .map(async (event: any) => {
          const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(event.location)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );
          const geocodeData = await geocodeResponse.json();
          
          if (geocodeData.results?.[0]?.geometry?.location) {
            return {
              ...geocodeData.results[0].geometry.location,
              timestamp: new Date(event.start.dateTime || event.start.date).getTime()
            };
          }
          return null;
        })
    );

    // Combine all locations and sort by timestamp
    const allLocations = [...storedLocations, ...calendarLocations.filter(Boolean)]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(loc => ({
        lat: loc.lat,
        lng: loc.lng,
        isCurrent: false
      }));

    // Add current location with special flag
    if (currentLocation) {
      allLocations.push({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        isCurrent: true
      });
    }

    console.log(`Found ${allLocations.length} total locations`);
    return allLocations;

  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
