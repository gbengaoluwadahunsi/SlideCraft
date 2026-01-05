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
  layout?: 'icon-grid' | 'process-flow' | 'comparison' | 'stats' | 'radial';
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



