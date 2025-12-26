"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, Target, Zap, CheckCircle, ArrowRight, ArrowDown,
  TrendingUp, Users, Shield, Star, Heart,
  Rocket, Brain, Clock, DollarSign, Award,
  BarChart3, PieChart, Activity, Layers, Settings,
  Sparkles, Globe, Lock, Eye, MessageCircle,
  ThumbsUp, Bookmark, Share2, Play, Coffee,
  Check, Circle, Diamond, Hexagon
} from 'lucide-react';

export type InfographicLayout = 
  | 'cards-grid' 
  | 'timeline' 
  | 'process-steps' 
  | 'feature-list' 
  | 'metrics-row'
  | 'icon-cards'
  | 'numbered-list'
  | 'pyramid'
  | 'cycle'
  | 'comparison'
  | 'checklist'
  | 'quote-highlight';

interface InfographicProps {
  items: string[];
  layout: InfographicLayout;
  accentColor?: string;
  textColor?: string;
  backgroundColor?: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// Smart icon mapping based on content
const getIconForText = (text: string, index: number) => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('goal') || lowerText.includes('target') || lowerText.includes('aim')) return Target;
  if (lowerText.includes('idea') || lowerText.includes('tip') || lowerText.includes('insight')) return Lightbulb;
  if (lowerText.includes('fast') || lowerText.includes('quick') || lowerText.includes('speed') || lowerText.includes('energy')) return Zap;
  if (lowerText.includes('success') || lowerText.includes('done') || lowerText.includes('complete') || lowerText.includes('achieve')) return CheckCircle;
  if (lowerText.includes('grow') || lowerText.includes('increase') || lowerText.includes('boost') || lowerText.includes('improve')) return TrendingUp;
  if (lowerText.includes('team') || lowerText.includes('people') || lowerText.includes('community') || lowerText.includes('social')) return Users;
  if (lowerText.includes('secure') || lowerText.includes('safe') || lowerText.includes('protect') || lowerText.includes('trust')) return Shield;
  if (lowerText.includes('best') || lowerText.includes('top') || lowerText.includes('quality') || lowerText.includes('premium')) return Star;
  if (lowerText.includes('health') || lowerText.includes('care') || lowerText.includes('wellness') || lowerText.includes('love')) return Heart;
  if (lowerText.includes('launch') || lowerText.includes('start') || lowerText.includes('begin') || lowerText.includes('new')) return Rocket;
  if (lowerText.includes('think') || lowerText.includes('mind') || lowerText.includes('learn') || lowerText.includes('smart')) return Brain;
  if (lowerText.includes('time') || lowerText.includes('schedule') || lowerText.includes('hour') || lowerText.includes('morning')) return Clock;
  if (lowerText.includes('money') || lowerText.includes('cost') || lowerText.includes('price') || lowerText.includes('save')) return DollarSign;
  if (lowerText.includes('award') || lowerText.includes('win') || lowerText.includes('reward')) return Award;
  if (lowerText.includes('data') || lowerText.includes('analytics') || lowerText.includes('measure')) return BarChart3;
  if (lowerText.includes('focus') || lowerText.includes('attention')) return Eye;
  if (lowerText.includes('connect') || lowerText.includes('network') || lowerText.includes('global')) return Globe;
  if (lowerText.includes('message') || lowerText.includes('communicate')) return MessageCircle;
  if (lowerText.includes('like') || lowerText.includes('positive')) return ThumbsUp;
  if (lowerText.includes('action') || lowerText.includes('move') || lowerText.includes('exercise')) return Play;
  if (lowerText.includes('routine') || lowerText.includes('habit') || lowerText.includes('daily')) return Coffee;
  if (lowerText.includes('magic') || lowerText.includes('special')) return Sparkles;
  if (lowerText.includes('perform') || lowerText.includes('active')) return Activity;
  if (lowerText.includes('layer') || lowerText.includes('level')) return Layers;
  
  const defaultIcons = [Sparkles, Target, Zap, TrendingUp, Star, Rocket, Brain, Heart, CheckCircle, Globe];
  return defaultIcons[index % defaultIcons.length];
};

