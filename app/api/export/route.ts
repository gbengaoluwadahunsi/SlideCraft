/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserPlanLimits, trackUsage } from '@/lib/subscription';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getPool } from '@/lib/db';
// Dynamic imports for React rendering to avoid build-time restrictions in Route Handlers

// Generate a short URL for video links
async function generateShortUrl(originalUrl: string): Promise<string> {
  try {
    const db = getPool();
    
    // Check if URL already has a short link
    const existing = await db.query(
      'SELECT id FROM short_urls WHERE original_url = $1',
      [originalUrl]
    );
    
    if (existing.rows.length > 0) {
      const shortId = existing.rows[0].id;
      const baseUrl = process.env.NEXTAUTH_URL || 'https://carouslk.com';
      return `${baseUrl}/v/${shortId}`;
    }
    
    // Generate new short ID
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
    let shortId = '';
    for (let i = 0; i < 6; i++) {
      shortId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Insert with collision handling
    let attempts = 0;
    while (attempts < 5) {
      try {
        await db.query(
          'INSERT INTO short_urls (id, original_url) VALUES ($1, $2)',
          [shortId, originalUrl]
        );
        break;
      } catch (err: any) {
        if (err.code === '23505') {
          shortId = '';
          for (let i = 0; i < 6; i++) {
            shortId += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          attempts++;
        } else {
          throw err;
        }
      }
    }
    
    const baseUrl = process.env.NEXTAUTH_URL || 'https://carouslk.com';
    return `${baseUrl}/v/${shortId}`;
  } catch (error) {
    console.error('Failed to generate short URL:', error);
    return originalUrl; // Fallback to original URL
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Increase max duration to 60 seconds

// Note: Next.js App Router does not support `export const config` for body parser size limit in the same way.
// The limit is handled globally in next.config.mjs or via custom body parsing.
// Since we are reading the body manually via request.formData() / request.json(), 
// the standard bodyParser config might be bypassed or handled differently.
// However, typically the issue is the global limit. We've updated next.config.mjs.

function resolveVideoEmbedUrl(url?: string) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get('v')}`;
    }
    if (parsed.pathname.includes('/shorts/')) {
      const videoId = parsed.pathname.split('/shorts/')[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (parsed.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed${parsed.pathname}`;
    }
    return url;
  } catch {
    return url;
  }
}

// Check if URL is a YouTube/embeddable video vs a direct video file
function isEmbeddableVideo(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('youtube.com') || 
           parsed.hostname.includes('youtu.be') ||
           parsed.hostname.includes('vimeo.com');
  } catch {
    return false;
  }
}

// Get video thumbnail URL for Cloudinary videos
function getVideoThumbnailUrl(videoUrl?: string, posterUrl?: string): string {
  if (posterUrl) return posterUrl;
  if (!videoUrl) return '';
  // Cloudinary: replace video extension with .jpg for auto-generated thumbnail
  if (videoUrl.includes('cloudinary.com')) {
    return videoUrl.replace(/\.[^/.]+$/, '.jpg');
  }
  return '';
}

