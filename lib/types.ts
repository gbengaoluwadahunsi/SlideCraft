// Shared types for carousel/slide data

export interface ElementPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface CustomBlock {
  id: string;
  html: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InfographicData {
  items: string[];
  layout?: 'cards-grid' | 'timeline' | 'process-steps' | 'feature-list' | 'metrics-row' | 'icon-cards' | 'numbered-list' | 'pyramid' | 'cycle' | 'comparison' | 'checklist' | 'quote-highlight';
}

export interface SlideData {
  id: string;
  type: 'cover' | 'content' | 'chart' | 'visual';
  title: string;
  subtitle?: string;
  content?: string;
  emoji?: string;
  icon?: string;
  infographicData?: InfographicData;
  category?: string;
  accentColor?: string;
  handle?: string;
  fontFamily?: string;
  fontScale?: number;
  backgroundColor?: string;
  textColor?: string;
  backgroundImage?: string;
  backgroundOverlayOpacity?: number;
  backgroundImageFilter?: string; // e.g. "brightness(0.5) contrast(1.2)"
  textAlign?: 'left' | 'center' | 'right';
  chartType?: 'bar' | 'line' | 'pie';
  chartData?: Array<{ name: string; value: number; }>;
  mediaType?: 'video' | 'embed' | 'image' | null;
  mediaUrl?: string;
  mediaPosterUrl?: string; // Generated thumbnail for video files
  embedHtml?: string;
  mediaAspectRatio?: number;
  mediaWidthPercent?: number;
  mediaAlignment?: 'left' | 'center' | 'right';
  elementOrder?: string[];
  customBlocks?: CustomBlock[];
  logoUrl?: string | null;
  // Free positioning for main elements (optional - uses flow layout if not set)
  elementPositions?: {
    title?: ElementPosition;
    subtitle?: ElementPosition;
    content?: ElementPosition;
    emoji?: ElementPosition;
    media?: ElementPosition;
  };
  freePositioning?: boolean; // Enable free positioning mode for this slide
  // Styling properties
  textOpacity?: number; // 0-1
  boxShadow?: string; // CSS box-shadow value
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: number;
  textAnimation?: string; // Animation type for text elements (fadeIn, slideUp, zoomIn, etc.)
  // Advanced design properties (for premium templates)
  titleColor?: string;
  slideLabel?: string;
  slideLabelColor?: string;
  showNoise?: boolean;
  glowColor?: string;
  glowPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'center';
  slideNumber?: number;
  totalSlides?: number;
  slidePadding?: number;
  backgroundPattern?: 'grid' | 'dots' | 'none';
  slideJustify?: 'center' | 'start' | 'between' | 'end';
}

export interface Project {
  id: string;
  name: string;
  slides: SlideData[];
  options: any;
  createdAt: string;
  updatedAt: string;
  isShared?: boolean;
  shareToken?: string;
}



