/**
 * 100 Unique Templates Generator
 * Inspired by design patterns from:
 * - Canva templates (modern, colorful, clean)
 * - LinkedIn carousels (professional, bold typography)
 * - Dribbble/Behance (creative, artistic)
 * - Instagram carousels (gradient, trendy, bold)
 * - Modern design trends (minimalist, brutalist, editorial, etc.)
 */

// ===== DESIGN PATTERNS FROM RESEARCH =====

// Canva-style: Modern, colorful, clean
const CANVA_COLORS = [
  { bg: '#FFFFFF', text: '#1A1A1A', accent: '#FF6B9D', name: 'Canva Pink' },
  { bg: '#F8F9FA', text: '#212529', accent: '#4ECDC4', name: 'Canva Teal' },
  { bg: '#FFFFFF', text: '#000000', accent: '#FFC107', name: 'Canva Yellow' },
  { bg: '#E3F2FD', text: '#1565C0', accent: '#2196F3', name: 'Canva Blue' },
  { bg: '#FFF3E0', text: '#E65100', accent: '#FF9800', name: 'Canva Orange' },
];

// LinkedIn-style: Professional, bold, high contrast
const LINKEDIN_COLORS = [
  { bg: '#FFFFFF', text: '#000000', accent: '#0077B5', name: 'LinkedIn Blue' },
  { bg: '#0A66C2', text: '#FFFFFF', accent: '#FFD700', name: 'LinkedIn Dark' },
  { bg: '#F3F2EF', text: '#000000', accent: '#0077B5', name: 'LinkedIn Light' },
  { bg: '#1D1D1D', text: '#FFFFFF', accent: '#0077B5', name: 'LinkedIn Black' },
  { bg: '#FFFFFF', text: '#0A66C2', accent: '#FF6B35', name: 'LinkedIn Modern' },
];

