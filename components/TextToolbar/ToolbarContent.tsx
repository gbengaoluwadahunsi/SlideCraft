"use client";

import React from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  Minus, Plus, Link2, Outdent, Indent, Superscript, Subscript, RotateCcw,
  CaseSensitive, CaseUpper, CaseLower, Pipette, Copy
} from 'lucide-react';
import { ToolbarButton, Divider } from './ToolbarButton';
import { ColorPicker } from './ColorPicker';
import { HighlightPicker } from './HighlightPicker';
import { FontPicker } from './FontPicker';
import { BulletStylePicker } from './BulletStylePicker';
import { EmojiPicker } from './EmojiPicker';
import { LineHeightPicker } from './LineHeightPicker';
import { LetterSpacingPicker } from './LetterSpacingPicker';
import { TextEffectsPicker } from './TextEffectsPicker';
import { useTextToolbar } from './TextToolbarContext';

interface ToolbarContentProps {
  // Picker states
  showColorPicker: boolean;
  showHighlightPicker: boolean;
  showFontPicker: boolean;
  showBulletStylePicker: boolean;
  showEmojiPicker: boolean;
  showLineHeightPicker: boolean;
  showLetterSpacingPicker: boolean;
  showTextEffectsPicker: boolean;
  
  // Picker handlers
  onToggleColorPicker: () => void;
  onToggleHighlightPicker: () => void;
  onToggleFontPicker: () => void;
  onToggleBulletStylePicker: () => void;
  onToggleEmojiPicker: () => void;
  onToggleLineHeightPicker: () => void;
  onToggleLetterSpacingPicker: () => void;
  onToggleTextEffectsPicker: () => void;
  closeAllPickers: () => void;
  
  // Functions
  execCommand: (command: string, value?: string) => void;
  adjustFontSize: (delta: number) => void;
  applyFontSize: (size: number) => void;
  applyFontFamily: (fontFamily: string) => void;
  applyHighlight: (color: string) => void;
  applyLineHeight: (lineHeight: string) => void;
  applyLetterSpacing: (spacing: string) => void;
  applyTextTransform: (transform: 'uppercase' | 'lowercase' | 'capitalize' | 'none') => void;
  applyTextEffect: (effect: 'shadow' | 'outline' | 'glow' | 'none') => void;
  applyListStyle: (style: 'disc' | 'circle' | 'square' | 'decimal' | 'decimal-leading-zero' | 'lower-roman' | 'upper-roman' | 'lower-alpha' | 'upper-alpha' | 'none') => void;
  insertEmoji: (emoji: string) => void;
  insertLink: () => void;
  adjustIndent: (direction: 'increase' | 'decrease') => void;
  copyFormat: () => void;
  pasteFormat: () => void;
  clearFormatting: () => void;
  
  // State
  fontSizeInput: string;
  setFontSizeInput: (value: string) => void;
}

