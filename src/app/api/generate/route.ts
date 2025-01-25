import { NextResponse } from 'next/server';
import { generateMapFact } from '@/utils/openai';
import { MapFact } from '@/types';

export async function GET(): Promise<NextResponse<MapFact | { error: string }>> {
  try {
    const fact = await generateMapFact();
    return NextResponse.json(fact);
  } catch (error) {
    console.error('Error generating map fact:', error);
    return NextResponse.json(
      { error: 'Failed to generate map fact' },
      { status: 500 }
    );
  }
}
