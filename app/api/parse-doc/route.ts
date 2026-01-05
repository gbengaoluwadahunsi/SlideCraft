import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import matter from 'gray-matter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// pdf-parse doesn't have proper ESM exports, use dynamic import
const pdfParse = async (buffer: Buffer): Promise<{ text: string }> => {
  const pdf = (await import('pdf-parse')).default;
  return pdf(buffer);
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    let parsedText = '';

    if (fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      parsedText = result.value;
    } else if (fileName.endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      parsedText = data.text;
    } else if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
      const fileContent = buffer.toString('utf-8');
      // Use gray-matter to strip frontmatter if present, otherwise just use content
      const { content } = matter(fileContent);
      parsedText = content;
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload .docx, .md, .txt, or .pdf' },
        { status: 400 }
      );
    }

    // Basic cleanup
    parsedText = parsedText.trim();

    if (!parsedText) {
      return NextResponse.json(
        { error: 'File appears to be empty' },
        { status: 400 }
      );
    }

    return NextResponse.json({ text: parsedText });

  } catch (error) {
    console.error('Parse Error:', error);
    return NextResponse.json(
      { error: 'Failed to parse file' },
      { status: 500 }
    );
  }
}

