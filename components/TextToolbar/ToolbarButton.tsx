"use client";

import React from 'react';

interface ToolbarButtonProps {
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  onMouseDown,
  active,
  title,
  children,
  className = '',
}) => (
  <button
    onClick={onClick}
    onMouseDown={onMouseDown}
    className={`p-1.5 rounded-lg transition-colors ${
      active ? 'bg-[#ffd700] text-black' : 'text-gray-400 hover:text-white hover:bg-gray-700'
    } ${className}`}
    title={title}
  >
    {children}
  </button>
);

export const Divider: React.FC = () => (
  <div className="w-px h-5 bg-gray-600 mx-0.5" />
);
