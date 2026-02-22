import { readFileSync } from 'fs';
import OpenAI from 'openai';

const env = readFileSync('.env', 'utf8');
const groqKey = env.match(/GROQ_API_KEY=(.+)/)[1].trim();
const orKey = env.match(/OPENROUTER_API_KEY=(.+)/)?.[1]?.trim();

// Test Groq first
console.log('=== Groq (primary) ===');
const groq = new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' });
try {
  const start = Date.now();
  const r = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'Return only valid JSON with a "slides" array.' },
      { role: 'user', content: 'Create 2 slides about "Why Testing Matters". Slide 1: type cover with title+subtitle. Slide 2: type content with title and HTML content.' }
    ],
    max_tokens: 500,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });
  const text = r.choices[0]?.message?.content;
  console.log(`SUCCESS in ${Date.now()-start}ms`);
  const parsed = JSON.parse(text);
  console.log(`Slides: ${parsed.slides.length}`);
  parsed.slides.forEach((s, i) => console.log(`  ${i+1}. [${s.type}] ${s.title}`));
} catch(e) {
  console.log('FAILED:', e.message.substring(0, 150));
}

// Test OpenRouter
if (orKey) {
  console.log('\n=== OpenRouter (fallback) ===');
  const or = new OpenAI({ apiKey: orKey, baseURL: 'https://openrouter.ai/api/v1' });
  try {
    const start = Date.now();
    const r = await or.chat.completions.create({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: 'Return only valid JSON with a "slides" array.' },
        { role: 'user', content: 'Create 2 slides about "Why Testing Matters". Slide 1: type cover with title+subtitle. Slide 2: type content with title and HTML content.' }
      ],
      max_tokens: 500,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
    const text = r.choices[0]?.message?.content;
    console.log(`SUCCESS in ${Date.now()-start}ms`);
    const parsed = JSON.parse(text);
    console.log(`Slides: ${parsed.slides.length}`);
    parsed.slides.forEach((s, i) => console.log(`  ${i+1}. [${s.type}] ${s.title}`));
  } catch(e) {
    console.log('FAILED:', e.message.substring(0, 150));
  }
}

console.log('\nBoth providers tested. Ready to generate carousels!');
