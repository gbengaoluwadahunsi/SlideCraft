/**
 * Template Generator Script (ESM version)
 * Run with: node scripts/generate-100-templates.mjs > generated-templates.json
 */

// Color palette variations
const COLOR_SCHEMES = [
  { bg: '#FFFFFF', text: '#000000', accent: '#FF6B6B' },
  { bg: '#0B0F19', text: '#FFFFFF', accent: '#FFD700' },
  { bg: '#F8F9FA', text: '#1A1A1A', accent: '#4ECDC4' },
  { bg: '#1A1A2E', text: '#EAEAEA', accent: '#E94560' },
  { bg: '#FFF5F7', text: '#000000', accent: '#FF2D55' },
  { bg: '#F0FFF4', text: '#000000', accent: '#34C759' },
  { bg: '#E8E8E8', text: '#000000', accent: '#FFA500' },
  { bg: '#FFFFFF', text: '#000000', accent: '#007AFF' },
  { bg: '#0F172A', text: '#E2E8F0', accent: '#38BDF8' },
  { bg: '#FDFBF7', text: '#2D2A26', accent: '#D946EF' },
];

// Font families
const FONT_FAMILIES = [
  'var(--font-inter)',
  'var(--font-oswald)',
  'var(--font-playfair)',
  'var(--font-roboto-mono)',
];

// Categories/themes
const CONTENT_THEMES = [
  { name: 'Productivity', topics: ['Time Management', 'Focus', 'Efficiency', 'Habits'] },
  { name: 'Marketing', topics: ['Growth', 'Strategy', 'Content', 'Engagement'] },
  { name: 'Design', topics: ['UI/UX', 'Typography', 'Color Theory', 'Layout'] },
  { name: 'Business', topics: ['Leadership', 'Strategy', 'Innovation', 'Growth'] },
  { name: 'Technology', topics: ['AI', 'Development', 'Tools', 'Trends'] },
  { name: 'Education', topics: ['Learning', 'Skills', 'Knowledge', 'Tips'] },
  { name: 'Health', topics: ['Wellness', 'Fitness', 'Mindfulness', 'Balance'] },
  { name: 'Finance', topics: ['Investing', 'Saving', 'Budgeting', 'Wealth'] },
  { name: 'Social Media', topics: ['Growth', 'Content', 'Engagement', 'Strategy'] },
  { name: 'Creativity', topics: ['Inspiration', 'Ideas', 'Process', 'Expression'] },
];

// Layout variations
const LAYOUT_STYLES = [
  { elementOrder: ['title', 'subtitle', 'content'], alignment: 'center' },
  { elementOrder: ['title', 'content', 'emoji'], alignment: 'left' },
  { elementOrder: ['emoji', 'title', 'content'], alignment: 'center' },
  { elementOrder: ['title', 'subtitle'], alignment: 'center' },
  { elementOrder: ['content', 'title'], alignment: 'left' },
];

