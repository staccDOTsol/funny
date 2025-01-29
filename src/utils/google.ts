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
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      resolve([]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([{
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }]);
      },
      (error) => {
        console.error('Error getting location:', error);
        resolve([]);
      }
    );
  });
}