// Decorative background pattern
const BackgroundPattern: React.FC<{ color: string; variant?: number }> = ({ color, variant = 0 }) => {
  const patterns = [
    // Dots pattern
    <svg key="dots" className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>,
    // Grid pattern
    <svg key="grid" className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={color} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>,
    // Diagonal lines
    <svg key="diag" className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="diag" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="20" stroke={color} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#diag)" />
    </svg>,
  ];
  return patterns[variant % patterns.length];
};

// Glowing orb decoration
const GlowOrb: React.FC<{ color: string; size?: number; className?: string }> = ({ 
  color, 
  size = 200, 
  className = "" 
}) => (
  <div 
    className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
    style={{ 
      width: size, 
      height: size, 
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)` 
    }}
  />
);

// ============ LAYOUTS ============

// Cards Grid - Premium modern cards
const CardsGridLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff' }) => {
  const displayItems = items.slice(0, 6);
  const cols = displayItems.length <= 2 ? 2 : displayItems.length <= 4 ? 2 : 3;
  
  return (
    <div className="relative w-full p-2">
      <GlowOrb color={accentColor} size={300} className="-top-20 -right-20" />
      <motion.div 
        className="grid gap-4 relative z-10"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {displayItems.map((item, index) => {
          const Icon = getIconForText(item, index);
          return (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="relative rounded-2xl p-5 overflow-hidden group"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}12 0%, ${accentColor}05 100%)`,
                border: `1px solid ${accentColor}20`,
                boxShadow: `0 4px 24px ${accentColor}08`,
              }}
            >
              {/* Hover glow effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ 
                  background: `radial-gradient(circle at center, ${accentColor}15 0%, transparent 70%)` 
                }}
              />
              
              {/* Top accent line */}
              <div 
                className="absolute top-0 left-4 right-4 h-[2px]"
                style={{ 
                  background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` 
                }}
              />
              
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative z-10"
                style={{ 
                  background: `linear-gradient(135deg, ${accentColor}35 0%, ${accentColor}15 100%)`,
                  boxShadow: `0 4px 20px ${accentColor}25`,
                }}
              >
                <Icon size={22} style={{ color: accentColor }} strokeWidth={2} />
              </div>
              
              <p 
                className="text-sm font-medium leading-relaxed relative z-10"
                style={{ color: textColor, opacity: 0.9 }}
              >
                {item}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

// Timeline - Elegant vertical progression
const TimelineLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff' }) => {
  const displayItems = items.slice(0, 5);
  
  return (
    <div className="relative w-full px-4">
      <BackgroundPattern color={accentColor} variant={0} />
      
      {/* Gradient connecting line */}
      <div 
        className="absolute left-[30px] top-8 bottom-8 w-[3px] rounded-full"
        style={{ 
          background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}40 50%, ${accentColor}10 100%)`,
        }}
      />
      
      <motion.div 
        className="space-y-5 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {displayItems.map((item, index) => {
          const Icon = getIconForText(item, index);
          const isLast = index === displayItems.length - 1;
          return (
            <motion.div 
              key={index} 
              className="flex items-start gap-5"
              variants={itemVariants}
            >
              {/* Node with pulse animation */}
              <div className="relative">
                <div 
                  className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center relative z-10"
                  style={{ 
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}80 100%)`,
                    boxShadow: `0 8px 32px ${accentColor}40`,
                  }}
                >
                  <Icon size={26} color="#000" strokeWidth={2} />
                </div>
                {!isLast && (
                  <div 
                    className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-5"
                    style={{ background: `linear-gradient(180deg, ${accentColor}60, transparent)` }}
                  />
                )}
              </div>
              
              {/* Content card */}
              <div 
                className="flex-1 rounded-xl p-4 mt-1"
                style={{ 
                  background: `linear-gradient(135deg, ${accentColor}10 0%, transparent 100%)`,
                  border: `1px solid ${accentColor}15`,
                }}
              >
                <div 
                  className="text-xs font-bold mb-1 uppercase tracking-wider"
                  style={{ color: accentColor }}
                >
                  Step {index + 1}
                </div>
                <p 
                  className="text-sm font-medium leading-relaxed"
                  style={{ color: textColor, opacity: 0.9 }}
                >
                  {item}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

// Process Steps - Horizontal flow with premium design
const ProcessStepsLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff' }) => {
  const displayItems = items.slice(0, 4);
  
  return (
    <div className="w-full px-2 relative">
      <GlowOrb color={accentColor} size={200} className="top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      
      <motion.div 
        className="flex items-start justify-between gap-2 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {displayItems.map((item, index) => {
          const Icon = getIconForText(item, index);
          const isLast = index === displayItems.length - 1;
          
          return (
            <React.Fragment key={index}>
              <motion.div 
                className="flex-1 flex flex-col items-center text-center"
                variants={scaleVariants}
              >
                {/* Step container */}
                <div className="relative mb-4">
                  {/* Outer ring */}
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}70 100%)`,
                      boxShadow: `0 12px 40px ${accentColor}35, inset 0 -4px 12px rgba(0,0,0,0.2)`,
                    }}
                  >
                    <Icon size={32} color="#000" strokeWidth={2} />
                  </div>
                  
                  {/* Step number */}
                  <div 
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                    style={{ 
                      background: '#000',
                      color: accentColor,
                      border: `3px solid ${accentColor}`,
                      boxShadow: `0 4px 12px ${accentColor}40`,
                    }}
                  >
                    {index + 1}
                  </div>
                </div>
                
                {/* Label */}
                <p 
                  className="text-xs font-semibold leading-snug max-w-[120px]"
                  style={{ color: textColor, opacity: 0.9 }}
                >
                  {item.length > 50 ? item.slice(0, 50) + '...' : item}
                </p>
              </motion.div>
              
              {/* Arrow connector */}
              {!isLast && (
                <div className="flex items-center pt-8 px-1">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <ArrowRight 
                      size={24} 
                      style={{ color: accentColor }} 
                      strokeWidth={2.5}
                    />
                  </motion.div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </motion.div>
    </div>
  );
};

