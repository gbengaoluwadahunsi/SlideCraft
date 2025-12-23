/**
 * Embeddings utility for RAG
 * Uses Groq (free) or OpenAI (paid) for embeddings
 */

export async function generateEmbedding(text: string): Promise<number[]> {
  const groqApiKey = process.env.GROQ_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // Try OpenAI first (better quality), fallback to Groq
  if (openaiApiKey) {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: openaiApiKey });
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small', // Cheaper and good quality
        input: text.slice(0, 8000), // Limit text length
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.warn('OpenAI embedding failed, falling back to Groq:', error);
    }
  }

  // Fallback to Groq (free but may need to use chat completion)
  if (groqApiKey) {
    try {
      const Groq = (await import('groq-sdk')).default;
      const groq = new Groq({ apiKey: groqApiKey });
      
      // Groq doesn't have embeddings API, so we use a workaround
      // Generate a simple hash-based embedding (not ideal but free)
      // For production, consider using a free embedding service like Hugging Face
      return generateSimpleEmbedding(text);
    } catch (error) {
      console.error('Embedding generation failed:', error);
    }
  }

  // Last resort: simple hash-based embedding
  return generateSimpleEmbedding(text);
}

/**
 * Simple hash-based embedding (free but less accurate)
 * For better results, use OpenAI or a free embedding service
 */
function generateSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(1536).fill(0);
  
  // Simple word frequency-based embedding
  words.forEach((word, idx) => {
    const hash = hashString(word);
    const index = Math.abs(hash) % 1536;
    embedding[index] += 1 / (idx + 1); // Weight by position
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
}


