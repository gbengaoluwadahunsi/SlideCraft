'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleIcon?: React.ReactNode;
  subtitle?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[90vw]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  titleIcon,
  subtitle,
  size = 'md',
  children,
  footer,
  className = '',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className={`
          w-full ${sizeStyles[size]}
          bg-[var(--surface-1)] border border-[var(--border)]
          rounded-2xl shadow-2xl overflow-hidden
          animate-in fade-in zoom-in duration-200
          max-h-[90vh] flex flex-col
          ${className}
        `.trim()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            {titleIcon && (
              <span className="text-[var(--accent)]">{titleIcon}</span>
            )}
            <div>
              <h3 className="font-bold text-white text-lg">{title}</h3>
              {subtitle && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-white transition p-2 hover:bg-[var(--surface-2)] rounded-lg"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-[var(--border)] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
