import React from 'react';
import { EditableText } from '../EditableText';
import { Infographic } from '../Infographic';
import { MediaBlock } from './MediaBlock';
import { ChartBlock } from './ChartBlock';
import {
    Lightbulb, Target, Rocket, TrendingUp, Users, Shield, Zap, Brain,
    Puzzle, Trophy, Clock, CheckCircle, Layers, GitBranch, Search, Lock,
    Globe, Star, Heart, Flag, Compass, Anchor, Award, Briefcase, Calendar,
    Cloud, Code, Cpu, Database, Download, Edit, Eye, FileText, Folder,
    Gift, Grid, Key, Layout, Link, List, Mail, Map, Maximize, Monitor,
    Package, Play, Plus, Power, RefreshCw, Settings, Share, Sliders, Sun,
    Tag, ThumbsUp, Wrench, UploadCloud, User, Video, Wifi
} from 'lucide-react';

import { SlideProps } from '../Slide';

interface ElementRendererProps extends SlideProps {
    id: string;
    activeAccentColor: string;
    activeTextColor: string;
    activeBgColor: string;
    isDownloading: boolean;
}

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
    'file-text': <FileText />,
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

export const ElementRenderer: React.FC<ElementRendererProps> = (props) => {
    const {
        id, type, title, subtitle, content, emoji, icon, slideLabel, slideLabelColor,
        slideNumber, totalSlides, fontScale = 1, activeAccentColor, activeTextColor,
        activeBgColor, titleColor, textAlign, textOpacity, backgroundImage, isEditable,
        onUpdate, infographicData, mediaType, mediaUrl, mediaPosterUrl, embedHtml,
        mediaAspectRatio, mediaWidthPercent, mediaAlignment, onImagePreview,
        chartType, chartData, isDownloading
    } = props;

    const getIconComponent = (iconName: string | undefined) => {
        if (!iconName) return null;
        return iconMap[iconName] || <Lightbulb />;
    };

    const sanitizeEmoji = (value: string | undefined | null) => {
        if (!value) return '';
        const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;
        return value.match(emojiRegex)?.[0] || value.charAt(0);
    };

    switch (id) {
        case 'slideLabel': {
            if (!slideLabel) return null;
            const labelColor = slideLabelColor || activeAccentColor;
            const isCover = type === 'cover';
            return (
                <div style={{
                    fontFamily: 'var(--font-roboto-mono), monospace',
                    fontSize: `${0.75 * fontScale}rem`,
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: labelColor,
                    marginBottom: isCover ? '12px' : '8px',
                    ...(isCover ? {
                        background: 'var(--slide-accent-10)',
                        border: '1px solid var(--slide-accent-33)',
                        padding: '6px 14px',
                        borderRadius: '4px',
                        width: 'fit-content',
                    } : {}),
                }}>
                    {isEditable ? (
                        <EditableText
                            tagName="span"
                            html={slideLabel}
                            onChange={(val) => onUpdate?.('slideLabel', val)}
                            placeholder="Label"
                        />
                    ) : slideLabel}
                </div>
            );
        }
        case 'slideCounter': {
            if (slideNumber === undefined || totalSlides === undefined) return null;
            return (
                <div style={{
                    fontFamily: 'var(--font-roboto-mono), monospace',
                    fontSize: `${0.7 * fontScale}rem`,
                    letterSpacing: '0.2em',
                    color: 'var(--slide-text-60)',
                    marginBottom: '8px',
                }}>
                    {String(slideNumber).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
                </div>
            );
        }
        case 'emoji': {
            const emojiValue = sanitizeEmoji(emoji);
            if (!emojiValue && !isEditable) return null;
            if (!emojiValue && isEditable) {
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
                    ) : emojiValue}
                </div>
            );
        }
        case 'icon':
            if (type !== 'visual' || !icon) return null;
            return (
                <div className="mb-8 flex items-center justify-center" style={{ color: 'var(--slide-accent)' }}>
                    <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--slide-accent-20)', border: '2px solid var(--slide-accent-40)' }}>
                        <div style={{ width: `${5 * fontScale}rem`, height: `${5 * fontScale}rem` }}>
                            {React.cloneElement(getIconComponent(icon) as React.ReactElement, {
                                width: '100%',
                                height: '100%',
                                strokeWidth: 1.5,
                            } as any)}
                        </div>
                    </div>
                </div>
            );
        case 'title':
            const titleStripped = title?.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
            const titleAlign = type === 'visual' ? 'center' : textAlign;
            const resolvedTitleColor = titleColor || activeAccentColor;
            return isEditable ? (
                <EditableText
                    tagName="h1"
                    className="font-bold leading-tight tracking-tight mb-2"
                    style={{
                        color: 'var(--slide-title)',
                        fontSize: type === 'cover' ? `${4 * fontScale}rem` : `${2.35 * fontScale}rem`,
                        textShadow: backgroundImage ? '0 4px 12px rgba(0,0,0,0.5)' : 'none',
                        textAlign: titleAlign,
                        opacity: textOpacity !== undefined ? textOpacity : 1,
                        wordWrap: 'break-word',
                        width: '100%',
                    }}
                    html={title}
                    onChange={(val) => onUpdate?.('title', val)}
                    placeholder="Title"
                />
            ) : titleStripped ? (
                <h1
                    className="font-bold leading-tight tracking-tight mb-2"
                    style={{
                        color: 'var(--slide-title)',
                        fontSize: type === 'cover' ? `${4 * fontScale}rem` : `${2.35 * fontScale}rem`,
                        textShadow: backgroundImage ? '0 4px 12px rgba(0,0,0,0.5)' : 'none',
                        textAlign: titleAlign,
                        opacity: textOpacity !== undefined ? textOpacity : 1,
                        wordWrap: 'break-word',
                        width: '100%',
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
                        className="font-light leading-relaxed opacity-80 mb-4"
                        style={{
                            color: 'var(--slide-text)',
                            fontSize: `${1.7 * fontScale}rem`,
                            textShadow: backgroundImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                            textAlign: textAlign,
                            opacity: textOpacity !== undefined ? textOpacity : 0.8,
                            wordWrap: 'break-word',
                            width: '100%',
                        }}
                        html={subtitle || ''}
                        onChange={(val) => onUpdate?.('subtitle', val)}
                        placeholder="Subtitle"
                    />
                ) : subtitleStripped ? (
                    <div
                        className="font-light leading-relaxed opacity-80 mb-4"
                        style={{
                            color: 'var(--slide-text)',
                            fontSize: `${1.7 * fontScale}rem`,
                            textShadow: backgroundImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                            textAlign: textAlign,
                            opacity: textOpacity !== undefined ? textOpacity : 0.8,
                            wordWrap: 'break-word',
                            width: '100%',
                        }}
                        dangerouslySetInnerHTML={{ __html: subtitle || '' }}
                    />
                ) : null
            ) : null;
        case 'content':
            const contentStripped = content?.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
            const isVisualSlide = type === 'visual';
            const contentFontSize = isVisualSlide ? `${1.7 * fontScale}rem` : `${1.65 * fontScale}rem`;
            const contentAlign = isVisualSlide ? 'center' : textAlign;
            return (content || isEditable) ? (
                <div className={`w-full ${isVisualSlide ? 'flex flex-col items-center justify-center' : ''}`} style={{ overflow: 'visible', width: '100%', wordWrap: 'break-word', minHeight: 'auto', height: 'auto' }}>
                    {isEditable ? (
                        <EditableText
                            tagName="div"
                            className={`slide-content leading-relaxed font-light ${isVisualSlide ? 'visual-content' : ''}`}
                            style={{
                                color: 'var(--slide-text)',
                                fontSize: contentFontSize,
                                textShadow: backgroundImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                                textAlign: contentAlign,
                                opacity: textOpacity !== undefined ? textOpacity : 1,
                                overflow: 'visible',
                                width: '100%',
                                paddingBottom: '0.75rem',
                                wordWrap: 'break-word',
                            }}
                            html={content || ''}
                            onChange={(val) => onUpdate?.('content', val)}
                            placeholder="Content..."
                        />
                    ) : contentStripped ? (
                        <div
                            className={`slide-content leading-relaxed font-light ${isVisualSlide ? 'visual-content' : ''}`}
                            style={{
                                color: 'var(--slide-text)',
                                fontSize: contentFontSize,
                                textShadow: backgroundImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                                textAlign: contentAlign,
                                opacity: textOpacity !== undefined ? textOpacity : 1,
                                overflow: 'visible',
                                width: '100%',
                                paddingBottom: '0.75rem',
                                wordWrap: 'break-word',
                            }}
                            dangerouslySetInnerHTML={{ __html: content || '' }}
                        />
                    ) : null}
                </div>
            ) : null;
        case 'infographic':
            if (!infographicData || !infographicData.items || infographicData.items.length < 1) return null;
            return (
                <div className="flex-1 w-full rounded-2xl overflow-hidden my-4 relative" style={{ minHeight: '400px' }}>
                    <div className="relative z-10 h-full">
                        <Infographic
                            items={infographicData.items}
                            layout={infographicData.layout || 'cards-grid'}
                            accentColor={activeAccentColor}
                            backgroundColor={backgroundImage ? '#0a0a0a' : activeBgColor || '#111c24'}
                            textColor={activeTextColor}
                        />
                    </div>
                </div>
            );
        case 'media':
            return (
                <MediaBlock
                    mediaType={mediaType}
                    mediaUrl={mediaUrl}
                    embedHtml={embedHtml}
                    mediaAspectRatio={mediaAspectRatio}
                    mediaWidthPercent={mediaWidthPercent}
                    mediaAlignment={mediaAlignment}
                    mediaPosterUrl={mediaPosterUrl}
                    isDownloading={isDownloading}
                    isEditable={isEditable}
                    onUpdate={onUpdate}
                    onImagePreview={onImagePreview}
                />
            );
        case 'chart':
            return (
                <ChartBlock
                    chartType={chartType}
                    chartData={chartData}
                    activeAccentColor={activeAccentColor}
                    activeTextColor={activeTextColor}
                    isDownloading={isDownloading}
                />
            );
        default:
            return null;
    }
};
