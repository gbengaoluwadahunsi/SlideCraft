import { z } from 'zod';

export const slideTypeSchema = z.enum(['cover', 'content', 'chart', 'visual']);

export const mediaTypeSchema = z.enum(['video', 'embed', 'image']).nullable();

export const elementPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const customBlockSchema = z.object({
  id: z.string(),
  html: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const chartDataItemSchema = z.object({
  name: z.string(),
  value: z.number(),
});

export const infographicDataSchema = z.object({
  items: z.array(z.string()),
  layout: z.enum([
    'cards-grid',
    'timeline',
    'process-steps',
    'feature-list',
    'metrics-row',
    'icon-cards',
    'numbered-list',
    'pyramid',
    'cycle',
    'comparison',
    'checklist',
    'quote-highlight',
  ]).optional(),
});

export const slideDataSchema = z.object({
  id: z.string(),
  type: slideTypeSchema,
  title: z.string(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  emoji: z.string().optional(),
  icon: z.string().optional(),
  infographicData: infographicDataSchema.optional(),
  category: z.string().optional(),
  accentColor: z.string().optional(),
  handle: z.string().optional(),
  fontFamily: z.string().optional(),
  fontScale: z.number().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundOverlayOpacity: z.number().optional(),
  backgroundImageFilter: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  chartType: z.enum(['bar', 'line', 'pie']).optional(),
  chartData: z.array(chartDataItemSchema).optional(),
  mediaType: mediaTypeSchema,
  mediaUrl: z.string().optional(),
  mediaPosterUrl: z.string().optional(),
  embedHtml: z.string().optional(),
  mediaAspectRatio: z.number().optional(),
  mediaWidthPercent: z.number().optional(),
  mediaAlignment: z.enum(['left', 'center', 'right']).optional(),
  elementOrder: z.array(z.string()).optional(),
  customBlocks: z.array(customBlockSchema).optional(),
  logoUrl: z.string().nullable().optional(),
  elementPositions: z.record(z.string(), elementPositionSchema).optional(),
  freePositioning: z.boolean().optional(),
  textOpacity: z.number().optional(),
  boxShadow: z.string().optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
  borderStyle: z.enum(['solid', 'dashed', 'dotted', 'none']).optional(),
  borderRadius: z.number().optional(),
  textAnimation: z.string().optional(),
  titleColor: z.string().optional(),
  slideLabel: z.string().optional(),
  slideLabelColor: z.string().optional(),
  showNoise: z.boolean().optional(),
  glowColor: z.string().optional(),
  glowPosition: z.enum(['top-right', 'bottom-right', 'top-left', 'bottom-left', 'center']).optional(),
  slideNumber: z.number().optional(),
  totalSlides: z.number().optional(),
  slidePadding: z.number().optional(),
  backgroundPattern: z.enum(['grid', 'dots', 'none']).optional(),
  slideJustify: z.enum(['center', 'start', 'between', 'end']).optional(),
});

export const slidesArraySchema = z.array(slideDataSchema);

export const projectOptionsSchema = z.object({
  category: z.string().optional(),
  handle: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().optional(),
  fontScale: z.number().optional(),
  coverBackgroundColor: z.string().optional(),
  coverTextColor: z.string().optional(),
  coverAccentColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundOverlayOpacity: z.number().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  slides: slidesArraySchema.optional(),
  options: projectOptionsSchema.optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slides: slidesArraySchema.optional(),
  options: projectOptionsSchema.optional(),
});

export const exportOptionsSchema = z.object({
  format: z.enum(['pdf', 'ppt']).default('pdf'),
  mode: z.enum(['puppeteer', 'client-side-images']).default('puppeteer'),
  category: z.string().optional(),
  handle: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().optional(),
  fontScale: z.number().optional(),
  coverBackgroundColor: z.string().optional(),
  coverTextColor: z.string().optional(),
  coverAccentColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundOverlayOpacity: z.number().optional(),
});

export const exportRequestSchema = z.object({
  slides: slidesArraySchema,
  options: exportOptionsSchema.optional(),
});

export const generateRequestSchema = z.object({
  text: z.string().min(1),
  slideCount: z.number().int().min(3).max(100).default(6),
  wordCount: z.number().optional(),
  writingStyle: z.string().optional(),
  slideStyle: z.enum(['text', 'visual', 'mixed']).default('mixed'),
  sections: z.array(z.string()).optional(),
  language: z.string().default('en'),
  tone: z.enum(['neutral', 'professional', 'casual', 'humorous']).default('neutral'),
  autoHashtags: z.boolean().default(false),
  smartColors: z.boolean().default(false),
  accessibility: z.boolean().default(false),
  includeStats: z.boolean().default(false),
  patternOrder: z.array(z.string()).optional(),
  creativeAngle: z.number().int().min(0).max(11).optional(),
  accentColor: z.string().optional(),
  textColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  audience: z.string().default(''),
  goal: z.string().default(''),
});

export const brandSettingsSchema = z.object({
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  fontFamily: z.string().optional(),
  logoUrl: z.string().optional(),
});

export const uploadSchema = z.object({
  file: z.instanceof(File).optional(),
});

export type SlideData = z.infer<typeof slideDataSchema>;
export type ProjectOptions = z.infer<typeof projectOptionsSchema>;
export type BrandSettings = z.infer<typeof brandSettingsSchema>;
export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type ExportRequest = z.infer<typeof exportRequestSchema>;
