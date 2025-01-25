import OpenAI from 'openai';
import { MapFact } from '../types';

if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
  throw new Error('NEXT_PUBLIC_OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const SYSTEM_PROMPT = `You are a creative geographer who generates interesting and factual tidbits about specific regions that can be displayed on a map. 
Generate responses in the following JSON format:
{
  "title": "Brief, catchy title that captures attention",
  "regions": [
    {
      "name": "region name (specific state, province, city, or small country)",
      "value": "interesting fact or numerical value",
      "color": "detailed hex code with specific meaning"
    }
  ],
  "description": "Brief, engaging explanation focusing on the local significance"
}

Guidelines for generating facts:
1. Focus on LOCALIZED facts - pick a specific area (like a single country or state) and show interesting variations within it
2. Include 4-6 regions per fact, all within the same general area
3. Use specific, local region names:
   - States/provinces within a country
   - Cities within a state
   - Districts within a city
   - Small countries within a continent
4. Values should tell a connected story:
   - Local statistics or measurements
   - Regional variations or patterns
   - Historical events specific to the area
   - Cultural practices unique to each region
5. Colors must be meaningful and varied:
   - Use specific hex codes, not generic colors
   - Examples:
     - #FF6B6B (coral red) for hot regions
     - #4ECDC4 (turquoise) for coastal areas
     - #96CEB4 (sage) for forested regions
     - #FFEEAD (cream) for desert areas
     - #D4A5A5 (dusty rose) for historic sites
     - #9FA4C4 (slate blue) for industrial areas
6. Topics should be locally focused:
   - Regional dialects or language variations
   - Local food specialties or ingredients
   - Area-specific traditions or festivals
   - Regional architectural styles
   - Local environmental features
   - State/provincial laws or customs
   - Regional economic specialties

Always focus on a specific geographical area rather than spreading facts across the globe. Make the story cohesive and connected to a particular region or theme.`;

export async function generateMapFact(): Promise<MapFact> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "Generate an interesting geographical fact about a specific region, focusing on local variations and using meaningful hex colors." }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");
    
    // Ensure each region has a color if not provided
    response.regions = response.regions.map((region: { name: string; value: string | number; color?: string }) => ({
      ...region,
      color: region.color || `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
    }));

    return response as MapFact;
  } catch (error) {
    console.error('Error generating map fact:', error);
    throw error;
  }
}
