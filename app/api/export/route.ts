import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    
    const { slides, options, format = 'pdf' } = await request.json();
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

    const firstSlideTitle = slides[0]?.title || 'slidecraft-deck';
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
          // For charts in export, we render a simpler static visualization using CSS/HTML
          // since client-side JS (Recharts) won't hydrate in Puppeteer's print view easily without wait.
          // We build simple CSS bars for robustness.
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
              // Simple line chart visualization using SVG
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
                        <!-- Grid -->
                        <line x1="0" y1="0" x2="${width}" y2="0" stroke="rgba(255,255,255,0.2)" stroke-dasharray="5,5" />
                        <line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" stroke="rgba(255,255,255,0.2)" stroke-dasharray="5,5" />
                        <line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="rgba(255,255,255,0.2)" />
                        
                        <!-- Line -->
                        <polyline points="${points}" fill="none" stroke="${activeAccentColor}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
                        
                        <!-- Dots & Labels -->
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
              // Fallback / Pie (simplified as list for now in PDF export if complex)
              chartHtml = `
                  <div style="display: flex; flex-wrap: wrap; gap: 2rem; justify-content: center; align-items: center; height: 100%;">
                      ${slide.chartData.map((d: any, i: number) => `
                          <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2rem; background: rgba(255,255,255,0.05); border-radius: 1rem; width: 200px;">
                              <div style="font-size: 3rem; font-weight: bold; color: ${activeAccentColor};">${d.value}%</div>
                              <div style="font-size: 1.5rem; color: ${activeTextColor}; text-align: center;">${d.name}</div>
                          </div>
                      `).join('')}
                  </div>
              `;
          }
      }

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
          <div style="flex: 1; padding-top: 12rem; padding-bottom: 6rem; display: flex; flex-direction: column; position: relative; z-index: 10;">
            ${isCover ? `
              <div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
                <h1 style="font-size: ${4.5 * fontScale}rem; font-weight: 700; line-height: 1.1; letter-spacing: -0.025em; margin-bottom: 3rem; color: ${activeTextColor}; ${textShadowStyle}">
                  ${slide.title}
                </h1>
                ${slide.subtitle ? `
                  <p style="font-size: ${2.25 * fontScale}rem; font-weight: 300; line-height: 1.625; opacity: 0.8; color: ${activeTextColor}; max-width: 64rem; ${textShadowStyle}">
                    ${slide.subtitle}
                  </p>
                ` : ''}
              </div>
            ` : isChart ? `
               <div style="display: flex; flex-direction: column; height: 100%;">
                <div style="margin-bottom: 3rem;">
                  ${slide.emoji ? `<div style="font-size: ${3.75 * fontScale}rem; margin-bottom: 1.5rem;">${slide.emoji}</div>` : ''}
                  <h2 style="font-size: ${3 * fontScale}rem; font-weight: 700; line-height: 1.2; margin-bottom: 1rem; color: ${activeAccentColor}; ${textShadowStyle}">
                    ${slide.title}
                  </h2>
                  ${slide.content ? `<p style="font-size: ${1.75 * fontScale}rem; font-weight: 300; opacity: 0.8; color: ${activeTextColor}; ${textShadowStyle}">${slide.content.replace(/<[^>]*>?/gm, '')}</p>` : ''}
                </div>
                <div style="flex: 1; overflow: hidden; background: rgba(0,0,0,0.2); border-radius: 2rem; padding: 2rem; border: 1px solid rgba(255,255,255,0.1);">
                   ${chartHtml}
                </div>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; height: 100%;">
                <div style="margin-bottom: 3rem;">
                  ${slide.emoji ? `<div style="font-size: ${3.75 * fontScale}rem; margin-bottom: 1.5rem;">${slide.emoji}</div>` : ''}
                  <h2 style="font-size: ${3 * fontScale}rem; font-weight: 700; line-height: 1.2; margin-bottom: 1rem; color: ${activeAccentColor}; ${textShadowStyle}">
                    ${slide.title}
                  </h2>
                </div>
                <div style="flex: 1; overflow: hidden;">
                  ${slide.content ? `
                    <div class="slide-content" style="font-size: ${2.25 * fontScale}rem; line-height: 1.6; font-weight: 300; color: ${activeTextColor}; ${textShadowStyle}">
                      ${slide.content}
                    </div>
                  ` : ''}
                </div>
              </div>
            `}
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
      screenshots.forEach(imageBuffer => {
        const slide = pptx.addSlide();
        slide.addImage({ 
            data: `data:image/png;base64,${imageBuffer}`, 
            x: 0, 
            y: 0, 
            w: 11.25, 
            h: 11.25 
        });
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
