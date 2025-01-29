"use client";

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import GoogleAuth from './GoogleAuth';
import { getLocationHistory, getVisitedPlaces } from '@/utils/google';

interface VisitedArea {
  lat: number;
  lng: number;
  radius: number;
}

export default function MapVisualizer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const pathRef = useRef<google.maps.Polyline | null>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [visitedAreas, setVisitedAreas] = useState<VisitedArea[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const fogRef = useRef<SVGRectElement>(null);

  const handleAuthSuccess = (token: string) => {
    setAccessToken(token);
    setIsAuthenticated(true);
  };

  const updateFogMask = (locations: google.maps.LatLng[]) => {
    // Remove any existing fog
    const existingFog = mapRef.current?.querySelector('.fog-overlay');
    if (existingFog) {
      existingFog.remove();
    }

    // Create a canvas for the fog
    const canvas = document.createElement('canvas');
    canvas.className = 'fog-overlay';
    canvas.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;
    
    const ctx = canvas.getContext('2d');
    if (!ctx || !mapInstanceRef.current) return;

    // Set canvas size to match map
    canvas.width = mapRef.current?.clientWidth || 0;
    canvas.height = mapRef.current?.clientHeight || 0;

    // Fill with dark overlay
    ctx.fillStyle = 'rgba(50, 50, 50, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear circles where visited - with smaller, more frequent circles
    ctx.globalCompositeOperation = 'destination-out';
    locations.forEach(location => {
      // Create multiple circles around each location point
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          const offset = new google.maps.LatLng(
            location.lat() + i * 0.001, // Small offset in latitude
            location.lng() + j * 0.001  // Small offset in longitude
          );
          
          const point = mapInstanceRef.current?.getProjection()?.fromLatLngToPoint(offset);
          const bounds = mapInstanceRef.current?.getBounds();
          if (point && bounds) {
            const ne = mapInstanceRef.current?.getProjection()?.fromLatLngToPoint(bounds.getNorthEast());
            const sw = mapInstanceRef.current?.getProjection()?.fromLatLngToPoint(bounds.getSouthWest());
            if (ne && sw) {
              const x = (point.x - sw.x) / (ne.x - sw.x) * canvas.width;
              const y = (point.y - ne.y) / (sw.y - ne.y) * canvas.height;
              
              // Smaller base radius and adjusted zoom scaling
              const zoom = mapInstanceRef.current?.getZoom() || 0;
              const baseRadius = 10; // Much smaller base radius
              const radius = Math.pow(1.5, zoom - 10) * baseRadius;

              ctx.beginPath();
              ctx.arc(x, y, radius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    });

    mapRef.current?.appendChild(canvas);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is not configured');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry', 'drawing', 'marker'],
    });

    async function initMap() {
      try {
        const google = await loader.load();
        if (!mapRef.current) return;

        // Create the search box input
        const input = document.createElement("input");
        input.placeholder = "Search for places...";
        input.className = "absolute top-4 left-4 w-64 px-3 py-2 bg-white rounded-lg shadow-lg z-20";
        mapRef.current.appendChild(input);

        // Initialize the search box
        const searchBox = new google.maps.places.SearchBox(input);
        searchBoxRef.current = searchBox;

        const map = new google.maps.Map(mapRef.current, {
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          maxZoom: 18,
          minZoom: 2,
          zoomControl: true,
          center: { lat: 20, lng: 0 },
          zoom: 3,
          styles: [
            {
              featureType: "all",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#1a237e" }]
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#263238" }]
            }
          ]
        });

        mapInstanceRef.current = map;

        // Bias the SearchBox results towards current map's viewport.
        map.addListener("bounds_changed", () => {
          searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
        });

        // Listen for the event fired when the user selects a prediction
        searchBox.addListener("places_changed", () => {
          const places = searchBox.getPlaces();
          if (!places || places.length === 0) return;

          // For each place, get the location and pan to it
          places.forEach((place) => {
            if (!place.geometry || !place.geometry.location) return;

            // Pan to the place
            if (place.geometry.viewport) {
              map.fitBounds(place.geometry.viewport);
            } else {
              map.setCenter(place.geometry.location);
              map.setZoom(10);
            }
          });
        });

        // Now that map is initialized, fetch location history if we have an access token
        if (accessToken) {
          console.log('Loading location history after map init');
          const history = await getLocationHistory(accessToken);
          console.log('Location history fetched:', history);

          if (history && history.length) {
            const locations = history.map((point: { lat: number; lng: number; }) => 
              new google.maps.LatLng(point.lat, point.lng)
            );

            // Focus on most recent location with closer zoom
            const mostRecent = locations[locations.length - 1];
            map.setCenter(mostRecent);
            map.setZoom(13); // Zoom in closer to city level

            // Add a marker for current location
            new google.maps.Marker({
              position: mostRecent,
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4285F4', // Google blue
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                scale: 7,
              },
              title: 'Current Location'
            });

            // Update fog mask
            updateFogMask(locations);
          }
        }

        // Add zoom_changed listener to update fog
        mapInstanceRef.current?.addListener('zoom_changed', () => {
          if (accessToken) {
            getLocationHistory(accessToken).then(history => {
              if (history && history.length) {
                const locations = history.map((point: { lat: number; lng: number; }) => 
                  new google.maps.LatLng(point.lat, point.lng)
                );
                updateFogMask(locations);
              }
            });
          }
        });

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }

    initMap();

    return () => {
      if (pathRef.current) {
        pathRef.current.setMap(null);
      }
    };
  }, [isAuthenticated, accessToken]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="relative w-full h-[600px] bg-gray-100 flex items-center justify-center">
        <div className="text-red-500">
          Error: Google Maps API key is not configured properly
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative w-full h-screen bg-gray-100 flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold mb-4">Sign in to explore your world</h2>
        <GoogleAuth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  const mapContainerStyle = {
    position: 'relative' as const,
    width: '100%',
    height: '100vh', // Full viewport height
  };

  return (
    <div className="relative w-full h-screen bg-gray-100">
      <div ref={mapRef} style={mapContainerStyle} />
      
      {/* Search box */}
      <div className="absolute top-4 left-4 z-10">
        <input
          type="text"
          placeholder="Search places..."
          className="px-4 py-2 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm w-64"
        />
      </div>
    </div>
  );
}
