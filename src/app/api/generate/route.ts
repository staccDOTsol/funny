import { NextRequest, NextResponse } from 'next/server';
import { generateMapFact } from '@/utils/openai';
import { MapFact } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<MapFact | { error: string }>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get('region');
    const fact = await generateMapFact(region || undefined);
    return NextResponse.json(fact);
  } catch (error) {
    console.error('Error generating map fact:', error);
    return NextResponse.json(
      { error: 'Failed to generate map fact' },
      { status: 500 }
    );
  }
}
