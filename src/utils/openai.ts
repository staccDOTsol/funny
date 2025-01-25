import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
  const topics = [
    "Ancient trade routes and their modern economic impact",
    "Unique local superstitions and folklore",
    "Endangered species habitats",
    "Traditional music instruments and their origins",
    "Historical migration patterns",
    "Local delicacies and their cultural significance",
    "Ancient architectural styles that persist today",
    "Traditional crafts and artisan techniques",
    "Historical weather phenomena and their cultural impact",
    "Indigenous language families and their distribution",
    "Traditional healing practices and medicinal plants",
    "Historical political boundaries vs modern regions",
    "Traditional farming techniques and their evolution",
    "Ancient religious sites and their modern influence",
    "Traditional clothing materials and techniques",
    "Historical naval routes and modern shipping lanes",
    "Traditional storytelling methods and their preservation",
    "Ancient battlefield sites and their tourism impact",
    "Traditional hunting methods and conservation",
    "Historical plague outbreaks and modern healthcare"
  ];


  const prompt = `Generate an interesting and factual map visualization about a specific region or country. Choose an unexpected combination of topic and region from these suggestions (but you can use others too):

Topics: ${topics.join(', ')}
Regions: 

The fact should be:
1. Based on real, verifiable data or historical records
2. Reveal surprising connections or patterns
3. Tell a compelling story through geographical data
4. Challenge common assumptions about the region
5. Connect historical patterns to modern implications

Format the response as a JSON object with:
- title: A catchy, intriguing title that hints at an unexpected connection
- description: A brief explanation that sets up the historical or cultural context and why it matters today
- regions: An array of 3-7 objects, each with:
  - name: The region name (must be a real, mappable location)
  - value: A specific characteristic that contributes to the larger story
  - color: A hex color code that either:
    - Represents the intensity of the value
    - Symbolizes cultural significance
    - Reflects historical meaning
    - Matches natural elements
    - Corresponds to traditional color associations

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

Generate a new, different fact that reveals an unexpected pattern or connection about a region and topic not shown in the example.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a knowledgeable geographer, historian, and data visualization expert with a talent for discovering surprising connections between regions, cultures, and historical patterns."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.8,
    max_tokens: 1000,
    response_format: { type: "json_object" }
  });

  const response = completion.choices[0].message.content;
  if (!response) {
    throw new Error('Failed to generate map fact');
  }

  return JSON.parse(response);
}
