/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

export async function POST(request: NextRequest) {
  try {
    let slides: any[] = [];
    let options: any = {};
    let format = 'pdf';
    const videoAttachments: Record<string, Buffer> = {};

    // Handle FormData vs JSON content types
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const dataStr = formData.get('data') as string;
        
        if (!dataStr) throw new Error('Missing data field in FormData');
        const parsedData = JSON.parse(dataStr);
        
        slides = parsedData.slides;
        options = parsedData.options;
        format = parsedData.format;

        // Extract attached video files
        for (const [key, val] of formData.entries()) {
            if (key.startsWith('video_') && val instanceof File) {
                const arrayBuffer = await val.arrayBuffer();
                videoAttachments[key] = Buffer.from(arrayBuffer);
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
      backgroundImage, // Receive global background image
      backgroundOverlayOpacity
    } = options;

    // Map CSS variables to Google Font names
    const fontMap: Record<string, string> = {
      'var(--font-inter)': 'Inter',
      'var(--font-playfair)': 'Playfair Display',
      'var(--font-oswald)': 'Oswald',
      'var(--font-roboto-mono)': 'Roboto Mono'
    };

    const selectedFontFamily = fontMap[fontFamily] || 'Inter';
    
    // Generate filename from first slide title
    const generateFilename = (title: string): string => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .substring(0, 50); // Limit to 50 characters
    };

    const firstSlideTitle = slides[0]?.title || 'carouslk-deck';
    const filenameExtension = format === 'ppt' ? 'pptx' : 'pdf';
    const downloadFilename = `${generateFilename(firstSlideTitle)}.${filenameExtension}`;

    const browser = await launchBrowser();
    const page = await browser.newPage();

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
          if (!embedUrl) return '';
          return `
            <div style="margin-top: 2rem; width: 100%; display: flex; justify-content: ${mediaJustify};">
              <div style="width: ${mediaWidthPercent}%; min-width: 220px; max-width: 100%; border: 1px solid rgba(255,255,255,0.2); border-radius: 2rem; overflow: hidden; background: rgba(0,0,0,0.35); padding: 1.5rem;">
                <div style="position: relative; padding-bottom: ${(1 / aspectRatio) * 100}%; height: 0;">
                  <iframe src="${embedUrl}" style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe>
                </div>
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
              case 'emoji':
                  return slide.emoji ? `<div style="font-size: ${3.75 * fontScale}rem; margin-bottom: 1.5rem;">${slide.emoji}</div>` : '';
              case 'title':
                  return `<h1 style="font-size: ${(isCover ? 4.5 : 3) * fontScale}rem; font-weight: 700; line-height: 1.1; letter-spacing: -0.025em; margin-bottom: 1.5rem; color: ${(isCover ? activeTextColor : activeAccentColor)}; ${textShadowStyle}; text-align: ${isCover ? 'center' : 'left'};">
                      ${slide.title}
                  </h1>`;
              case 'subtitle':
                  return slide.subtitle ? `<p style="font-size: ${2.25 * fontScale}rem; font-weight: 300; line-height: 1.625; opacity: 0.8; color: ${activeTextColor}; margin-bottom: 1.5rem; ${textShadowStyle}; text-align: ${isCover ? 'center' : 'left'};">
                      ${slide.subtitle}
                  </p>` : '';
              case 'content':
                  return slide.content ? `<div style="flex: 1; margin-bottom: 1.5rem;">
                      <div class="slide-content" style="font-size: ${2.25 * fontScale}rem; line-height: 1.6; font-weight: 300; color: ${activeTextColor}; ${textShadowStyle}">
                        ${slide.content}
                      </div>
                  </div>` : '';
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
    const fontsToLoad = ['Permanent Marker', 'Roboto Mono', selectedFontFamily];
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
        if (slideData && (slideData as any)._hasAttachedVideo) {
             const videoKey = `video_${index}`;
             if (videoAttachments[videoKey]) {
                 // Convert Buffer to base64 because pptxgenjs expects data-URI or path.
                 // For server-side nodebuffer export, passing base64 data works best.
                 const videoB64 = videoAttachments[videoKey].toString('base64');
                 
                 // Add video media centered on slide. 
                 // We use the mediaAspectRatio to determine size if possible, or default to 16:9 fit.
                 const ratio = slideData.mediaAspectRatio || (16/9);
                 const vW = 10; // Almost full width (11.25 is max)
                 const vH = vW / ratio;
                 
                 // Center it
                 const vX = (11.25 - vW) / 2;
                 const vY = (11.25 - vH) / 2;

                 slide.addMedia({ 
                     type: 'video',
                     data: `data:video/mp4;base64,${videoB64}`,
                     x: vX,
                     y: vY,
                     w: vW,
                     h: vH,
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
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}
