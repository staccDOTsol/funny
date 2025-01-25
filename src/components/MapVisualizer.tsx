"use client";

import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapFact } from '@/types';

interface MapVisualizerProps {
  fact: MapFact;
  onMapReady?: () => void;
}

export default function MapVisualizer({ fact, onMapReady }: MapVisualizerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polygonsRef = useRef<google.maps.Polygon[]>([]);

  const fitBoundsWithPadding = (map: google.maps.Map, bounds: google.maps.LatLngBounds) => {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latSpan = ne.lat() - sw.lat();
    const lngSpan = ne.lng() - sw.lng();
    
    // Add dynamic padding based on region size
    const padding = Math.min(0.3, Math.max(0.1, 1 / Math.max(latSpan, lngSpan)));
    const newBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(sw.lat() - latSpan * padding, sw.lng() - lngSpan * padding),
      new google.maps.LatLng(ne.lat() + latSpan * padding, ne.lng() + lngSpan * padding)
    );

    map.fitBounds(newBounds);
    
    // Adjust final zoom based on region size
    const zoomLevel = map.getZoom();
    if (zoomLevel) {
      const optimalZoom = Math.min(
        10,
        Math.max(
          4,
          Math.floor(Math.log2(360 / Math.max(latSpan, lngSpan))) + 1
        )
      );
      if (zoomLevel > optimalZoom) {
        map.setZoom(optimalZoom);
      }
    }
  };

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is not configured');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });

    async function initMap() {
      try {
        const google = await loader.load();
        if (!mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          maxZoom: 12,
          minZoom: 2,
          zoomControl: true,
          styles: [
            {
              featureType: "all",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#e9e9e9" }]
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#f5f5f5" }]
            }
          ]
        });

        mapInstanceRef.current = map;
        const bounds = new google.maps.LatLngBounds();
        const geocoder = new google.maps.Geocoder();
        
        // Process each region
        for (const region of fact.regions) {
          try {
            await new Promise<void>((resolve, reject) => {
              geocoder.geocode({ address: region.name }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  const result = results[0];
                  const viewport = result.geometry.viewport;
                  bounds.union(viewport);

                  // Create a polygon for the region
                  const path = [
                    { lat: viewport.getNorthEast().lat(), lng: viewport.getNorthEast().lng() },
                    { lat: viewport.getNorthEast().lat(), lng: viewport.getSouthWest().lng() },
                    { lat: viewport.getSouthWest().lat(), lng: viewport.getSouthWest().lng() },
                    { lat: viewport.getSouthWest().lat(), lng: viewport.getNorthEast().lng() }
                  ];

                  const polygon = new google.maps.Polygon({
                    paths: path,
                    strokeColor: region.color,
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: region.color,
                    fillOpacity: 0.35,
                    map
                  });

                  polygonsRef.current.push(polygon);

                  // Add click handler
                  polygon.addListener('click', () => {
                    // Reset all polygons
                    polygonsRef.current.forEach(p => {
                      p.setOptions({
                        fillOpacity: 0.35,
                        strokeWeight: 2
                      });
                    });
                    
                    // Highlight clicked polygon
                    polygon.setOptions({
                      fillOpacity: 0.6,
                      strokeWeight: 3
                    });

                    fitBoundsWithPadding(map, viewport);
                  });

                  // Add label
                  const marker = new google.maps.Marker({
                    position: result.geometry.location,
                    map,
                    label: {
                      text: `${region.name}\n${region.value}`,
                      color: '#000000',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    },
                    icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 0,
                    }
                  });
                  markersRef.current.push(marker);
                  resolve();
                } else {
                  reject(new Error(`Geocoding failed: ${status}`));
                }
              });
            });
          } catch (error) {
            console.error(`Error processing region ${region.name}:`, error);
          }
        }

        // Initial view after a short delay to allow features to load
        setTimeout(() => {
          fitBoundsWithPadding(map, bounds);
          onMapReady?.();
        }, 1000);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }

    initMap();

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      polygonsRef.current.forEach(polygon => polygon.setMap(null));
      polygonsRef.current = [];
    };
  }, [fact, onMapReady]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="relative w-full h-[600px] bg-gray-100 flex items-center justify-center">
        <div className="text-red-500">
          Error: Google Maps API key is not configured properly
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] bg-gray-100">
      <div ref={mapRef} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-md z-10">
        <h2 className="text-xl font-bold mb-2">{fact.title}</h2>
        <p className="text-gray-700 mb-2">{fact.description}</p>
        <p className="text-sm text-gray-500 italic">Click on any region to zoom in</p>
      </div>
      <button
        onClick={() => {
          if (mapInstanceRef.current) {
            const bounds = new google.maps.LatLngBounds();
            polygonsRef.current.forEach(polygon => {
              const path = polygon.getPath();
              path.forEach(latLng => {
                bounds.extend(latLng);
              });
            });
            // Reset all polygons
            polygonsRef.current.forEach(polygon => {
              polygon.setOptions({
                fillOpacity: 0.35,
                strokeWeight: 2
              });
            });
            fitBoundsWithPadding(mapInstanceRef.current, bounds);
          }
        }}
        className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg z-10 hover:bg-gray-50"
      >
        Reset Zoom
      </button>
    </div>
  );
}
