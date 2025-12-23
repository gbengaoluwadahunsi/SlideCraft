/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getUserPlanLimits, trackUsage } from '@/lib/subscription';

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

async function launchBrowser() {
  // Vercel Serverless requires a special Chromium build
  if (process.env.VERCEL === '1') {
    const { default: chromium } = await import('@sparticuz/chromium');
    const { default: puppeteerCore } = await import('puppeteer-core');
    const executablePath = await chromium.executablePath();

    return puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath || undefined,
      headless: chromium.headless,
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
      'var(--font-geist-sans)': 'Geist',
      'var(--font-geist-mono)': 'Geist Mono',
    };
    
    const selectedFontFamily = fontVariableMap[fontFamily] 
      || (fontFamily.startsWith('var(--font-') 
        ? fontFamily.replace('var(--font-', '').replace(')', '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
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
        if (format === 'ppt') {
            const pptxgen = (await import('pptxgenjs')).default;
            const pptx = new pptxgen();
            const layoutName = 'SQUARE';
            
            // Define layout if not exists
            try {
                pptx.defineLayout({ name: layoutName, width: 11.25, height: 11.25 });
            } catch (e) {}
            pptx.layout = layoutName;

            slides.forEach((slide: any, index: number) => {
                const slidePage = pptx.addSlide();
                const imageKey = slide._attachedImageKey;

                // 1. Add Background Image (the captured slide)
                if (imageAttachments[imageKey]) {
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
                }

                // 2. Overlay Video if exists
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
                     }
                } 
                // Handle YouTube/Online video overlay
                else if (slide.mediaType === 'video' && slide.mediaUrl && !slide.mediaUrl.startsWith('blob:')) {
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
                }
            });
            buffer = await pptx.write('nodebuffer') as Buffer;
        } else {
            // PDF Mode for Client Images
            // Puppeteer is still useful here to stitch images into a PDF properly
            const browser = await launchBrowser();
            const page = await browser.newPage();
            
            const pagesHtml = slides.map((slide: any, index: number) => {
                 const imageKey = slide._attachedImageKey;
                 const b64 = imageAttachments[imageKey] ? imageAttachments[imageKey].toString('base64') : '';
                 
                 // Detect MIME
                 let mime = 'image/jpeg';
                 if (imageAttachments[imageKey] && imageAttachments[imageKey][0] === 0x89) {
                     mime = 'image/png';
                 }
                 
                 const imgSrc = b64 ? `data:${mime};base64,${b64}` : '';
                 
                 // If video link exists AND is remote, wrap in anchor to make it clickable.
                 // Local blob videos cannot be linked in PDF, so we just show the static image.
                 let overlayLink = '';
                 
                 // Check for remote video URL (Cloudinary or YouTube)
                 if (slide.mediaType === 'video' && slide.mediaUrl && !slide.mediaUrl.startsWith('blob:')) {
                      overlayLink = `
                        <a href="${slide.mediaUrl}" target="_blank" style="
                            position: absolute; 
                            top: 0; left: 0; width: 100%; height: 100%;
                            z-index: 1000;
                            display: block;
                            cursor: pointer;
                            background: transparent;
                        " title="Click to watch video">
                            <span style="display: none;">Watch Video</span>
                        </a>
                      `;
                 }

                 return `
                    <div class="page" style="width: 1080px; height: 1080px; page-break-after: always; position: relative; overflow: hidden; display: flex; justify-content: center; align-items: center; background: white;">
                        <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
                        ${overlayLink}
                    </div>
                 `;
            }).join('');

            await page.setContent(`
                <style>
                    body { margin: 0; padding: 0; }
                    @page { size: 1080px 1080px; margin: 0; }
                </style>
                ${pagesHtml}
            `);
            
            buffer = await page.pdf({
                width: '1080px',
                height: '1080px',
                printBackground: true,
            });
            await browser.close();
        }
    } else {
        // --- PUPPETEER SERVER-SIDE RENDERING MODE (Legacy/Fallback) ---
        // Existing logic...
        const browser = await launchBrowser();

    const page = await browser.newPage();

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

    // HTML Template generation
    const slidesHtml = slides.map((slide: any) => {
      const isCover = slide.type === 'cover';
      const isChart = slide.type === 'chart';
      
      // Determine active colors
      const activeBgColor = (isCover && coverBackgroundColor) ? coverBackgroundColor : (backgroundColor || '#0B0F19');
      const activeTextColor = (isCover && coverTextColor) ? coverTextColor : (textColor || '#ffffff');
      const activeAccentColor = (isCover && coverAccentColor) ? coverAccentColor : (accentColor || '#ffd700');
      
      // Use slide-specific background or fallback to global option
      const slideBgImage = slide.backgroundImage || backgroundImage;
      const slideOverlayOpacity = slide.backgroundOverlayOpacity || backgroundOverlayOpacity || 0.5;

      const backgroundImageStyle = slideBgImage 
        ? `background-image: url(${slideBgImage}); background-size: cover; background-position: center;` 
        : '';
        
      const overlayHtml = slideBgImage 
        ? `<div style="position: absolute; inset: 0; background-color: ${activeBgColor}; opacity: ${slideOverlayOpacity}; pointer-events: none;"></div>` 
        : '';
        
      const textShadowStyle = slideBgImage ? 'text-shadow: 0 2px 8px rgba(0,0,0,0.5);' : '';
      
      let chartHtml = '';
      if (isChart && slide.chartData) {
          const maxVal = Math.max(...slide.chartData.map((d: any) => d.value));
          
          if (slide.chartType === 'bar') {
              chartHtml = `
                <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 100%; width: 100%; padding-bottom: 2rem; box-sizing: border-box;">
                    ${slide.chartData.map((d: any) => `
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; height: 100%; justify-content: flex-end; width: ${100 / slide.chartData.length}%;">
                             <div style="font-size: 1.5rem; font-weight: bold; color: ${activeTextColor};">${d.value}</div>
                             <div style="width: 60%; background-color: ${activeAccentColor}; border-radius: 8px 8px 0 0; height: ${(d.value / maxVal) * 80}%;"></div>
                             <div style="font-size: 1.5rem; color: ${activeTextColor};">${d.name}</div>
                        </div>
                    `).join('')}
                </div>
              `;
          } else if (slide.chartType === 'line') {
               const width = 800;
               const height = 400;
               const points = slide.chartData.map((d: any, i: number) => {
                   const x = (i / (slide.chartData.length - 1)) * width;
                   const y = height - ((d.value / maxVal) * height);
                   return `${x},${y}`;
               }).join(' ');

              chartHtml = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;">
                     <svg width="100%" height="100%" viewBox="0 0 ${width} ${height + 50}" overflow="visible">
                        <line x1="0" y1="0" x2="${width}" y2="0" stroke="rgba(255,255,255,0.2)" stroke-dasharray="5,5" />
                        <line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" stroke="rgba(255,255,255,0.2)" stroke-dasharray="5,5" />
                        <line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="rgba(255,255,255,0.2)" />
                        
                        <polyline points="${points}" fill="none" stroke="${activeAccentColor}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
                        
                        ${slide.chartData.map((d: any, i: number) => {
                           const x = (i / (slide.chartData.length - 1)) * width;
                           const y = height - ((d.value / maxVal) * height);
                           return `
                             <circle cx="${x}" cy="${y}" r="8" fill="${activeAccentColor}" />
                             <text x="${x}" y="${height + 40}" fill="${activeTextColor}" font-size="24" text-anchor="middle">${d.name}</text>
                             <text x="${x}" y="${y - 20}" fill="${activeTextColor}" font-size="24" text-anchor="middle" font-weight="bold">${d.value}</text>
                           `;
                        }).join('')}
                     </svg>
                </div>
              `;
          } else {
              chartHtml = `
                  <div style="display: flex; flex-wrap: wrap; gap: 2rem; justify-content: center; align-items: center; height: 100%;">
                      ${slide.chartData.map((d: any) => `
                          <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2rem; background: rgba(255,255,255,0.05); border-radius: 1rem; width: 200px;">
                              <div style="font-size: 3rem; font-weight: bold; color: ${activeAccentColor};">${d.value}%</div>
                              <div style="font-size: 1.5rem; color: ${activeTextColor}; text-align: center;">${d.name}</div>
                          </div>
                      `).join('')}
                  </div>
              `;
          }
      }

      const aspectRatio = slide.mediaAspectRatio || (16 / 9);

      const mediaWidthPercent = Math.max(20, Math.min(100, typeof slide.mediaWidthPercent === 'number' ? slide.mediaWidthPercent : 100));
      const mediaAlignment = slide.mediaAlignment || 'center';
      const mediaJustify = mediaAlignment === 'left' ? 'flex-start' : mediaAlignment === 'right' ? 'flex-end' : 'center';

      const mediaHtml = (() => {
        if (!slide.mediaType) return '';
        if (slide.mediaType === 'image' && slide.mediaUrl) {
           return `
             <div style="margin-top: 2rem; width: 100%; display: flex; justify-content: ${mediaJustify};">
                <div style="width: ${mediaWidthPercent}%; min-width: 220px; max-width: 100%; border: 1px solid rgba(255,255,255,0.2); border-radius: 2rem; overflow: hidden; background: rgba(0,0,0,0.35); padding: 0; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.3);">
                  <img src="${slide.mediaUrl}" alt="Slide Media" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
                </div>
             </div>
           `;
        }
        if (slide.mediaType === 'video' && slide.mediaUrl) {
          const embedUrl = resolveVideoEmbedUrl(slide.mediaUrl);
          const videoLink = slide.mediaUrl; // Original URL for linking
          
          if (!embedUrl) return '';
          
          // PDF Export: Wrap in anchor tag to make it clickable
          // Note: This relies on the PDF renderer preserving links. Puppeteer generally does.
          return `
            <div style="margin-top: 2rem; width: 100%; display: flex; justify-content: ${mediaJustify};">
              <div style="width: ${mediaWidthPercent}%; min-width: 220px; max-width: 100%; border: 1px solid rgba(255,255,255,0.2); border-radius: 2rem; overflow: hidden; background: rgba(0,0,0,0.35); padding: 1.5rem; position: relative;">
                <a href="${videoLink}" target="_blank" style="display: block; position: relative; text-decoration: none; color: inherit;">
                    <div style="position: relative; padding-bottom: ${(1 / aspectRatio) * 100}%; height: 0;">
                        <!-- Thumbnail/iframe overlay for visual -->
                        <iframe src="${embedUrl}" style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0; pointer-events: none;" tabindex="-1"></iframe>
                        <!-- Play button overlay to indicate clickability -->
                        <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); z-index: 10;">
                            <div style="width: 80px; height: 80px; background: rgba(255,0,0,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                                <div style="width: 0; height: 0; border-top: 15px solid transparent; border-bottom: 15px solid transparent; border-left: 26px solid white; margin-left: 4px;"></div>
                            </div>
                        </div>
                    </div>
                </a>
              </div>
            </div>
          `;
        }
        if (slide.mediaType === 'embed' && slide.embedHtml) {
          return `
            <div style="margin-top: 2rem; width: 100%; display: flex; justify-content: ${mediaJustify};">
              <div style="width: ${mediaWidthPercent}%; min-width: 220px; max-width: 100%; border: 1px solid rgba(255,255,255,0.2); border-radius: 2rem; overflow: hidden; background: rgba(0,0,0,0.35); padding: 1.5rem;">
                ${slide.embedHtml}
              </div>
            </div>
          `;
        }
        return '';
      })();

      const slideCategory = (slide.category ?? category ?? '').trim();
      const categoryHtml = slideCategory
        ? `
          <div style="position: absolute; top: 4rem; left: 4rem; z-index: 10;">
            <span style="font-family: 'Permanent Marker', cursive; background-color: ${activeAccentColor}; color: black; padding: 0.75rem 2rem; border-radius: 9999px; font-size: ${1.5 * fontScale}rem; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: inline-block; transform: rotate(-1deg);">
              ${slideCategory}
            </span>
          </div>
        `
        : '';

      // Logo HTML (only if logoUrl exists)
      const logoHtml = slide.logoUrl
        ? `
          <div style="position: absolute; top: 4rem; right: 4rem; z-index: 10;">
            <img 
              src="${slide.logoUrl}" 
              alt="Brand Logo" 
              style="max-height: 5rem; max-width: 12rem; object-fit: contain; opacity: 0.9; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));"
            />
          </div>
        `
        : '';

      // Define default order if missing
      let currentOrder = slide.elementOrder || [];
      if (!currentOrder.length) {
          if (slide.type === 'cover') currentOrder = ['title', 'subtitle', 'media'];
          else if (slide.type === 'chart') currentOrder = ['emoji', 'title', 'content', 'chart', 'media'];
          else currentOrder = ['emoji', 'title', 'content', 'media'];
      }

      // Render logic for each element type
      const renderElement = (id: string) => {
          switch (id) {
              case 'emoji': {
                  const emojiStripped = slide.emoji?.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
                  return emojiStripped ? `<div style="font-size: ${3.75 * fontScale}rem; margin-bottom: 1.5rem;">${slide.emoji}</div>` : '';
              }
              case 'title': {
                  const titleStripped = slide.title?.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
                  return titleStripped ? `<h1 style="font-size: ${(isCover ? 4.5 : 3) * fontScale}rem; font-weight: 700; line-height: 1.1; letter-spacing: -0.025em; margin-bottom: 1.5rem; color: ${(isCover ? activeTextColor : activeAccentColor)}; ${textShadowStyle}; text-align: ${isCover ? 'center' : 'left'};">
                      ${slide.title}
                  </h1>` : '';
              }
              case 'subtitle': {
                  const subtitleStripped = slide.subtitle?.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
                  return subtitleStripped ? `<p style="font-size: ${2.25 * fontScale}rem; font-weight: 300; line-height: 1.625; opacity: 0.8; color: ${activeTextColor}; margin-bottom: 1.5rem; ${textShadowStyle}; text-align: ${isCover ? 'center' : 'left'};">
                      ${slide.subtitle}
                  </p>` : '';
              }
              case 'content': {
                  const contentStripped = slide.content?.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
                  return contentStripped ? `<div style="flex: 1; margin-bottom: 1.5rem;">
                      <div class="slide-content" style="font-size: ${2.25 * fontScale}rem; line-height: 1.6; font-weight: 300; color: ${activeTextColor}; ${textShadowStyle}">
                        ${slide.content}
                      </div>
                  </div>` : '';
              }
              case 'chart':
                  return chartHtml ? `<div style="flex: 1; overflow: hidden; background: rgba(0,0,0,0.2); border-radius: 2rem; padding: 2rem; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 1.5rem;">
                      ${chartHtml}
                  </div>` : '';
              case 'media':
                  return mediaHtml;
              default:
                  return '';
          }
      };

      const innerContent = currentOrder.map((id: string) => renderElement(id)).join('');

      // Render custom blocks (freeform text blocks)
      const customBlocksHtml = (slide.customBlocks || []).map((block: any) => {
        // Only render blocks with actual content
        const strippedContent = block.html
          ?.replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/gi, ' ') // Replace &nbsp; with space
          .replace(/\u200B/g, '') // Remove zero-width spaces
          .trim();
        
        // Only skip if truly empty
        if (!strippedContent) return '';
        
        return `
          <div style="position: absolute; left: ${block.x}px; top: ${block.y}px; width: ${block.width}px; height: ${block.height}px; z-index: 40;">
            <div style="width: 100%; height: 100%; text-align: left; font-size: ${2.25 * fontScale}rem; line-height: 1.6; color: ${activeTextColor}; overflow: visible; padding: 0.5rem; ${textShadowStyle}">
              ${block.html}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="slide-container" style="
            width: 1080px; 
            height: 1080px; 
            background-color: ${activeBgColor}; 
            ${backgroundImageStyle}
            color: ${activeTextColor}; 
            position: relative; 
            overflow: hidden; 
            display: flex; 
            flex-direction: column; 
            font-family: '${selectedFontFamily}', system-ui, sans-serif; 
            padding: 4rem; 
            box-sizing: border-box; 
            page-break-after: always;
          ">
          
          ${overlayHtml}
          
          <!-- Styles for this slide -->
          <style>
            .slide-content strong { color: ${activeAccentColor}; font-weight: 700; }
            .slide-content em { background-color: ${activeAccentColor}33; color: ${activeAccentColor}; font-style: normal; padding: 0 4px; border-radius: 4px; }
            .slide-content :not(pre) > code { background-color: transparent; color: ${activeAccentColor}; padding: 0 2px; font-family: 'Roboto Mono', monospace; font-weight: bold; }
            .slide-content :not(pre) > code::before, .slide-content :not(pre) > code::after { content: "'"; opacity: 0.8; }
            .slide-content pre { background-color: #1f2937; padding: 1rem; border-radius: 0.5rem; overflow-x: hidden; margin: 1rem 0; border: 1px solid #374151; white-space: pre-wrap; word-break: break-word; }
            .slide-content pre code { background-color: transparent; color: inherit; padding: 0; font-weight: normal; font-family: 'Roboto Mono', monospace; }
            .slide-content pre code::before, .slide-content pre code::after { content: none; }
            .slide-content ul { list-style-type: disc; padding-left: 1.5rem; margin: 1rem 0; }
            .slide-content li { margin-bottom: 0.5rem; }
            .slide-content p { margin-bottom: 1.5rem; }
            .slide-content table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 2rem 0; font-size: 0.75em; border: 1px solid #374151; border-radius: 0.5rem; overflow: hidden; }
            .slide-content th, .slide-content td { padding: 1.25rem; border-bottom: 1px solid #374151; border-right: 1px solid #374151; text-align: left; vertical-align: middle; }
            .slide-content th:last-child, .slide-content td:last-child { border-right: none; }
            .slide-content tr:last-child td { border-bottom: none; }
            .slide-content th { background-color: #1f2937; color: ${activeAccentColor}; font-weight: 700; text-transform: uppercase; font-size: 0.9em; letter-spacing: 0.05em; }
            .slide-content tr:nth-child(even) { background-color: rgba(255, 255, 255, 0.03); }
            .slide-content img { max-width: 100%; border-radius: 0.5rem; margin: 1rem 0; }
          </style>

          <!-- Category Pill -->
          ${categoryHtml}

          <!-- Brand Logo -->
          ${logoHtml}

          <!-- Custom Blocks (Freeform Text) -->
          ${customBlocksHtml}

          <!-- Main Content -->
          <div style="flex: 1; padding-top: 12rem; padding-bottom: 6rem; display: flex; flex-direction: column; position: relative; z-index: 10; ${isCover ? 'justify-content: center;' : ''}">
             ${innerContent}
          </div>

          <!-- Footer Handle -->
          <div style="position: absolute; bottom: 3rem; right: 4rem; font-size: ${1.25 * fontScale}rem; font-weight: 500; letter-spacing: 0.025em; opacity: 0.6; z-index: 10;">
            ${handle}
          </div>

        </div>
      `;
    }).join('');

    // Construct Google Fonts URL
    // Filter out CSS variables and invalid font names, and ensure we have valid font names
    const fontsToLoad = ['Permanent Marker', 'Roboto Mono', selectedFontFamily]
      .filter(font => font && !font.startsWith('var(') && font.trim().length > 0);
    const fontQuery = [...new Set(fontsToLoad)]
      .map(font => `family=${font.replace(/\s+/g, '+')}:wght@300;400;500;700`)
      .join('&');

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?${fontQuery}&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { margin: 0; padding: 0; }
            @page { size: 1080px 1080px; margin: 0; }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          ${slidesHtml}
        </body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 60000 });

    let buffer: Buffer;

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
             }
        }
      });

      buffer = await pptx.write('nodebuffer') as Buffer;

    } else {
      // Default to PDF
      buffer = await page.pdf({
        width: '1080px',
        height: '1080px',
        printBackground: true,
      });
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
