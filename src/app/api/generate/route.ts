import { NextRequest, NextResponse } from 'next/server';
import { generateMapFact } from '@/utils/openai';
import { GenerateFactResponse } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return NextResponse.json<GenerateFactResponse>(
      {
        fact: {
          title: 'Configuration Error',
          regions: [],
          description: 'API keys are not properly configured'
        },
        error: 'Missing required API keys'
      },
      { status: 500 }
    );
  }

  try {
    const fact = await generateMapFact();
    
    return NextResponse.json<GenerateFactResponse>({
      fact
    });
  } catch (error) {
    console.error('Error in generate route:', error);
    return NextResponse.json<GenerateFactResponse>(
      {
        fact: {
          title: 'Error',
          regions: [],
          description: 'Failed to generate map fact'
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
