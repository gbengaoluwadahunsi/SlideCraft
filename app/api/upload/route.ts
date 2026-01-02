import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for large video uploads

export async function POST(request: NextRequest) {
  try {
    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.' },
        { status: 500 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    const MAX_FILE_MB = 100; // Reasonable default for most Cloudinary plans

    // Handle file upload (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const sizeMb = buffer.length / 1024 / 1024;

        if (sizeMb > MAX_FILE_MB) {
            return NextResponse.json(
              { error: `File too large (${sizeMb.toFixed(1)} MB). Please upload a file <= ${MAX_FILE_MB} MB.` },
              { status: 413 }
            );
        }
        
        // Determine resource type
        const resourceType = file.type.startsWith('video/') ? 'video' : 'image';

        console.log(`Uploading ${resourceType} to Cloudinary (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);

        // Upload to Cloudinary using the SDK (Server-to-Server, no CORS)
        const result = await new Promise<any>((resolve, reject) => {
            const options = {
              resource_type: resourceType as 'video' | 'image' | 'raw' | 'auto',
              folder: 'carousel-generator',
              // Chunk size helps with larger videos
              chunk_size: 6_000_000, // ~6MB
              // Timeout for upload (2 minutes for large files)
              timeout: 120000,
              // Use eager transformation for videos to generate thumbnails
              ...(resourceType === 'video' && {
                eager: [{ format: 'jpg', transformation: [{ quality: 'auto' }] }],
                eager_async: true,
              }),
            };

            const callback = (error: any, result: any) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else {
                    console.log('Cloudinary upload success:', result?.secure_url);
                    resolve(result);
                }
            };

            // IMPORTANT: Use upload_stream for all files
            // - upload_large_stream is not compatible with Turbopack bundling
            // - upload_stream handles large files automatically with chunking
            // - Works for both images and videos up to 100MB
            const uploadStream = cloudinary.uploader.upload_stream(options, callback);

            uploadStream.on('error', (err) => {
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
    
    // Cloudinary errors often come as plain objects, not Error instances
    const message =
      (error as any)?.message ||
      (error as any)?.error?.message ||
      (error instanceof Error ? error.message : 'Unknown error');
    
    // Log full error for debugging
    if (error && typeof error === 'object') {
      console.error('Full error details:', JSON.stringify(error, null, 2));
    }
    
    return NextResponse.json({ 
      error: `Upload failed: ${message}`,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
