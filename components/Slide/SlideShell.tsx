import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { EditableText } from '../EditableText';

import { SlideProps } from '../Slide';

interface SlideShellProps extends SlideProps {
    children: React.ReactNode;
    scopeClass: string;
    styles: string;
    activeBgColor: string;
    activeTextColor: string;
    activeAccentColor: string;
    isDownloading: boolean;
    isEditable: boolean; // Override to be non-optional if needed, but SlideProps has it optional
}

export const SlideShell: React.FC<SlideShellProps> = ({
    children,
    scopeClass,
    styles,
    activeBgColor,
    activeTextColor,
    activeAccentColor,
    fontFamily,
    isEditable,
    isDownloading,
    onUpdate,
    showNoise,
    backgroundPattern,
    glowColor,
    glowPosition,
    backgroundImage,
    backgroundImageFilter,
    backgroundOverlayOpacity = 0,
    borderWidth,
    borderStyle,
    borderColor,
    borderRadius,
    category,
    logoUrl,
    handle,
    fontScale = 1,
    titleColor,
}) => {
    const glowPositionStyles: Record<string, React.CSSProperties> = {
        'top-right': { top: '-80px', right: '-80px' },
        'bottom-right': { bottom: '-80px', right: '-80px' },
        'top-left': { top: '-80px', left: '-80px' },
        'bottom-left': { bottom: '-80px', left: '-80px' },
        'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    };

    const sanitizeHandle = (value: string | undefined | null) => {
        if (!value) return '';
        return value.replace(/<[^>]*>/g, '').trim();
    };

    return (
        <motion.div
            className={`w-[1080px] min-h-[1080px] flex flex-col relative overflow-visible shrink-0 ${scopeClass}`}
            style={{
                backgroundColor: backgroundImage ? '#0a0a0a' : 'var(--slide-bg)',
                color: 'var(--slide-text)',
                fontFamily: fontFamily,
                userSelect: isEditable ? 'text' : 'none',
                WebkitUserSelect: isEditable ? 'text' : 'none',
                height: 'auto',
                maxHeight: 'none',
                minHeight: '1080px',
                ...(borderWidth ? { border: `${borderWidth}px ${borderStyle || 'solid'} ${borderColor || 'var(--slide-accent)'}` } : {}),
                ...(borderRadius ? { borderRadius: `${borderRadius}px`, overflow: 'hidden' } : {}),
                // CSS Variables for themes
                ['--slide-accent' as any]: activeAccentColor,
                ['--slide-accent-10' as any]: `${activeAccentColor}10`,
                ['--slide-accent-20' as any]: `${activeAccentColor}20`,
                ['--slide-accent-33' as any]: `${activeAccentColor}33`,
                ['--slide-accent-40' as any]: `${activeAccentColor}40`,
                ['--slide-accent-60' as any]: `${activeAccentColor}60`,
                ['--slide-text' as any]: activeTextColor,
                ['--slide-text-45' as any]: `${activeTextColor}73`,
                ['--slide-text-60' as any]: `${activeTextColor}99`,
                ['--slide-bg' as any]: activeBgColor,
                ['--slide-title' as any]: titleColor || activeAccentColor,
            }}
            initial={isDownloading ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={isDownloading ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
        >
            <style>{styles}</style>

            {/* Noise texture overlay */}
            {showNoise && (
                <div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
                        opacity: 0.4,
                    }}
                />
            )}

            {/* Grid/dots background pattern */}
            {backgroundPattern === 'grid' && (
                <div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                        backgroundImage: `linear-gradient(var(--slide-accent-10) 1px, transparent 1px), linear-gradient(90deg, var(--slide-accent-10) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
            )}
            {backgroundPattern === 'dots' && (
                <div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                        backgroundImage: `radial-gradient(var(--slide-accent-20) 1px, transparent 1px)`,
                        backgroundSize: '24px 24px',
                    }}
                />
            )}

            {/* Radial glow effect */}
            {glowColor && (
                <div
                    className="absolute pointer-events-none z-0"
                    style={{
                        width: '360px',
                        height: '360px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${glowColor} 0%, transparent 65%)`,
                        ...(glowPositionStyles[glowPosition || 'top-right'] || glowPositionStyles['top-right']),
                    }}
                />
            )}

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
                                backgroundColor: 'var(--slide-accent)',
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
                                backgroundColor: 'var(--slide-accent)',
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
                    <Image
                        src={logoUrl}
                        alt="Brand Logo"
                        width={200}
                        height={80}
                        className="max-h-20 max-w-48 object-contain drop-shadow-lg"
                        style={{
                            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                            opacity: 0.9
                        }}
                        unoptimized
                    />
                </motion.div>
            )}

            {/* Children Content Area */}
            {children}

            {/* Footer / Handle */}
            <motion.div
                className="absolute bottom-12 right-16 font-medium tracking-wide opacity-60 z-10"
                style={{
                    fontSize: `${1.25 * fontScale}rem`,
                    whiteSpace: 'nowrap',
                    width: 'auto',
                    minWidth: 'auto'
                }}
                initial={isDownloading ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 0.6, y: 0 }}
                transition={isDownloading ? { duration: 0 } : { duration: 0.5, delay: 0.3 }}
            >
                {isEditable ? (
                    <span
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => onUpdate?.('handle', sanitizeHandle(e.currentTarget.textContent || ''))}
                        className="cursor-text outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 whitespace-nowrap"
                        {...({ 'data-placeholder': "@handle" } as any)}
                        style={{ whiteSpace: 'nowrap', display: 'inline' }}
                    >
                        {sanitizeHandle(handle) || ''}
                    </span>
                ) : (
                    <span className="whitespace-nowrap" style={{ whiteSpace: 'nowrap', display: 'inline' }}>{sanitizeHandle(handle)}</span>
                )}
            </motion.div>
        </motion.div>
    );
};
