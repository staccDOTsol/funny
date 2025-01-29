"use client";

import MapVisualizer from '@/components/MapVisualizer';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 mb-8">
          <h1 className="text-3xl font-bold">Your World Map</h1>
          <p className="text-gray-600">Sign in to see everywhere you've been!</p>
        </div>
        <MapVisualizer />
      </div>
    </main>
  );
}
