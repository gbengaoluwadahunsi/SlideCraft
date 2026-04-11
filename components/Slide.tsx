"use client";

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  DndContext,
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
} from '@dnd-kit/sortable';
import { Rnd } from 'react-rnd';
import { SlideShell } from './Slide/SlideShell';
import { ElementRenderer } from './Slide/ElementRenderer';
import { CustomBlocks } from './Slide/CustomBlocks';
import { SortableItem } from './Slide/SortableItem';
import { getSlideStyles } from './Slide/SlideStyles';

interface CustomBlock {
  id: string;
  html: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ElementPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface SlideProps {
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
  onUpdate?: (field: string, value: unknown) => void;
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

export const Slide: React.FC<SlideProps> = React.memo(function Slide(props) {
  const {
    type, title, subtitle, content, emoji, icon, category = "", handle = "@yourhandle",
    backgroundColor = "#111c24", textColor = "#ffffff", accentColor = "#ffd700",
    fontFamily = "var(--font-inter)", fontScale = 1, textAlign = 'left',
    coverBackgroundColor, coverTextColor, coverAccentColor,
    backgroundImage, backgroundOverlayOpacity = 0, backgroundImageFilter,
    isEditable = false, onUpdate, chartType, chartData, mediaType, mediaUrl,
    mediaPosterUrl, embedHtml, mediaAspectRatio = 1.77, mediaWidthPercent = 100,
    mediaAlignment = 'center', elementOrder, customBlocks = [], scale = 1,
    logoUrl, infographicData, onImagePreview, elementPositions, freePositioning = false,
    textOpacity, boxShadow, borderWidth, borderColor, borderStyle, borderRadius,
    titleColor, slideLabel, slideLabelColor, showNoise, glowColor, glowPosition,
    slideNumber, totalSlides, slidePadding, backgroundPattern, slideJustify = 'start'
  } = props;

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const activeBgColor = (type === 'cover' && coverBackgroundColor) ? coverBackgroundColor : backgroundColor;
  const activeTextColor = (type === 'cover' && coverTextColor) ? coverTextColor : textColor;
  const activeAccentColor = (type === 'cover' && coverAccentColor) ? coverAccentColor : accentColor;

  const slideId = React.useId().replace(/:/g, '');
  const scopeClass = `slide-${slideId}`;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getOrder = useCallback(() => {
    if (elementOrder && elementOrder.length > 0) return elementOrder;
    if (type === 'cover') return ['emoji', 'title', 'subtitle'];
    if (type === 'visual') return ['icon', 'title', 'infographic'];
    if (type === 'chart') return ['title', 'chart'];
    return ['slideCounter', 'slideLabel', 'emoji', 'title', 'subtitle', 'content', 'media'];
  }, [elementOrder, type]);

  const currentOrder = getOrder();

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      const oldIndex = currentOrder.indexOf(active.id as string);
      const newIndex = currentOrder.indexOf(over.id as string);
      onUpdate?.('elementOrder', arrayMove(currentOrder, oldIndex, newIndex));
    }
  }, [currentOrder, onUpdate]);

  const handleElementPositionChange = useCallback((elementId: string, position: ElementPosition) => {
    const newPositions = { ...(elementPositions || {}), [elementId]: position };
    onUpdate?.('elementPositions', newPositions);
  }, [elementPositions, onUpdate]);

  const getDefaultPosition = (elementId: string): ElementPosition => {
    if (elementPositions?.[elementId as keyof typeof elementPositions]) {
      return elementPositions[elementId as keyof typeof elementPositions]!;
    }
    const defaults: Record<string, ElementPosition> = {
      title: { x: 80, y: 320, width: 920 },
      subtitle: { x: 80, y: 480, width: 920 },
      content: { x: 80, y: 560, width: 920 },
      emoji: { x: 80, y: 160, width: 120 },
      media: { x: 80, y: 640, width: 920 },
      icon: { x: 440, y: 160, width: 200 },
      chart: { x: 80, y: 240, width: 920, height: 500 },
      infographic: { x: 80, y: 360, width: 920, height: 500 },
    };
    return defaults[elementId] || { x: 80, y: 80, width: 400 };
  };

  const isDownloading = (props as any)._isDownloading;
  const styles = useMemo(() => getSlideStyles(scopeClass, activeAccentColor, activeTextColor, activeBgColor, titleColor), [scopeClass, activeAccentColor, activeTextColor, activeBgColor, titleColor]);

