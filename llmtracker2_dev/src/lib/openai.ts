interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatGPTResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface CompetitorMention {
  name: string;
  position: number | null;
  mentioned: boolean;
  context: string;
}

export interface BrandAnalysisResult {
  keyword: string;
  brandMentioned: boolean;
  position: number | null;
  confidence: number;
  context: string;
  competitors: CompetitorMention[];
  rawResponse: string;
}

export async function analyzeBrandMention(
  keyword: string,
  brandName: string,
  competitors: string[],
  apiKey: string
): Promise<BrandAnalysisResult> {
  const competitorsList = competitors.length > 0 ? competitors.join(', ') : 'none specified';
  
  const prompt = `You are a brand tracking analyst. Search for information about the keyword "${keyword}" and analyze brand mentions for both the target brand and competitors.

Context:
- Target Brand: ${brandName}
- Competitors: ${competitorsList}
- Keyword: ${keyword}

Please provide a detailed analysis in JSON format with the following structure:
{
  "targetBrand": {
    "name": "${brandName}",
    "mentioned": boolean,
    "position": number or null,
    "context": "specific context where brand appears"
  },
  "competitors": [
    {
      "name": "competitor name",
      "mentioned": boolean,
      "position": number or null,
      "context": "specific context where competitor appears"
    }
  ],
  "confidence": number (0-100),
  "summary": "detailed analysis summary"
}

Analyze:
1. Whether ${brandName} is mentioned when searching for "${keyword}"
2. Which competitors from the list appear in search results
3. Position/ranking of each brand (1-10 scale where available)
4. Specific context where each brand appears
5. Your confidence level (0-100) in this analysis

Be specific about positions and provide context for each mention.`;

  const messages: ChatGPTMessage[] = [
    {
      role: 'system',
      content: 'You are a brand tracking analyst specializing in search result analysis. Provide detailed, accurate analysis of brand mentions in search results.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data: ChatGPTResponse = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Parse the response to extract structured data
    const analysisResult = parseBrandAnalysis(content, keyword, brandName);
    
    return {
      ...analysisResult,
      rawResponse: content,
    };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error(`Failed to analyze brand mention: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseBrandAnalysis(content: string, keyword: string, brandName: string): Omit<BrandAnalysisResult, 'rawResponse'> {
  let parsedData: any = {};
  
  try {
    // Try to parse JSON response first
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedData = JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.warn('Failed to parse JSON, falling back to text analysis');
  }
  
  // Extract data from parsed JSON or fallback to text parsing
  const brandMentioned = parsedData.targetBrand?.mentioned ?? content.toLowerCase().includes(brandName.toLowerCase());
  const position = parsedData.targetBrand?.position ?? extractPosition(content);
  const confidence = parsedData.confidence ?? extractConfidence(content);
  const context = parsedData.targetBrand?.context ?? extractContext(content, brandName);
  
  // Extract competitor information
  const competitors: CompetitorMention[] = [];
  if (parsedData.competitors && Array.isArray(parsedData.competitors)) {
    competitors.push(...parsedData.competitors.map((comp: any) => ({
      name: comp.name,
      mentioned: comp.mentioned,
      position: comp.position,
      context: comp.context || ''
    })));
  }
  
  return {
    keyword,
    brandMentioned,
    position,
    confidence,
    context,
    competitors,
  };
}

function extractPosition(content: string): number | null {
  const positionRegex = /(?:position|rank|#|number)\s*:?\s*(\d+)/i;
  const match = content.match(positionRegex);
  return match ? parseInt(match[1], 10) : null;
}

function extractConfidence(content: string): number {
  const confidenceRegex = /confidence[:\s]*(\d+)/i;
  const match = content.match(confidenceRegex);
  return match ? parseInt(match[1], 10) : 50;
}

function extractContext(content: string, brandName: string): string {
  const lowerContent = content.toLowerCase();
  const lowerBrandName = brandName.toLowerCase();
  const brandIndex = lowerContent.indexOf(lowerBrandName);
  
  if (brandIndex === -1) return '';
  
  const start = Math.max(0, brandIndex - 100);
  const end = Math.min(content.length, brandIndex + 200);
  return content.substring(start, end).trim();
}