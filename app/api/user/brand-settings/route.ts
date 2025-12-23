import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getPool, initDB } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Helper to extract public_id from Cloudinary URL
function extractPublicId(url: string): string | null {
  try {
    // Cloudinary URLs format: 
    // https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{folder}/{public_id}.{format}
    // or: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{folder}/{public_id}.{format}
    // The public_id includes the folder path
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match) {
      // Remove the file extension if present
      let publicId = match[1];
      // Remove trailing format extension (e.g., .jpg, .png)
      publicId = publicId.replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, '');
      return publicId;
    }
    return null;
  } catch {
    return null;
  }
}

// Helper to delete logo from Cloudinary
async function deleteLogoFromCloudinary(logoUrl: string | null): Promise<void> {
  if (!logoUrl) return;
  
  try {
    const publicId = extractPublicId(logoUrl);
    if (publicId && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted logo from Cloudinary: ${publicId}`);
    }
  } catch (error) {
    console.error('Error deleting logo from Cloudinary:', error);
    // Don't throw - logo deletion failure shouldn't block settings update
  }
}

// Default brand settings
const DEFAULT_BRAND_SETTINGS = {
  handle: '@carouslk',
  category: '',
  fontFamily: 'var(--font-inter)',
  backgroundColor: '#0B0F19',
  textColor: '#ffffff',
  accentColor: '#ffd700',
  logoUrl: null as string | null
};

// GET - Retrieve user's brand settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDB();
    const db = getPool();
    const result = await db.query(
      'SELECT brand_settings FROM user_settings WHERE user_id = $1',
      [session.user.id]
    );

    if (result.rows.length === 0) {
      // Return defaults if no settings exist
      return NextResponse.json({ settings: DEFAULT_BRAND_SETTINGS });
    }

    const settings = result.rows[0].brand_settings || {};
    // Merge with defaults to ensure all fields exist
    const mergedSettings = { ...DEFAULT_BRAND_SETTINGS, ...settings };

    return NextResponse.json({ settings: mergedSettings });
  } catch (error) {
    console.error('Error fetching brand settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand settings' },
      { status: 500 }
    );
  }
}

// POST - Save user's brand settings
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings, deleteLogo } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    // Check user's plan limits
    const { getUserPlanLimits } = await import('@/lib/subscription');
    const limits = await getUserPlanLimits(session.user.id);
    
    // All users can customize colors/fonts/handle
    // But only paid users can upload logos
    const isUploadingLogo = settings.logoUrl && settings.logoUrl !== null;
    
    if (isUploadingLogo && !limits.canUploadLogo) {
      return NextResponse.json(
        { 
          error: 'Logo upload not available',
          message: 'Logo upload is available on Starter, Pro, and Enterprise plans. Upgrade to add your brand logo!',
          upgradeRequired: true,
          feature: 'logo'
        },
        { status: 403 }
      );
    }

    await initDB();
    const db = getPool();
    
    // Get existing settings to check for logo deletion
    const existingResult = await db.query(
      'SELECT brand_settings FROM user_settings WHERE user_id = $1',
      [session.user.id]
    );
    
    const existingSettings = existingResult.rows.length > 0 
      ? (existingResult.rows[0].brand_settings || {})
      : {};
    
    // If logo is being deleted, remove it from Cloudinary
    if (deleteLogo && existingSettings.logoUrl) {
      await deleteLogoFromCloudinary(existingSettings.logoUrl);
      settings.logoUrl = null;
    }
    
    // For free users, don't allow saving logo (strip it out)
    if (!limits.canUploadLogo) {
      settings.logoUrl = null;
    }
    
    // Merge with defaults to ensure all fields exist
    const mergedSettings = { ...DEFAULT_BRAND_SETTINGS, ...settings };

    // Upsert user settings
    await db.query(
      `INSERT INTO user_settings (user_id, brand_settings, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET brand_settings = $2, updated_at = NOW()`,
      [session.user.id, JSON.stringify(mergedSettings)]
    );

    return NextResponse.json({ 
      success: true, 
      settings: mergedSettings 
    });
  } catch (error) {
    console.error('Error saving brand settings:', error);
    return NextResponse.json(
      { error: 'Failed to save brand settings' },
      { status: 500 }
    );
  }
}

// DELETE - Reset brand settings to defaults
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDB();
    const db = getPool();
    
    // Get existing settings to delete logo from Cloudinary
    const existingResult = await db.query(
      'SELECT brand_settings FROM user_settings WHERE user_id = $1',
      [session.user.id]
    );
    
    if (existingResult.rows.length > 0) {
      const existingSettings = existingResult.rows[0].brand_settings || {};
      if (existingSettings.logoUrl) {
        await deleteLogoFromCloudinary(existingSettings.logoUrl);
      }
    }
    
    // Delete user settings (will use defaults on next GET)
    await db.query(
      'DELETE FROM user_settings WHERE user_id = $1',
      [session.user.id]
    );

    return NextResponse.json({ 
      success: true, 
      settings: DEFAULT_BRAND_SETTINGS 
    });
  } catch (error) {
    console.error('Error resetting brand settings:', error);
    return NextResponse.json(
      { error: 'Failed to reset brand settings' },
      { status: 500 }
    );
  }
}

