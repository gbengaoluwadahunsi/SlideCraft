"use client";

import React from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Minus, Plus, Link2, RotateCcw
} from 'lucide-react';
import { ToolbarButton, Divider } from './ToolbarButton';
import { ColorPicker } from './ColorPicker';
import { BulletStylePicker } from './BulletStylePicker';
import { EmojiPicker } from './EmojiPicker';
import { useTextToolbar } from './TextToolbarContext';

interface ToolbarContentProps {
  showColorPicker: boolean;
  showBulletStylePicker: boolean;
  showEmojiPicker: boolean;
  
  onToggleColorPicker: () => void;
  onToggleBulletStylePicker: () => void;
  onToggleEmojiPicker: () => void;
  closeAllPickers: () => void;
  
  execCommand: (command: string, value?: string) => void;
  adjustFontSize: (delta: number) => void;
  applyFontSize: (size: number) => void;
  insertEmoji: (emoji: string) => void;
  insertLink: () => void;
  clearFormatting: () => void;
  
  fontSizeInput: string;
  setFontSizeInput: (value: string) => void;
}

export const ToolbarContent: React.FC<ToolbarContentProps> = ({
  showColorPicker,
  showBulletStylePicker,
  showEmojiPicker,
  onToggleColorPicker,
  onToggleBulletStylePicker,
  onToggleEmojiPicker,
  closeAllPickers,
  execCommand,
  adjustFontSize,
  applyFontSize,
  insertEmoji,
  insertLink,
  clearFormatting,
  fontSizeInput,
  setFontSizeInput,
}) => {
  const { activeStates } = useTextToolbar();

  return (
    <div className="flex items-center justify-center gap-0.5">
      {/* Font Size */}
      <button 
        onMouseDown={(e) => { e.preventDefault(); adjustFontSize(-2); }}
        className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
        title="Smaller"
      >
        <Minus size={14} />
      </button>
      <input 
        type="text" 
        value={fontSizeInput} 
        onChange={(e) => setFontSizeInput(e.target.value)} 
        onBlur={() => { 
          const s = parseInt(fontSizeInput); 
          if (!isNaN(s) && s >= 8 && s <= 120) applyFontSize(s); 
        }} 
        onKeyDown={(e) => { 
          if (e.key === 'Enter') { 
            const s = parseInt(fontSizeInput); 
            if (!isNaN(s) && s >= 8 && s <= 120) applyFontSize(s); 
          } 
        }} 
        className="w-8 px-1 py-0.5 text-center text-xs bg-gray-700 rounded text-gray-200 focus:outline-none" 
      />
      <button 
        onMouseDown={(e) => { e.preventDefault(); adjustFontSize(2); }}
        className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
        title="Larger"
      >
        <Plus size={14} />
      </button>

      <Divider />

      {/* Bold, Italic, Underline */}
      <ToolbarButton 
        onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} 
        active={activeStates.bold} 
        title="Bold"
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} 
        active={activeStates.italic} 
        title="Italic"
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }} 
        active={activeStates.underline} 
        title="Underline"
      >
        <Underline size={16} />
      </ToolbarButton>

      <Divider />

      {/* Text Color */}
      <ColorPicker
        isOpen={showColorPicker}
        onClose={closeAllPickers}
        onToggle={() => { closeAllPickers(); onToggleColorPicker(); }}
      />

      <Divider />

      {/* Alignment */}
      <ToolbarButton 
        onMouseDown={(e) => { e.preventDefault(); execCommand('justifyLeft'); }} 
        active={activeStates.alignLeft} 
        title="Left"
      >
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onMouseDown={(e) => { e.preventDefault(); execCommand('justifyCenter'); }} 
        active={activeStates.alignCenter} 
        title="Center"
      >
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onMouseDown={(e) => { e.preventDefault(); execCommand('justifyRight'); }} 
        active={activeStates.alignRight} 
        title="Right"
      >
        <AlignRight size={16} />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <BulletStylePicker
        isOpen={showBulletStylePicker}
        onClose={closeAllPickers}
        onToggle={() => { closeAllPickers(); onToggleBulletStylePicker(); }}
        applyListStyle={() => execCommand('insertUnorderedList')}
      />

      {/* Link */}
      <ToolbarButton onMouseDown={(e) => { e.preventDefault(); insertLink(); }} title="Link">
        <Link2 size={16} />
      </ToolbarButton>

      {/* Emoji */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={closeAllPickers}
        onToggle={() => { closeAllPickers(); onToggleEmojiPicker(); }}
        insertEmoji={insertEmoji}
      />

      {/* Clear */}
      <ToolbarButton onMouseDown={(e) => { e.preventDefault(); clearFormatting(); }} title="Clear Format">
        <RotateCcw size={16} />
      </ToolbarButton>
    </div>
  );
};