  const renderElement = (id: string) => (
    <ElementRenderer
      {...props}
      id={id}
      activeAccentColor={activeAccentColor}
      activeTextColor={activeTextColor}
      activeBgColor={activeBgColor}
      isDownloading={isDownloading}
    />
  );

  return (
    <SlideShell
      {...props}
      scopeClass={scopeClass}
      styles={styles}
      activeBgColor={activeBgColor}
      activeTextColor={activeTextColor}
      activeAccentColor={activeAccentColor}
      isDownloading={isDownloading}
      isEditable={isEditable}
    >
      {customBlocks.length > 0 && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          <CustomBlocks
            customBlocks={customBlocks}
            isEditable={isEditable}
            scale={scale}
            activeTextColor={activeTextColor}
            fontScale={fontScale}
            onUpdate={onUpdate}
          />
        </div>
      )}

      {freePositioning && isEditable && isMounted ? (
        <div className="absolute inset-0 z-10 pointer-events-none" style={{ top: 0, left: 0, width: '1080px', minHeight: '1080px', height: 'auto' }}>
          {currentOrder.map((itemId) => {
            const pos = getDefaultPosition(itemId);
            const element = renderElement(itemId);
            if (!element) return null;
            const isTextElement = ['title', 'subtitle', 'content'].includes(itemId);
            return (
              <Rnd
                key={itemId}
                bounds="parent"
                scale={scale}
                size={{ width: pos.width || 400, height: isTextElement ? 'auto' : (pos.height || 100) }}
                position={{ x: pos.x, y: pos.y }}
                onDragStop={(_, data) => handleElementPositionChange(itemId, { ...pos, x: data.x, y: data.y })}
                onResizeStop={(_, __, ref, ___, position) =>
                  handleElementPositionChange(itemId, {
                    x: position.x,
                    y: position.y,
                    width: parseFloat(ref.style.width) || 400,
                    height: isTextElement ? undefined : (parseFloat(ref.style.height) || 100),
                  })
                }
                dragHandleClassName="free-drag-handle"
                className="pointer-events-auto group/element"
                style={{ zIndex: 20, touchAction: 'none', height: isTextElement ? 'auto' : undefined }}
                enableResizing={{ right: true, bottom: !isTextElement, bottomRight: !isTextElement }}
              >
                <div className={`w-full relative group ${isTextElement ? 'h-auto min-h-full' : 'h-full'}`}>
                  <div className="free-drag-handle absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#ffd700] rounded-full flex items-center justify-center gap-1.5 cursor-move shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <span className="text-sm font-bold text-black">Move</span>
                  </div>
                  <div className={`w-full ${isTextElement ? 'overflow-visible h-auto' : 'h-full overflow-hidden'}`}>
                    {element}
                  </div>
                </div>
              </Rnd>
            );
          })}
        </div>
      ) : freePositioning ? (
        <div className="absolute inset-0 z-10" style={{ top: 0, left: 0, width: '1080px', minHeight: '1080px' }}>
          {currentOrder.map((itemId) => {
            const pos = getDefaultPosition(itemId);
            const element = renderElement(itemId);
            if (!element) return null;
            return (
              <div key={itemId} style={{ position: 'absolute', left: pos.x, top: pos.y, width: pos.width || 400, height: pos.height || 100, overflow: ['title', 'subtitle'].includes(itemId) ? 'visible' : 'hidden' }}>
                {element}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full relative z-10 flex flex-col overflow-visible" style={{
          justifyContent: slideJustify === 'between' ? 'space-between' : slideJustify === 'end' ? 'flex-end' : slideJustify === 'start' ? 'flex-start' : (type === 'cover' ? 'center' : 'flex-start'),
          padding: slidePadding ? `${slidePadding}px` : (type === 'cover' ? '4rem' : '4rem 4rem 1rem'),
          minHeight: 'auto', height: 'auto', flex: '1 1 auto'
        }}>
          {isEditable && isMounted ? (
            <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragEnd={handleDragEnd}>
              <SortableContext items={currentOrder} strategy={verticalListSortingStrategy}>
                {currentOrder.map((itemId) => (
                  <SortableItem key={itemId} id={itemId} isEditable={isEditable}>
                    {renderElement(itemId)}
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            currentOrder.map((itemId) => (
              <div key={itemId} className="relative">
                {renderElement(itemId)}
              </div>
            ))
          )}
        </div>
      )}
    </SlideShell>
  );
});
