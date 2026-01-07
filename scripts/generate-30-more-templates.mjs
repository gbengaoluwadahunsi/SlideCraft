/**
 * Generate 30 more unique templates
 */

const templates = [];

// Design patterns
const styles = [
  { name: 'Canva Modern', colors: ['#FF6B9D', '#4ECDC4', '#FFC107', '#2196F3', '#FF9800'], fonts: ['var(--font-inter)'] },
  { name: 'LinkedIn Professional', colors: ['#0077B5', '#0A66C2', '#FFD700'], fonts: ['var(--font-oswald)', 'var(--font-inter)'] },
  { name: 'Instagram Trendy', colors: ['#667eea', '#f5576c', '#4facfe', '#43e97b', '#fa709a'], fonts: ['var(--font-oswald)'] },
  { name: 'Creative Artistic', colors: ['#EA4C89', '#1769FF', '#00D4FF', '#FF6B6B', '#4ECDC4'], fonts: ['var(--font-playfair)', 'var(--font-inter)'] },
  { name: 'Minimalist', colors: ['#000000', '#DC143C', '#E94560', '#D946EF'], fonts: ['var(--font-inter)'] },
];

const categories = [
  { name: 'Productivity', topics: ['Time Management', 'Focus', 'Habits', 'Systems', 'Automation', 'Planning'] },
  { name: 'Marketing', topics: ['Content Strategy', 'Social Media', 'Branding', 'SEO', 'Analytics', 'Growth'] },
  { name: 'Design', topics: ['UI/UX', 'Typography', 'Color Theory', 'Layout', 'Branding', 'Creativity'] },
  { name: 'Technology', topics: ['AI', 'Development', 'Tools', 'Trends', 'Innovation', 'Automation'] },
  { name: 'Personal Development', topics: ['Mindset', 'Goals', 'Growth', 'Skills', 'Success', 'Habits'] },
];

let templateIndex = 0;

