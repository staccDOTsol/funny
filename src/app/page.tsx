"use client";

import { useEffect, useState, useRef } from 'react';
import MapVisualizer from '@/components/MapVisualizer';
import { MapFact } from '@/types';
import { toPng } from 'html-to-image';

export default function Home() {
  const [fact, setFact] = useState<MapFact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const generateNewFact = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setFact(data.fact);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate map fact');
    } finally {
      setLoading(false);
    }
  };

  const saveImage = async () => {
    if (!mapContainerRef.current) return;
    
    try {
      const dataUrl = await toPng(mapContainerRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff'
      });
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.download = `${fact?.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error saving image:', err);
      setError('Failed to save image');
    }
  };

  useEffect(() => {
    generateNewFact();
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Local Map Facts Generator</h1>
            <p className="text-gray-600 text-sm">
              Discover fascinating local facts about regions, cities, and provinces. Each map focuses on a specific area with detailed insights about:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                "Local Traditions",
                "Regional Foods",
                "Dialect Variations",
                "Historical Events",
                "Environmental Features",
                "Cultural Practices"
              ].map((tag) => (
                <span key={tag} className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="space-x-4">
              <button
                onClick={generateNewFact}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Generate New Fact</span>
                  </>
                )}
              </button>
            {fact && (
              <button
                onClick={saveImage}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
              >
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Save as Image</span>
                </>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div ref={mapContainerRef}>
          {fact && <MapVisualizer fact={fact} />}
        </div>
      </div>
    </main>
  );
}