// Feature List - Premium two-column checklist
const FeatureListLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff' }) => {
  const displayItems = items.slice(0, 6);
  
  return (
    <motion.div 
      className="w-full rounded-2xl p-6 relative overflow-hidden"
      style={{ 
        background: `linear-gradient(135deg, ${accentColor}08 0%, transparent 100%)`,
        border: `1px solid ${accentColor}12`,
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <BackgroundPattern color={accentColor} variant={1} />
      <GlowOrb color={accentColor} size={150} className="-bottom-10 -right-10" />
      
      <div 
        className="grid gap-3 relative z-10" 
        style={{ gridTemplateColumns: displayItems.length > 3 ? '1fr 1fr' : '1fr' }}
      >
        {displayItems.map((item, index) => {
          const Icon = getIconForText(item, index);
          return (
            <motion.div 
              key={index} 
              className="flex items-start gap-4 p-3 rounded-xl"
              style={{ background: `${accentColor}06` }}
              variants={itemVariants}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ 
                  background: `linear-gradient(135deg, ${accentColor}30 0%, ${accentColor}10 100%)`,
                  boxShadow: `0 2px 10px ${accentColor}15`,
                }}
              >
                <Icon size={18} style={{ color: accentColor }} strokeWidth={2} />
              </div>
              <p 
                className="text-sm font-medium leading-relaxed pt-2"
                style={{ color: textColor, opacity: 0.9 }}
              >
                {item}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// Metrics Row - Impactful numbers with visual flair
const MetricsRowLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff' }) => {
  const displayItems = items.slice(0, 4);
  
  const metrics = displayItems.map((item, index) => {
    const numberMatch = item.match(/(\d+%?|\d+x|\d+\+|\d+k|\d+K|\d+M)/i);
    const value = numberMatch ? numberMatch[1].toUpperCase() : ['95%', '10X', '24/7', '500+'][index % 4];
    const label = item.replace(/(\d+%?|\d+x|\d+\+|\d+k|\d+K|\d+M)/gi, '').trim() || item;
    return { value, label };
  });
  
  return (
    <motion.div 
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.div 
            key={index}
            className="relative rounded-2xl p-6 text-center overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${accentColor}12 0%, ${accentColor}04 100%)`,
              border: `1px solid ${accentColor}15`,
            }}
            variants={scaleVariants}
          >
            {/* Decorative ring */}
            <div 
              className="absolute -top-16 -right-16 w-32 h-32 rounded-full"
              style={{ 
                background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)` 
              }}
            />
            
            {/* Value */}
            <div 
              className="text-5xl font-black mb-2 relative"
              style={{ 
                color: accentColor,
                textShadow: `0 0 60px ${accentColor}50`,
              }}
            >
              {metric.value}
            </div>
            
            {/* Underline */}
            <div 
              className="w-12 h-1 mx-auto mb-3 rounded-full"
              style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
            />
            
            {/* Label */}
            <p 
              className="text-xs font-medium relative"
              style={{ color: textColor, opacity: 0.7 }}
            >
              {metric.label.slice(0, 35)}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Icon Cards - Compact premium grid
const IconCardsLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff' }) => {
  const displayItems = items.slice(0, 6);
  
  return (
    <motion.div 
      className="grid grid-cols-3 gap-4 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {displayItems.map((item, index) => {
        const Icon = getIconForText(item, index);
        return (
          <motion.div 
            key={index}
            className="flex flex-col items-center text-center p-5 rounded-2xl relative overflow-hidden"
            style={{ 
              background: `linear-gradient(180deg, ${accentColor}10 0%, transparent 100%)`,
              border: `1px solid ${accentColor}12`,
            }}
            variants={scaleVariants}
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}70 100%)`,
                boxShadow: `0 8px 30px ${accentColor}35`,
              }}
            >
              <Icon size={28} color="#000" strokeWidth={2} />
            </div>
            <p 
              className="text-xs font-semibold leading-snug"
              style={{ color: textColor, opacity: 0.85 }}
            >
              {item.length > 45 ? item.slice(0, 45) + '...' : item}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// Numbered List - Premium numbered items
const NumberedListLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff' }) => {
  const displayItems = items.slice(0, 5);
  
  return (
    <motion.div 
      className="w-full space-y-3 px-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {displayItems.map((item, index) => (
        <motion.div 
          key={index}
          className="flex items-center gap-5 p-4 rounded-xl relative overflow-hidden"
          style={{ 
            background: `linear-gradient(90deg, ${accentColor}10 0%, transparent 100%)`,
            border: `1px solid ${accentColor}12`,
          }}
          variants={itemVariants}
        >
          {/* Large number background */}
          <div 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl font-black opacity-[0.03] select-none"
            style={{ color: accentColor }}
          >
            {index + 1}
          </div>
          
          {/* Number badge */}
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-xl font-black"
            style={{ 
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}70 100%)`,
              color: '#000',
              boxShadow: `0 6px 20px ${accentColor}30`,
            }}
          >
            {index + 1}
          </div>
          
          {/* Content */}
          <p 
            className="text-sm font-medium leading-relaxed flex-1 relative z-10"
            style={{ color: textColor, opacity: 0.9 }}
          >
            {item}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Pyramid - Hierarchical pyramid layout
const PyramidLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff' }) => {
  const displayItems = items.slice(0, 4);
  
  return (
    <motion.div 
      className="w-full flex flex-col items-center gap-3 py-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {displayItems.map((item, index) => {
        const width = 40 + (index * 20); // Increases from top to bottom
        const Icon = getIconForText(item, index);
        
        return (
          <motion.div 
            key={index}
            className="relative rounded-xl p-4 flex items-center gap-4"
            style={{ 
              width: `${width}%`,
              background: `linear-gradient(135deg, ${accentColor}${15 + index * 5} 0%, ${accentColor}05 100%)`,
              border: `1px solid ${accentColor}20`,
              boxShadow: `0 4px 20px ${accentColor}${10 + index * 5}`,
            }}
            variants={scaleVariants}
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ 
                background: index === 0 
                  ? `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}70 100%)`
                  : `${accentColor}20`,
              }}
            >
              <Icon size={18} style={{ color: index === 0 ? '#000' : accentColor }} strokeWidth={2} />
            </div>
            <p 
              className="text-sm font-medium leading-snug flex-1"
              style={{ color: textColor, opacity: 0.9 }}
            >
              {item}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// Cycle - Circular flow diagram
const CycleLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff' }) => {
  const displayItems = items.slice(0, 4);
  
  return (
    <motion.div 
      className="w-full relative"
      style={{ minHeight: '280px' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Center element */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div 
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ 
            background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}05 100%)`,
            border: `2px solid ${accentColor}30`,
          }}
          variants={scaleVariants}
        >
          <Sparkles size={32} style={{ color: accentColor }} />
        </motion.div>
      </div>
      
      {/* Items arranged in corners */}
      {displayItems.map((item, index) => {
        const Icon = getIconForText(item, index);
        const positions = [
          { top: '0%', left: '10%' },
          { top: '0%', right: '10%' },
          { bottom: '0%', right: '10%' },
          { bottom: '0%', left: '10%' },
        ];
        const pos = positions[index];
        
        return (
          <motion.div 
            key={index}
            className="absolute w-[40%] p-3 rounded-xl"
            style={{ 
              ...pos,
              background: `linear-gradient(135deg, ${accentColor}12 0%, transparent 100%)`,
              border: `1px solid ${accentColor}15`,
            }}
            variants={itemVariants}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ 
                  background: `linear-gradient(135deg, ${accentColor}30 0%, ${accentColor}10 100%)`,
                }}
              >
                <Icon size={18} style={{ color: accentColor }} strokeWidth={2} />
              </div>
              <p 
                className="text-xs font-medium leading-snug"
                style={{ color: textColor, opacity: 0.85 }}
              >
                {item.length > 40 ? item.slice(0, 40) + '...' : item}
              </p>
            </div>
          </motion.div>
        );
      })}
      
      {/* Connecting arrows */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={accentColor} opacity="0.4" />
          </marker>
        </defs>
        <circle 
          cx="50%" 
          cy="50%" 
          r="80" 
          fill="none" 
          stroke={accentColor} 
          strokeWidth="1" 
          strokeDasharray="8 8"
          opacity="0.2"
        />
      </svg>
    </motion.div>
  );
};

