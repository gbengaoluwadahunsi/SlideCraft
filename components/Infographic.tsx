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
import * as PhosphorIcons from 'phosphor-react';

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
  infographicIcons?: string[]; // Add this prop
}

// Derive N theme-aware colors from a base accent color using hue rotation
function deriveThemeColors(accentColor: string, count: number): string[] {
  const h = (accentColor || '#ffd700').replace('#', '').padEnd(6, '0');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let hDeg = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hDeg = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) hDeg = ((b - r) / d + 2) * 60;
    else hDeg = ((r - g) / d + 4) * 60;
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return Array.from({ length: count }, (_, i) => {
    const newH = ((hDeg + (i * (360 / count))) % 360) / 360;
    let r2, g2, b2;
    if (s === 0) { r2 = g2 = b2 = l; }
    else {
      const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p2 = 2 * l - q2;
      r2 = hue2rgb(p2, q2, newH + 1/3);
      g2 = hue2rgb(p2, q2, newH);
      b2 = hue2rgb(p2, q2, newH - 1/3);
    }
    return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
  });
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
    transition: { duration: 0.4, ease: "easeOut" as const }
  }
} as const;

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const }
  }
} as const;

// Smart icon mapping based on content (using Phosphor + Lucide)
const getIconForText = (text: string, index: number) => {
  const lowerText = text.toLowerCase();
  
  // Phosphor icons for more variety and professional look
  if (lowerText.includes('goal') || lowerText.includes('target') || lowerText.includes('aim')) return PhosphorIcons.Target;
  if (lowerText.includes('idea') || lowerText.includes('tip') || lowerText.includes('insight')) return PhosphorIcons.Lightbulb;
  if (lowerText.includes('fast') || lowerText.includes('quick') || lowerText.includes('speed') || lowerText.includes('energy')) return PhosphorIcons.Lightning;
  if (lowerText.includes('success') || lowerText.includes('done') || lowerText.includes('complete') || lowerText.includes('achieve')) return PhosphorIcons.CheckCircle;
  if (lowerText.includes('grow') || lowerText.includes('increase') || lowerText.includes('boost') || lowerText.includes('improve')) return PhosphorIcons.TrendUp;
  if (lowerText.includes('team') || lowerText.includes('people') || lowerText.includes('community') || lowerText.includes('social')) return PhosphorIcons.Users;
  if (lowerText.includes('secure') || lowerText.includes('safe') || lowerText.includes('protect') || lowerText.includes('trust')) return PhosphorIcons.ShieldCheck;
  if (lowerText.includes('best') || lowerText.includes('top') || lowerText.includes('quality') || lowerText.includes('premium')) return PhosphorIcons.Star;
  if (lowerText.includes('health') || lowerText.includes('care') || lowerText.includes('wellness') || lowerText.includes('love')) return PhosphorIcons.Heart;
  if (lowerText.includes('launch') || lowerText.includes('start') || lowerText.includes('begin') || lowerText.includes('new')) return PhosphorIcons.Rocket;
  if (lowerText.includes('think') || lowerText.includes('mind') || lowerText.includes('learn') || lowerText.includes('smart')) return PhosphorIcons.Brain;
  if (lowerText.includes('time') || lowerText.includes('schedule') || lowerText.includes('hour') || lowerText.includes('morning')) return PhosphorIcons.Clock;
  if (lowerText.includes('money') || lowerText.includes('cost') || lowerText.includes('price') || lowerText.includes('save')) return PhosphorIcons.CurrencyDollar;
  if (lowerText.includes('award') || lowerText.includes('win') || lowerText.includes('reward') || lowerText.includes('trophy')) return PhosphorIcons.Trophy;
  if (lowerText.includes('data') || lowerText.includes('analytics') || lowerText.includes('measure')) return PhosphorIcons.ChartBar;
  if (lowerText.includes('focus') || lowerText.includes('attention') || lowerText.includes('vision')) return PhosphorIcons.Eye;
  if (lowerText.includes('connect') || lowerText.includes('network') || lowerText.includes('global')) return PhosphorIcons.Globe;
  if (lowerText.includes('message') || lowerText.includes('communicate') || lowerText.includes('chat')) return PhosphorIcons.ChatCircle;
  if (lowerText.includes('like') || lowerText.includes('positive') || lowerText.includes('thumbs')) return PhosphorIcons.ThumbsUp;
  if (lowerText.includes('action') || lowerText.includes('move') || lowerText.includes('exercise')) return PhosphorIcons.Play;
  if (lowerText.includes('routine') || lowerText.includes('habit') || lowerText.includes('daily')) return PhosphorIcons.Coffee;
  if (lowerText.includes('magic') || lowerText.includes('special') || lowerText.includes('sparkle')) return PhosphorIcons.Sparkle;
  if (lowerText.includes('perform') || lowerText.includes('active') || lowerText.includes('activity')) return PhosphorIcons.Activity;
  if (lowerText.includes('layer') || lowerText.includes('level') || lowerText.includes('stack')) return PhosphorIcons.Stack;
  if (lowerText.includes('book') || lowerText.includes('read') || lowerText.includes('learn')) return PhosphorIcons.Book;
  if (lowerText.includes('chart') || lowerText.includes('graph')) return PhosphorIcons.ChartLine;
  if (lowerText.includes('download') || lowerText.includes('save')) return PhosphorIcons.DownloadSimple;
  if (lowerText.includes('upload')) return PhosphorIcons.UploadSimple;
  if (lowerText.includes('design') || lowerText.includes('create')) return PhosphorIcons.PaintBrush;
  if (lowerText.includes('code') || lowerText.includes('develop')) return PhosphorIcons.Code;
  if (lowerText.includes('fire') || lowerText.includes('hot') || lowerText.includes('trending')) return PhosphorIcons.Fire;
  if (lowerText.includes('sun') || lowerText.includes('light') || lowerText.includes('day')) return PhosphorIcons.Sun;
  if (lowerText.includes('moon') || lowerText.includes('night') || lowerText.includes('dark')) return PhosphorIcons.Moon;
  if (lowerText.includes('gift') || lowerText.includes('present') || lowerText.includes('bonus')) return PhosphorIcons.Gift;
  if (lowerText.includes('music') || lowerText.includes('audio') || lowerText.includes('sound')) return PhosphorIcons.MusicNote;
  if (lowerText.includes('phone') || lowerText.includes('call')) return PhosphorIcons.Phone;
  if (lowerText.includes('camera') || lowerText.includes('photo')) return PhosphorIcons.Camera;
  if (lowerText.includes('video')) return PhosphorIcons.VideoCamera;
  if (lowerText.includes('calendar') || lowerText.includes('date')) return PhosphorIcons.Calendar;
  if (lowerText.includes('bell') || lowerText.includes('notification')) return PhosphorIcons.Bell;
  if (lowerText.includes('gear') || lowerText.includes('setting')) return PhosphorIcons.Gear;
  if (lowerText.includes('link') || lowerText.includes('chain')) return PhosphorIcons.Link;
  if (lowerText.includes('flag')) return PhosphorIcons.Flag;
  if (lowerText.includes('pin') || lowerText.includes('location')) return PhosphorIcons.MapPin;
  if (lowerText.includes('key') || lowerText.includes('password')) return PhosphorIcons.Key;
  if (lowerText.includes('lock')) return PhosphorIcons.Lock;
  if (lowerText.includes('unlock')) return PhosphorIcons.LockOpen;
  if (lowerText.includes('cloud')) return PhosphorIcons.Cloud;
  if (lowerText.includes('database') || lowerText.includes('storage')) return PhosphorIcons.Database;
  if (lowerText.includes('cpu') || lowerText.includes('processor')) return PhosphorIcons.Cpu;
  if (lowerText.includes('battery') || lowerText.includes('power')) return PhosphorIcons.BatteryCharging;
  if (lowerText.includes('wifi') || lowerText.includes('wireless')) return PhosphorIcons.WifiHigh;
  if (lowerText.includes('bluetooth')) return PhosphorIcons.Bluetooth;
  if (lowerText.includes('shopping') || lowerText.includes('cart') || lowerText.includes('buy')) return PhosphorIcons.ShoppingCartSimple;
  if (lowerText.includes('credit') || lowerText.includes('card') || lowerText.includes('payment')) return PhosphorIcons.CreditCard;
  if (lowerText.includes('wallet')) return PhosphorIcons.Wallet;
  if (lowerText.includes('package') || lowerText.includes('box') || lowerText.includes('delivery')) return PhosphorIcons.Package;
  if (lowerText.includes('truck') || lowerText.includes('shipping')) return PhosphorIcons.Truck;
  if (lowerText.includes('plane') || lowerText.includes('flight')) return PhosphorIcons.Airplane;
  if (lowerText.includes('train')) return PhosphorIcons.Train;
  if (lowerText.includes('bicycle') || lowerText.includes('bike')) return PhosphorIcons.Bicycle;
  if (lowerText.includes('heart') && lowerText.includes('beat')) return PhosphorIcons.Heartbeat;
  if (lowerText.includes('medical') || lowerText.includes('medicine') || lowerText.includes('health')) return PhosphorIcons.FirstAidKit;
  if (lowerText.includes('tree') || lowerText.includes('nature')) return PhosphorIcons.Tree;
  if (lowerText.includes('leaf') || lowerText.includes('eco') || lowerText.includes('green')) return PhosphorIcons.Leaf;
  if (lowerText.includes('recycle')) return PhosphorIcons.ArrowsClockwise;
  
  // Default colorful icon rotation
  const defaultIcons = [
    PhosphorIcons.Sparkle, PhosphorIcons.Target, PhosphorIcons.Lightning, 
    PhosphorIcons.TrendUp, PhosphorIcons.Star, PhosphorIcons.Rocket, 
    PhosphorIcons.Brain, PhosphorIcons.Heart, PhosphorIcons.CheckCircle, 
    PhosphorIcons.Globe, PhosphorIcons.Fire, PhosphorIcons.Trophy
  ];
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
                <Icon size={22} color={accentColor} weight="duotone" />
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

// Poster Process - Mimics the "How to make an infographic" style 1:1
const PosterProcessLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff', infographicIcons = [] }) => {
  const displayItems = items.slice(0, 5);
  const colors = deriveThemeColors(accentColor, 5);
  
  return (
    <div className="w-full h-[600px] relative flex items-center justify-center overflow-visible rounded-[40px] shadow-2xl"
         style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      {/* Central Hub with Ring */}
      <div className="relative z-20">
        {/* Outer Ring */}
        <div className="w-[220px] h-[220px] rounded-full border-[2px] border-white/10 flex items-center justify-center relative">
          <motion.div 
            className="absolute inset-[-15px] rounded-full border border-dashed border-white/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Inner Circle with Hub Icon */}
          <motion.div 
            className="w-24 h-32 rounded-2xl flex flex-col items-center justify-center"
            style={{ background: accentColor, boxShadow: `0 20px 40px ${accentColor}4D` }}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: -5 }}
            transition={{ type: "spring", damping: 10 }}
          >
             <div className="w-10 h-1 bg-black/20 mb-3 rounded-full" />
             <div className="w-10 h-10 flex items-center justify-center">
                <BarChart3 size={36} color="#000" strokeWidth={2.5} />
             </div>
             <div className="mt-4 space-y-1.5">
                <div className="w-12 h-1 bg-black/10 rounded-full" />
                <div className="w-8 h-1 bg-black/10 rounded-full" />
             </div>
          </motion.div>
        </div>
      </div>

      {/* Steps positioned around the circle */}
      {displayItems.map((item, index) => {
        const color = colors[index % colors.length];
        const iconUrl = infographicIcons[index];
        // Optimized angles for 5 items to avoid overlapping
        const angles = [-140, -220, -270, -320, -40];
        const angle = angles[index];
        const radius = 260; 
        const x = Math.cos(angle * (Math.PI / 180)) * radius;
        const y = Math.sin(angle * (Math.PI / 180)) * radius;

        return (
          <React.Fragment key={index}>
            {/* Connecting line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
               <motion.path 
                 d={`M ${x/2 + 540} ${y/2 + 540} L ${x + 540} ${y + 540}`}
                 stroke="white"
                 strokeWidth="1.5"
                 strokeDasharray="6 6"
                 initial={{ pathLength: 0, opacity: 0 }}
                 animate={{ pathLength: 1, opacity: 0.2 }}
                 transition={{ delay: 0.5 + index * 0.1 }}
               />
            </svg>

            {/* Content Box */}
            <motion.div 
              className="absolute z-30 w-[220px] bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              style={{ 
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: `translate(-50%, -50%)`,
              }}
              variants={itemVariants}
            >
              {/* Colored Step Header */}
              <div 
                className="px-4 py-2 flex items-center justify-between"
                style={{ backgroundColor: color }}
              >
                <span className="text-[10px] font-black text-black uppercase tracking-widest">
                  STEP {index + 1}
                </span>
                <div className="w-6 h-6 rounded-full bg-white/40 flex items-center justify-center overflow-hidden">
                   {iconUrl ? (
                     <img src={iconUrl} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-2 h-2 rounded-full bg-white" />
                   )}
                </div>
              </div>

              {/* Text Content */}
              <div className="p-4 min-h-[80px] flex items-center">
                <p className="text-[13px] font-bold leading-snug text-white/90">
                  {item}
                </p>
              </div>
            </motion.div>
          </React.Fragment>
        );
      })}
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
  const colors = deriveThemeColors(accentColor, 4);
  
  const metrics = displayItems.map((item, index) => {
    const numberMatch = item.match(/(\d+%?|\d+x|\d+\+|\d+k|\d+K|\d+M)/i);
    const value = numberMatch ? numberMatch[1].toUpperCase() : `${index + 1}`;
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
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {metrics.map((metric, index) => {
          const color = colors[index % colors.length];
          return (
            <motion.div 
              key={index}
              className="relative rounded-3xl p-8 text-center overflow-hidden group"
              style={{ 
                background: `linear-gradient(135deg, ${color}20 0%, ${color}05 100%)`,
                border: `1px solid ${color}30`,
              }}
              variants={scaleVariants}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
            >
              {/* Decorative background glow */}
              <div 
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40"
                style={{ backgroundColor: color }}
              />
              
              {/* Value */}
              <div 
                className="text-6xl font-black mb-4 relative z-10"
                style={{ 
                  color: color,
                  textShadow: `0 0 30px ${color}40`,
                }}
              >
                {metric.value}
              </div>
              
              {/* Animated Divider */}
              <motion.div 
                className="w-16 h-1 mx-auto mb-4 rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: 64 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              />
              
              {/* Label */}
              <p 
                className="text-sm font-bold leading-tight relative z-10 uppercase tracking-wide"
                style={{ color: textColor, opacity: 0.9 }}
              >
                {metric.label.length > 40 ? metric.label.slice(0, 40) + '...' : metric.label}
              </p>
            </motion.div>
          );
        })}
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

// Cycle - Circular hub and spoke diagram (Designer style)
const CycleLayout: React.FC<InfographicProps> = ({ items, accentColor = '#ffd700', textColor = '#ffffff' }) => {
  const displayItems = items.slice(0, 5);
  const colors = deriveThemeColors(accentColor, 5);
  
  return (
    <div className="w-full h-[550px] relative flex items-center justify-center overflow-visible">
      {/* Central Hub */}
      <motion.div 
        className="relative z-20 w-32 h-32 rounded-[32px] flex items-center justify-center shadow-2xl"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor} 0%, ${colors[1]} 100%)`,
          boxShadow: `0 0 80px ${accentColor}33`,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <Sparkles size={48} color="#000" strokeWidth={2.5} />
      </motion.div>
      
      {/* Spoke Items */}
      {displayItems.map((item, index) => {
        const Icon = getIconForText(item, index);
        const color = colors[index % colors.length];
        
        // Circular math
        const angle = (index * (360 / displayItems.length)) - 90;
        const radius = 220;
        const x = Math.cos(angle * (Math.PI / 180)) * radius;
        const y = Math.sin(angle * (Math.PI / 180)) * radius;
        
        return (
          <React.Fragment key={index}>
            {/* Connecting line */}
            <motion.div 
              className="absolute left-1/2 top-1/2 h-px origin-left z-10"
              style={{ 
                width: radius - 40,
                background: `linear-gradient(90deg, #ffffff20, ${color})`,
                left: '50%',
                top: '50%',
                transform: `rotate(${angle}deg) translateX(40px)`,
                opacity: 0.4
              }}
            />
            
            {/* Item Card */}
            <motion.div 
              className="absolute z-30 flex flex-col items-center"
              style={{ 
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
              variants={itemVariants}
            >
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl mb-3"
                style={{ background: color }}
              >
                <Icon size={28} color="#000" strokeWidth={2.5} />
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-center max-w-[140px]">
                <p className="text-[12px] font-bold text-white leading-tight">
                  {item}
                </p>
              </div>
            </motion.div>
          </React.Fragment>
        );
      })}
    </div>
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
  const { layout, items, accentColor = '#ffd700' } = props;
  
  if (!items || items.length === 0) return null;
  
  // Choose colors based on theme or index
  const themeColors = [
    accentColor, 
    '#3b82f6', // blue
    '#a855f7', // purple
    '#ec4899', // pink
    '#10b981', // emerald
    '#f59e0b'  // amber
  ];
  
  const propsWithColors = { ...props, themeColors };
  
  switch (layout) {
    case 'cards-grid': return <CardsGridLayout {...props} />;
    case 'timeline': return <TimelineLayout {...props} />;
    case 'process-steps': return <PosterProcessLayout {...props} />; // Updated to the new poster style
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
