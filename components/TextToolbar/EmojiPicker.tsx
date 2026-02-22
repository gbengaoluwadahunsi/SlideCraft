"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile } from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';
import { useTextToolbar } from './TextToolbarContext';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  insertEmoji: (emoji: string) => void;
}

const emojis = ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','👍','👎','👏','🙌','👐','🤲','🤝','🙏','✌️','🤞','🤟','🤘','👌','🤌','🤏','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤙','💪','🦾','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','⭐','🌟','✨','💫','🔥','💥','💯','👀','👁️','💬','💭','🗯️','✅','❌','❓','❗','💡','📌','📍','🎯','🎪','🎨','🎭','🎬','🎤','🎧','🎵','🎶','🎹','🥁','🎸','🎺','🎻'];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ 
  isOpen, 
  onClose, 
  onToggle, 
  insertEmoji 
}) => {
  const { saveSelection } = useTextToolbar();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 300),
      });
    }
  }, [isOpen]);

  const dropdown = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed z-[9999] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-72"
          style={{ top: pos.top, left: pos.left }}
          initial={{ opacity: 0, y: -5, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: -5, scale: 0.95 }}
        >
          <div className="px-3 py-2 border-b border-gray-700">
            <span className="text-xs text-gray-400 font-medium">Emoji</span>
          </div>
          <div className="p-2 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-8 gap-1">
              {emojis.map(emoji => (
                <button 
                  key={emoji} 
                  onMouseDown={(e) => { e.preventDefault(); insertEmoji(emoji); onClose(); }}
                  className="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={buttonRef}>
      <ToolbarButton 
        onMouseDown={(e) => { e.preventDefault(); saveSelection(); onToggle(); }} 
        title="Emoji"
      >
        <Smile size={16} />
      </ToolbarButton>
      {mounted && createPortal(dropdown, document.body)}
    </div>
  );
};