// Comparison - Side by side comparison
const ComparisonLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff' }) => {
  const half = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, half);
  const rightItems = items.slice(half);
  
  return (
    <motion.div 
      className="flex gap-4 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Left column */}
      <div 
        className="flex-1 rounded-2xl p-5"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor}10 0%, transparent 100%)`,
          border: `1px solid ${accentColor}15`,
        }}
      >
        <div 
          className="text-xs font-bold mb-4 pb-2 uppercase tracking-wider"
          style={{ color: accentColor, borderBottom: `2px solid ${accentColor}30` }}
        >
          Key Points
        </div>
        <div className="space-y-3">
          {leftItems.map((item, index) => (
            <motion.div 
              key={index} 
              className="flex items-start gap-3"
              variants={itemVariants}
            >
              <CheckCircle size={18} style={{ color: accentColor }} className="shrink-0 mt-0.5" />
              <span className="text-sm" style={{ color: textColor, opacity: 0.9 }}>{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Divider */}
      <div 
        className="w-[2px] rounded-full"
        style={{ background: `linear-gradient(180deg, transparent, ${accentColor}40, transparent)` }}
      />
      
      {/* Right column */}
      <div 
        className="flex-1 rounded-2xl p-5"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor}10 0%, transparent 100%)`,
          border: `1px solid ${accentColor}15`,
        }}
      >
        <div 
          className="text-xs font-bold mb-4 pb-2 uppercase tracking-wider"
          style={{ color: accentColor, borderBottom: `2px solid ${accentColor}30` }}
        >
          Benefits
        </div>
        <div className="space-y-3">
          {rightItems.map((item, index) => (
            <motion.div 
              key={index} 
              className="flex items-start gap-3"
              variants={itemVariants}
            >
              <Star size={18} style={{ color: accentColor }} className="shrink-0 mt-0.5" />
              <span className="text-sm" style={{ color: textColor, opacity: 0.9 }}>{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Checklist - Premium todo style
const ChecklistLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff' }) => {
  const displayItems = items.slice(0, 6);
  
  return (
    <motion.div 
      className="w-full rounded-2xl p-6 relative overflow-hidden"
      style={{ 
        background: `linear-gradient(135deg, ${accentColor}08 0%, transparent 100%)`,
        border: `1px solid ${accentColor}10`,
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <BackgroundPattern color={accentColor} variant={2} />
      
      <div className="space-y-3 relative z-10">
        {displayItems.map((item, index) => (
          <motion.div 
            key={index}
            className="flex items-center gap-4 p-3 rounded-xl"
            style={{ background: `${accentColor}05` }}
            variants={itemVariants}
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}70 100%)`,
                boxShadow: `0 2px 10px ${accentColor}30`,
              }}
            >
              <Check size={16} color="#000" strokeWidth={3} />
            </div>
            <p 
              className="text-sm font-medium leading-relaxed"
              style={{ color: textColor, opacity: 0.9 }}
            >
              {item}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Quote Highlight - Featured quote style
const QuoteHighlightLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff' }) => {
  const mainQuote = items[0] || '';
  const supportingPoints = items.slice(1, 4);
  
  return (
    <motion.div 
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Main quote */}
      <motion.div 
        className="relative rounded-2xl p-8 mb-4 overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}05 100%)`,
          border: `1px solid ${accentColor}20`,
        }}
        variants={scaleVariants}
      >
        <GlowOrb color={accentColor} size={200} className="-top-20 -left-20" />
        
        {/* Quote mark */}
        <div 
          className="absolute top-4 left-6 text-8xl font-serif opacity-20 select-none"
          style={{ color: accentColor }}
        >
          "
        </div>
        
        <p 
          className="text-lg font-semibold leading-relaxed relative z-10 pl-8"
          style={{ color: textColor }}
        >
          {mainQuote}
        </p>
      </motion.div>
      
      {/* Supporting points */}
      {supportingPoints.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {supportingPoints.map((point, index) => (
            <motion.div 
              key={index}
              className="p-3 rounded-xl text-center"
              style={{ 
                background: `${accentColor}08`,
                border: `1px solid ${accentColor}10`,
              }}
              variants={itemVariants}
            >
              <p 
                className="text-xs font-medium"
                style={{ color: textColor, opacity: 0.8 }}
              >
                {point.length > 50 ? point.slice(0, 50) + '...' : point}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Main export
export const Infographic: React.FC<InfographicProps> = (props) => {
  const { layout, items } = props;
  
  if (!items || items.length === 0) return null;
  
  switch (layout) {
    case 'cards-grid': return <CardsGridLayout {...props} />;
    case 'timeline': return <TimelineLayout {...props} />;
    case 'process-steps': return <ProcessStepsLayout {...props} />;
    case 'feature-list': return <FeatureListLayout {...props} />;
    case 'metrics-row': return <MetricsRowLayout {...props} />;
    case 'icon-cards': return <IconCardsLayout {...props} />;
    case 'numbered-list': return <NumberedListLayout {...props} />;
    case 'pyramid': return <PyramidLayout {...props} />;
    case 'cycle': return <CycleLayout {...props} />;
    case 'comparison': return <ComparisonLayout {...props} />;
    case 'checklist': return <ChecklistLayout {...props} />;
    case 'quote-highlight': return <QuoteHighlightLayout {...props} />;
    default: return <CardsGridLayout {...props} />;
  }
};

export default Infographic;
