"use client";

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { EditableText } from './EditableText';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  DndContext, 
  closestCenter,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { GripVertical, Trash2, Upload, Image as ImageIcon, Lightbulb, Target, Rocket, TrendingUp, Users, Shield, Zap, Brain, Puzzle, Trophy, Clock, CheckCircle, Layers, GitBranch, Search, Lock, Globe, Star, Heart, Flag, Compass, Anchor, Award, Briefcase, Calendar, Cloud, Code, Cpu, Database, Download, Edit, Eye, FileText, Folder, Gift, Grid, Key, Layout, Link, List, Mail, Map, Maximize, Monitor, Package, Play, Plus, Power, RefreshCw, Settings, Share, Sliders, Sun, Tag, ThumbsUp, Wrench, UploadCloud, User, Video, Wifi, Scissors, Loader2 } from 'lucide-react';
import { Rnd } from 'react-rnd';
import { Infographic } from './Infographic';

type CustomBlock = {
  id: string;
  html: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

interface ElementPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface SlideProps {
  type: 'cover' | 'content' | 'chart' | 'visual';
  title: string;
  subtitle?: string;
  content?: string;
  emoji?: string;
  icon?: string;
  category?: string;
  handle?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontScale?: number;
  textAlign?: 'left' | 'center' | 'right';
  coverBackgroundColor?: string;
  coverTextColor?: string;
  coverAccentColor?: string;
  backgroundImage?: string;
  backgroundOverlayOpacity?: number;
  backgroundImageFilter?: string;
  isEditable?: boolean;
  onUpdate?: (field: string, value: any) => void;
  // Chart specific props
  chartType?: 'bar' | 'line' | 'pie';
  chartData?: Array<{ name: string; value: number; }>;
  mediaType?: 'video' | 'embed' | 'image' | null;
  mediaUrl?: string;
  mediaPosterUrl?: string;
  embedHtml?: string;
  mediaAspectRatio?: number;
  mediaWidthPercent?: number;
  mediaAlignment?: 'left' | 'center' | 'right';
  elementOrder?: string[];
  customBlocks?: CustomBlock[];
  scale?: number;
  logoUrl?: string | null;
  infographicData?: {
    items: string[];
    layout?: 'cards-grid' | 'timeline' | 'process-steps' | 'feature-list' | 'metrics-row' | 'icon-cards' | 'numbered-list' | 'pyramid' | 'cycle' | 'comparison' | 'checklist' | 'quote-highlight';
  };
  onImagePreview?: (imageUrl: string) => void;
  // Free positioning for main elements
  elementPositions?: {
    title?: ElementPosition;
    subtitle?: ElementPosition;
    content?: ElementPosition;
    emoji?: ElementPosition;
    media?: ElementPosition;
  };
  freePositioning?: boolean;
  // Styling properties
  textOpacity?: number;
  boxShadow?: string;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: number;
}

const sanitizeEmoji = (value: string | undefined | null) => {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
};

// Sanitize handle to strip HTML tags (handles should be plain text)
const sanitizeHandle = (value: string | undefined | null) => {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, '')  // Remove all HTML tags
    .replace(/&nbsp;/gi, ' ') // Replace &nbsp; with space
    .replace(/&amp;/gi, '&')  // Decode &amp;
    .replace(/&lt;/gi, '<')   // Decode &lt;
    .replace(/&gt;/gi, '>')   // Decode &gt;
    .trim();
};


