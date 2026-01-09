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
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Check if remove.bg API key is configured
    const removeBgApiKey = process.env.REMOVEBG_API_KEY;

    if (removeBgApiKey) {
      // Use remove.bg API
      try {
        // Fetch the image first
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error('Failed to fetch image');
        }
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // Call remove.bg API using form-data package
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('image_file', imageBuffer, {
          filename: 'image.png',
          contentType: 'image/png',
        });
        formData.append('size', 'auto');

        const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: {
            'X-Api-Key': removeBgApiKey,
            ...formData.getHeaders(),
          },
          body: formData as any,
        });

        if (!removeBgResponse.ok) {
          const errorText = await removeBgResponse.text();
          console.error('Remove.bg API error:', errorText);
          throw new Error(`Remove.bg API error: ${removeBgResponse.status}`);
        }

        const resultBuffer = Buffer.from(await removeBgResponse.arrayBuffer());

        // Upload to Cloudinary
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'carousel-generator',
              format: 'png',
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          uploadStream.end(resultBuffer);
        });

        return NextResponse.json({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (error) {
        console.error('Remove.bg processing error:', error);
        // Fall through to Cloudinary background removal
      }
    }

    // Fallback: Use Cloudinary's background removal (requires AI add-on)
    // This will work if Cloudinary AI background removal is enabled
    try {
      // Upload image to Cloudinary first if it's not already there
      let publicId: string;
      
      if (imageUrl.includes('cloudinary.com')) {
        // Extract public_id from Cloudinary URL
        const match = imageUrl.match(/\/v\d+\/(.+)\.(jpg|png|jpeg|webp)/i);
        if (match) {
          publicId = match[1];
        } else {
          throw new Error('Could not extract public_id from Cloudinary URL');
        }
      } else {
        // Upload the image first
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error('Failed to fetch image');
        }
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        const uploadResult = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'carousel-generator',
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          uploadStream.end(imageBuffer);
        });

        publicId = uploadResult.public_id;
      }

      // Apply background removal transformation
      // Note: This requires Cloudinary AI add-on for background removal
      const transformedUrl = cloudinary.url(publicId, {
        effect: 'background_removal',
        format: 'png',
      });

      // Generate the transformed image
      const transformedResponse = await fetch(transformedUrl);
      if (!transformedResponse.ok) {
        throw new Error('Background removal transformation failed');
      }

      // Re-upload the transformed image
      const transformedBuffer = Buffer.from(await transformedResponse.arrayBuffer());
      const finalResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'carousel-generator',
            format: 'png',
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(transformedBuffer);
      });

      return NextResponse.json({
        secure_url: finalResult.secure_url,
        public_id: finalResult.public_id,
      });
    } catch (error) {
      console.error('Cloudinary background removal error:', error);
      return NextResponse.json(
        { 
          error: 'Background removal failed. Please ensure REMOVEBG_API_KEY is set or Cloudinary AI add-on is enabled.',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Background removal API error:', error);
    return NextResponse.json(
      { 
        error: 'Background removal failed',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

