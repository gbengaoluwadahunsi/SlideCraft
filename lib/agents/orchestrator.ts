/**
 * Agent Orchestrator using LangChain
 * Coordinates multiple AI agents for complex workflows
 */

import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';

// Initialize Groq LLM
function getLLM() {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return null;
  }

  return new ChatGroq({
    modelName: 'llama-3.3-70b-versatile',
    temperature: 0.5,
    apiKey: groqApiKey,
  });
}

/**
 * Research Agent - Gathers information about a topic
 */
export async function researchAgent(topic: string): Promise<string> {
  const llm = getLLM();
  if (!llm) return 'Research unavailable (missing GROQ_API_KEY).';

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a research assistant. Provide comprehensive, accurate information on topics.'],
    ['human', 'Research the following topic: {topic}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ topic });
  
  return response.content as string;
}

/**
 * Content Generation Agent - Creates carousel content
 */
export async function generateContentAgent(
  research: string,
  slideCount: number,
  writingStyle: string
): Promise<any> {
  const llm = getLLM();
  if (!llm) return { slides: [] };

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are an expert carousel content creator. Convert research into engaging slides.
      Return a JSON object with a "slides" array. Each slide should have: type, title, content, emoji.`],
    ['human', `Based on this research, create ${slideCount} slides in ${writingStyle} style:
      {research}`],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ research, slideCount, writingStyle });
  
  try {
    const content = response.content as string;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { slides: [] };
  } catch {
    return { slides: [] };
  }
}

/**
 * Enhancement Agent - Improves existing content
 */
export async function enhanceContentAgent(content: string, goal: string): Promise<string> {
  const llm = getLLM();
  if (!llm) return content;

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a content enhancement expert. Improve content while maintaining its core message.'],
    ['human', `Enhance this content with the goal of: {goal}\n\nContent: {content}`],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ content, goal });
  
  return response.content as string;
}

/**
 * Design Agent - Provides design recommendations
 */
export async function designAgent(slides: any[]): Promise<any> {
  const llm = getLLM();
  if (!llm) return { recommendations: 'Design review unavailable (missing GROQ_API_KEY).', score: 0 };

  const slidesSummary = slides.map((s, i) => 
    `Slide ${i + 1}: ${s.title || 'Untitled'}`
  ).join('\n');

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a design expert. Analyze carousel slides and provide design recommendations.'],
    ['human', `Analyze these slides and provide design recommendations:\n${slidesSummary}`],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({});
  
  return {
    recommendations: response.content as string,
    score: 85, // Placeholder - could be calculated
  };
}

/**
 * Multi-Agent Workflow Orchestrator
 * Coordinates multiple agents to complete complex tasks
 */
export class AgentOrchestrator {
  private llm: ChatGroq | null;

  constructor() {
    this.llm = getLLM();
  }

  /**
   * Complete workflow: Research → Generate → Enhance → Design
   */
  async executeWorkflow(params: {
    topic: string;
    slideCount: number;
    writingStyle: string;
    enhance?: boolean;
    designReview?: boolean;
  }): Promise<{
    research: string;
    slides: any[];
    enhanced?: boolean;
    designRecommendations?: any;
  }> {
    const results: any = {};

    // Step 1: Research
    console.log('🔍 Researching topic...');
    results.research = await researchAgent(params.topic);

    // Step 2: Generate
    console.log('✍️ Generating content...');
    const generated = await generateContentAgent(
      results.research,
      params.slideCount,
      params.writingStyle
    );
    results.slides = generated.slides || [];

    // Step 3: Enhance (optional)
    if (params.enhance && results.slides.length > 0) {
      console.log('✨ Enhancing content...');
      for (let i = 0; i < results.slides.length; i++) {
        const slide = results.slides[i];
        if (slide.content) {
          slide.content = await enhanceContentAgent(
            slide.content,
            'Make it more engaging and clear'
          );
        }
      }
      results.enhanced = true;
    }

    // Step 4: Design Review (optional)
    if (params.designReview && results.slides.length > 0) {
      console.log('🎨 Analyzing design...');
      results.designRecommendations = await designAgent(results.slides);
    }

    return results;
  }

  /**
   * Parallel agent execution for faster processing
   */
  async executeParallel(agents: Array<() => Promise<any>>): Promise<any[]> {
    return Promise.all(agents.map(agent => agent()));
  }
}

