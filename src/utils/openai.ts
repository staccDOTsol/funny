import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function generateMapFact(region?: string): Promise<{
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
      "Historical plague outbreaks and modern healthcare",
      "Traditional music instruments and their origins",
      "Traditional dance styles and their origins",
      "Traditional food and their origins",
      "Traditional clothing and their origins",
      "Traditional art and their origins",
      "Traditional architecture and their origins",
      "Traditional sports and their origins",
      "Traditional games and their origins",
      "Traditional festivals and their origins",
      "Traditional music and their origins",
      "Traditional dance and their origins",
      "Traditional art and their origins",
      "Traditional architecture and their origins",
      "modern music and their origins",
      "modern dance and their origins",
      "modern art and their origins",
      "modern architecture and their origins",
      "modern sports and their origins",
      "modern games and their origins",
      "modern festivals and their origins",
      "modern music and their origins",
      "modern dance and their origins",
      "modern art and their origins",
      "modern architecture and their origins",
      "modern sports and their origins",
      "modern games and their origins",
      "modern festivals and their origins",
      "modern music and their origins",
      "modern dance and their origins",
      "modern art and their origins",
      "modern architecture and their origins",
      "modern sports and their origins",
      "modern games and their origins",
      "modern festivals and their origins",
    ];
  

  const regions = [
    "Southeast Asia",
    "Mediterranean Basin",
    "Scandinavia",
    "The Balkans",
    "Central America",
    "The Caribbean",
    "The Caucasus",
    "The Sahel",
    "The Himalayas",
    "The Amazon Basin",
    "The Pacific Islands",
    "The Arabian Peninsula",
    "The Horn of Africa",
    "The Andes Mountains",
    "The Great Lakes Region",
    "The Silk Road Cities",
    "The Celtic Nations",
    "The Polynesian Triangle",
    "The Fertile Crescent",
    "The Steppe Regions"
  ];

  const prompt = `Generate an interesting and factual map visualization about ${
    region ? `the ${region} region` : 'a specific region or country'
  }. ${
    !region ? `Choose an unexpected combination of topic and region from these suggestions (but you can use others too):

Topics: ${topics.join(', ')}
Regions: ${regions.join(', ')}` : ''
  }

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
  - name: The region name (must be a real, mappable location${region ? ` within ${region}` : ''})
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

Generate a new, different fact that reveals an unexpected pattern or connection about ${region || 'a region and topic not shown in the example'}.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
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
