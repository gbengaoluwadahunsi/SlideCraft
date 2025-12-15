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

export async function POST(request: NextRequest) {
  try {
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

            const uploadStream =
              resource_type_is_video(options.resource_type)
                ? cloudinary.uploader.upload_large_stream(options, callback)
                : cloudinary.uploader.upload_stream(options, callback);

            uploadStream.on('error', reject);
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
    console.error('Upload failed:', error);
    // Cloudinary errors often come as plain objects, not Error instances
    const message =
      (error as any)?.message ||
      (error as any)?.error?.message ||
      (error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}

function resource_type_is_video(rt: string | undefined) {
  return rt === 'video';
}
