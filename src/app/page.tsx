"use client";

import { useState } from 'react';
import { MapFact } from '@/types';
import MapVisualizer from '@/components/MapVisualizer';

export default function Home() {
  const [fact, setFact] = useState<MapFact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState('');

  const generateNewFact = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/generate${region ? `?region=${encodeURIComponent(region)}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to generate map fact');
      }
      const data = await response.json();
      setFact(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveAsImage = () => {
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
      // Use browser's native functionality to print/save as PDF
      window.print();
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 mb-8">
          <h1 className="text-3xl font-bold">Local Map Facts Generator</h1>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Enter the name of a town, city, or region or place of some kind heehee (optional)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={generateNewFact}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white whitespace-nowrap ${
                loading
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Generating...' : 'Generate New Fact'}
            </button>
            {fact && (
              <button
                onClick={saveAsImage}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg whitespace-nowrap"
              >
                Save as Image
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="map-container">
          {fact ? (
            <MapVisualizer fact={fact} />
          ) : (
            <div className="h-[600px] bg-gray-100 flex items-center justify-center text-gray-500">
              {region ? 
                `Enter a region name and click "Generate New Fact" to start` :
                `Click "Generate New Fact" to start`
              }
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