function generateTemplate(index, colorScheme, fontFamily, theme, topic, layoutStyle) {
  const templateId = `generated-${index + 1}-${theme.name.toLowerCase().replace(/\s+/g, '-')}`;
  const templateName = `${theme.name}: ${topic}`;
  
  // Generate slides based on theme
  const slides = [
    {
      type: 'cover',
      title: topic.toUpperCase(),
      subtitle: `LEARN THE SECRETS`,
      category: theme.name,
      accentColor: colorScheme.accent,
      handle: '@yourhandle',
      fontFamily,
      fontScale: 1.3 + (index % 3) * 0.1,
      backgroundColor: colorScheme.bg,
      textColor: colorScheme.text,
      mediaType: null,
      mediaAspectRatio: 16 / 9,
      mediaWidthPercent: 100,
      mediaAlignment: 'center',
      elementOrder: layoutStyle.elementOrder,
      customBlocks: [],
      textAlign: layoutStyle.alignment,
    },
    {
      type: 'content',
      title: `WHY ${topic.toUpperCase()} MATTERS`,
      content: `<p style="font-size: 1.2em; line-height: 1.6;">Understanding ${topic.toLowerCase()} is crucial for success. Here's what you need to know.</p>`,
      emoji: '',
      category: theme.name,
      accentColor: colorScheme.accent,
      handle: '@yourhandle',
      fontFamily,
      fontScale: 1.1 + (index % 2) * 0.1,
      backgroundColor: colorScheme.bg === '#FFFFFF' ? '#F8F9FA' : colorScheme.bg,
      textColor: colorScheme.text,
      mediaType: null,
      mediaAspectRatio: 16 / 9,
      mediaWidthPercent: 100,
      mediaAlignment: 'center',
      elementOrder: layoutStyle.elementOrder,
      customBlocks: [],
      textAlign: layoutStyle.alignment,
    },
    {
      type: 'content',
      title: 'KEY PRINCIPLES',
      content: `<p style="margin-bottom: 1rem;"><strong style="background: ${colorScheme.accent}; color: ${colorScheme.bg === '#FFFFFF' || colorScheme.bg === '#F8F9FA' ? '#000' : '#FFF'}; padding: 4px 12px; display: inline-block;">PRINCIPLE 1</strong></p><p>Master these fundamentals to excel in ${topic.toLowerCase()}.</p>`,
      emoji: '',
      category: theme.name,
      accentColor: colorScheme.accent,
      handle: '@yourhandle',
      fontFamily,
      fontScale: 1.1,
      backgroundColor: colorScheme.bg,
      textColor: colorScheme.text,
      mediaType: null,
      mediaAspectRatio: 16 / 9,
      mediaWidthPercent: 100,
      mediaAlignment: 'center',
      elementOrder: layoutStyle.elementOrder,
      customBlocks: [],
      textAlign: layoutStyle.alignment,
    },
    {
      type: 'content',
      title: 'TAKE ACTION',
      content: `<p style="background: ${colorScheme.accent}20; padding: 2rem; border-radius: 8px; margin-top: 1rem;"><strong>START TODAY</strong></p><p style="margin-top: 1.5rem;">Apply these ${topic.toLowerCase()} strategies and see results.</p>`,
      emoji: '',
      category: theme.name,
      accentColor: colorScheme.accent,
      handle: '@yourhandle',
      fontFamily,
      fontScale: 1.1,
      backgroundColor: colorScheme.bg === '#FFFFFF' ? '#F8F9FA' : colorScheme.bg,
      textColor: colorScheme.text,
      mediaType: null,
      mediaAspectRatio: 16 / 9,
      mediaWidthPercent: 100,
      mediaAlignment: 'center',
      elementOrder: layoutStyle.elementOrder,
      customBlocks: [],
      textAlign: layoutStyle.alignment,
    },
  ];

  return {
    id: templateId,
    name: templateName,
    description: `Generated template for ${theme.name} - ${topic}`,
    category: theme.name,
    slides,
  };
}

function generate100Templates() {
  const templates = [];
  let templateIndex = 0;

  // Generate templates by combining different variations
  for (const theme of CONTENT_THEMES) {
    for (const topic of theme.topics) {
      if (templateIndex >= 100) break;

      const colorScheme = COLOR_SCHEMES[templateIndex % COLOR_SCHEMES.length];
      const fontFamily = FONT_FAMILIES[templateIndex % FONT_FAMILIES.length];
      const layoutStyle = LAYOUT_STYLES[templateIndex % LAYOUT_STYLES.length];

      const template = generateTemplate(
        templateIndex,
        colorScheme,
        fontFamily,
        theme,
        topic,
        layoutStyle
      );

      templates.push(template);
      templateIndex++;
    }
  }

  // Fill remaining slots with additional variations
  while (templates.length < 100) {
    const theme = CONTENT_THEMES[templates.length % CONTENT_THEMES.length];
    const topic = theme.topics[templates.length % theme.topics.length];
    const colorScheme = COLOR_SCHEMES[templates.length % COLOR_SCHEMES.length];
    const fontFamily = FONT_FAMILIES[templates.length % FONT_FAMILIES.length];
    const layoutStyle = LAYOUT_STYLES[templates.length % LAYOUT_STYLES.length];

    const template = generateTemplate(
      templates.length,
      colorScheme,
      fontFamily,
      theme,
      `${topic} Advanced`,
      layoutStyle
    );

    templates.push(template);
  }

  return templates.slice(0, 100);
}

// Run if executed directly
const templates = generate100Templates();
console.log(JSON.stringify(templates, null, 2));






