"use client";

import React from 'react';
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

  return (
    <div className="relative z-[9998]">
      <ToolbarButton 
        onClick={() => { saveSelection(); onToggle(); }} 
        title="Emoji"
      >
        <Smile size={16} />
      </ToolbarButton>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute top-full right-0 mt-2 z-[9999] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-72"
            style={{ zIndex: 9999 }}
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
    </div>
  );
};
