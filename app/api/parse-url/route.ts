import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Common patterns to remove from extracted content
const NOISE_PATTERNS = [
  /cookie\s*(policy|consent|notice|banner)/gi,
  /accept\s*all\s*cookies/gi,
  /subscribe\s*to\s*(our\s*)?(newsletter|updates)/gi,
  /sign\s*up\s*for\s*(our\s*)?(newsletter|updates)/gi,
  /follow\s*us\s*on/gi,
  /share\s*(this|on)\s*(facebook|twitter|linkedin|x)/gi,
  /read\s*more\s*articles/gi,
  /related\s*(posts|articles|content)/gi,
  /leave\s*a\s*(comment|reply)/gi,
  /advertisement/gi,
  /sponsored\s*content/gi,
  /©\s*\d{4}/gi,
  /all\s*rights\s*reserved/gi,
  /privacy\s*policy/gi,
  /terms\s*(of\s*)?(service|use)/gi,
];

// Selectors to remove (common non-content elements)
const REMOVE_SELECTORS = [
  'script', 'style', 'nav', 'header', 'footer', 'aside',
  'iframe', 'form', 'button', 'input', 'select', 'textarea',
  '[class*="sidebar"]', '[class*="menu"]', '[class*="nav"]',
  '[class*="footer"]', '[class*="header"]', '[class*="comment"]',
  '[class*="social"]', '[class*="share"]', '[class*="related"]',
  '[class*="advertisement"]', '[class*="ad-"]', '[class*="cookie"]',
  '[id*="sidebar"]', '[id*="menu"]', '[id*="nav"]',
  '[id*="footer"]', '[id*="header"]', '[id*="comment"]',
];

function extractTextFromHtml(html: string): { title: string; content: string; description: string } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const title = ogTitleMatch?.[1] || titleMatch?.[1] || '';

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const description = ogDescMatch?.[1] || descMatch?.[1] || '';

  // Remove unwanted elements
  let cleanHtml = html;
  
  // Remove script and style tags with their content
  cleanHtml = cleanHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleanHtml = cleanHtml.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
  
  // Remove nav, header, footer, aside elements
  cleanHtml = cleanHtml.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  cleanHtml = cleanHtml.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  cleanHtml = cleanHtml.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  cleanHtml = cleanHtml.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
  
  // Remove forms and inputs
  cleanHtml = cleanHtml.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');
  cleanHtml = cleanHtml.replace(/<input[^>]*>/gi, '');
  cleanHtml = cleanHtml.replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '');
  
  // Try to find the main content area
  let mainContent = '';
  
  // Look for article tag first
  const articleMatch = cleanHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    mainContent = articleMatch[1];
  }
  
  // Look for main tag
  if (!mainContent) {
    const mainMatch = cleanHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      mainContent = mainMatch[1];
    }
  }
  
  // Look for common content class names
  if (!mainContent) {
    const contentPatterns = [
      /<div[^>]*class=["'][^"']*(?:content|article|post|entry|blog)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id=["'][^"']*(?:content|article|post|entry|blog)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    ];
    
    for (const pattern of contentPatterns) {
      const match = cleanHtml.match(pattern);
      if (match) {
        mainContent = match[1];
        break;
      }
    }
  }
  
  // Fallback to body content
  if (!mainContent) {
    const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    mainContent = bodyMatch?.[1] || cleanHtml;
  }
  
  // Extract headings for structure
  const headings: string[] = [];
  const headingMatches = mainContent.matchAll(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi);
  for (const match of headingMatches) {
    const heading = match[1].trim();
    if (heading && heading.length > 2) {
      headings.push(heading);
    }
  }
  
  // Convert HTML to text
  let text = mainContent
    // Replace headers with text + newlines
    .replace(/<h[1-6][^>]*>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    // Replace paragraphs
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    // Replace list items
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    // Replace breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&#\d+;/g, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
  
  // Remove noise patterns
  for (const pattern of NOISE_PATTERNS) {
    text = text.replace(pattern, '');
  }
  
  // Remove very short lines (likely navigation remnants)
  const lines = text.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 10 || trimmed.startsWith('•');
  });
  
  text = lines.join('\n').trim();
  
  // Clean up extra whitespace again
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  
  return {
    title: title.trim(),
    content: text,
    description: description.trim(),
  };
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function extractSections(text: string): string[] {
  const sections: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for potential section headers (short lines, possibly with numbers)
    if (
      trimmed.length > 3 &&
      trimmed.length < 100 &&
      !trimmed.startsWith('•') &&
      (
        /^\d+[.)]\s/.test(trimmed) || // Numbered
        /^[A-Z][^.!?]*$/.test(trimmed) || // Title case without period
        trimmed === trimmed.toUpperCase() // All caps
      )
    ) {
      sections.push(trimmed);
    }
  }
  
  return sections.slice(0, 20); // Limit to 20 sections
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a valid http or https URL.' },
        { status: 400 }
      );
    }

    // Fetch the URL content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CarouslkBot/1.0; +https://carouslk.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out. The website took too long to respond.' },
          { status: 408 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch the URL. Please check if the URL is accessible.' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return NextResponse.json(
        { error: 'URL does not point to an HTML page. Please provide a link to an article or blog post.' },
        { status: 400 }
      );
    }

    const html = await response.text();
    
    // Limit HTML size to prevent memory issues
    if (html.length > 5_000_000) { // 5MB limit
      return NextResponse.json(
        { error: 'Page content is too large to process.' },
        { status: 413 }
      );
    }

    const { title, content, description } = extractTextFromHtml(html);

    if (!content || content.length < 100) {
      return NextResponse.json(
        { error: 'Could not extract meaningful content from this URL. Try a different page with more text content.' },
        { status: 422 }
      );
    }

    // Truncate very long content
    const MAX_CHARS = 25000;
    const truncated = content.length > MAX_CHARS;
    const finalContent = truncated ? content.slice(0, MAX_CHARS) + '...' : content;

    const wordCount = countWords(finalContent);
    const sections = extractSections(finalContent);

    return NextResponse.json({
      title,
      description,
      text: finalContent,
      wordCount,
      sections,
      truncated,
      sourceUrl: url,
      sourceDomain: parsedUrl.hostname,
    });

  } catch (error) {
    console.error('URL Parse Error:', error);
    return NextResponse.json(
      { error: 'Failed to parse URL content' },
      { status: 500 }
    );
  }
}













