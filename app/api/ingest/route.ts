import { NextRequest, NextResponse } from 'next/server';
import matter from 'gray-matter';
import mammoth from 'mammoth';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPPORTED_EXTENSIONS = ['.md', '.markdown', '.docx', '.txt', '.pdf'];

interface PdfParseModule {
  default?: (buffer: Buffer) => Promise<{ text: string }>;
}

const pdfParse = async (buffer: Buffer): Promise<{ text: string }> => {
  const mod = await import('pdf-parse') as PdfParseModule;
  const pdf = mod.default || (() => { throw new Error('pdf-parse not available'); });
  return pdf(buffer);
};
const MAX_CHAR_COUNT = 20000;

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function detectSections(text: string): string[] {
  const sections = new Set<string>();
  const lines = text.split(/\n+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^(#{1,6}|\d+\.)\s*(.+)/);
    if (headingMatch) {
      sections.add(headingMatch[2].trim());
      continue;
    }

    if (/^Q[:\s-]/i.test(trimmed)) {
      sections.add(trimmed.replace(/^Q[:\s-]*/i, 'Q: ').trim());
    }
  }

  return Array.from(sections).slice(0, 24);
}

async function extractMarkdown(buffer: Buffer) {
  const raw = buffer.toString('utf-8');
  const parsed = matter(raw);
  return `${parsed.data?.title ? `${parsed.data.title}\n\n` : ''}${parsed.content}`.trim();
}

async function extractDocx(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
}

async function extractPdf(buffer: Buffer) {
  const data = await pdfParse(buffer);
  return data.text || '';
}

async function extractPlain(buffer: Buffer) {
  return buffer.toString('utf-8');
}

function truncateText(text: string) {
  if (text.length <= MAX_CHAR_COUNT) {
    return { text, truncated: false };
  }
  return {
    text: text.slice(0, MAX_CHAR_COUNT),
    truncated: true,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    const fileName = file.name || 'document';
    const lowerName = fileName.toLowerCase();
    const extension = SUPPORTED_EXTENSIONS.find((ext) => lowerName.endsWith(ext));

    if (!extension) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload .md, .markdown, .docx, .txt, or .pdf' },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extracted = '';
    if (extension === '.md' || extension === '.markdown') {
      extracted = await extractMarkdown(buffer);
    } else if (extension === '.docx') {
      extracted = await extractDocx(buffer);
    } else if (extension === '.pdf') {
      extracted = await extractPdf(buffer);
    } else {
      extracted = await extractPlain(buffer);
    }

    extracted = normalizeText(extracted);

    if (!extracted) {
      return NextResponse.json(
        { error: 'Unable to extract readable text from this document' },
        { status: 400 },
      );
    }

    const { text, truncated } = truncateText(extracted);
    const sections = detectSections(extracted);
    const wordCount = extracted.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      fileName,
      text,
      truncated,
      sections,
      wordCount,
    });
  } catch (error) {
    console.error('Document ingestion failed:', error);
    return NextResponse.json(
      { error: 'Failed to process document. Please try a different file.' },
      { status: 500 },
    );
  }
}