async function launchBrowser() {
  // Vercel Serverless requires a special Chromium build
  if (process.env.VERCEL === '1') {
    const { default: chromium } = await import('@sparticuz/chromium');
    const { default: puppeteerCore } = await import('puppeteer-core');
    const executablePath = await chromium.executablePath();

    return puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: (chromium as any).defaultViewport ?? { width: 1080, height: 1080 },
      executablePath: executablePath || undefined,
      headless: (chromium as any).headless ?? true,
    });
  }

  // Local dev can use the full Puppeteer package + bundled Chrome
  const puppeteer = (await import('puppeteer')).default;
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-local-file-access' // SECURITY: Prevent local file read
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check export limit
    const limits = await getUserPlanLimits(session.user.id);
    const usage = await trackUsage(session.user.id, 'export', 0);
    
    if (!usage.canUse) {
      return NextResponse.json(
        { 
          error: 'Export limit reached',
          message: `You've reached your limit of ${limits.maxExports} exports. Upgrade to Pro for unlimited exports.`,
          limit: limits.maxExports,
          current: usage.current
        },
        { status: 403 }
      );
    }

    // Track export usage
    await trackUsage(session.user.id, 'export', 1);

    let slides: any[] = [];
    let options: any = {};
    let format = 'pdf';
    let mode = 'puppeteer'; // Default
    const imageAttachments: Record<string, Buffer> = {};
    const videoAttachments: Record<string, Buffer> = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const dataStr = formData.get('data') as string;
        
        if (!dataStr) throw new Error('Missing data field in FormData');
        const parsedData = JSON.parse(dataStr);
        
        slides = parsedData.slides;
        options = parsedData.options;
        format = parsedData.format;
        mode = parsedData.mode || 'puppeteer';
        
        // Debug: Log slide data for video URL troubleshooting
        console.log('=== EXPORT DEBUG ===');
        slides.forEach((s: any, i: number) => {
            console.log(`Slide ${i}: type=${s.type}, mediaType=${s.mediaType}, mediaUrl=${s.mediaUrl?.substring(0, 80) || 'none'}`);
        });
        console.log('===================');

        // Extract attached video and image files
        for (const [key, val] of formData.entries()) {
            if (val instanceof File) {
                const arrayBuffer = await val.arrayBuffer();
                if (key.startsWith('video_')) {
                    videoAttachments[key] = Buffer.from(arrayBuffer);
                } else if (key.startsWith('slide_image_')) {
                    imageAttachments[key] = Buffer.from(arrayBuffer);
                }
            }
        }
    } else {
        const json = await request.json();
        slides = json.slides;
        options = json.options;
        format = json.format || 'pdf';
    }

    const { 
      category, 
      handle, 
      backgroundColor, 
      textColor, 
      accentColor,
      fontFamily = 'var(--font-inter)',
      fontScale = 1,
      coverBackgroundColor,
      coverTextColor,
      coverAccentColor,
      backgroundImage,
      backgroundOverlayOpacity
    } = options;

    // Extract actual font name from CSS variable if needed
    // Map CSS variables to their Google Font names
    const fontVariableMap: Record<string, string> = {
      'var(--font-inter)': 'Inter',
      'var(--font-playfair)': 'Playfair Display',
      'var(--font-oswald)': 'Oswald',
      'var(--font-roboto-mono)': 'Roboto Mono',
      'var(--font-permanent-marker)': 'Permanent Marker',
      'var(--font-bebas-neue)': 'Bebas Neue',
      'var(--font-space-grotesk)': 'Space Grotesk',
      'var(--font-geist-sans)': 'Inter', // Geist not on Google Fonts — fallback to Inter
      'var(--font-geist-mono)': 'Roboto Mono', // Geist Mono fallback
    };
    
    const selectedFontFamily = fontVariableMap[fontFamily] 
      || (fontFamily.startsWith('var(--font-') 
        ? fontFamily.replace('var(--font-', '').replace(')', '').split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : fontFamily.replace(/['"]/g, '')); // Remove quotes if present

    const generateFilename = (title: string): string => {
      return (title || 'carouslk-deck')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .substring(0, 50);
    };

    const firstSlideTitle = slides[0]?.title || 'carouslk-deck';
    const filenameExtension = format === 'ppt' ? 'pptx' : 'pdf';
    const downloadFilename = `${generateFilename(firstSlideTitle)}.${filenameExtension}`;

    let buffer: Buffer;

    // --- CLIENT-SIDE IMAGE MODE ---
    // If frontend sent pre-rendered images (for 100% fidelity), just stitch them together
    if (mode === 'client-side-images') {
        if (format === 'pdf') {
            // PDF: Simply merge captured images into a PDF - guaranteed perfect rendering!
            const pdfDoc = await PDFDocument.create();
            
            for (let index = 0; index < slides.length; index++) {
                const slide = slides[index];
                const imageKey = slide._attachedImageKey;
                const imageBuffer = imageAttachments[imageKey];
                
                if (!imageBuffer) {
                    console.warn(`Missing image buffer for slide ${index}, skipping...`);
                    continue;
                }
                
                try {
                    // Detect image type
                    const isPng = imageBuffer[0] === 0x89;
                    
                    let image;
                    if (isPng) {
                        image = await pdfDoc.embedPng(imageBuffer);
                    } else {
                        image = await pdfDoc.embedJpg(imageBuffer);
                    }
                    
                    // Get image dimensions
                    const imgWidth = image.width;
                    const imgHeight = image.height;
                    
                    // Create page with exact image dimensions - no clipping!
                    const page = pdfDoc.addPage([imgWidth, imgHeight]);
                    
                    // Draw image at full size (1:1 mapping)
                    page.drawImage(image, {
                        x: 0,
                        y: 0,
                        width: imgWidth,
                        height: imgHeight,
                    });
                    
                    console.log(`Added slide ${index + 1} to PDF: ${imgWidth}x${imgHeight}`);
                } catch (error) {
                    console.error(`Failed to add slide ${index} to PDF:`, error);
                }
            }
            
            buffer = Buffer.from(await pdfDoc.save());
        } else if (format === 'ppt') {
            const pptxgen = (await import('pptxgenjs')).default;
            const pptx = new pptxgen();
            const layoutName = 'SQUARE';
            
            // Define layout if not exists
            try {
                pptx.defineLayout({ name: layoutName, width: 11.25, height: 11.25 });
            } catch (e) {}
            pptx.layout = layoutName;

            for (let index = 0; index < slides.length; index++) {
                const slide = slides[index];
                const slidePage = pptx.addSlide();
                const imageKey = slide._attachedImageKey;

                // 1. Add Background Image (the captured slide)
                if (imageAttachments[imageKey]) {
                    try {
                        const b64 = imageAttachments[imageKey].toString('base64');
                        // Detect MIME type based on buffer signature or default to JPEG
                        // JPEG signature: FF D8 FF
                        // PNG signature: 89 50 4E 47
                        const isPng = imageAttachments[imageKey][0] === 0x89;
                        const mime = isPng ? 'image/png' : 'image/jpeg';
                        
                        slidePage.addImage({
                            data: `data:${mime};base64,${b64}`,
                            x: 0, y: 0, w: 11.25, h: 11.25
                        });
                    } catch (imgError) {
                        console.error(`Failed to add image for slide ${index} in PPT:`, imgError);
                        // Continue without the image - slide will be blank but won't break export
                    }
                } else {
                    console.warn(`No image attachment found for slide ${index}`);
                }

                // 2. Overlay Video if exists
                console.log(`PPT Slide ${index}: _hasAttachedVideo=${(slide as any)._hasAttachedVideo}, mediaType=${slide.mediaType}, mediaUrl=${slide.mediaUrl?.substring(0, 50)}`);
                try {
                    if ((slide as any)._hasAttachedVideo) {
                         const videoKey = `video_${index}`;
                         if (videoAttachments[videoKey]) {
                             const videoB64 = videoAttachments[videoKey].toString('base64');
                             const ratio = slide.mediaAspectRatio || (16/9);
                             const vW = 10; 
                             const vH = vW / ratio;
                             const vX = (11.25 - vW) / 2;
                             const vY = (11.25 - vH) / 2;

                             slidePage.addMedia({ 
                                 type: 'video',
                                 data: `data:video/mp4;base64,${videoB64}`,
                                 x: vX, y: vY, w: vW, h: vH,
                             });
                             
                             // Add clickable URL text below the video (if permanent URL exists)
                             if (slide.mediaUrl && !slide.mediaUrl.startsWith('blob:')) {
                                 console.log(`PPT: Generating short URL for attached video slide ${index}`);
                                 const shortUrl = await generateShortUrl(slide.mediaUrl);
                                 console.log(`PPT: Generated short URL: ${shortUrl}`);
                                 const urlY = vY + vH + 0.2;
                                 slidePage.addText([{
                                     text: 'Watch Video: ',
                                     options: { fontSize: 11, bold: true }
                                 }, {
                                     text: shortUrl,
                                     options: {
                                         fontSize: 11,
                                         color: '60A5FA',
                                         underline: { style: 'sng' },
                                         hyperlink: { url: shortUrl }
                                     }
                                 }], {
                                     x: vX,
                                     y: urlY,
                                     w: vW,
                                     h: 0.4,
                                     align: 'center',
                                     valign: 'top'
                                 });
                             }
                         }
                    } 
                    // Handle YouTube/Online video overlay (Cloudinary URLs go here)
                    else if (slide.mediaType === 'video' && slide.mediaUrl && !slide.mediaUrl.startsWith('blob:')) {
                        console.log(`PPT: Online video detected for slide ${index}, URL: ${slide.mediaUrl.substring(0, 60)}`);
                         const ratio = slide.mediaAspectRatio || (16/9);
                         const vW = 10; 
                         const vH = vW / ratio;
                         const vX = (11.25 - vW) / 2;
                         const vY = (11.25 - vH) / 2;
                         
                         slidePage.addMedia({
                             type: 'online',
                             link: slide.mediaUrl,
                             x: vX, y: vY, w: vW, h: vH
                         });
                         
                         // Generate short URL for cleaner display
                         console.log(`PPT: Generating short URL for online video...`);
                         const shortUrl = await generateShortUrl(slide.mediaUrl);
                         console.log(`PPT: Generated short URL: ${shortUrl}`);
                         
                         // Add clickable URL text below the video
                         const urlY = vY + vH + 0.2;
                         slidePage.addText([{
                             text: 'Watch Video: ',
                             options: { fontSize: 11, bold: true }
                         }, {
                             text: shortUrl,
                             options: {
                                 fontSize: 11,
                                 color: '60A5FA',
                                 underline: { style: 'sng' },
                                 hyperlink: { url: shortUrl }
                             }
                         }], {
                             x: vX,
                             y: urlY,
                             w: vW,
                             h: 0.4,
                             align: 'center',
                             valign: 'top'
                         });
                    }
                } catch (videoError) {
                    console.error(`Failed to add video for slide ${index} in PPT:`, videoError);
                    // Continue without video - the slide background image will still be there
                }
            }
            buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
        } else {
            // PDF Mode for Client Images - Use pdf-lib for MUCH faster generation
            // No need for Puppeteer just to stitch images!
            const pdfDoc = await PDFDocument.create();
            
            // Page size: 1080x1080 pixels at 72 DPI = 1080 points (PDF uses points, 1 point = 1/72 inch)
            // But for better quality, we'll use the actual pixel size
            const pageWidth = 1080;
            const pageHeight = 1080;
            
            // Embed font for URL text
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            
            for (let index = 0; index < slides.length; index++) {
                const slide = slides[index];
                const imageKey = slide._attachedImageKey;
                const imageBuffer = imageAttachments[imageKey];
                
                if (!imageBuffer) {
                    console.warn(`Missing image buffer for slide ${index}, skipping...`);
                    continue;
                }
                
                let page;
                try {
                    // Detect image type and embed accordingly
                    const isPng = imageBuffer[0] === 0x89;
                    
                    let image;
                    if (isPng) {
                        image = await pdfDoc.embedPng(imageBuffer);
                    } else {
                        image = await pdfDoc.embedJpg(imageBuffer);
                    }
                    
                    // Get actual image dimensions
                    const imageWidth = image.width;
                    const imageHeight = image.height;
                    
                    // Scale image to fit 1080x1080 page while preserving aspect ratio
                    // If image is taller than 1080px, scale it down to fit; otherwise use as-is
                    let drawWidth = pageWidth;
                    let drawHeight = pageHeight;
                    
                    // Calculate scale to fit content within page
                    const scaleX = pageWidth / imageWidth;
                    const scaleY = pageHeight / imageHeight;
                    const scale = Math.min(scaleX, scaleY, 1); // Never upscale, but downscale if needed
                    
                    drawWidth = imageWidth * scale;
                    drawHeight = imageHeight * scale;
                    
                    // Center the image on the page if it doesn't fill the page
                    const xOffset = (pageWidth - drawWidth) / 2;
                    const yOffset = (pageHeight - drawHeight) / 2;
                    
                    // Create page with height matching the image (to avoid clipping)
                    const actualPageHeight = Math.max(pageHeight, drawHeight);
                    page = pdfDoc.addPage([pageWidth, actualPageHeight]);
                    
                    page.drawImage(image, {
                        x: xOffset,
                        y: yOffset,
                        width: drawWidth,
                        height: drawHeight,
                    });
                } catch (imageError) {
                    console.error(`Failed to embed image for slide ${index}:`, imageError);
                    // Add a blank page as placeholder
                    page = pdfDoc.addPage([pageWidth, pageHeight]);
                }
                
                // Add visible video URL link at bottom of slide
                console.log(`Slide ${index} - mediaType: ${slide.mediaType}, mediaUrl: ${slide.mediaUrl?.substring(0, 50)}...`);
                if (slide.mediaType === 'video' && slide.mediaUrl && !slide.mediaUrl.startsWith('blob:') && page) {
                    console.log(`Adding video URL to PDF for slide ${index}: ${slide.mediaUrl}`);
                    try {
                        // Generate short URL for cleaner display
                        const shortUrl = await generateShortUrl(slide.mediaUrl);
                        console.log(`Generated short URL: ${shortUrl}`);
                        
                        const fontSize = 16;
                        const padding = 20;
                        const linkHeight = 55;
                        
                        // Draw a dark background bar at the bottom for the URL
                        page.drawRectangle({
                            x: 0,
                            y: 0,
                            width: pageWidth,
                            height: linkHeight,
                            color: rgb(0.08, 0.08, 0.12),
                        });
                        
                        // Draw play icon hint and URL text
                        const urlText = `Watch Video: ${shortUrl}`;
                        
                        page.drawText(urlText, {
                            x: padding,
                            y: linkHeight / 2 - fontSize / 2 + 2,
                            size: fontSize,
                            font: font,
                            color: rgb(0.376, 0.647, 0.98), // #60A5FA blue
                        });
                        
                        console.log(`Successfully added short video URL to slide ${index}: ${shortUrl}`);
                    } catch (urlError) {
                        console.error(`Failed to add video URL to slide ${index}:`, urlError);
                    }
                }
            }
            
            buffer = Buffer.from(await pdfDoc.save());
        }
    } else {
        // --- FALLBACK: PUPPETEER SERVER-SIDE RENDERING MODE (for non-client-side-images requests) ---
        // This is legacy - client-side-images mode is now preferred for PDF
        const browser = await launchBrowser();

    const page = await browser.newPage();
    
    // Set a larger viewport to prevent clipping of overflow content (like bullet points)
    await page.setViewport({
      width: 1200,
      height: 1200,
      deviceScaleFactor: 1,
    });

    // SECURITY: Request Interception to block SSRF and local access
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url().toLowerCase();
      const resourceType = req.resourceType();

      // Allow data URIs (images/fonts)
      if (url.startsWith('data:')) {
        req.continue();
        return;
      }

      // Allow Google Fonts & Tailwind CDN
      if (
        url.startsWith('https://fonts.googleapis.com') ||
        url.startsWith('https://fonts.gstatic.com') ||
        url.startsWith('https://cdn.tailwindcss.com')
      ) {
        req.continue();
        return;
      }

      // Allow image resources if they are from safe domains (optional, strict mode for now)
      // For now, we block external images unless embedded as data URI, 
      // BUT users might paste image URLs. 
      // To be safe against SSRF, we should block metadata IPs.
      if (resourceType === 'image') {
         // Basic SSRF protection list (simplified)
         if (url.includes('169.254.169.254') || url.includes('metadata.google.internal') || url.includes('localhost') || url.includes('127.0.0.1')) {
             req.abort();
             return;
         }
         req.continue();
         return;
      }

      // Block everything else
      req.abort();
    });

    // Dynamic imports to bypass Next.js build restrictions on react-dom/server in Route Handlers
    const [{ renderToString }, { Slide }] = await Promise.all([
      import('react-dom/server'),
      import('@/components/Slide')
    ]);

    // HTML Template generation
    const slidesHtml = (await Promise.all(slides.map(async (slideData: any, index: number) => {
      // Merge slide data with global options
      const mergedProps = {
        ...options,
        ...slideData,
        slideNumber: index + 1,
        totalSlides: slides.length,
        _isDownloading: true, // Marker for components to use static fallbacks (charts/video)
      };

      try {
        return renderToString(React.createElement(Slide as any, mergedProps));
      } catch (error) {
        console.error(`Failed to render slide ${index} with React:`, error);
        return `<div style="width:1080px;height:1080px;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;">Error rendering slide ${index}</div>`;
      }
    }))).join('');

    // Construct Google Fonts URL
    // Always load Bebas Neue + Roboto Mono since they're used inside HTML pattern templates
    const fontsToLoad = ['Permanent Marker', 'Roboto Mono', 'Bebas Neue', selectedFontFamily]
      .filter(font => font && !font.startsWith('var(') && font.trim().length > 0);
    const fontQuery = [...new Set(fontsToLoad)]
      .map(font => `family=${font.replace(/\s+/g, '+')}:wght@300;400;500;700`)
      .join('&');

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?${fontQuery}&display=swap" rel="stylesheet">
          <style>
            /* Global resets and PDF-specific adjustments */
            *, *::before, *::after { box-sizing: border-box; }
            body { margin: 0; padding: 0; overflow: visible; font-family: system-ui, sans-serif; }
            @page { 
              size: 1080px 1080px; 
              margin: 0; 
            }
            html { overflow: visible; }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            /* Ensure text renders nicely */
            h1, h2, h3, p, div { -webkit-font-smoothing: antialiased; }
          </style>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    slide: {
                      bg: 'var(--slide-bg)',
                      text: 'var(--slide-text)',
                      accent: 'var(--slide-accent)',
                    }
                  }
                }
              }
            }
          </script>
        </head>
        <body style="margin:0; padding:0;">
          ${slidesHtml}
        </body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 60000 });

    if (format === 'ppt') {
      const pptxgen = (await import('pptxgenjs')).default;
      const pptx = new pptxgen();
      
      // Configure a square layout (11.25in ~= 1080px @ 96dpi)
      const layoutName = 'SQUARE';
      let canUseSquareLayout = true;
      const squareLayout = { name: layoutName, width: 11.25, height: 11.25 };
      try {
        pptx.defineLayout(squareLayout);
      } catch (layoutError) {
        // defineLayout throws if the layout already exists; ignore that case
        const message = layoutError instanceof Error ? layoutError.message : '';
        if (!message.toLowerCase().includes('already exists')) {
          console.warn('pptx layout definition failed, falling back to default layout', layoutError);
          canUseSquareLayout = false;
        }
      }
      pptx.layout = canUseSquareLayout ? layoutName : 'LAYOUT_4x3';

      // Get all slide containers
      const slideElements = await page.$$('.slide-container');
      
      // Optimize: Take screenshots in parallel instead of sequentially
      const screenshotPromises = slideElements.map(slideElement => 
        slideElement.screenshot({ 
          encoding: 'base64',
          type: 'png'
        })
      );

      const screenshots = await Promise.all(screenshotPromises);
      
      // Add images to slides
      screenshots.forEach((imageBuffer, index) => {
        const slide = pptx.addSlide();
        
        // Add the base slide image (captured from Puppeteer)
        slide.addImage({ 
            data: `data:image/png;base64,${imageBuffer}`, 
            x: 0, 
            y: 0, 
            w: 11.25, 
            h: 11.25 
        });

        // If this slide had an attached video, embed it now on top
        // The dashboard sends a marker `_videoAttachmentIndex` which aligns with `video_${index}`
        // Check if the slide data at this index had a video attachment marker
        const slideData = slides[index];
        if (slideData) {
             try {
                 // Handle uploaded video attachment
                 if ((slideData as any)._hasAttachedVideo) {
                     const videoKey = `video_${index}`;
                     if (videoAttachments[videoKey]) {
                         const videoB64 = videoAttachments[videoKey].toString('base64');
                         const ratio = slideData.mediaAspectRatio || (16/9);
                         const vW = 10; 
                         const vH = vW / ratio;
                         const vX = (11.25 - vW) / 2;
                         const vY = (11.25 - vH) / 2;

                        slide.addMedia({ 
                            type: 'video',
                            data: `data:video/mp4;base64,${videoB64}`,
                            x: vX, y: vY, w: vW, h: vH,
                        });
                        
                        // Add clickable URL text below the video (if URL exists)
                        if (slideData.mediaUrl && !slideData.mediaUrl.startsWith('blob:')) {
                            const urlY = vY + vH + 0.2;
                            slide.addText([{
                                text: '🔗 ',
                                options: { fontSize: 10 }
                            }, {
                                text: slideData.mediaUrl,
                                options: {
                                    fontSize: 10,
                                    color: '60A5FA',
                                    underline: { style: 'sng' },
                                    hyperlink: { url: slideData.mediaUrl }
                                }
                            }], {
                                x: vX,
                                y: urlY,
                                w: vW,
                                h: 0.4,
                                align: 'center',
                                valign: 'top'
                            });
                        }
                    }
                } 
                // Handle YouTube/Online video
                else if (slideData.mediaType === 'video' && slideData.mediaUrl) {
                    const ratio = slideData.mediaAspectRatio || (16/9);
                    const vW = 10; 
                    const vH = vW / ratio;
                    const vX = (11.25 - vW) / 2;
                    const vY = (11.25 - vH) / 2;
                    
                    // pptxgenjs supports 'online' type for YouTube
                    slide.addMedia({
                        type: 'online',
                        link: slideData.mediaUrl,
                        x: vX, y: vY, w: vW, h: vH
                    });
                    
                    // Add clickable URL text below the video
                    const urlY = vY + vH + 0.2;
                    slide.addText([{
                        text: '🔗 ',
                        options: { fontSize: 10 }
                    }, {
                        text: slideData.mediaUrl,
                        options: {
                            fontSize: 10,
                            color: '60A5FA',
                            underline: { style: 'sng' },
                            hyperlink: { url: slideData.mediaUrl }
                        }
                    }], {
                        x: vX,
                        y: urlY,
                        w: vW,
                        h: 0.4,
                        align: 'center',
                        valign: 'top'
                    });
                }
             } catch (videoError) {
                 console.error(`Failed to add video for slide ${index} in Puppeteer PPT mode:`, videoError);
                 // Continue without video
             }
        }
      });

      buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;

    } else {
      // Default to PDF
      // Use preferCSSPageSize to respect @page CSS, but ensure content fits
      // Add small margins to prevent text clipping
      const pdfData = await page.pdf({
        width: '1080px',
        height: '1080px',
        printBackground: true,
        preferCSSPageSize: false,
        margin: {
          top: '0',
          right: '0',
          bottom: '10px',
          left: '0',
        },
      });
      buffer = Buffer.from(pdfData);
    }

        await browser.close();
    } // End Puppeteer mode

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': format === 'ppt' 
            ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
            : 'application/pdf',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
      },
    });

  } catch (error) {
    console.error('Export Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to generate export: ${errorMessage}` }, { status: 500 });
  }
}