// Sortable Item Component - drag from anywhere, but allow text selection in contenteditable
function SortableItem({ id, children, isEditable, className = '' }: { id: string; children: React.ReactNode; isEditable: boolean; className?: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: !isEditable });

  // Use only translate transform for smoother movement
  // Element moves with cursor during drag, no overlay
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : (transition || 'transform 200ms ease-out'),
    position: 'relative' as const,
    willChange: isDragging ? 'transform' : 'auto',
    zIndex: isDragging ? 50 : 'auto',
  };

  // Create custom listeners that prevent dragging when interacting with contenteditable
  const customListeners = isEditable ? {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      const contentEditable = target.closest('[contenteditable="true"]');
      
      // If clicking directly on a contenteditable element, don't start drag
      // The activation constraint (distance: 8) will handle the rest
      // This allows text selection to work normally
      if (contentEditable && contentEditable === target) {
        // Check if there's already a text selection
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          // User has selected text, don't interfere
          return;
        }
        // Allow the click to go through for text editing
        // The drag will only start if user moves mouse 8px (activation constraint)
      }
      
      // Call the original listener for drag
      if (listeners?.onPointerDown) {
        listeners.onPointerDown(e);
      }
    }
  } : {};

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group/item relative ${className} ${isDragging ? 'cursor-grabbing' : isEditable ? 'cursor-move' : ''}`}
      {...(isEditable ? attributes : {})}
      {...customListeners}
    >
      {children}
    </div>
  );
}

function getYouTubeId(url: string) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
        if (parsed.hostname.includes('youtube.com')) return parsed.searchParams.get('v');
        return null;
    } catch { return null; }
}

export const Slide: React.FC<SlideProps> = ({ 
  type, 
  title, 
  subtitle, 
  content, 
  emoji,
  icon, 
  category = "", 
  handle = "@yourhandle",
  backgroundColor = "#111c24",
  textColor = "#ffffff",
  accentColor = "#ffd700",
  fontFamily = "var(--font-inter)",
  fontScale = 1,
  textAlign = 'left',
  coverBackgroundColor,
  coverTextColor,
  coverAccentColor,
  backgroundImage,
  backgroundOverlayOpacity = 0, // Default to no color tint on images
  backgroundImageFilter = '',
  isEditable = false,
  onUpdate,
  chartType,
  chartData,
  mediaType = null,
  mediaUrl,
  mediaPosterUrl,
  embedHtml,
  mediaAspectRatio = 16 / 9,
  mediaWidthPercent = 100,
  mediaAlignment = 'center',
  elementOrder,
  customBlocks = [],
  scale = 1,
  onImagePreview,
  logoUrl = null,
  infographicData,
  elementPositions,
  freePositioning = true,
  textOpacity,
  boxShadow,
  borderWidth,
  borderColor,
  borderStyle,
  borderRadius,
  ...props
}) => {
  // Track client-side mount to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determine colors based on slide type and overrides
  const activeBgColor = (type === 'cover' && coverBackgroundColor) ? coverBackgroundColor : backgroundColor;
  const activeTextColor = (type === 'cover' && coverTextColor) ? coverTextColor : textColor;
  const activeAccentColor = (type === 'cover' && coverAccentColor) ? coverAccentColor : accentColor;

  // Generate unique ID for style scoping
  const slideId = React.useId().replace(/:/g, '');
  const scopeClass = `slide-${slideId}`;

  // Custom handler to check if we should allow drag - prevents drag from inside contenteditable
  const shouldHandleEvent = (element: Element | null) => {
    // Don't start drag if the event target is inside a contenteditable element
    while (element) {
      if (element.getAttribute?.('contenteditable') === 'true') {
        return false;
      }
      element = element.parentElement;
    }
    return true;
  };

  // Sensors for drag and drop - filtered to not interfere with contenteditable
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8, // Slightly larger distance to better differentiate from text selection
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Icon mapping for visual slides
  const iconMap: Record<string, React.ReactNode> = {
    'lightbulb': <Lightbulb />,
    'target': <Target />,
    'rocket': <Rocket />,
    'chart-line': <TrendingUp />,
    'trending-up': <TrendingUp />,
    'users': <Users />,
    'shield': <Shield />,
    'zap': <Zap />,
    'brain': <Brain />,
    'puzzle': <Puzzle />,
    'trophy': <Trophy />,
    'clock': <Clock />,
    'check-circle': <CheckCircle />,
    'layers': <Layers />,
    'git-branch': <GitBranch />,
    'search': <Search />,
    'lock': <Lock />,
    'globe': <Globe />,
    'star': <Star />,
    'heart': <Heart />,
    'flag': <Flag />,
    'compass': <Compass />,
    'anchor': <Anchor />,
    'award': <Award />,
    'briefcase': <Briefcase />,
    'calendar': <Calendar />,
    'cloud': <Cloud />,
    'code': <Code />,
    'cpu': <Cpu />,
    'database': <Database />,
    'download': <Download />,
    'edit': <Edit />,
    'eye': <Eye />,
    'file': <FileText />,
    'folder': <Folder />,
    'gift': <Gift />,
    'grid': <Grid />,
    'key': <Key />,
    'layout': <Layout />,
    'link': <Link />,
    'list': <List />,
    'mail': <Mail />,
    'map': <Map />,
    'maximize': <Maximize />,
    'monitor': <Monitor />,
    'package': <Package />,
    'play': <Play />,
    'plus': <Plus />,
    'power': <Power />,
    'refresh': <RefreshCw />,
    'settings': <Settings />,
    'share': <Share />,
    'sliders': <Sliders />,
    'sun': <Sun />,
    'tag': <Tag />,
    'thumbs-up': <ThumbsUp />,
    'tool': <Wrench />,
    'upload': <UploadCloud />,
    'user': <User />,
    'video': <Video />,
    'wifi': <Wifi />,
  };

  const getIconComponent = (iconName: string | undefined) => {
    if (!iconName) return <Lightbulb />;
    const normalizedName = iconName.toLowerCase().replace(/_/g, '-');
    return iconMap[normalizedName] || <Lightbulb />;
  };

  // Default orders if not provided
  const getOrder = () => {
      if (elementOrder && elementOrder.length > 0) return elementOrder;
      if (type === 'cover') return ['title', 'subtitle', 'media'];
      if (type === 'chart') return ['emoji', 'title', 'content', 'chart', 'media'];
      if (type === 'visual') return ['icon', 'title', 'infographic', 'media'];
      return ['emoji', 'title', 'content', 'media'];
  };

  const currentOrder = getOrder();

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
        const oldIndex = currentOrder.indexOf(active.id as string);
        const newIndex = currentOrder.indexOf(over.id as string);
        const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
        onUpdate?.('elementOrder', newOrder);
    }
  }, [currentOrder, onUpdate]);

  // Handler for updating element position in free positioning mode
  const handleElementPositionChange = useCallback((elementId: string, position: { x: number; y: number; width?: number; height?: number }) => {
    const newPositions = {
      ...(elementPositions || {}),
      [elementId]: position
    };
    onUpdate?.('elementPositions', newPositions);
  }, [elementPositions, onUpdate]);

  // Get default positions for elements if not set
  const getDefaultPosition = (elementId: string): ElementPosition => {
    const defaults: Record<string, ElementPosition> = {
      emoji: { x: 64, y: 160, width: 100, height: 80 },
      // Title and subtitle use large flexible heights to accommodate multi-line text
      title: { x: 64, y: 260, width: 952, height: 300 }, // Large height to allow wrapping
      subtitle: { x: 64, y: 400, width: 952, height: 200 }, // Large height to allow wrapping
      content: { x: 64, y: 500, width: 952, height: 300 },
      media: { x: 64, y: 700, width: 600, height: 300 },
      chart: { x: 64, y: 500, width: 900, height: 400 },
      icon: { x: 64, y: 160, width: 100, height: 100 },
      infographic: { x: 64, y: 400, width: 952, height: 500 },
    };
    return elementPositions?.[elementId as keyof typeof elementPositions] || defaults[elementId] || { x: 64, y: 200, width: 400, height: 100 };
  };

  const handleCustomBlockChange = useCallback((blockId: string, updates: Partial<CustomBlock>) => {
    if (!onUpdate) return;
    const updatedBlocks = customBlocks.map((block) =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    onUpdate('customBlocks', updatedBlocks);
  }, [customBlocks, onUpdate]);

  const handleRemoveCustomBlock = useCallback((blockId: string) => {
    if (!onUpdate) return;
    const updatedBlocks = customBlocks.filter((block) => block.id !== blockId);
    onUpdate('customBlocks', updatedBlocks);
  }, [customBlocks, onUpdate]);

  // Check if we are in download mode (via props or hidden flag)
  const isDownloading = (props as any)._isDownloading;

  const renderMediaBlock = () => {
    // Re-access isDownloading here to ensure closure capture
    const isDownloading = (props as any)._isDownloading;

    if (!mediaType) return null;
    if (mediaType === 'video' && !mediaUrl) return null;
    if (mediaType === 'embed' && !embedHtml) return null;
    if (mediaType === 'image' && !mediaUrl) return null;

    const isDirectVideo = mediaUrl?.startsWith('blob:') || mediaUrl?.match(/\.(mp4|webm|ogg|mov)$/i);
    const widthPercent = Math.max(20, Math.min(100, mediaWidthPercent ?? 100));
    const justifyContent = mediaAlignment === 'left' ? 'flex-start' : mediaAlignment === 'right' ? 'flex-end' : 'center';
    const outerStyle: React.CSSProperties = { justifyContent };
    const innerStyle: React.CSSProperties = {
        width: `${widthPercent}%`,
        minWidth: '180px',
        maxWidth: '100%',
    };

    const preventDrag = (e: React.DragEvent) => {
        if (!isEditable) return;
        e.stopPropagation();
    };

    // If downloading as image, replace video/iframe with a static placeholder to avoid black screenshots
    if (isDownloading && (mediaType === 'video' || mediaType === 'embed')) {
        return (
          <div className="mt-6 flex w-full" style={outerStyle}>
              <div 
                  className="relative rounded-3xl overflow-hidden bg-black/40 border border-white/20 shadow-2xl flex-shrink-0"
                  style={{ ...innerStyle, aspectRatio: mediaAspectRatio || 16 / 9 }}
              >
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      {/* Check if we have a generated poster (thumbnail) from upload */}
                      {mediaPosterUrl ? (
                           <>
                               <img 
                                  src={mediaPosterUrl}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  alt="Video Thumbnail"
                                  crossOrigin="anonymous" // Essential for capture
                               />
                               {/* Play button overlay */}
                               <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                   <div className="w-24 h-24 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl backdrop-blur-sm">
                                       <div className="w-0 h-0 border-t-[16px] border-t-transparent border-l-[28px] border-l-white border-b-[16px] border-b-transparent ml-2"></div>
                                   </div>
                               </div>
                           </>
                      ) : (
                          <>
                            {/* Static Thumbnail Placeholder (Fallback) */}
                            <div className="flex flex-col items-center gap-4 text-gray-500">
                                {mediaType === 'video' ? <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white"><div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1"></div></div> : <code className="text-xl">Embed Content</code>}
                                <span className="font-medium text-lg uppercase tracking-widest">{mediaType === 'video' ? 'Video' : 'Interactive Embed'}</span>
                            </div>
                            {/* YouTube thumbnail removed during download to avoid CORS issues */}
                            {/* The play button overlay provides sufficient visual indication */}
                            {/* Play button overlay on top of thumbnail */}
                            {mediaType === 'video' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <div className="w-24 h-24 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl backdrop-blur-sm">
                                        <div className="w-0 h-0 border-t-[16px] border-t-transparent border-l-[28px] border-l-white border-b-[16px] border-b-transparent ml-2"></div>
                                    </div>
                                </div>
                            )}
                          </>
                      )}
                  </div>
              </div>
          </div>
        );
    }

    // Handle background removal
    const handleRemoveBackground = async () => {
        if (!mediaUrl || !onUpdate || isRemovingBackground) return;
        
        setIsRemovingBackground(true);
        try {
            const response = await fetch('/api/remove-background', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageUrl: mediaUrl }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Background removal failed');
            }

            const data = await response.json();
            if (data.secure_url) {
                onUpdate('mediaUrl', data.secure_url);
                toast.success('Background removed successfully!');
            }
        } catch (error) {
            console.error('Background removal error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to remove background. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsRemovingBackground(false);
        }
    };

    // Media Actions Overlay (Hover) for Editable Mode
    const MediaOverlay = () => {
        if (!isEditable) return null;
        
        return (
            <div className="absolute inset-0 pointer-events-none z-20">
                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition pointer-events-auto">
                    {mediaType === 'image' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveBackground();
                            }}
                            disabled={isRemovingBackground}
                            className="p-2 bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/50 shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove Background"
                        >
                            {isRemovingBackground ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Scissors size={18} />
                            )}
                        </button>
                    )}
                    <label className="p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 border border-gray-600 cursor-pointer shadow-lg transform hover:scale-105 transition-all" title="Replace Media">
                        {mediaType === 'video' ? <Upload size={18} /> : <ImageIcon size={18} />}
                        <input 
                            type="file" 
                            accept={mediaType === 'video' ? "video/*" : "image/*"}
                            className="hidden" 
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file || !onUpdate) return;
                                
                                const reader = new FileReader();
                                reader.onload = async (event) => {
                                    const result = event.target?.result as string;
                                    const url = URL.createObjectURL(file); // For video
                                    
                                    if (mediaType === 'video') {
                                        onUpdate('mediaUrl', url);
                                    } else {
                                        onUpdate('mediaUrl', result);
                                    }
                                };
                                if (mediaType === 'video') {
                                    const url = URL.createObjectURL(file);
                                    onUpdate('mediaUrl', url);
                                } else {
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </label>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate?.('mediaUrl', undefined);
                            onUpdate?.('mediaType', null);
                        }}
                        className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500 hover:text-white border border-red-500/50 shadow-lg transform hover:scale-105 transition-all"
                        title="Remove Media"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        );
    };

    if (mediaType === 'image' && mediaUrl) {
        // If aspect ratio is 0 or undefined, show image at natural proportions
        const hasAspectRatio = mediaAspectRatio && mediaAspectRatio > 0;
        
        return (
            <div className="mt-6 flex w-full" style={outerStyle}>
                <div
                    className={`relative group overflow-visible flex-shrink-0 ${onImagePreview ? 'cursor-zoom-in' : ''}`}
                    style={{ 
                        ...innerStyle,
                        ...(hasAspectRatio ? { aspectRatio: mediaAspectRatio } : {})
                    }}
                    onDragStart={preventDrag}
                    onClick={(e) => {
                        if (onImagePreview && mediaUrl) {
                            e.stopPropagation();
                            onImagePreview(mediaUrl);
                        }
                    }}
                >
                    <img 
                        src={mediaUrl} 
                        alt="Slide Media" 
                        className={`select-none drop-shadow-lg ${hasAspectRatio ? 'w-full h-full object-contain' : 'max-w-full max-h-[600px] object-contain'}`}
                        draggable={false}
                    />
                    {/* Zoom indicator overlay */}
                    {onImagePreview && (
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                            <div className="bg-black/70 rounded-full p-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                    <path d="M11 8v6" />
                                    <path d="M8 11h6" />
                                </svg>
                            </div>
                        </div>
                    )}
                    <MediaOverlay />
                </div>
            </div>
        );
    }

    const resolvedUrl = (() => {
      if (!mediaUrl) return '';
      try {
        const url = new URL(mediaUrl);
        if (url.hostname.includes('youtube.com') && url.searchParams.get('v')) {
          return `https://www.youtube.com/embed/${url.searchParams.get('v')}`;
        }
        if (url.pathname.includes('/shorts/')) {
            const videoId = url.pathname.split('/shorts/')[1];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.hostname.includes('youtu.be')) {
          return `https://www.youtube.com/embed${url.pathname}`;
        }
        return mediaUrl;
      } catch {
        return mediaUrl;
      }
    })();

    return (
      <div className="mt-6 flex w-full" style={outerStyle}>
        <div
          className="relative group rounded-3xl border border-white/10 bg-black/30 overflow-hidden shadow-xl flex-shrink-0"
          style={{ ...innerStyle, aspectRatio: mediaAspectRatio || 16 / 9 }}
          onDragStart={preventDrag}
        >
          {mediaType === 'video' ? (
          isDirectVideo ? (
             <video 
               src={mediaUrl} 
               className="w-full h-full object-cover"
               controls
               playsInline
               crossOrigin="anonymous" // Important for html-to-image capture
               draggable={false}
               onDragStart={preventDrag}
             />
          ) : (
          <iframe
            src={resolvedUrl}
            title="Embedded media"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            draggable={false}
            onDragStart={preventDrag}
          />
          )
        ) : (
          <div
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: embedHtml || '' }}
            draggable={false}
            onDragStart={preventDrag}
          />
        )}
        <MediaOverlay />
        </div>
      </div>
    );
  };

  const styles = `
    .${scopeClass} strong, .${scopeClass} b { color: ${activeAccentColor}; font-weight: 700; }
    .${scopeClass} em, .${scopeClass} i { background-color: ${activeAccentColor}33; color: ${activeAccentColor}; font-style: normal; padding: 0 4px; border-radius: 4px; }
    .${scopeClass} code { background-color: transparent; color: ${activeAccentColor}; padding: 0 2px; font-family: var(--font-roboto-mono), monospace; font-weight: bold; }
  `;

  const COLORS = [activeAccentColor, '#ff9f40', '#ff6384', '#4bc0c0', '#9966ff'];

  // Static HTML/CSS chart rendering for download mode (html-to-image has issues with Recharts SVG)
  const renderStaticChart = () => {
    if (!chartData || chartData.length === 0) return null;
    const maxVal = Math.max(...chartData.map(d => d.value)) || 1; // Prevent division by zero

    if (chartType === 'bar') {
      return (
        <div className="w-full h-[400px] mt-6 bg-black/20 rounded-3xl p-8 border border-white/10 shadow-inner">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '100%', width: '100%', paddingBottom: '2rem', boxSizing: 'border-box' }}>
            {chartData.map((d, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', height: '100%', justifyContent: 'flex-end', width: `${100 / chartData.length}%` }}>
                <div style={{ fontSize: `${1.25 * fontScale}rem`, fontWeight: 'bold', color: activeTextColor }}>{d.value}</div>
                <div style={{ width: '60%', backgroundColor: activeAccentColor, borderRadius: '8px 8px 0 0', height: `${(d.value / maxVal) * 80}%`, minHeight: '10px' }}></div>
                <div style={{ fontSize: `${1.25 * fontScale}rem`, color: activeTextColor, textAlign: 'center' }}>{d.name}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (chartType === 'line') {
      const width = 700;
      const height = 280;
      const points = chartData.map((d, i) => {
        const x = (i / Math.max(chartData.length - 1, 1)) * width;
        const y = height - ((d.value / maxVal) * height);
        return `${x},${y}`;
      }).join(' ');

      return (
        <div className="w-full h-[400px] mt-6 bg-black/20 rounded-3xl p-8 border border-white/10 shadow-inner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height + 60}`} style={{ overflow: 'visible' }}>
              <line x1="0" y1="0" x2={width} y2="0" stroke="rgba(255,255,255,0.2)" strokeDasharray="5,5" />
              <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="rgba(255,255,255,0.2)" strokeDasharray="5,5" />
              <line x1="0" y1={height} x2={width} y2={height} stroke="rgba(255,255,255,0.3)" />
              <polyline points={points} fill="none" stroke={activeAccentColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              {chartData.map((d, i) => {
                const x = (i / Math.max(chartData.length - 1, 1)) * width;
                const y = height - ((d.value / maxVal) * height);
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="8" fill={activeAccentColor} />
                    <text x={x} y={height + 35} fill={activeTextColor} fontSize={20 * fontScale} textAnchor="middle">{d.name}</text>
                    <text x={x} y={y - 15} fill={activeTextColor} fontSize={18 * fontScale} textAnchor="middle" fontWeight="bold">{d.value}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      );
    }

    if (chartType === 'pie') {
      const total = chartData.reduce((sum, d) => sum + d.value, 0) || 1; // Prevent division by zero
      return (
        <div className="w-full h-[400px] mt-6 bg-black/20 rounded-3xl p-8 border border-white/10 shadow-inner">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            {chartData.map((d, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', minWidth: '140px', borderLeft: `4px solid ${COLORS[i % COLORS.length]}` }}>
                <div style={{ fontSize: `${2.5 * fontScale}rem`, fontWeight: 'bold', color: COLORS[i % COLORS.length] }}>{Math.round((d.value / total) * 100)}%</div>
                <div style={{ fontSize: `${1.1 * fontScale}rem`, color: activeTextColor, textAlign: 'center' }}>{d.name}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderChart = () => {
    if (!chartData || chartData.length === 0) return null;

    // Use static HTML/CSS charts for download mode (Recharts SVG doesn't capture well with html-to-image)
    if (isDownloading) {
      return renderStaticChart();
    }

    const chartContent = (() => {
        switch (chartType) {
        case 'bar':
            return (
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff33" vertical={false} />
                <XAxis 
                dataKey="name" 
                tick={{ fill: activeTextColor, fontSize: 24 * fontScale }} 
                axisLine={{ stroke: activeTextColor }}
                tickLine={{ stroke: activeTextColor }}
                />
                <YAxis 
                tick={{ fill: activeTextColor, fontSize: 24 * fontScale }} 
                axisLine={{ stroke: activeTextColor }}
                tickLine={{ stroke: activeTextColor }}
                />
                <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '20px' }}
                itemStyle={{ color: '#ffffff' }}
                labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '4px' }}
                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                />
                <Bar dataKey="value" fill={activeAccentColor} radius={[8, 8, 0, 0]} />
            </BarChart>
            );
        case 'line':
            return (
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff33" vertical={false} />
                <XAxis 
                dataKey="name" 
                tick={{ fill: activeTextColor, fontSize: 24 * fontScale }} 
                axisLine={{ stroke: activeTextColor }}
                tickLine={{ stroke: activeTextColor }}
                />
                <YAxis 
                tick={{ fill: activeTextColor, fontSize: 24 * fontScale }} 
                axisLine={{ stroke: activeTextColor }}
                tickLine={{ stroke: activeTextColor }}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '20px' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '4px' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.3)' }}
                />
                <Line 
                type="monotone" 
                dataKey="value" 
                stroke={activeAccentColor} 
                strokeWidth={6} 
                dot={{ fill: activeAccentColor, r: 8 }} 
                activeDot={{ r: 10 }}
                />
            </LineChart>
            );
        case 'pie':
            return (
            <PieChart>
                <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={250}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '20px' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '4px' }}
                />
            </PieChart>
            );
        default:
            return null;
        }
    })();

    return (
        <div className="w-full h-[400px] mt-6 bg-black/20 rounded-3xl p-8 border border-white/10 shadow-inner">
             <ResponsiveContainer width="100%" height="100%">
                {chartContent}
             </ResponsiveContainer>
        </div>
    );
  };

  // Helper functions for table manipulation
  const isTableBlock = (html: string) => html.includes('<table');
  
  const addTableRow = (block: CustomBlock) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(block.html, 'text/html');
    const table = doc.querySelector('table');
    if (!table) return;
    
    const lastRow = table.querySelector('tr:last-child');
    if (!lastRow) return;
    
    const newRow = lastRow.cloneNode(true) as HTMLTableRowElement;
    // Reset cell content to "Cell"
    newRow.querySelectorAll('td').forEach(cell => {
      cell.textContent = 'Cell';
      cell.style.fontWeight = 'normal';
      cell.style.background = 'transparent';
    });
    table.appendChild(newRow);
    
    handleCustomBlockChange(block.id, { 
      html: table.outerHTML,
      height: block.height + 50
    });
  };
  
  const addTableColumn = (block: CustomBlock) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(block.html, 'text/html');
    const table = doc.querySelector('table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, index) => {
      const lastCell = row.querySelector('td:last-child, th:last-child');
      if (!lastCell) return;
      
      const newCell = lastCell.cloneNode(true) as HTMLTableCellElement;
      newCell.textContent = index === 0 ? `Header ${row.children.length + 1}` : 'Cell';
      row.appendChild(newCell);
    });
    
    handleCustomBlockChange(block.id, { 
      html: table.outerHTML,
      width: block.width + 100
    });
  };
  
  const removeTableRow = (block: CustomBlock) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(block.html, 'text/html');
    const table = doc.querySelector('table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    if (rows.length <= 1) return; // Keep at least one row
    
    rows[rows.length - 1].remove();
    
    handleCustomBlockChange(block.id, { 
      html: table.outerHTML,
      height: Math.max(block.height - 50, 70)
    });
  };
  
  const removeTableColumn = (block: CustomBlock) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(block.html, 'text/html');
    const table = doc.querySelector('table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    const firstRowCells = rows[0]?.querySelectorAll('td, th');
    if (!firstRowCells || firstRowCells.length <= 1) return; // Keep at least one column
    
    rows.forEach(row => {
      const lastCell = row.querySelector('td:last-child, th:last-child');
      if (lastCell) lastCell.remove();
    });
    
    handleCustomBlockChange(block.id, { 
      html: table.outerHTML,
      width: Math.max(block.width - 100, 160)
    });
  };

  const renderCustomBlocks = () => {
    if (!customBlocks?.length) return null;

    return customBlocks.map((block) => {
      const isTable = isTableBlock(block.html);
      
      if (isEditable) {
        return (
          <Rnd
            key={block.id}
            bounds="parent"
            scale={scale}
            size={{ width: block.width, height: block.height }}
            position={{ x: block.x, y: block.y }}
            onDragStop={(_, data) => handleCustomBlockChange(block.id, { x: data.x, y: data.y })}
            onResizeStop={(_, __, ref, ___, position) =>
              handleCustomBlockChange(block.id, {
                width: parseFloat(ref.style.width),
                height: parseFloat(ref.style.height),
                x: position.x,
                y: position.y,
              })
            }
            dragHandleClassName="drag-handle"
            minWidth={isTable ? 200 : 160}
            minHeight={isTable ? 60 : 40}
            className={`pointer-events-auto group/block ${isTable ? 'table-block' : ''}`}
            style={{ zIndex: 40, touchAction: 'none' }}
            cancel=".editable-text, .table-controls"
            enableResizing={isTable ? {
              top: true,
              right: true,
              bottom: true,
              left: true,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
              topLeft: true,
            } : {
              top: false,
              right: true,
              bottom: true,
              left: false,
              topRight: false,
              bottomRight: true,
              bottomLeft: false,
              topLeft: false,
            }}
          >
            <div className="w-full h-full relative group">
              <div
                className="drag-handle absolute -top-3 -left-3 w-8 h-8 bg-[#ffd700] rounded-full flex items-center justify-center cursor-move shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Drag to move"
              >
                <GripVertical size={16} className="text-black" />
              </div>
              <button
                onClick={() => handleRemoveCustomBlock(block.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                title="Delete block"
              >
                <Trash2 size={12} />
              </button>
              
              {/* Table Controls - show only for table blocks */}
              {isTable && (
                <div className="table-controls absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(e) => { e.stopPropagation(); addTableRow(block); }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-medium shadow-lg"
                    title="Add Row"
                  >
                    + Row
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTableRow(block); }}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded font-medium shadow-lg"
                    title="Remove Row"
                  >
                    - Row
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); addTableColumn(block); }}
                    className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded font-medium shadow-lg"
                    title="Add Column"
                  >
                    + Col
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTableColumn(block); }}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded font-medium shadow-lg"
                    title="Remove Column"
                  >
                    - Col
                  </button>
                </div>
              )}
              
              <div className="w-full h-full text-left overflow-visible cursor-text p-2 editable-text">
                <EditableText
                  tagName="div"
                  className="leading-relaxed w-full h-full overflow-visible editable-text"
                  style={{
                    color: activeTextColor,
                    overflow: 'visible',
                    fontSize: isTable ? '1rem' : `${2.25 * fontScale}rem`,
                  }}
                  html={block.html}
                  onChange={(val) => {
                    // Auto-delete if content is empty (but not for tables)
                    const strippedVal = val.replace(/<[^>]*>/g, '').trim();
                    if (!strippedVal && !isTableBlock(val)) {
                      handleRemoveCustomBlock(block.id);
                    } else {
                      handleCustomBlockChange(block.id, { html: val });
                    }
                  }}
                  placeholder="Text block"
                />
              </div>
            </div>
          </Rnd>
        );
      }

      // For non-editable view (download/export), only render if block has actual content
      const strippedContent = block.html
        ?.replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/gi, ' ') // Replace &nbsp; with space
        .replace(/\u200B/g, '') // Remove zero-width spaces
        .trim();
      
      // Only skip if truly empty
      if (!strippedContent) {
        return null;
      }

      return (
        <div
          key={block.id}
          style={{
            position: 'absolute',
            left: `${block.x}px`,
            top: `${block.y}px`,
            width: `${block.width}px`,
            height: `${block.height}px`,
            zIndex: 40,
          }}
        >
          <div 
            style={{ 
              width: '100%',
              height: '100%',
              textAlign: 'left',
              fontSize: `${2.25 * fontScale}rem`, // Match slide content size
              lineHeight: 1.6,
              color: activeTextColor,
              overflow: 'visible',
              padding: '0.5rem',
            }}
            dangerouslySetInnerHTML={{ __html: block.html }}
          />
        </div>
      );
    });
  };

  // Element Renderers Map
  const renderElement = (id: string) => {
      switch (id) {
        case 'emoji': {
            const emojiValue = sanitizeEmoji(emoji);
            // Only render emoji container if there's actually an emoji value
            // No placeholder - user must explicitly add an emoji
            if (!emojiValue && !isEditable) return null;
            if (!emojiValue && isEditable) {
                // In edit mode with no emoji, show a subtle add button instead of placeholder
                return (
                    <div 
                        className="mb-6 opacity-30 hover:opacity-60 transition cursor-pointer group"
                        style={{ fontSize: `${3.75 * fontScale}rem` }}
                        onClick={() => onUpdate?.('emoji', '✨')}
                        title="Click to add emoji"
                    >
                        <span className="text-gray-500 text-lg">+ Add emoji</span>
                    </div>
                );
            }
            return (
                <div className="mb-6" style={{ fontSize: `${3.75 * fontScale}rem` }}>
                    {isEditable ? (
                        <EditableText 
                            html={emojiValue}
                            onChange={(val) => onUpdate?.('emoji', sanitizeEmoji(val))}
                            tagName="div"
                            placeholder=""
                        />
                    ) : (
                        emojiValue
                    )}
                </div>
            );
        }
        case 'icon':
            // Render icon for visual slides
            if (type !== 'visual' || !icon) return null;
            return (
                <div 
                    className="mb-8 flex items-center justify-center"
                    style={{ 
                        color: activeAccentColor,
                    }}
                >
                    <div 
                        className="p-6 rounded-2xl"
                        style={{ 
                            backgroundColor: `${activeAccentColor}20`,
                            border: `2px solid ${activeAccentColor}40`,
                        }}
                    >
                        <div style={{ width: `${5 * fontScale}rem`, height: `${5 * fontScale}rem` }}>
                            {React.cloneElement(getIconComponent(icon) as React.ReactElement, {
                                style: { width: '100%', height: '100%' },
                                strokeWidth: 1.5,
                            })}
                        </div>
                    </div>
                </div>
            );
        case 'title':
            // Strip HTML to check for actual content
            const titleStripped = title?.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
            // Visual slides default to centered text
            const titleAlign = type === 'visual' ? 'center' : textAlign;
            return isEditable ? (
                <EditableText 
                    tagName="h1"
                    className="font-bold leading-tight tracking-tight mb-6"
                    style={{ 
                        color: activeAccentColor, // Consistent color for simplicity in dynamic order
                        fontSize: type === 'cover' ? `${4.5 * fontScale}rem` : `${3 * fontScale}rem`,
                        textShadow: backgroundImage ? '0 4px 12px rgba(0,0,0,0.5)' : 'none',
                        textAlign: titleAlign,
                        opacity: textOpacity !== undefined ? textOpacity : 1,
                        // Removed boxShadow, borders, and borderRadius for cleaner text
                    }}
                    html={title}
                    onChange={(val) => onUpdate?.('title', val)}
                    placeholder="Title"
                />
            ) : titleStripped ? (
                <h1 
                    className="font-bold leading-tight tracking-tight mb-6" 
                    style={{ 
                        color: activeAccentColor,
                        fontSize: type === 'cover' ? `${4.5 * fontScale}rem` : `${3 * fontScale}rem`,
                        textShadow: backgroundImage ? '0 4px 12px rgba(0,0,0,0.5)' : 'none',
                        textAlign: titleAlign,
                        opacity: textOpacity !== undefined ? textOpacity : 1,
                        // Removed boxShadow, borders, and borderRadius for cleaner text
                    }}
                    dangerouslySetInnerHTML={{ __html: title }}
                />
            ) : null;
        case 'subtitle':
            const subtitleStripped = subtitle?.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
            return (subtitle || isEditable) ? (
                isEditable ? (
                    <EditableText
                        tagName="div"
                        className="font-light leading-relaxed opacity-80 mb-6"
                        style={{ 
                            color: activeTextColor,
                            fontSize: `${2.25 * fontScale}rem`,
                            textShadow: backgroundImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                            textAlign: textAlign,
                            opacity: textOpacity !== undefined ? textOpacity : 0.8,
                            // Removed boxShadow, borders, and borderRadius for cleaner text
                        }}
                        html={subtitle || ''}
                        onChange={(val) => onUpdate?.('subtitle', val)}
                        placeholder="Subtitle"
                    />
                ) : subtitleStripped ? (
                    <div 
                        className="font-light leading-relaxed opacity-80 mb-6" 
                        style={{ 
                            color: activeTextColor,
                            fontSize: `${2.25 * fontScale}rem`,
                            textShadow: backgroundImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                            textAlign: textAlign,
                            opacity: textOpacity !== undefined ? textOpacity : 0.8,
                            // Removed boxShadow, borders, and borderRadius for cleaner text
                        }}
                        dangerouslySetInnerHTML={{ __html: subtitle }}
                    />
                ) : null
            ) : null;
        case 'content':
            const contentStripped = content?.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
            // Visual slides have centered, larger content with special styling
            const isVisualSlide = type === 'visual';
            const contentFontSize = isVisualSlide ? `${2.5 * fontScale}rem` : `${2.25 * fontScale}rem`;
            const contentAlign = isVisualSlide ? 'center' : textAlign;
            return (content || isEditable) ? (
                 <div className={`flex-1 ${isVisualSlide ? 'flex flex-col items-center justify-center' : ''}`}>
                    {isEditable ? (
                        <EditableText 
                            tagName="div"
                            className={`slide-content leading-relaxed font-light mb-6 ${isVisualSlide ? 'visual-content' : ''}`}
                            style={{ 
                                color: activeTextColor,
                                fontSize: contentFontSize,
                                textShadow: backgroundImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                                textAlign: contentAlign,
                                opacity: textOpacity !== undefined ? textOpacity : 1,
                                // Removed boxShadow, borders, and borderRadius for cleaner text
                            }} 
                            html={content || ''}
                            onChange={(val) => onUpdate?.('content', val)}
                            placeholder="Content..."
                        />
                    ) : contentStripped ? (
                        <div 
                            className={`slide-content leading-relaxed font-light mb-6 ${isVisualSlide ? 'visual-content' : ''}`}
                            style={{ 
                                color: activeTextColor,
                                fontSize: contentFontSize,
                                textShadow: backgroundImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                                textAlign: contentAlign,
                                opacity: textOpacity !== undefined ? textOpacity : 1,
                                // Removed boxShadow, borders, and borderRadius for cleaner text
                            }} 
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    ) : null}
                 </div>
            ) : null;
        case 'infographic':
            // Render programmatic infographic for visual slides
            if (!infographicData || !infographicData.items || infographicData.items.length < 1) {
              return null;
            }
            return (
              <div className="flex-1 w-full rounded-2xl overflow-hidden my-4 relative" style={{ minHeight: '400px' }}>
                <div className="relative z-10 h-full">
                  <Infographic
                    items={infographicData.items}
                    layout={infographicData.layout || 'cards-grid'}
                    accentColor={activeAccentColor}
                    backgroundColor={activeBgColor}
                    textColor={activeTextColor}
                  />
                </div>
              </div>
            );
        case 'media':
            return renderMediaBlock();
        case 'chart':
            return renderChart();
        default:
            return null;
      }
  };

  return (
    <motion.div 
      className={`w-[1080px] h-[1080px] flex flex-col relative overflow-hidden shrink-0 ${scopeClass}`}
      style={{
        // If there's a background image, use a fallback dark color; otherwise use the selected color
        backgroundColor: backgroundImage ? '#0a0a0a' : activeBgColor, 
        color: activeTextColor,
        fontFamily: fontFamily,
        userSelect: isEditable ? 'text' : 'none',
        WebkitUserSelect: isEditable ? 'text' : 'none',
      }}
      initial={isDownloading ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={isDownloading ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
    >
      <style>{styles}</style>
      
      {/* Background Image Layer - fully covers when present */}
      {backgroundImage && (
        <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
            style={{ 
                backgroundImage: `url(${backgroundImage})`,
                filter: backgroundImageFilter || 'none'
            }}
        />
      )}

      {/* Optional Color Overlay on top of background image - only if user has enabled it */}
      {/* Default opacity is 0 (no tint), user can increase to add color tint */}
      {backgroundImage && backgroundOverlayOpacity > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{ backgroundColor: activeBgColor, opacity: backgroundOverlayOpacity }}
        />
      )}

      {/* Category Pill */}
      {category && category.trim() !== "" && (
        <motion.div 
          className="absolute top-16 left-16 z-10"
          initial={isDownloading ? false : { opacity: 0, x: -20, rotate: -5 }}
          animate={{ opacity: 1, x: 0, rotate: -1 }}
          transition={isDownloading ? { duration: 0 } : { duration: 0.5, delay: 0.2 }}
        >
           {isEditable ? (
             <div className="px-8 py-3 rounded-full tracking-widest uppercase shadow-md inline-block transform -rotate-1"
                style={{ 
                    fontFamily: 'var(--font-permanent-marker)',
                    backgroundColor: activeAccentColor,
                    color: 'black',
                    fontSize: `${1.5 * fontScale}rem`
                }}
             >
                <EditableText 
                    html={category} 
                    onChange={(val) => onUpdate?.('category', val)}
                    tagName="span"
                />
             </div>
           ) : (
            <span 
                className="px-8 py-3 rounded-full tracking-widest uppercase shadow-md inline-block transform -rotate-1"
                style={{ 
                    fontFamily: 'var(--font-permanent-marker)',
                    backgroundColor: activeAccentColor,
                    color: 'black',
                    fontSize: `${1.5 * fontScale}rem`
                }}
            >
                {category}
            </span>
           )}
        </motion.div>
      )}

      {/* Brand Logo */}
      {logoUrl && (
        <motion.div 
          className="absolute top-16 right-16 z-10"
          initial={isDownloading ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={isDownloading ? { duration: 0 } : { duration: 0.5, delay: 0.3 }}
        >
          <img 
            src={logoUrl} 
            alt="Brand Logo" 
            className="max-h-20 max-w-48 object-contain drop-shadow-lg"
            style={{ 
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
              opacity: 0.9
            }}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        </motion.div>
      )}

      {/* Custom Blocks Layer - only render container when there are blocks */}
      {customBlocks && customBlocks.length > 0 && (
        <div 
          className="absolute z-30 pointer-events-none"
          style={{
            top: 0,
            left: 0,
            width: '1080px',
            height: '1080px',
          }}
        >
          {renderCustomBlocks()}
        </div>
      )}

      {/* Main Content Area */}
      {freePositioning && isEditable && isMounted ? (
        /* Free Positioning Mode - elements can be dragged anywhere (editable) */
        <div className="absolute inset-0 z-10 pointer-events-none" style={{ top: 0, left: 0, width: '1080px', height: '1080px' }}>
          {currentOrder.map((itemId) => {
            const pos = getDefaultPosition(itemId);
            const element = renderElement(itemId);
            if (!element) return null;
            
            // Title and subtitle should allow content to overflow and expand naturally
            const isTextElement = itemId === 'title' || itemId === 'subtitle';
            
            return (
              <Rnd
                key={itemId}
                bounds="parent"
                scale={scale}
                size={{ width: pos.width || 400, height: pos.height || 100 }}
                position={{ x: pos.x, y: pos.y }}
                onDragStop={(_, data) => handleElementPositionChange(itemId, { ...pos, x: data.x, y: data.y })}
                onResizeStop={(_, __, ref, ___, position) =>
                  handleElementPositionChange(itemId, {
                    x: position.x,
                    y: position.y,
                    width: parseFloat(ref.style.width),
                    height: parseFloat(ref.style.height),
                  })
                }
                dragHandleClassName="free-drag-handle"
                minWidth={100}
                minHeight={40}
                className="pointer-events-auto group/element"
                style={{ zIndex: 20, touchAction: 'none' }}
                enableResizing={{
                  top: false,
                  right: true,
                  bottom: true,
                  left: false,
                  topRight: false,
                  bottomRight: true,
                  bottomLeft: false,
                  topLeft: false,
                }}
              >
                <div className="w-full h-full relative group">
                  <div
                    className="free-drag-handle absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#ffd700] rounded-full flex items-center justify-center gap-1.5 cursor-move shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50"
                    title="Drag to move anywhere"
                  >
                    <GripVertical size={18} className="text-black" />
                    <span className="text-sm font-bold text-black">Move</span>
                  </div>
                  <div className={`w-full h-full ${isTextElement ? 'overflow-visible' : 'overflow-hidden'}`}>
                    {element}
                  </div>
                </div>
              </Rnd>
            );
          })}
        </div>
      ) : freePositioning ? (
        /* Free Positioning Mode - static render for export/download */
        <div className="absolute inset-0 z-10" style={{ top: 0, left: 0, width: '1080px', height: '1080px' }}>
          {currentOrder.map((itemId) => {
            const pos = getDefaultPosition(itemId);
            const element = renderElement(itemId);
            if (!element) return null;
            
            // Title and subtitle should allow content to overflow and expand naturally
            const isTextElement = itemId === 'title' || itemId === 'subtitle';
            
            return (
              <div
                key={itemId}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  width: pos.width || 400,
                  height: pos.height || 100,
                  overflow: isTextElement ? 'visible' : 'hidden',
                }}
              >
                {element}
              </div>
            );
          })}
        </div>
      ) : (
        /* Flow Layout Mode - elements stack vertically and can be reordered */
        <div className={`flex-1 px-16 pt-48 pb-24 relative z-10 flex flex-col ${type === 'cover' ? 'justify-center' : 'justify-start'} h-full overflow-visible`}>
          {isEditable && isMounted ? (
              <DndContext 
                  sensors={sensors} 
                  collisionDetection={rectIntersection} 
                  onDragEnd={handleDragEnd}
              >
                  <SortableContext 
                      items={currentOrder} 
                      strategy={verticalListSortingStrategy}
                  >
                      {currentOrder.map((itemId) => (
                          <SortableItem key={itemId} id={itemId} isEditable={isEditable} className={itemId === 'content' ? 'flex-1' : ''}>
                              {renderElement(itemId)}
                          </SortableItem>
                      ))}
                  </SortableContext>
              </DndContext>
          ) : (
              <>
                  {currentOrder.map((itemId) => (
                      <div key={itemId} className={`relative ${itemId === 'content' ? 'flex-1' : ''}`}>
                          {renderElement(itemId)}
                      </div>
                  ))}
              </>
          )}
        </div>
      )}

      {/* Footer / Handle */}
      <motion.div 
        className="absolute bottom-12 right-16 font-medium tracking-wide opacity-60 z-10"
        style={{ fontSize: `${1.25 * fontScale}rem` }}
        initial={isDownloading ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={isDownloading ? { duration: 0 } : { duration: 0.5, delay: 0.3 }}
      >
         {isEditable ? (
            <EditableText 
               html={sanitizeHandle(handle) || ''}
               onChange={(val) => onUpdate?.('handle', sanitizeHandle(val))}
               tagName="div"
               placeholder="@yourhandle"
            />
         ) : (
            sanitizeHandle(handle)
         )}
      </motion.div>

    </motion.div>
  );
};