export const ToolbarContent: React.FC<ToolbarContentProps> = ({
  showColorPicker,
  showHighlightPicker,
  showFontPicker,
  showBulletStylePicker,
  showEmojiPicker,
  showLineHeightPicker,
  showLetterSpacingPicker,
  showTextEffectsPicker,
  onToggleColorPicker,
  onToggleHighlightPicker,
  onToggleFontPicker,
  onToggleBulletStylePicker,
  onToggleEmojiPicker,
  onToggleLineHeightPicker,
  onToggleLetterSpacingPicker,
  onToggleTextEffectsPicker,
  closeAllPickers,
  execCommand,
  adjustFontSize,
  applyFontSize,
  applyFontFamily,
  applyHighlight,
  applyLineHeight,
  applyLetterSpacing,
  applyTextTransform,
  applyTextEffect,
  applyListStyle,
  insertEmoji,
  insertLink,
  adjustIndent,
  copyFormat,
  pasteFormat,
  clearFormatting,
  fontSizeInput,
  setFontSizeInput,
}) => {
  const { activeStates } = useTextToolbar();

  return (
    <div className="flex flex-col gap-1">
      {/* Row 1: Font, Size, Basic Formatting, Colors */}
      <div className="flex items-center justify-center gap-0.5">
        {/* Font Family */}
        <FontPicker
          isOpen={showFontPicker}
          onClose={closeAllPickers}
          onToggle={() => { closeAllPickers(); onToggleFontPicker(); }}
          applyFontFamily={applyFontFamily}
        />

        <Divider />

        {/* Font Size */}
        <button 
          onClick={() => adjustFontSize(-2)} 
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
          onClick={() => adjustFontSize(2)} 
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
          title="Larger"
        >
          <Plus size={14} />
        </button>

        <Divider />

        {/* B I U S */}
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
        <ToolbarButton 
          onMouseDown={(e) => { e.preventDefault(); execCommand('strikethrough'); }} 
          active={activeStates.strikethrough} 
          title="Strike"
        >
          <Strikethrough size={16} />
        </ToolbarButton>

        <Divider />

        {/* Colors */}
        <ColorPicker
          isOpen={showColorPicker}
          onClose={closeAllPickers}
          onToggle={() => { closeAllPickers(); onToggleColorPicker(); }}
        />

        <HighlightPicker
          isOpen={showHighlightPicker}
          onClose={closeAllPickers}
          onToggle={() => { closeAllPickers(); onToggleHighlightPicker(); }}
          applyHighlight={applyHighlight}
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

        {/* Lists with Style Picker */}
        <BulletStylePicker
          isOpen={showBulletStylePicker}
          onClose={closeAllPickers}
          onToggle={() => { closeAllPickers(); onToggleBulletStylePicker(); }}
          applyListStyle={applyListStyle}
        />
      </div>

      {/* Row 2: Advanced Features */}
      <div className="flex items-center justify-center gap-0.5 border-t border-gray-700/50 pt-1">
        {/* Indent */}
        <ToolbarButton 
          onClick={() => adjustIndent('decrease')} 
          title="Outdent"
        >
          <Outdent size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => adjustIndent('increase')} 
          title="Indent"
        >
          <Indent size={16} />
        </ToolbarButton>

        <Divider />

        {/* Line Height */}
        <LineHeightPicker
          isOpen={showLineHeightPicker}
          onClose={closeAllPickers}
          onToggle={() => { closeAllPickers(); onToggleLineHeightPicker(); }}
          applyLineHeight={applyLineHeight}
        />

        {/* Letter Spacing */}
        <LetterSpacingPicker
          isOpen={showLetterSpacingPicker}
          onClose={closeAllPickers}
          onToggle={() => { closeAllPickers(); onToggleLetterSpacingPicker(); }}
          applyLetterSpacing={applyLetterSpacing}
        />

        <Divider />

        {/* Text Transform */}
        <ToolbarButton 
          onClick={() => applyTextTransform('uppercase')} 
          title="UPPERCASE"
        >
          <CaseUpper size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => applyTextTransform('lowercase')} 
          title="lowercase"
        >
          <CaseLower size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => applyTextTransform('capitalize')} 
          title="Capitalize"
        >
          <CaseSensitive size={16} />
        </ToolbarButton>

        <Divider />

        {/* Super/Sub */}
        <ToolbarButton 
          onMouseDown={(e) => { e.preventDefault(); execCommand('superscript'); }} 
          active={activeStates.superscript} 
          title="Superscript"
        >
          <Superscript size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onMouseDown={(e) => { e.preventDefault(); execCommand('subscript'); }} 
          active={activeStates.subscript} 
          title="Subscript"
        >
          <Subscript size={16} />
        </ToolbarButton>

        <Divider />

        {/* Format Painter */}
        <ToolbarButton 
          onClick={copyFormat} 
          active={false} 
          title="Copy Format"
        >
          <Copy size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={pasteFormat} 
          title="Paste Format"
        >
          <Pipette size={16} />
        </ToolbarButton>

        <Divider />

        {/* Text Effects */}
        <TextEffectsPicker
          isOpen={showTextEffectsPicker}
          onClose={closeAllPickers}
          onToggle={() => { closeAllPickers(); onToggleTextEffectsPicker(); }}
          applyTextEffect={applyTextEffect}
        />

        <Divider />

        {/* Link */}
        <ToolbarButton 
          onClick={insertLink} 
          title="Link"
        >
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
        <ToolbarButton 
          onClick={clearFormatting} 
          title="Clear Format"
        >
          <RotateCcw size={16} />
        </ToolbarButton>
      </div>
    </div>
  );
};
