import React from 'react';
import Image from 'next/image';
import { Upload, ImageIcon, Trash2 } from 'lucide-react';

interface MediaBlockProps {
    mediaType: 'video' | 'embed' | 'image' | null | undefined;
    mediaUrl?: string;
    embedHtml?: string;
    mediaAspectRatio?: number;
    mediaWidthPercent?: number;
    mediaAlignment?: 'left' | 'center' | 'right';
    mediaPosterUrl?: string;
    isDownloading: boolean;
    isEditable?: boolean;
    onUpdate?: (field: string, value: unknown) => void;
    onImagePreview?: (imageUrl: string) => void;
}

interface MediaOverlayProps {
    isEditable?: boolean;
    mediaType: 'video' | 'embed' | 'image' | null | undefined;
    onUpdate?: (field: string, value: unknown) => void;
}

const MediaOverlay: React.FC<MediaOverlayProps> = ({ isEditable, mediaType, onUpdate }) => {
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
                                const url = URL.createObjectURL(file);

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

export const MediaBlock: React.FC<MediaBlockProps> = ({
    mediaType,
    mediaUrl,
    embedHtml,
    mediaAspectRatio,
    mediaWidthPercent,
    mediaAlignment,
    mediaPosterUrl,
    isDownloading,
    isEditable,
    onUpdate,
    onImagePreview,
}) => {
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

    if (isDownloading && (mediaType === 'video' || mediaType === 'embed')) {
        return (
            <div className="mt-6 flex w-full" style={outerStyle}>
                <div
                    className="relative rounded-3xl overflow-hidden bg-black/40 border border-white/20 shadow-2xl flex-shrink-0"
                    style={{ ...innerStyle, aspectRatio: mediaAspectRatio || 16 / 9 }}
                >
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        {mediaPosterUrl ? (
                            <>
                                <Image
                                    src={mediaPosterUrl}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    alt="Video Thumbnail"
                                    fill
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <div className="w-24 h-24 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl backdrop-blur-sm">
                                        <div className="w-0 h-0 border-t-[16px] border-t-transparent border-l-[28px] border-l-white border-b-[16px] border-b-transparent ml-2"></div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col items-center gap-4 text-gray-500">
                                    {mediaType === 'video' ? <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white"><div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1"></div></div> : <code className="text-xl">Embed Content</code>}
                                    <span className="font-medium text-lg uppercase tracking-widest">{mediaType === 'video' ? 'Video' : 'Interactive Embed'}</span>
                                </div>
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

    if (mediaType === 'image' && mediaUrl) {
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
                    <Image
                        src={mediaUrl}
                        alt="Slide Media"
                        width={800}
                        height={800}
                        className={`select-none drop-shadow-lg ${hasAspectRatio ? 'w-full h-full object-contain' : 'max-w-full max-h-[600px] object-contain'}`}
                        unoptimized
                    />
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
                    <MediaOverlay isEditable={isEditable} mediaType={mediaType} onUpdate={onUpdate} />
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
                            crossOrigin="anonymous"
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
                <MediaOverlay isEditable={isEditable} mediaType={mediaType} onUpdate={onUpdate} />
            </div>
        </div>
    );
};
