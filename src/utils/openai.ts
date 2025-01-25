import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function generateMapFact(): Promise<{
  title: string;
  description: string;
  regions: Array<{
    name: string;
    value: string;
    color: string;
  }>;
}> {
  const prompt = `Generate an interesting and factual map visualization about a specific region or country. The fact should be:
1. Based on real, verifiable data
2. Interesting and unique
3. Suitable for visualization on a map
4. Related to one of these themes: culture, history, environment, language, or economics

Format the response as a JSON object with:
- title: A catchy title for the visualization
- description: A brief explanation of what the map shows
- regions: An array of objects, each with:
  - name: The region name (must be a real, mappable location)
  - value: The specific value or characteristic for this region
  - color: A hex color code that represents the value (use appropriate color theory)

Example:
{
  "title": "The Colors of Coffee in Colombia",
  "description": "Colombia's diverse geography lends itself to a variety of coffee bean characteristics, with each region offering a unique taste profile.",
  "regions": [
    {
      "name": "Huila",
      "value": "Bright, acidic beans with medium body",
      "color": "#7F5539"
    },
    {
      "name": "Antioquia",
      "value": "Mild flavor with medium body",
      "color": "#9B6A6C"
    }
  ]
}

Generate a new, different fact with similar structure but about a different topic or region.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a knowledgeable geographer and data visualization expert."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: "json_object" }
  });

  const response = completion.choices[0].message.content;
  if (!response) {
    throw new Error('Failed to generate map fact');
  }

  return JSON.parse(response);
}
