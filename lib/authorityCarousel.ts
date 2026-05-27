import type { SlideData } from './types';

type BrandSettings = {
  handle?: string;
  category?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  logoUrl?: string | null;
};

export type OutputPreset =
  | 'General Carousel'
  | 'Authority LinkedIn'
  | 'Educational'
  | 'Sales'
  | 'Founder LinkedIn'
  | 'Tips/Listicle';

export type PlatformTarget =
  | 'Auto'
  | 'LinkedIn'
  | 'Instagram'
  | 'Sales Deck'
  | 'Education';

const BLUE = '#075BFF';
const NAVY = '#020617';
const INK = '#071127';
const MUTED = '#475569';
const BORDER = '#D7E0F2';

const authorName = 'Gbenga Oluwadahunsi';
const authorRole = 'Full-Stack & AI Engineer';
const authorTagline = 'Applied ML | Privacy-first | Local-first AI';

const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const strip = (value?: string) =>
  (value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();

const highlight = (text: string, accent = BLUE) =>
  esc(text).replace(/\b(Reviews|Customer|Right|Easy|Every|Real|Simple|More|Trust|Proof)\b/g, `<span style="color:${accent};">$1</span>`);

const pageBadge = (slideNumber: number, totalSlides: number, isDark: boolean) => `
  <div style="display:inline-flex;align-items:center;justify-content:center;background:${isDark ? 'rgba(7,91,255,0.95)' : BLUE};color:white;border-radius:14px;padding:12px 18px;font-family:Arial, sans-serif;font-size:26px;font-weight:800;line-height:1;box-shadow:0 10px 24px rgba(7,91,255,0.22);">
    ${String(slideNumber).padStart(2, '0')} <span style="opacity:.55;margin:0 8px;">/</span> ${String(totalSlides).padStart(2, '0')}
  </div>`;

const circuitLines = (isDark: boolean) => `
  <div style="width:100%;height:100%;opacity:${isDark ? 0.42 : 0.22};">
    <svg viewBox="0 0 360 180" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 28H130L164 62H318" stroke="${BLUE}" stroke-width="3"/>
      <path d="M72 72H178L210 104H348" stroke="${BLUE}" stroke-width="2"/>
      <path d="M0 128H118L158 92H284" stroke="${BLUE}" stroke-width="2"/>
      <circle cx="18" cy="28" r="6" fill="${BLUE}"/><circle cx="318" cy="62" r="6" fill="${BLUE}"/>
      <circle cx="72" cy="72" r="5" fill="${BLUE}"/><circle cx="348" cy="104" r="5" fill="${BLUE}"/>
      <circle cx="118" cy="128" r="5" fill="${BLUE}"/><circle cx="284" cy="92" r="5" fill="${BLUE}"/>
      <path d="M210 18H306M236 42H360M252 150H330" stroke="${BLUE}" stroke-width="2" opacity=".55"/>
    </svg>
  </div>`;

const authorFooter = (isDark: boolean) => `
  <div style="display:flex;align-items:center;gap:22px;font-family:Arial, sans-serif;color:${isDark ? '#FFFFFF' : INK};">
    <div style="width:110px;height:110px;border-radius:999px;background:linear-gradient(135deg, ${BLUE}, #79A7FF);display:flex;align-items:center;justify-content:center;color:white;font-size:34px;font-weight:900;border:6px solid ${isDark ? 'rgba(255,255,255,.14)' : '#F1F5F9'};">GO</div>
    <div style="width:2px;height:94px;background:${BLUE};opacity:.85;"></div>
    <div>
      <div style="font-size:31px;line-height:1.08;font-weight:900;letter-spacing:-.02em;">${authorName}</div>
      <div style="margin-top:8px;font-size:22px;line-height:1.24;color:${isDark ? 'rgba(255,255,255,.82)' : '#1F2937'};">${authorRole}</div>
      <div style="margin-top:4px;font-size:20px;line-height:1.24;color:${isDark ? 'rgba(255,255,255,.74)' : MUTED};">${authorTagline}</div>
    </div>
  </div>`;

const premiumCoverArt = (isDark = true) => `
  <div style="position:relative;width:100%;height:100%;border-radius:30px;overflow:hidden;background:${isDark ? 'linear-gradient(145deg,#071127,#0B1B3F 55%,#075BFF)' : 'linear-gradient(145deg,#F8FAFC,#E0ECFF)'};border:1px solid ${isDark ? 'rgba(255,255,255,.16)' : BORDER};box-shadow:0 28px 70px rgba(7,91,255,.28);font-family:Arial,sans-serif;">
    <div style="position:absolute;inset:0;opacity:.26;">${circuitLines(isDark)}</div>
    <div style="position:absolute;left:34px;top:34px;right:34px;height:170px;border-radius:22px;background:${isDark ? 'rgba(255,255,255,.08)' : 'white'};border:1px solid ${isDark ? 'rgba(255,255,255,.14)' : BORDER};padding:24px;">
      <div style="display:flex;gap:8px;margin-bottom:24px;"><span style="width:12px;height:12px;border-radius:50%;background:#EF4444;"></span><span style="width:12px;height:12px;border-radius:50%;background:#F59E0B;"></span><span style="width:12px;height:12px;border-radius:50%;background:#22C55E;"></span></div>
      <div style="height:14px;width:72%;border-radius:99px;background:${isDark ? 'rgba(255,255,255,.52)' : '#CBD5E1'};"></div>
      <div style="margin-top:14px;height:14px;width:48%;border-radius:99px;background:${BLUE};"></div>
      <div style="margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:12px;"><div style="height:46px;border-radius:14px;background:${isDark ? 'rgba(255,255,255,.1)' : '#EAF1FF'};"></div><div style="height:46px;border-radius:14px;background:${isDark ? 'rgba(255,255,255,.1)' : '#EAF1FF'};"></div></div>
    </div>
    <div style="position:absolute;right:42px;bottom:48px;width:156px;height:156px;border-radius:42px;background:white;color:${BLUE};display:flex;align-items:center;justify-content:center;font-size:76px;font-weight:900;box-shadow:0 22px 50px rgba(0,0,0,.28);">AI</div>
    <div style="position:absolute;left:42px;bottom:54px;width:210px;border-radius:24px;background:${isDark ? 'rgba(255,255,255,.1)' : 'white'};border:1px solid ${isDark ? 'rgba(255,255,255,.16)' : BORDER};padding:18px;">
      <div style="font-size:16px;font-weight:900;color:${isDark ? '#DCE7FF' : INK};">Draft quality</div>
      <div style="margin-top:12px;height:10px;border-radius:99px;background:${BLUE};width:88%;"></div>
      <div style="margin-top:10px;height:10px;border-radius:99px;background:${isDark ? 'rgba(255,255,255,.24)' : '#CBD5E1'};width:62%;"></div>
    </div>
  </div>`;

const authorityBlocks = (slideNumber: number, totalSlides: number, isDark = false) => [
  {
    id: `page-${slideNumber}`,
    x: isDark ? 904 : 40,
    y: 32,
    width: 150,
    height: 64,
    html: pageBadge(slideNumber, totalSlides, isDark),
  },
  {
    id: `circuit-${slideNumber}`,
    x: 700,
    y: isDark ? 40 : 24,
    width: 330,
    height: 170,
    html: circuitLines(isDark),
  },
  {
    id: `author-${slideNumber}`,
    x: 54,
    y: 902,
    width: 690,
    height: 140,
    html: authorFooter(isDark),
  },
];

const coverArtBlock = (isDark = true) => ({
  id: 'premium-cover-art',
  x: 690,
  y: 238,
  width: 330,
  height: 410,
  html: premiumCoverArt(isDark),
});

const baseSlide = (brand: BrandSettings, slideNumber: number, totalSlides: number, isDark = false): Partial<SlideData> => ({
  accentColor: brand.accentColor || BLUE,
  backgroundColor: isDark ? '#030817' : '#FFFFFF',
  textColor: isDark ? '#FFFFFF' : INK,
  titleColor: isDark ? '#FFFFFF' : INK,
  fontFamily: brand.fontFamily || 'var(--font-inter)',
  fontScale: 0.86,
  handle: '',
  category: '',
  slideNumber,
  totalSlides,
  slidePadding: isDark ? 58 : 54,
  backgroundPattern: 'none',
  mediaType: null,
  mediaAspectRatio: 16 / 9,
  mediaWidthPercent: 100,
  mediaAlignment: 'center',
  logoUrl: null,
  showNoise: isDark,
  elementOrder: ['slideLabel', 'title', 'subtitle', 'content', 'infographic'],
  customBlocks: authorityBlocks(slideNumber, totalSlides, isDark),
});

const contentCard = (html: string, isDark = false) => `
  <div style="margin-top:26px;border:1px solid ${isDark ? 'rgba(255,255,255,.16)' : BORDER};border-radius:24px;padding:30px;background:${isDark ? 'rgba(15,23,42,.72)' : '#F8FAFF'};box-shadow:0 18px 45px rgba(15,23,42,.08);font-family:Arial, sans-serif;color:${isDark ? '#E5ECFF' : INK};">
    ${html}
  </div>`;

const paragraph = (text: string) => `<p style="font-size:30px;line-height:1.38;margin:0;color:${INK};">${highlight(text)}</p>`;

export const createAuthorityLinkedInSampleSlides = (brand: BrandSettings = {}): SlideData[] => {
  const totalSlides = 8;
  const slides: SlideData[] = [
    {
      ...baseSlide(brand, 1, totalSlides, true),
      id: `authority-sample-${Date.now()}-1`,
      type: 'cover',
      slideLabel: 'THE PLAYBOOK',
      title: 'How to Get More Customer Reviews',
      subtitle: 'Without begging, spamming, or sounding desperate.',
      content: contentCard(`
        <div style="font-size:26px;line-height:1.35;color:#DCE7FF;">From random asks to a simple repeatable review system.</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:28px;">
          ${['Ask at the right moment', 'Make it easy', 'Reply to every review'].map(item => `<div style="border-left:4px solid ${BLUE};padding-left:14px;font-size:20px;line-height:1.25;color:white;font-weight:800;">${item}</div>`).join('')}
        </div>
      `, true),
      textAlign: 'left',
      slideJustify: 'center',
      customBlocks: [...authorityBlocks(1, totalSlides, true), coverArtBlock(true)],
    } as SlideData,
    {
      ...baseSlide(brand, 2, totalSlides),
      id: `authority-sample-${Date.now()}-2`,
      type: 'content',
      slideLabel: 'THE SHIFT',
      title: 'Stop Asking Everyone. Ask at the Right Moment.',
      subtitle: 'Timing changes the whole response rate.',
      content: contentCard(`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;">
          <div style="background:#FFF1F2;border:1px solid #FECDD3;border-radius:22px;padding:26px;">
            <div style="display:inline-block;background:#E11D48;color:white;border-radius:10px;padding:10px 18px;font-size:24px;font-weight:900;">OLD WAY</div>
            <div style="margin-top:26px;font-size:36px;line-height:1.18;font-weight:900;">You ask days later.</div>
            <div style="margin-top:18px;font-size:22px;line-height:1.4;color:#475569;">The customer has moved on, forgotten the details, or lost the emotional reason to help.</div>
          </div>
          <div style="background:#ECFDF5;border:1px solid #BBF7D0;border-radius:22px;padding:26px;">
            <div style="display:inline-block;background:#059669;color:white;border-radius:10px;padding:10px 18px;font-size:24px;font-weight:900;">NEW WAY</div>
            <div style="margin-top:26px;font-size:36px;line-height:1.18;font-weight:900;">You ask after a win.</div>
            <div style="margin-top:18px;font-size:22px;line-height:1.4;color:#475569;">Ask after delivery, resolution, praise, reorder, or any clear positive signal.</div>
          </div>
        </div>
      `),
    } as SlideData,
    {
      ...baseSlide(brand, 3, totalSlides),
      id: `authority-sample-${Date.now()}-3`,
      type: 'content',
      slideLabel: 'THE SYSTEM',
      title: 'Make the Review Path Frictionless',
      subtitle: 'Every extra step loses people.',
      content: contentCard(`
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;">
          ${[
            ['1', 'One direct link', 'Send people straight to the review page.'],
            ['2', 'One clear ask', 'Tell them exactly what to do.'],
            ['3', 'One simple prompt', 'Give them a sentence they can adapt.'],
          ].map(([num, head, body]) => `
            <div style="border:1px solid ${BORDER};border-radius:22px;padding:24px;background:white;">
              <div style="width:58px;height:58px;border-radius:16px;background:${BLUE};color:white;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;">${num}</div>
              <div style="margin-top:22px;font-size:26px;font-weight:900;line-height:1.1;">${head}</div>
              <div style="margin-top:12px;font-size:20px;line-height:1.35;color:${MUTED};">${body}</div>
            </div>`).join('')}
        </div>
      `),
    } as SlideData,
    {
      ...baseSlide(brand, 4, totalSlides),
      id: `authority-sample-${Date.now()}-4`,
      type: 'content',
      slideLabel: 'THE SCRIPT',
      title: 'Use a Review Ask That Sounds Human',
      subtitle: 'Simple beats clever.',
      content: contentCard(`
        <div style="font-size:72px;line-height:.8;color:${BLUE};font-weight:900;">“</div>
        <div style="font-size:32px;line-height:1.38;font-weight:800;">If we helped you today, could you leave a quick review? It helps other customers know what to expect.</div>
        <div style="margin-top:28px;border-top:1px solid ${BORDER};padding-top:22px;font-size:23px;line-height:1.35;color:${MUTED};">This works because it is specific, honest, and tied to the value the customer just received.</div>
      `),
    } as SlideData,
    {
      ...baseSlide(brand, 5, totalSlides),
      id: `authority-sample-${Date.now()}-5`,
      type: 'content',
      slideLabel: 'THE IMPACT',
      title: 'Small Review Habits Create Visible Trust',
      subtitle: 'The numbers compound when the system runs weekly.',
      content: contentCard(`
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:center;">
          ${[
            ['2-3x', 'More review asks sent'],
            ['30s', 'To send a clean link'],
            ['Weekly', 'Reply rhythm'],
            ['Higher', 'Buyer confidence'],
          ].map(([value, label]) => `
            <div style="border:1px solid ${BORDER};border-radius:22px;padding:24px 16px;background:white;">
              <div style="font-size:42px;font-weight:900;line-height:1;color:${BLUE};">${value}</div>
              <div style="margin-top:12px;font-size:18px;line-height:1.25;color:${INK};font-weight:800;">${label}</div>
            </div>`).join('')}
        </div>
      `),
    } as SlideData,
    {
      ...baseSlide(brand, 6, totalSlides),
      id: `authority-sample-${Date.now()}-6`,
      type: 'content',
      slideLabel: 'THE RESPONSE',
      title: 'Reply to Every Review',
      subtitle: 'Your replies are part of the marketing.',
      content: contentCard(`
        <div style="display:flex;flex-direction:column;gap:18px;">
          ${[
            ['Happy review', 'Thank them and mention the specific outcome.'],
            ['Average review', 'Acknowledge it and show you are improving.'],
            ['Bad review', 'Stay calm, take ownership, and move details offline.'],
          ].map(([head, body]) => `
            <div style="display:grid;grid-template-columns:210px 1fr;gap:22px;align-items:center;border-bottom:1px solid ${BORDER};padding-bottom:18px;">
              <div style="font-size:23px;font-weight:900;color:${BLUE};">${head}</div>
              <div style="font-size:22px;line-height:1.35;color:${INK};">${body}</div>
            </div>`).join('')}
        </div>
      `),
    } as SlideData,
    {
      ...baseSlide(brand, 7, totalSlides),
      id: `authority-sample-${Date.now()}-7`,
      type: 'content',
      slideLabel: 'THE CHECKLIST',
      title: 'Your Review Flywheel',
      subtitle: 'Repeat this every week.',
      content: contentCard(`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
          ${['Find happy customer moments', 'Send one direct review link', 'Make the ask personal', 'Reply within 24-48 hours', 'Share strong reviews in content', 'Improve from repeated complaints'].map(item => `
            <div style="display:flex;gap:16px;align-items:flex-start;background:white;border:1px solid ${BORDER};border-radius:18px;padding:18px;">
              <div style="width:34px;height:34px;border-radius:10px;background:${BLUE};color:white;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;">✓</div>
              <div style="font-size:22px;line-height:1.25;font-weight:800;color:${INK};">${item}</div>
            </div>`).join('')}
        </div>
      `),
    } as SlideData,
    {
      ...baseSlide(brand, 8, totalSlides, true),
      id: `authority-sample-${Date.now()}-8`,
      type: 'content',
      slideLabel: 'TAKEAWAY',
      title: 'More Reviews Come From Better Systems',
      subtitle: 'Not louder begging.',
      content: contentCard(`
        <div style="font-size:34px;line-height:1.38;font-weight:900;color:white;">Ask when the customer is happiest. Make the path simple. Reply like a real person. Repeat weekly.</div>
        <div style="margin-top:26px;font-size:24px;line-height:1.35;color:#DCE7FF;">That is how reviews become a trust engine, not a random event.</div>
      `, true),
    } as SlideData,
  ];

  return slides;
};

export const createGeneralSampleSlides = (brand: BrandSettings = {}): SlideData[] => {
  const base = {
    category: brand.category || 'Customer Reviews',
    accentColor: brand.accentColor || '#ffd700',
    handle: brand.handle || '@yourbrand',
    fontFamily: brand.fontFamily || 'var(--font-inter)',
    backgroundColor: brand.backgroundColor || '#0B0F19',
    textColor: brand.textColor || '#ffffff',
    mediaType: null as SlideData['mediaType'],
    mediaAspectRatio: 16 / 9,
    mediaWidthPercent: 100,
    mediaAlignment: 'center' as const,
    elementOrder: ['title', 'subtitle', 'content'],
    customBlocks: [],
    logoUrl: brand.logoUrl ?? null,
    slidePadding: 64,
  };

  const now = Date.now();
  return [
    {
      ...base,
      id: `general-sample-${now}-0`,
      type: 'cover',
      title: 'How to Get More Customer Reviews',
      subtitle: 'Simple ways to ask without being pushy',
      textAlign: 'center',
      fontScale: 1.15,
      slideJustify: 'center',
      customBlocks: [
        {
          id: 'general-cover-art',
          x: 690,
          y: 210,
          width: 310,
          height: 380,
          html: premiumCoverArt(false),
        },
      ],
    },
    {
      ...base,
      id: `general-sample-${now}-1`,
      type: 'content',
      title: 'Ask at the Right Moment',
      content: '<p>Ask after a clear win: a completed order, a solved support issue, or a happy customer message. That is when people are most willing to help.</p>',
      fontScale: 1.05,
    },
    {
      ...base,
      id: `general-sample-${now}-2`,
      type: 'content',
      title: 'Make It Easy',
      content: '<p>Send one direct review link. Add a short sentence they can copy. The fewer steps people have to take, the more reviews you will collect.</p>',
      fontScale: 1.05,
    },
    {
      ...base,
      id: `general-sample-${now}-3`,
      type: 'content',
      title: 'Reply to Every Review',
      content: '<p>Thank happy customers, respond calmly to complaints, and show future buyers that real people are behind the business.</p>',
      fontScale: 1.05,
    },
  ];
};

export const applyAuthorityLinkedInStyle = (slides: SlideData[], brand: BrandSettings = {}): SlideData[] => {
  const totalSlides = slides.length || 1;
  return slides.map((slide, index) => {
    const slideNumber = index + 1;
    const isDark = index === 0 || index === totalSlides - 1;
    const cleanTitle = strip(slide.title) || (slideNumber === 1 ? 'Your Big Idea' : 'Key Point');
    const cleanSubtitle = strip(slide.subtitle);
    const existingContent = slide.content || paragraph(cleanSubtitle || cleanTitle);

    return {
      ...slide,
      ...baseSlide(brand, slideNumber, totalSlides, isDark),
      title: index === 0 ? highlight(cleanTitle) : highlight(cleanTitle),
      subtitle: cleanSubtitle,
      content: contentCard(existingContent, isDark),
      slideLabel: slide.slideLabel || (index === 0 ? 'THE BIG SHIFT' : index === totalSlides - 1 ? 'TAKEAWAY' : 'INSIGHT'),
      titleColor: isDark ? '#FFFFFF' : INK,
      backgroundColor: isDark ? NAVY : '#FFFFFF',
      textColor: isDark ? '#FFFFFF' : INK,
      type: slide.type === 'chart' ? 'content' : slide.type,
      fontScale: index === 0 ? 0.92 : 0.78,
      slideJustify: index === 0 || index === totalSlides - 1 ? 'center' : 'start',
      customBlocks: index === 0
        ? [...authorityBlocks(slideNumber, totalSlides, isDark), coverArtBlock(isDark)]
        : authorityBlocks(slideNumber, totalSlides, isDark),
    };
  });
};
