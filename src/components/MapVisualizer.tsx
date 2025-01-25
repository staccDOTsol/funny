"use client";

import { useEffect, useRef, useState } from 'react';
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
  const polygonsRef = useRef<Array<google.maps.Polygon | google.maps.Circle>>([]);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

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
              // Use coordinates if provided, otherwise geocode
              if (region.coordinates) {
                const location = new google.maps.LatLng(
                  region.coordinates.lat,
                  region.coordinates.lng
                );
                const viewport = new google.maps.LatLngBounds(
                  new google.maps.LatLng(
                    region.coordinates.lat - 0.5,
                    region.coordinates.lng - 0.5
                  ),
                  new google.maps.LatLng(
                    region.coordinates.lat + 0.5,
                    region.coordinates.lng + 0.5
                  )
                );
                
                // Create a circular polygon for coordinate-based regions
                const circle = new google.maps.Circle({
                  strokeColor: region.color,
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: region.color,
                  fillOpacity: 0.35,
                  center: location,
                  radius: 50000, // 50km radius
                  map
                });
                
                polygonsRef.current.push(circle);
                bounds.union(viewport);

                // Add marker with value label
                const marker = new google.maps.Marker({
                  position: location,
                  map,
                  label: {
                    text: `${region.value}`,
                    color: '#000000',
                    fontSize: '14px',
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
            }
          })
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
    <div className="relative w-full h-[400px] md:h-[600px] bg-gray-100">
      <div ref={mapRef} className="absolute inset-0" />
      <div 
        className={`absolute transition-all duration-300 ease-in-out
          ${isInfoExpanded 
            ? 'top-4 left-4 right-4 bg-white p-3 rounded-lg shadow-lg z-10' 
            : 'top-4 left-4 right-4 bg-white/90 p-2 rounded-lg shadow-lg z-10 md:bg-white md:p-3 md:right-auto md:max-w-md'
          }`}
        onClick={() => setIsInfoExpanded(!isInfoExpanded)}
      >
        <div className="flex items-center justify-between md:block">
          <h2 className="text-lg md:text-xl font-bold truncate">{fact.title}</h2>
          <button 
            className="md:hidden"
            onClick={(e) => {
              e.stopPropagation();
              setIsInfoExpanded(!isInfoExpanded);
            }}
          >
            {isInfoExpanded ? '▼' : '▲'}
          </button>
        </div>
        <div className={`${isInfoExpanded ? 'block mt-2' : 'hidden md:block md:mt-2'}`}>
          <p className="text-sm md:text-base text-gray-700 mb-1 md:mb-2">{fact.description}</p>
          <p className="text-xs md:text-sm text-gray-500 italic">Click on any region to zoom in</p>
        </div>
      </div>
      <button
        onClick={() => {
          if (mapInstanceRef.current) {
            const bounds = new google.maps.LatLngBounds();
            polygonsRef.current.forEach(polygon => {
              if (polygon instanceof google.maps.Polygon) {
                const path = polygon.getPath();
                path.forEach((latLng: google.maps.LatLng) => {
                  bounds.extend(latLng);
                });
              } else if (polygon instanceof google.maps.Circle) {
                const center = polygon.getCenter();
                const radius = polygon.getRadius();
                if (center) {
                  const circleBounds = polygon.getBounds();
                  if (circleBounds) {
                    bounds.union(circleBounds);
                  } 
                }
              }
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
        className="absolute bottom-4 right-4 bg-white px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-lg shadow-lg z-10 hover:bg-gray-50"
      >
        Reset Zoom
      </button>
      <button
        onClick={async () => {
          if (!mapInstanceRef.current) return;
          
          const map = mapInstanceRef.current;
          const mapCanvas = document.createElement('canvas');
          const mapDiv = mapRef.current;
          
          if (!mapDiv) return;
          
          // Set canvas dimensions
          mapCanvas.width = mapDiv.offsetWidth;
          mapCanvas.height = mapDiv.offsetHeight;
          const context = mapCanvas.getContext('2d');
          
          if (!context) return;
          
          // Create overlay for capturing map content
          const overlay = new google.maps.OverlayView();
          overlay.onAdd = () => {};
          overlay.onRemove = () => {};
          
          overlay.draw = () => {
            const projection = overlay.getProjection();
            if (!projection) return;
            
            // Get map bounds
            const bounds = map.getBounds();
            if (!bounds) return;
            
            // Convert bounds to canvas coordinates
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            
            const nePx = projection.fromLatLngToDivPixel(ne);
            const swPx = projection.fromLatLngToDivPixel(sw);
            
            if (!nePx || !swPx) return;
            
            // Clear canvas
            context.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
            
            // Draw map tiles
            const mapTiles = mapDiv.querySelectorAll('canvas');
            mapTiles.forEach(tile => {
              if (tile instanceof HTMLCanvasElement) {
                context.drawImage(
                  tile,
                  swPx.x,
                  swPx.y,
                  nePx.x - swPx.x,
                  nePx.y - swPx.y,
                  0,
                  0,
                  mapCanvas.width,
                  mapCanvas.height
                );
              }
            });
            
            // Draw overlays (markers, polygons)
            markersRef.current.forEach(marker => {
              const position = marker.getPosition();
              if (position) {
                const point = projection.fromLatLngToDivPixel(position);
                if (point) {
                  context.fillStyle = '#000000';
                  context.beginPath();
                  context.arc(point.x - swPx.x, point.y - swPx.y, 5, 0, 2 * Math.PI);
                  context.fill();
                }
              }
            });
            
            polygonsRef.current.forEach(polygon => {
              if (polygon instanceof google.maps.Polygon) {
                const path = polygon.getPath();
                context.beginPath();
                path.forEach((latLng: google.maps.LatLng, i: number) => {
                  const point = projection.fromLatLngToDivPixel(latLng);
                  if (point) {
                    if (i === 0) {
                      context.moveTo(point.x - swPx.x, point.y - swPx.y);
                    } else {
                      context.lineTo(point.x - swPx.x, point.y - swPx.y);
                    }
                  }
                });
                context.closePath();
                
                // Apply polygon styles
                context.strokeStyle = polygon.get('strokeColor') as string;
                context.lineWidth = polygon.get('strokeWeight') as number;
                context.fillStyle = polygon.get('fillColor') as string;
                context.globalAlpha = polygon.get('fillOpacity') as number;
                context.fill();
                context.stroke();
                
              } else if (polygon instanceof google.maps.Circle) {
                const center = polygon.getCenter();
                const radius = polygon.getRadius();
                if (center) {
                  context.beginPath();
                  const centerPoint = projection.fromLatLngToDivPixel(center);
                  if (centerPoint) {
                    // Draw circle
                    context.arc(
                      centerPoint.x - swPx.x,
                      centerPoint.y - swPx.y,
                      radius / 111319.9, // Approximate meters to degrees
                      0,
                      2 * Math.PI
                    );
                    
                    // Apply circle styles
                    context.strokeStyle = polygon.get('strokeColor') as string;
                    context.lineWidth = polygon.get('strokeWeight') as number;
                    context.fillStyle = polygon.get('fillColor') as string;
                    context.globalAlpha = polygon.get('fillOpacity') as number;
                    context.fill();
                    context.stroke();
                  }
                }
              }
            });
            
            // Convert to data URL and trigger download
            const dataUrl = mapCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `map-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
          };
          
          overlay.setMap(map);
        }}
        className="absolute bottom-16 md:bottom-20 right-4 bg-white px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-lg shadow-lg z-10 hover:bg-gray-50"
      >
        Export Map
      </button>
    </div>
  );
}
