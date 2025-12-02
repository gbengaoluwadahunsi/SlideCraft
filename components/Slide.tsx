"use client";

import React from 'react';
import { EditableText } from './EditableText';
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

interface SlideProps {
  type: 'cover' | 'content' | 'chart';
  title: string;
  subtitle?: string;
  content?: string;
  emoji?: string;
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
  isEditable?: boolean;
  onUpdate?: (field: string, value: string) => void;
  // Chart specific props
  chartType?: 'bar' | 'line' | 'pie';
  chartData?: Array<{ name: string; value: number; }>;
}

export const Slide: React.FC<SlideProps> = ({ 
  type, 
  title, 
  subtitle, 
  content, 
  emoji, 
  category = "UNDER THE HOOD", 
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
  isEditable = false,
  onUpdate,
  chartType,
  chartData
}) => {
  // Determine colors based on slide type and overrides
  const activeBgColor = (type === 'cover' && coverBackgroundColor) ? coverBackgroundColor : backgroundColor;
  const activeTextColor = (type === 'cover' && coverTextColor) ? coverTextColor : textColor;
  const activeAccentColor = (type === 'cover' && coverAccentColor) ? coverAccentColor : accentColor;

  // Generate unique ID for style scoping
  const slideId = React.useId().replace(/:/g, '');
  const scopeClass = `slide-${slideId}`;

  // Styles that were previously applied via regex replacement are now handled via CSS
  // This allows content to remain clean HTML while still looking styled
  const styles = `
    .${scopeClass} strong, .${scopeClass} b { color: ${activeAccentColor}; font-weight: 700; }
    .${scopeClass} em, .${scopeClass} i { background-color: ${activeAccentColor}33; color: ${activeAccentColor}; font-style: normal; padding: 0 4px; border-radius: 4px; }
    .${scopeClass} code { background-color: transparent; color: ${activeAccentColor}; padding: 0 2px; font-family: var(--font-roboto-mono), monospace; font-weight: bold; }
    /* Add styles for font/color changes from toolbar if they use spans with styles, which works automatically */
  `;

  const COLORS = [activeAccentColor, '#ff9f40', '#ff6384', '#4bc0c0', '#9966ff'];

  const renderChart = () => {
    if (!chartData || chartData.length === 0) return null;

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
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
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
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
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
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
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={`w-[1080px] h-[1080px] flex flex-col relative overflow-hidden shrink-0 ${isEditable ? 'select-text' : 'select-none'} ${scopeClass}`}
      style={{
        backgroundColor: activeBgColor, 
        color: activeTextColor,
        fontFamily: fontFamily,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <style>{styles}</style>
      
      {/* Background Overlay for Readability */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: activeBgColor, opacity: backgroundOverlayOpacity }}
        />
      )}

      {/* Top Tag/Category Pill */}
      {category && category.trim() !== "" && (
        <div className="absolute top-16 left-16 z-10">
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
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 px-16 flex flex-col pt-48 pb-24 relative z-10">
        {type === 'cover' ? (
          <div className={`flex flex-col justify-center h-full text-${textAlign}`}>
            {isEditable ? (
                <EditableText 
                    tagName="h1"
                    className="font-bold leading-tight tracking-tight mb-12"
                    style={{ 
                        color: activeTextColor,
                        fontSize: `${4.5 * fontScale}rem`,
                        textShadow: backgroundImage ? '0 4px 12px rgba(0,0,0,0.5)' : 'none',
                        textAlign: textAlign
                    }}
                    html={title}
                    onChange={(val) => onUpdate?.('title', val)}
                    placeholder="Enter Title"
                />
            ) : (
                <h1 
                className="font-bold leading-tight tracking-tight mb-12" 
                style={{ 
                    color: activeTextColor,
                    fontSize: `${4.5 * fontScale}rem`,
                    textShadow: backgroundImage ? '0 4px 12px rgba(0,0,0,0.5)' : 'none',
                    textAlign: textAlign
                }}
                dangerouslySetInnerHTML={{ __html: title }}
                />
            )}
            
            {(subtitle || isEditable) && (
              isEditable ? (
                <EditableText
                    tagName="div"
                    className="font-light leading-relaxed max-w-5xl opacity-80"
                    style={{ 
                        color: activeTextColor,
                        fontSize: `${2.25 * fontScale}rem`,
                        textShadow: backgroundImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                        textAlign: textAlign
                    }}
                    html={subtitle || ''}
                    onChange={(val) => onUpdate?.('subtitle', val)}
                    placeholder="Enter Subtitle..."
                />
              ) : (
                  subtitle && (
                    <div 
                        className="font-light leading-relaxed max-w-5xl opacity-80" 
                        style={{ 
                        color: activeTextColor,
                        fontSize: `${2.25 * fontScale}rem`,
                        textShadow: backgroundImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                        textAlign: textAlign
                        }}
                        dangerouslySetInnerHTML={{ __html: subtitle }}
                    />
                  )
              )
            )}
          </div>
        ) : type === 'chart' ? (
            <div className="flex flex-col h-full">
               {/* Chart Title */}
               <div className="mb-8">
                   {emoji && (
                       <div style={{ fontSize: `${3.75 * fontScale}rem`, marginBottom: '1rem' }}>
                           {emoji}
                       </div>
                   )}
                   {isEditable ? (
                       <EditableText
                           tagName="h2"
                           className="font-bold leading-tight mb-4"
                           style={{ 
                               color: activeAccentColor,
                               fontSize: `${3 * fontScale}rem`,
                               textShadow: backgroundImage ? '0 4px 12px rgba(0,0,0,0.5)' : 'none'
                           }}
                           html={title}
                           onChange={(val) => onUpdate?.('title', val)}
                           placeholder="Chart Title"
                       />
                   ) : (
                       <h2 
                           className="font-bold leading-tight mb-4" 
                           style={{ 
                               color: activeAccentColor,
                               fontSize: `${3 * fontScale}rem`,
                               textShadow: backgroundImage ? '0 4px 12px rgba(0,0,0,0.5)' : 'none'
                           }}
                           dangerouslySetInnerHTML={{ __html: title }}
                       />
                   )}
                    {content && (
                        <p 
                            className="font-light opacity-80 leading-relaxed"
                             style={{ 
                                color: activeTextColor,
                                fontSize: `${1.75 * fontScale}rem`,
                            }}
                        >
                            {content.replace(/<[^>]*>?/gm, '')}
                        </p>
                    )}
               </div>

               {/* Chart Render Area */}
               <div className="flex-1 w-full h-full pb-12">
                   <div className="w-full h-full bg-black/20 rounded-3xl p-8 border border-white/10 shadow-inner">
                        {renderChart()}
                   </div>
               </div>
            </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Emoji & Title Header */}
            <div className="mb-12">
              {(emoji || isEditable) && (
                 isEditable ? (
                    <div style={{ fontSize: `${3.75 * fontScale}rem`, marginBottom: '1.5rem' }}>
                        <EditableText 
                            html={emoji || ''}
                            onChange={(val) => onUpdate?.('emoji', val)}
                            tagName="div"
                            placeholder="✨"
                        />
                    </div>
                 ) : (
                     emoji && (
                        <div style={{ fontSize: `${3.75 * fontScale}rem`, marginBottom: '1.5rem' }}>
                        {emoji}
                        </div>
                    )
                 )
              )}
              
              {isEditable ? (
                 <EditableText
                    tagName="h2"
                    className="font-bold leading-tight mb-4"
                    style={{ 
                        color: activeAccentColor,
                        fontSize: `${3 * fontScale}rem`,
                        textShadow: backgroundImage ? '0 4px 12px rgba(0,0,0,0.5)' : 'none'
                    }}
                    html={title}
                    onChange={(val) => onUpdate?.('title', val)}
                    placeholder="Slide Title"
                 />
              ) : (
                <h2 
                    className="font-bold leading-tight mb-4" 
                    style={{ 
                    color: activeAccentColor,
                    fontSize: `${3 * fontScale}rem`,
                    textShadow: backgroundImage ? '0 4px 12px rgba(0,0,0,0.5)' : 'none'
                    }}
                    dangerouslySetInnerHTML={{ __html: title }}
                />
              )}
            </div>
            
            {/* Content Body */}
            <div className="flex-1 overflow-hidden">
              {(content || isEditable) && (
                isEditable ? (
                    <EditableText 
                        tagName="div"
                        className="slide-content leading-relaxed font-light"
                        style={{ 
                            color: activeTextColor,
                            fontSize: `${2.25 * fontScale}rem`,
                            textShadow: backgroundImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none'
                        }} 
                        html={content || ''}
                        onChange={(val) => onUpdate?.('content', val)}
                        placeholder="Click to edit content..."
                    />
                ) : (
                     content && (
                        <div 
                        className="slide-content leading-relaxed font-light"
                        style={{ 
                            color: activeTextColor,
                            fontSize: `${2.25 * fontScale}rem`,
                            textShadow: backgroundImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none'
                        }} 
                        dangerouslySetInnerHTML={{ __html: content }} // Now just raw content, styled by css above
                        />
                    )
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Handle */}
      <div 
        className="absolute bottom-12 right-16 font-medium tracking-wide opacity-60 z-10"
        style={{ fontSize: `${1.25 * fontScale}rem` }}
      >
         {isEditable ? (
            <EditableText 
               html={handle || ''}
               onChange={(val) => onUpdate?.('handle', val)}
               tagName="div"
               placeholder="@yourhandle"
            />
         ) : (
            handle
         )}
      </div>
    </div>
  );
};