function generateTemplate(style, category, topic, index) {
  const color = style.colors[index % style.colors.length];
  const font = style.fonts[index % style.fonts.length];
  const isDark = ['#0A66C2', '#667eea', '#f5576c', '#764ba2', '#1A1A1A', '#0A0E27'].includes(color);
  const bgColor = isDark ? color : '#FFFFFF';
  const altBg = isDark ? '#1A1A1A' : '#F8F9FA';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  
  const id = `inspired-${templateIndex + 4}-${category.name.toLowerCase().replace(/\s+/g, '-')}-${topic.toLowerCase().replace(/\s+/g, '-')}`;
  const name = `${style.name}: ${category.name} - ${topic}`;
  
  return {
    id,
    name,
    description: `${style.name} template for ${category.name} - ${topic}. Inspired by modern design trends.`,
    category: category.name,
    slides: [
      {
        type: 'cover',
        title: topic.toUpperCase(),
        subtitle: style.name === 'LinkedIn Professional' ? 'PROFESSIONAL INSIGHTS' : style.name === 'Instagram Trendy' ? 'TRENDING NOW' : 'GET STARTED',
        category: category.name,
        accentColor: color,
        handle: '@yourhandle',
        fontFamily: font,
        fontScale: 1.3 + (index % 3) * 0.1,
        backgroundColor: bgColor,
        textColor: textColor,
        mediaType: null,
        mediaAspectRatio: 16 / 9,
        mediaWidthPercent: 100,
        mediaAlignment: 'center',
        elementOrder: ['title', 'subtitle'],
        customBlocks: [],
        textAlign: 'center',
      },
      {
        type: 'content',
        title: `WHY ${topic.toUpperCase()} MATTERS`,
        content: `<p style="font-size: 1.2em; line-height: 1.6; ${isDark ? 'color: #FFFFFF;' : ''}">Understanding ${topic.toLowerCase()} is essential for success. Here's what you need to know to excel.</p>`,
        emoji: '',
        category: category.name,
        accentColor: color,
        handle: '@yourhandle',
        fontFamily: font,
        fontScale: 1.1 + (index % 2) * 0.1,
        backgroundColor: altBg,
        textColor: textColor,
        mediaType: null,
        mediaAspectRatio: 16 / 9,
        mediaWidthPercent: 100,
        mediaAlignment: 'center',
        elementOrder: ['title', 'content'],
        customBlocks: [],
        textAlign: 'center',
      },
      {
        type: 'content',
        title: 'KEY PRINCIPLES',
        content: style.name.includes('Bold') || style.name === 'Minimalist' 
          ? `<p style="margin-bottom: 1rem;"><strong style="background: ${color}; color: ${isDark ? '#000' : '#FFF'}; padding: 6px 16px; display: inline-block; font-size: 1.2em;">PRINCIPLE #1</strong></p><p style="font-size: 1.1em; ${isDark ? 'color: #FFFFFF;' : ''}">Master these fundamentals to excel in ${topic.toLowerCase()}.</p>`
          : `<p style="margin-bottom: 1rem; ${isDark ? 'color: #FFFFFF;' : ''}"><strong style="color: ${color}; font-size: 1.1em;">Principle 1:</strong> Master the fundamentals</p><p style="${isDark ? 'color: #FFFFFF;' : ''}">Understanding core concepts is crucial for ${topic.toLowerCase()} success.</p>`,
        emoji: '',
        category: category.name,
        accentColor: color,
        handle: '@yourhandle',
        fontFamily: font,
        fontScale: 1.1,
        backgroundColor: bgColor,
        textColor: textColor,
        mediaType: null,
        mediaAspectRatio: 16 / 9,
        mediaWidthPercent: 100,
        mediaAlignment: 'center',
        elementOrder: ['title', 'content'],
        customBlocks: [],
        textAlign: 'center',
      },
      {
        type: 'content',
        title: 'TAKE ACTION',
        content: `<p style="background: ${color}20; padding: 2rem; border-radius: 8px; margin-top: 1rem; border-left: 4px solid ${color}; ${isDark ? 'color: #FFFFFF;' : ''}"><strong style="font-size: 1.2em;">START TODAY</strong></p><p style="margin-top: 1.5rem; ${isDark ? 'color: #FFFFFF;' : ''}">Apply these ${topic.toLowerCase()} strategies and see immediate results.</p>`,
        emoji: '',
        category: category.name,
        accentColor: color,
        handle: '@yourhandle',
        fontFamily: font,
        fontScale: 1.1,
        backgroundColor: altBg,
        textColor: textColor,
        mediaType: null,
        mediaAspectRatio: 16 / 9,
        mediaWidthPercent: 100,
        mediaAlignment: 'center',
        elementOrder: ['title', 'content'],
        customBlocks: [],
        textAlign: 'center',
      },
    ],
  };
}

// Generate 30 templates
for (let i = 0; i < 30; i++) {
  const style = styles[i % styles.length];
  const category = categories[Math.floor(i / 6) % categories.length];
  const topic = category.topics[i % category.topics.length];
  const template = generateTemplate(style, category, topic, i);
  templates.push(template);
  templateIndex++;
}

// Output as TypeScript
console.log('// Generated 30 additional templates\n');
templates.forEach((t, i) => {
  const slidesStr = t.slides.map(s => {
    const props = Object.entries(s).map(([k, v]) => {
      if (v === null) return `        ${k}: null`;
      if (typeof v === 'string') return `        ${k}: '${v.replace(/'/g, "\\'")}'`;
      if (typeof v === 'number') return `        ${k}: ${v}`;
      if (Array.isArray(v)) return `        ${k}: ${JSON.stringify(v)}`;
      if (typeof v === 'object') return `        ${k}: ${JSON.stringify(v)}`;
      return `        ${k}: ${v}`;
    }).join(',\n');
    return `      {\n${props}\n      }`;
  }).join(',\n');
  
  console.log(`  {
    id: '${t.id}',
    name: '${t.name.replace(/'/g, "\\'")}',
    description: '${t.description.replace(/'/g, "\\'")}',
    category: '${t.category}',
    slides: [
${slidesStr}
    ],
  },`);
});

