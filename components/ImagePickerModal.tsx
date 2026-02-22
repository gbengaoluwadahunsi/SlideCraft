'use client';

import React from 'react';
import {
  Image as ImageIcon,
  Upload,
  Search,
  Check,
  Loader2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface UnsplashPhoto {
  id: string;
  urls: { small: string; regular: string };
  alt: string;
  color: string;
  user: { name: string };
  downloadLink?: string;
}

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'single' | 'all';
  imageUrlInput: string;
  onImageUrlChange: (value: string) => void;
  onApplyUrl: (url: string, downloadLink?: string) => void;
  onUploadClick: () => void;
  unsplashQuery: string;
  onUnsplashQueryChange: (query: string) => void;
  onSearch: (query: string, page: number) => void;
  unsplashResults: UnsplashPhoto[];
  unsplashTotal: number;
  unsplashPage: number;
  unsplashLoading: boolean;
}

const QUICK_TAGS = [
  'business',
  'technology',
  'nature',
  'abstract',
  'gradient',
  'minimal',
  'office',
  'creative',
];

export const ImagePickerModal = React.memo(function ImagePickerModal({
  isOpen,
  onClose,
  mode,
  imageUrlInput,
  onImageUrlChange,
  onApplyUrl,
  onUploadClick,
  unsplashQuery,
  onUnsplashQueryChange,
  onSearch,
  unsplashResults,
  unsplashTotal,
  unsplashPage,
  unsplashLoading,
}: ImagePickerModalProps) {
  const title =
    mode === 'all' ? 'Set Background (All Slides)' : 'Set Background Image';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      titleIcon={<ImageIcon size={20} />}
      size="lg"
    >
      <div className="p-4 space-y-4">
        {/* Upload & URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              onUploadClick();
              onClose();
            }}
            className="flex items-center gap-3 p-4 bg-[var(--surface-2)]/50 hover:bg-[var(--surface-2)] border border-[var(--border)] rounded-xl transition group"
          >
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 group-hover:scale-110 transition">
              <Upload size={20} />
            </div>
            <div className="text-left">
              <div className="font-medium text-white">Upload from Device</div>
              <div className="text-xs text-[var(--text-muted)]">
                JPG, PNG, GIF, WebP
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2 p-2 bg-[var(--surface-2)]/50 border border-[var(--border)] rounded-xl">
            <input
              type="text"
              value={imageUrlInput}
              onChange={(e) => onImageUrlChange(e.target.value)}
              placeholder="Paste image URL..."
              className="flex-1 bg-transparent border-none outline-none text-white text-sm px-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && imageUrlInput.trim()) {
                  onApplyUrl(imageUrlInput.trim());
                }
              }}
            />
            <button
              onClick={() => {
                if (imageUrlInput.trim()) onApplyUrl(imageUrlInput.trim());
              }}
              disabled={!imageUrlInput.trim()}
              className="px-3 py-2 bg-[var(--accent)] text-black rounded-lg text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Unsplash Search */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[var(--surface-2)]/50 border border-[var(--border)] rounded-xl px-3 py-2">
              <Search size={16} className="text-[var(--text-muted)]" />
              <input
                type="text"
                value={unsplashQuery}
                onChange={(e) => onUnsplashQueryChange(e.target.value)}
                placeholder="Search free photos on Unsplash..."
                className="flex-1 bg-transparent border-none outline-none text-white text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSearch(unsplashQuery, 1);
                }}
              />
            </div>
            <button
              onClick={() => onSearch(unsplashQuery, 1)}
              disabled={unsplashLoading || !unsplashQuery.trim()}
              className="px-4 py-2 bg-[var(--accent)] text-black rounded-xl text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {unsplashLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Search
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  onUnsplashQueryChange(tag);
                  onSearch(tag, 1);
                }}
                className="px-3 py-1 bg-[var(--surface-3)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] text-xs rounded-full transition capitalize"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {unsplashResults.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs text-[var(--text-muted)]">
              {unsplashTotal.toLocaleString()} photos found &bull; Photos by{' '}
              <a
                href="https://unsplash.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                Unsplash
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {unsplashResults.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() =>
                    onApplyUrl(photo.urls.regular, photo.downloadLink)
                  }
                  className="group relative aspect-square rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] transition"
                  style={{ backgroundColor: photo.color }}
                >
                  <img
                    src={photo.urls.small}
                    alt={photo.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                    <Check
                      size={24}
                      className="text-white opacity-0 group-hover:opacity-100 transition"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition">
                    <div className="text-[10px] text-white truncate">
                      by {photo.user.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {unsplashResults.length < unsplashTotal && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() =>
                    onSearch(unsplashQuery, unsplashPage + 1)
                  }
                  disabled={unsplashLoading}
                  className="px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-secondary)] text-sm rounded-lg transition flex items-center gap-2"
                >
                  {unsplashLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  Load More
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!unsplashLoading &&
          unsplashResults.length === 0 &&
          unsplashQuery && (
            <div className="text-center py-8 text-[var(--text-muted)]">
              <ImageIcon size={40} className="mx-auto mb-2 opacity-50" />
              <p>No photos found for &ldquo;{unsplashQuery}&rdquo;</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}

        {/* Initial state */}
        {!unsplashQuery && unsplashResults.length === 0 && (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <Search size={40} className="mx-auto mb-2 opacity-50" />
            <p>Search millions of free photos</p>
            <p className="text-xs mt-1">Powered by Unsplash</p>
          </div>
        )}
      </div>
    </Modal>
  );
});