// Instagram-style: Gradient, trendy, bold
const INSTAGRAM_COLORS = [
  { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#FFFFFF', accent: '#FFD700', name: 'Instagram Purple' },
  { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: '#FFFFFF', accent: '#000000', name: 'Instagram Pink' },
  { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: '#FFFFFF', accent: '#FF6B6B', name: 'Instagram Blue' },
  { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', text: '#000000', accent: '#FFFFFF', name: 'Instagram Green' },
  { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', text: '#000000', accent: '#FFFFFF', name: 'Instagram Sunset' },
];

// Dribbble/Behance-style: Creative, artistic
const CREATIVE_COLORS = [
  { bg: '#0A0E27', text: '#FFFFFF', accent: '#EA4C89', name: 'Dribbble Pink' },
  { bg: '#1769FF', text: '#FFFFFF', accent: '#FFD700', name: 'Behance Blue' },
  { bg: '#1A1A1A', text: '#FFFFFF', accent: '#00D4FF', name: 'Creative Cyan' },
  { bg: '#FFFFFF', text: '#000000', accent: '#FF6B6B', name: 'Creative Red' },
  { bg: '#2D2D2D', text: '#FFFFFF', accent: '#4ECDC4', name: 'Creative Teal' },
];

// Modern trends: Minimalist, Brutalist, Editorial
const MODERN_COLORS = [
  { bg: '#FFFFFF', text: '#000000', accent: '#000000', name: 'Minimalist' },
  { bg: '#000000', text: '#FFFF00', accent: '#FFFFFF', name: 'Brutalist' },
  { bg: '#F5F5F5', text: '#1A1A1A', accent: '#DC143C', name: 'Editorial' },
  { bg: '#1A1A2E', text: '#EAEAEA', accent: '#E94560', name: 'Dark Modern' },
  { bg: '#FFF9E6', text: '#2D2A26', accent: '#D946EF', name: 'Warm Minimal' },
];

// Font combinations inspired by platforms
const FONT_COMBOS = [
  { primary: 'var(--font-inter)', style: 'Modern Clean' },
  { primary: 'var(--font-oswald)', style: 'Bold Condensed' },
  { primary: 'var(--font-playfair)', style: 'Elegant Serif' },
  { primary: 'var(--font-roboto-mono)', style: 'Tech Monospace' },
  { primary: 'var(--font-inter)', style: 'Professional' },
];

// Layout patterns from research
const LAYOUT_PATTERNS = [
  { order: ['title', 'subtitle', 'content'], align: 'center', spacing: 'tight', name: 'Centered Classic' },
  { order: ['title', 'content', 'emoji'], align: 'left', spacing: 'medium', name: 'Left Aligned' },
  { order: ['emoji', 'title', 'content'], align: 'center', spacing: 'loose', name: 'Emoji First' },
  { order: ['title', 'subtitle'], align: 'center', spacing: 'very-loose', name: 'Minimal Title' },
  { order: ['content', 'title'], align: 'left', spacing: 'medium', name: 'Content First' },
  { order: ['title', 'content'], align: 'center', spacing: 'tight', name: 'Simple Two' },
];

// Content themes based on popular categories
const CONTENT_THEMES = [
  { name: 'Business Growth', topics: ['Strategy', 'Leadership', 'Innovation', 'Scaling', 'Team Building'] },
  { name: 'Marketing', topics: ['Content Strategy', 'Social Media', 'Branding', 'SEO', 'Analytics'] },
  { name: 'Productivity', topics: ['Time Management', 'Focus', 'Habits', 'Systems', 'Automation'] },
  { name: 'Design', topics: ['UI/UX', 'Typography', 'Color Theory', 'Layout', 'Branding'] },
  { name: 'Technology', topics: ['AI', 'Development', 'Tools', 'Trends', 'Innovation'] },
  { name: 'Personal Development', topics: ['Mindset', 'Goals', 'Growth', 'Skills', 'Success'] },
  { name: 'Finance', topics: ['Investing', 'Budgeting', 'Wealth', 'Saving', 'Planning'] },
  { name: 'Health & Wellness', topics: ['Fitness', 'Nutrition', 'Mental Health', 'Balance', 'Wellness'] },
  { name: 'Education', topics: ['Learning', 'Teaching', 'Skills', 'Knowledge', 'Tips'] },
  { name: 'Creativity', topics: ['Inspiration', 'Ideas', 'Process', 'Expression', 'Art'] },
  { name: 'Entrepreneurship', topics: ['Startups', 'Funding', 'Growth', 'Strategy', 'Success'] },
  { name: 'Social Media', topics: ['Content', 'Engagement', 'Growth', 'Strategy', 'Trends'] },
  { name: 'Sales', topics: ['Closing', 'Prospecting', 'Relationships', 'Strategy', 'Tips'] },
  { name: 'Leadership', topics: ['Management', 'Team', 'Vision', 'Communication', 'Culture'] },
  { name: 'Career', topics: ['Advancement', 'Skills', 'Networking', 'Resume', 'Interview'] },
  { name: 'Lifestyle', topics: ['Balance', 'Habits', 'Routine', 'Wellness', 'Mindfulness'] },
  { name: 'Travel', topics: ['Destinations', 'Tips', 'Planning', 'Experiences', 'Culture'] },
  { name: 'Food & Cooking', topics: ['Recipes', 'Nutrition', 'Tips', 'Techniques', 'Culture'] },
  { name: 'Fashion', topics: ['Style', 'Trends', 'Tips', 'Inspiration', 'Wardrobe'] },
  { name: 'Photography', topics: ['Composition', 'Lighting', 'Editing', 'Gear', 'Tips'] },
];

// Design style variations
const DESIGN_STYLES = [
  { name: 'Canva Modern', colors: CANVA_COLORS, fonts: ['var(--font-inter)'], layouts: [0, 1, 2] },
  { name: 'LinkedIn Professional', colors: LINKEDIN_COLORS, fonts: ['var(--font-oswald)', 'var(--font-inter)'], layouts: [0, 3, 4] },
  { name: 'Instagram Trendy', colors: INSTAGRAM_COLORS, fonts: ['var(--font-oswald)'], layouts: [0, 2, 5] },
  { name: 'Creative Artistic', colors: CREATIVE_COLORS, fonts: ['var(--font-playfair)', 'var(--font-inter)'], layouts: [1, 2, 4] },
  { name: 'Minimalist', colors: MODERN_COLORS, fonts: ['var(--font-inter)'], layouts: [3, 5] },
];

// Generate a template
function generateTemplate(index, theme, topic, styleIndex) {
  const style = DESIGN_STYLES[styleIndex % DESIGN_STYLES.length];
  const colorScheme = style.colors[index % style.colors.length];
  const fontFamily = style.fonts[index % style.fonts.length];
  const layout = LAYOUT_PATTERNS[style.layouts[index % style.layouts.length]];
  
  const templateId = `inspired-${index + 1}-${theme.name.toLowerCase().replace(/\s+/g, '-')}-${topic.toLowerCase().replace(/\s+/g, '-')}`;
  const templateName = `${style.name}: ${theme.name} - ${topic}`;
  
  // Determine if gradient background
  const isGradient = colorScheme.bg.includes('gradient');
  const bgColor = isGradient ? '#FFFFFF' : colorScheme.bg; // Fallback for gradient
  
  // Generate slides with style-specific patterns
  const slides = [];
  
  // Cover slide - style varies by design pattern
  if (style.name === 'Instagram Trendy') {
    slides.push({
      type: 'cover',
      title: topic.toUpperCase(),
      subtitle: 'TRENDING NOW',
      category: theme.name,
      accentColor: colorScheme.accent,
      handle: '@yourhandle',
      fontFamily,
      fontScale: 1.5 + (index % 2) * 0.2,
      backgroundColor: isGradient ? bgColor : colorScheme.bg,
      backgroundImage: isGradient ? undefined : undefined,
      textColor: colorScheme.text,
      mediaType: null,
      mediaAspectRatio: 16 / 9,
      mediaWidthPercent: 100,
      mediaAlignment: 'center',
      elementOrder: layout.order,
      customBlocks: isGradient ? [{
        id: 'gradient-bg',
        html: `<div style="position: absolute; inset: 0; background: ${colorScheme.bg}; z-index: -1;"></div>`,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }] : [],
      textAlign: layout.align,
    });
  } else if (style.name === 'LinkedIn Professional') {
    slides.push({
      type: 'cover',
      title: topic.toUpperCase(),
      subtitle: 'PROFESSIONAL INSIGHTS',
      category: theme.name,
      accentColor: colorScheme.accent,
      handle: '@yourhandle',
      fontFamily,
      fontScale: 1.4 + (index % 2) * 0.1,
      backgroundColor: colorScheme.bg,
      textColor: colorScheme.text,
      mediaType: null,
      mediaAspectRatio: 16 / 9,
      mediaWidthPercent: 100,
      mediaAlignment: 'center',
      elementOrder: layout.order,
      customBlocks: [],
      textAlign: layout.align,
    });
  } else {
    slides.push({
      type: 'cover',
      title: topic.toUpperCase(),
      subtitle: 'GET STARTED',
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
      elementOrder: layout.order,
      customBlocks: [],
      textAlign: layout.align,
    });
  }
  
  // Content slide 1 - Why it matters
  slides.push({
    type: 'content',
    title: `WHY ${topic.toUpperCase()} MATTERS`,
    content: `<p style="font-size: ${1.1 + (index % 2) * 0.1}em; line-height: 1.6;">Understanding ${topic.toLowerCase()} is essential for success. Here's what you need to know to excel.</p>`,
    emoji: '',
    category: theme.name,
    accentColor: colorScheme.accent,
    handle: '@yourhandle',
    fontFamily,
    fontScale: 1.1 + (index % 2) * 0.1,
    backgroundColor: colorScheme.bg === '#FFFFFF' || colorScheme.bg === '#F8F9FA' || colorScheme.bg === '#F3F2EF' 
      ? (isGradient ? '#F8F9FA' : '#F8F9FA') 
      : colorScheme.bg,
    textColor: colorScheme.text,
    mediaType: null,
    mediaAspectRatio: 16 / 9,
    mediaWidthPercent: 100,
    mediaAlignment: 'center',
    elementOrder: layout.order,
    customBlocks: [],
    textAlign: layout.align,
  });
  
  // Content slide 2 - Key principles (varies by style)
  if (style.name === 'Brutalist' || style.name.includes('Bold')) {
    slides.push({
      type: 'content',
      title: 'KEY PRINCIPLES',
      content: `<p style="margin-bottom: 1rem;"><strong style="background: ${colorScheme.accent}; color: ${colorScheme.bg === '#FFFFFF' || colorScheme.bg === '#F8F9FA' ? '#000' : '#FFF'}; padding: 6px 16px; display: inline-block; font-size: 1.2em;">PRINCIPLE #1</strong></p><p style="font-size: 1.1em;">Master these fundamentals to excel in ${topic.toLowerCase()}.</p>`,
      emoji: '',
      category: theme.name,
      accentColor: colorScheme.accent,
      handle: '@yourhandle',
      fontFamily,
      fontScale: 1.2,
      backgroundColor: colorScheme.bg,
      textColor: colorScheme.text,
      mediaType: null,
      mediaAspectRatio: 16 / 9,
      mediaWidthPercent: 100,
      mediaAlignment: 'center',
      elementOrder: layout.order,
      customBlocks: [],
      textAlign: layout.align,
    });
  } else {
    slides.push({
      type: 'content',
      title: 'KEY PRINCIPLES',
      content: `<p style="margin-bottom: 1rem;"><strong style="color: ${colorScheme.accent}; font-size: 1.1em;">Principle 1:</strong> Master the fundamentals</p><p>Understanding core concepts is crucial for ${topic.toLowerCase()} success.</p>`,
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
      elementOrder: layout.order,
      customBlocks: [],
      textAlign: layout.align,
    });
  }
  
  // Content slide 3 - Action steps
  slides.push({
    type: 'content',
    title: 'TAKE ACTION',
    content: `<p style="background: ${colorScheme.accent}${style.name === 'Minimalist' ? '15' : '20'}; padding: 2rem; border-radius: ${style.name === 'Brutalist' ? '0' : '8px'}; margin-top: 1rem; border-left: 4px solid ${colorScheme.accent};"><strong style="font-size: 1.2em;">START TODAY</strong></p><p style="margin-top: 1.5rem;">Apply these ${topic.toLowerCase()} strategies and see immediate results.</p>`,
    emoji: '',
    category: theme.name,
    accentColor: colorScheme.accent,
    handle: '@yourhandle',
    fontFamily,
    fontScale: 1.1,
    backgroundColor: colorScheme.bg === '#FFFFFF' || colorScheme.bg === '#F8F9FA' || colorScheme.bg === '#F3F2EF'
      ? (isGradient ? '#F8F9FA' : '#F8F9FA')
      : colorScheme.bg,
    textColor: colorScheme.text,
    mediaType: null,
    mediaAspectRatio: 16 / 9,
    mediaWidthPercent: 100,
    mediaAlignment: 'center',
    elementOrder: layout.order,
    customBlocks: [],
    textAlign: layout.align,
  });
  
  // Bonus slide for some styles
  if (index % 3 === 0) {
    slides.push({
      type: 'content',
      title: 'PRO TIP',
      content: `<p style="font-size: 1.3em; line-height: 1.8;"><span style="background: ${colorScheme.accent}; color: ${colorScheme.bg === '#FFFFFF' || colorScheme.bg === '#F8F9FA' ? '#000' : '#FFF'}; padding: 8px 16px; display: inline-block; border-radius: 4px;">💡 TIP</span></p><p style="margin-top: 1.5rem; font-size: 1.1em;">The most successful people in ${topic.toLowerCase()} focus on consistency over perfection.</p>`,
      emoji: '💡',
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
      elementOrder: ['emoji', 'title', 'content'],
      customBlocks: [],
      textAlign: 'center',
    });
  }
  
  return {
    id: templateId,
    name: templateName,
    description: `${style.name} template for ${theme.name} - ${topic}. Inspired by modern design trends.`,
    category: theme.name,
    slides,
  };
}

// Generate all 100 templates
function generate100InspiredTemplates() {
  const templates = [];
  let templateIndex = 0;
  
  // Generate templates by combining themes, topics, and styles
  for (let themeIndex = 0; themeIndex < CONTENT_THEMES.length && templateIndex < 100; themeIndex++) {
    const theme = CONTENT_THEMES[themeIndex];
    
    for (let topicIndex = 0; topicIndex < theme.topics.length && templateIndex < 100; topicIndex++) {
      const topic = theme.topics[topicIndex];
      const styleIndex = templateIndex % DESIGN_STYLES.length;
      
      const template = generateTemplate(templateIndex, theme, topic, styleIndex);
      templates.push(template);
      templateIndex++;
    }
  }
  
  // Fill remaining slots with variations
  while (templates.length < 100) {
    const theme = CONTENT_THEMES[templates.length % CONTENT_THEMES.length];
    const topic = theme.topics[templates.length % theme.topics.length];
    const styleIndex = templates.length % DESIGN_STYLES.length;
    
    const template = generateTemplate(
      templates.length,
      theme,
      `${topic} Advanced`,
      styleIndex
    );
    
    templates.push(template);
  }
  
  return templates.slice(0, 100);
}

// Run generator
const templates = generate100InspiredTemplates();

// Write to file with proper encoding
import { writeFileSync } from 'fs';
writeFileSync('generated-100-templates.json', JSON.stringify(templates, null, 2), { encoding: 'utf8' });

console.log(`✅ Generated ${templates.length} templates`);
console.log(`📁 Saved to generated-100-templates.json`);

