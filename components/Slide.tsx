"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { EditableText } from './EditableText';
import { motion } from 'framer-motion';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation
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
import { GripVertical, Trash2, Upload, Image as ImageIcon, Lightbulb, Target, Rocket, TrendingUp, Users, Shield, Zap, Brain, Puzzle, Trophy, Clock, CheckCircle, Layers, GitBranch, Search, Lock, Globe, Star, Heart, Flag, Compass, Anchor, Award, Briefcase, Calendar, Cloud, Code, Cpu, Database, Download, Edit, Eye, FileText, Folder, Gift, Grid, Key, Layout, Link, List, Mail, Map, Maximize, Monitor, Package, Play, Plus, Power, RefreshCw, Settings, Share, Sliders, Sun, Tag, ThumbsUp, Wrench, UploadCloud, User, Video, Wifi } from 'lucide-react';
import { Rnd } from 'react-rnd';
import { Infographic } from './Infographic';

// Fast, clean drop animation
const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '1',
      },
    },
  }),
  duration: 150,
  easing: 'ease-out',
};

type CustomBlock = {
  id: string;
  html: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

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


// Sortable Item Component - drag ONLY from handle, not content
function SortableItem({ id, children, isEditable, className = '' }: { id: string; children: React.ReactNode; isEditable: boolean; className?: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: !isEditable });

  // Use only translate transform for smoother movement
  // Only apply transition when NOT dragging (for return animation)
  // During drag, no transition = instant response = smooth dragging
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : (transition || 'transform 200ms ease-out'),
    opacity: isDragging ? 0 : 1, // Hide original when dragging (overlay shows the moving element)
    position: 'relative' as const,
    willChange: isDragging ? 'transform' : 'auto',
  };

  // IMPORTANT: listeners are ONLY on the drag handle, not the container
  // This allows normal text selection inside contenteditable elements
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group/item relative ${className} ${isDragging ? 'z-0' : ''}`}
    >
      {isEditable && (
        <div 
            ref={setActivatorNodeRef}
            {...attributes} 
            {...listeners} 
            className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white cursor-grab active:cursor-grabbing opacity-0 group-hover/item:opacity-100 transition-opacity z-50"
            title="Drag to move"
        >
            <GripVertical size={16} />
        </div>
      )}
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
  backgroundOverlayOpacity = 0.5,
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
  ...props
}) => {
  // Track client-side mount to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  // Track which item is being dragged for the DragOverlay
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
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

  const handleDragStart = (event: DragStartEvent) => {
    // Cancel drag if it originated from a contenteditable element
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement?.closest('[contenteditable="true"]') || activeElement?.isContentEditable) {
      return;
    }
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (active.id !== over?.id && over) {
        const oldIndex = currentOrder.indexOf(active.id as string);
        const newIndex = currentOrder.indexOf(over.id as string);
        const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
        onUpdate?.('elementOrder', newOrder);
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const handleCustomBlockChange = (blockId: string, updates: Partial<CustomBlock>) => {
    if (!onUpdate) return;
    const updatedBlocks = customBlocks.map((block) =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    onUpdate('customBlocks', updatedBlocks);
  };

  const handleRemoveCustomBlock = (blockId: string) => {
    if (!onUpdate) return;
    const updatedBlocks = customBlocks.filter((block) => block.id !== blockId);
    onUpdate('customBlocks', updatedBlocks);
  };

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

    // Media Actions Overlay (Hover) for Editable Mode
    const MediaOverlay = () => {
        if (!isEditable) return null;
        
        return (
            <div className="absolute inset-0 pointer-events-none z-20">
                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition pointer-events-auto">
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
        return (
            <div className="mt-6 flex w-full" style={outerStyle}>
                <div
                    className={`relative group rounded-3xl border border-white/10 bg-black/30 overflow-hidden shadow-xl flex-shrink-0 ${onImagePreview ? 'cursor-zoom-in' : ''}`}
                    style={{ ...innerStyle, aspectRatio: mediaAspectRatio || 16 / 9 }}
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
                        className="w-full h-full object-contain select-none"
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

  const renderChart = () => {
    if (!chartData || chartData.length === 0) return null;

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
                contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '24px' }}
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
                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '24px' }}
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
                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '24px' }}
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

  const renderCustomBlocks = () => {
    if (!customBlocks?.length) return null;

    return customBlocks.map((block) => {
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
            minWidth={160}
            minHeight={40}
            className="pointer-events-auto group/block"
            style={{ zIndex: 40 }}
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
                className="drag-handle absolute -top-2 -left-2 w-6 h-6 bg-[#ffd700] rounded-full flex items-center justify-center cursor-move shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Drag to move"
              >
                <GripVertical size={12} className="text-black" />
              </div>
              <button
                onClick={() => handleRemoveCustomBlock(block.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                title="Delete block"
              >
                <Trash2 size={12} />
              </button>
              <div className="w-full h-full text-left overflow-visible cursor-text p-2">
                <EditableText
                  tagName="div"
                  className="leading-relaxed w-full h-full overflow-visible"
                  style={{
                    color: activeTextColor,
                    overflow: 'visible',
                    fontSize: `${2.25 * fontScale}rem`, // Match slide content size
                  }}
                  html={block.html}
                  onChange={(val) => {
                    // Auto-delete if content is empty
                    const strippedVal = val.replace(/<[^>]*>/g, '').trim();
                    if (!strippedVal) {
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
                        textAlign: titleAlign
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
                        textAlign: titleAlign
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
                            textAlign: textAlign
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
                            textAlign: textAlign
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
        backgroundColor: activeBgColor, 
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
      
      {/* Background Image Layer */}
      {backgroundImage && (
        <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
            style={{ 
                backgroundImage: `url(${backgroundImage})`,
                filter: backgroundImageFilter || 'none'
            }}
        />
      )}

      {/* Background Overlay */}
      {backgroundImage && (
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

      {/* Custom Blocks Layer */}
      {customBlocks && customBlocks.length > 0 ? (
        <div 
          className={`absolute z-30 ${isEditable ? 'pointer-events-none' : ''}`}
          style={{
            position: 'absolute',
            top: '0px',
            left: '0px',
            width: '1080px',
            height: '1080px',
          }}
        >
          {renderCustomBlocks()}
        </div>
      ) : null}

      {/* Main Content Area */}
      <div className={`flex-1 px-16 pt-48 pb-24 relative z-10 flex flex-col ${type === 'cover' ? 'justify-center' : 'justify-start'} h-full`}>
        {isEditable && isMounted ? (
            <DndContext 
                sensors={sensors} 
                collisionDetection={closestCenter} 
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
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
                {/* Simple drag overlay - no background effects */}
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeDragId ? (
                        <div className="pointer-events-none">
                            {renderElement(activeDragId)}
                        </div>
                    ) : null}
                </DragOverlay>
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
