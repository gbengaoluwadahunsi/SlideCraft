import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  width: number;
  height: number;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured' },
        { status: 500 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    const MAX_FILE_MB = 100;

    if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const sizeMb = buffer.length / 1024 / 1024;

        if (sizeMb > MAX_FILE_MB) {
            return NextResponse.json(
              { error: `File too large (${sizeMb.toFixed(1)} MB). Max: ${MAX_FILE_MB} MB.` },
              { status: 413 }
            );
        }
        
        const resourceType = file.type.startsWith('video/') ? 'video' : 'image';

        console.log(`Uploading ${resourceType} to Cloudinary (${sizeMb.toFixed(2)} MB)...`);

        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            const options = {
              resource_type: resourceType as 'video' | 'image' | 'raw' | 'auto',
              folder: 'carousel-generator',
              chunk_size: 6_000_000,
              timeout: 120000,
              ...(resourceType === 'video' && {
                eager: [{ format: 'jpg', transformation: [{ quality: 'auto' }] }],
                eager_async: true,
              }),
            };

            const callback = (error: unknown, result: unknown) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    const errMsg = error instanceof Error ? error.message : 'Upload failed';
                    reject(new Error(errMsg));
                } else if (result) {
                    const res = result as CloudinaryUploadResult;
                    console.log('Cloudinary upload success:', res.secure_url);
                    resolve(res);
                } else {
                    reject(new Error('Upload failed - no result'));
                }
            };

            const uploadStream = cloudinary.uploader.upload_stream(options, callback as never);

            uploadStream.on('error', (err: Error) => {
                console.error('Upload stream error:', err);
                reject(err);
            });
            
            uploadStream.end(buffer);
        });

        return NextResponse.json({
            secure_url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
            format: result.format,
            width: result.width,
            height: result.height,
        });
    }
    
    return NextResponse.json({ error: 'Please send file as multipart/form-data' }, { status: 400 });

  } catch (error) {
    console.error('Upload API error:', error);
    
    const message = error instanceof Error 
      ? error.message 
      : 'Unknown error';
    
    return NextResponse.json({ 
      error: `Upload failed: ${message}`,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}
