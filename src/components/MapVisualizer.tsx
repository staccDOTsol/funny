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
  const geocoder = useRef<google.maps.Geocoder | null>(null);

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
        geocoder.current = new google.maps.Geocoder();

        const map = new google.maps.Map(mapRef.current!, {
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: "all",
              elementType: "labels.text",
              stylers: [{ visibility: "on" }]
            },
            {
              featureType: "administrative.locality",
              elementType: "labels",
              stylers: [{ visibility: "on" }]
            },
            {
              featureType: "administrative.neighborhood",
              elementType: "labels",
              stylers: [{ visibility: "on" }]
            },
            {
              featureType: "administrative.province",
              elementType: "geometry.stroke",
              stylers: [{ visibility: "on", weight: 1 }]
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ visibility: "on", saturation: -50 }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#e9e9e9" }]
            }
          ],
          minZoom: 3
        });

        mapInstanceRef.current = map;
        
        const bounds = new google.maps.LatLngBounds();
        
        // Visualize the data and collect bounds
        for (const region of fact.regions) {
          const regionBounds = await visualizeRegion(region, map);
          if (regionBounds) {
            bounds.union(regionBounds);
          }
        }

        // Fit map to all regions with padding
        map.fitBounds(bounds);
        // Add some padding by extending the bounds
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const latPadding = (ne.lat() - sw.lat()) * 0.1;
        const lngPadding = (ne.lng() - sw.lng()) * 0.1;
        bounds.extend(new google.maps.LatLng(ne.lat() + latPadding, ne.lng() + lngPadding));
        bounds.extend(new google.maps.LatLng(sw.lat() - latPadding, sw.lng() - lngPadding));
        map.fitBounds(bounds);

        onMapReady?.();
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }

    if (mapRef.current) {
      initMap();
    }
  }, [fact, onMapReady]);

  const visualizeRegion = async (
    region: MapFact['regions'][0],
    map: google.maps.Map
  ) => {
    return new Promise<google.maps.LatLngBounds | null>((resolve) => {
      if (!geocoder.current) return resolve(null);

      geocoder.current.geocode({ address: region.name }, (results, status) => {
        if (status === 'OK' && results?.[0]?.geometry) {
          const bounds = results[0].geometry.viewport || results[0].geometry.bounds;
          
          if (bounds) {
            // Create polygon for the region
            const paths = getPolygonPathsFromBounds(bounds);
            const polygon = new google.maps.Polygon({
              paths,
              strokeColor: region.color,
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: region.color,
              fillOpacity: 0.35,
              map
            });

            // Add click handler to zoom to region
            polygon.addListener('click', () => {
              map.fitBounds(bounds);
              // Add padding by extending the bounds
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              const latPadding = (ne.lat() - sw.lat()) * 0.1;
              const lngPadding = (ne.lng() - sw.lng()) * 0.1;
              const paddedBounds = new google.maps.LatLngBounds();
              paddedBounds.extend(new google.maps.LatLng(ne.lat() + latPadding, ne.lng() + lngPadding));
              paddedBounds.extend(new google.maps.LatLng(sw.lat() - latPadding, sw.lng() - lngPadding));
              map.fitBounds(paddedBounds);
            });

            // Add label
            const marker = new google.maps.Marker({
              position: bounds.getCenter(),
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

            marker.addListener('click', () => {
              map.fitBounds(bounds);
              // Add padding by extending the bounds
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              const latPadding = (ne.lat() - sw.lat()) * 0.1;
              const lngPadding = (ne.lng() - sw.lng()) * 0.1;
              const paddedBounds = new google.maps.LatLngBounds();
              paddedBounds.extend(new google.maps.LatLng(ne.lat() + latPadding, ne.lng() + lngPadding));
              paddedBounds.extend(new google.maps.LatLng(sw.lat() - latPadding, sw.lng() - lngPadding));
              map.fitBounds(paddedBounds);
            });

            resolve(bounds);
            return;
          }
        }
        resolve(null);
      });
    });
  };

  const getPolygonPathsFromBounds = (
    bounds: google.maps.LatLngBounds
  ): google.maps.LatLngLiteral[] => {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    return [
      { lat: ne.lat(), lng: ne.lng() },
      { lat: ne.lat(), lng: sw.lng() },
      { lat: sw.lat(), lng: sw.lng() },
      { lat: sw.lat(), lng: ne.lng() }
    ];
  };

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
            fact.regions.forEach(region => {
              geocoder.current?.geocode({ address: region.name }, (results, status) => {
                if (status === 'OK' && results?.[0]?.geometry?.viewport) {
                  bounds.union(results[0].geometry.viewport);
                  mapInstanceRef.current?.fitBounds(bounds);
                }
              });
            });
          }
        }}
        className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg z-10 hover:bg-gray-50"
      >
        Reset Zoom
      </button>
    </div>
  );
}
