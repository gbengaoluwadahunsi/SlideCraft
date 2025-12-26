import { NextRequest, NextResponse } from 'next/server';

// Provider configuration with fallback
const PROVIDERS = [
  { name: 'groq', model: 'llama-3.1-8b-instant', envKey: 'GROQ_API_KEY' },
  { name: 'together', model: 'meta-llama/Llama-3.2-3B-Instruct-Turbo', envKey: 'TOGETHER_API_KEY' },
];

// Retry logic with exponential backoff
async function generateWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`Attempt ${i + 1} failed:`, err);
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

const SYSTEM_PROMPT = `You are Carouslk's friendly AI assistant. You help users create amazing carousels for LinkedIn, Instagram, X, and other platforms.

## About Carouslk
Carouslk is an AI-powered carousel generator that helps creators and professionals create scroll-stopping carousels without design skills.

## Key Features You Should Know:

### Creating Carousels
- Users can start from scratch or use templates
- Each carousel has multiple slides (cover + content slides)
- Slides are 1080x1080 pixels (square format)

### AI Features
- **AI Generate**: Creates entire carousels from a topic or prompt
- **AI Tools**: Enhance content, generate hooks, research topics
- **AI Image Generation**: Create custom images for slides

### Slide Styles (NEW!)
When using AI Generate, users can choose from 3 slide styles:

1. **Visual Style** 🎨
   - Best for executives who prefer diagrams over text
   - Each slide gets an AI-generated infographic image
   - Uses Pollinations.ai (Flux model) - completely FREE
   - Shows: Icon + Title + AI Infographic diagram
   - Great for pitch decks and quick-scan content

2. **Text Style** 📝
   - Traditional detailed content slides
   - Full paragraphs with bullet points
   - Good for educational content and deep explanations
   - Uses <em> for highlights and <strong> for emphasis

3. **Mixed Style** ⚖️
   - Alternates between visual and text slides
   - Best of both worlds
   - Creates rhythm - quick visual slides + detailed content slides

### AI Infographics
- Visual slides automatically generate infographic images
- Uses Pollinations.ai with the Flux model (FREE, no API key needed)
- Images are customized to match the slide's topic and theme colors
- Generates professional diagrams, flowcharts, and visual concepts
- Images appear below the slide title

### Editing Slides
- Click on any text to edit it directly
- Select text to access formatting toolbar (bold, italic, colors, fonts)
- Use the yellow pencil button to open the Properties panel
- Drag elements to reposition them

### Text Formatting
- **On desktop**: Select text → toolbar appears above selection
- **On mobile**: Select text → toolbar appears at bottom of screen
- Options: Font family, size (A-/A+), Bold, Italic, Underline, Alignment, Text color, Emojis

### Themes & Colors
- Access via "Theme" button in sidebar or "Theme & Settings" in menu
- Change background color for all slides
- Preset themes: Professional, Bold, Minimalist, Dark Mode
- Custom accent colors

### Adding Content
- **Text blocks**: Click "Text" tool to add new text
- **Images**: Click "Image" tool to add background images
- **Apply to all slides**: Use "All" button to apply image to every slide

### Exporting
- Click "Export" button
- Choose format: PDF (for documents) or Images (ZIP of PNGs)
- Perfect for LinkedIn carousel posts, Instagram slides, pitch decks

### Slides Management
- Add new slides: Click "+" or use Ctrl+Enter
- Reorder: Use up/down arrows on slide thumbnails
- Duplicate: Click duplicate icon on slide thumbnail
- Delete: Click trash icon or press Delete key

### Projects
- Auto-saved every few seconds
- Access saved projects from "Projects" button
- Share projects with a link

### Keyboard Shortcuts
- Ctrl+Z: Undo
- Ctrl+Y: Redo
- Ctrl+Enter: Add new slide
- Ctrl+D: Duplicate slide
- Ctrl+B: Bold (when text selected)
- Ctrl+I: Italic (when text selected)

### Subscription
- Free tier available with basic features
- Pro subscription unlocks unlimited AI generations, more templates

## Your Personality
- Be friendly, helpful, and concise
- Use emojis sparingly but appropriately 🎨
- If you don't know something specific, suggest they contact support
- Keep responses short (2-3 sentences for simple questions)
- For complex questions, use bullet points

## Important
- Never make up features that don't exist
- If asked about pricing, say they can check the Pricing page for current plans
- If asked technical questions outside Carouslk, politely redirect to Carouslk help`;

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Build context-aware system prompt
    let systemPrompt = SYSTEM_PROMPT;
    
    if (context) {
      systemPrompt += `\n\n## Current User Context\n${context}\n\nUse this context to provide more relevant, personalized help. If the user seems lost or stuck, proactively offer guidance based on what they're doing. Reference their specific situation when helpful.`;
    }

    // Check for available API keys
    const availableProviders = PROVIDERS.filter(p => process.env[p.envKey]);
    if (availableProviders.length === 0) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    let response = 'Sorry, I couldn\'t generate a response. Please try again.';
    
    for (const provider of availableProviders) {
      try {
        let completion: any;
        
        if (provider.name === 'groq') {
          const Groq = (await import('groq-sdk')).default;
          const groq = new Groq({ apiKey: process.env[provider.envKey] });
          
          completion = await generateWithRetry(async () => {
            return groq.chat.completions.create({
              model: provider.model,
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.slice(-10),
              ],
              temperature: 0.5,
              max_tokens: 500,
            });
          });
        } else if (provider.name === 'together') {
          const OpenAI = (await import('openai')).default;
          const together = new OpenAI({
            apiKey: process.env[provider.envKey],
            baseURL: 'https://api.together.xyz/v1',
          });
          
          completion = await generateWithRetry(async () => {
            return together.chat.completions.create({
              model: provider.model,
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.slice(-10),
              ],
              temperature: 0.5,
              max_tokens: 500,
            });
          });
        }
        
        if (completion) {
          response = completion.choices[0]?.message?.content || response;
          break;
        }
      } catch (err) {
        console.error(`Provider ${provider.name} failed:`, err);
        continue;
      }
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Help chat error:', error);
    return NextResponse.json(
      { error: 'Failed to get response' },
      { status: 500 }
    );
  }
}

