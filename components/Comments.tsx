"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Plus, Trash2, Send } from 'lucide-react';

export interface Comment {
  id: string;
  slideId: string;
  text: string;
  author: string;
  timestamp: Date;
  x?: number;
  y?: number;
}

interface CommentsProps {
  comments: Comment[];
  slideId: string;
  onAddComment: (text: string, x?: number, y?: number) => void;
  onDeleteComment: (id: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const Comments: React.FC<CommentsProps> = ({
  comments,
  slideId,
  onAddComment,
  onDeleteComment,
  onClose,
  isOpen,
}) => {
  const [newComment, setNewComment] = useState('');

  const slideComments = comments.filter(c => c.slideId === slideId);

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed top-20 right-4 z-[150] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-96 max-h-[80vh] flex flex-col"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-[#ffd700]" />
          <h3 className="text-lg font-bold text-white">Comments</h3>
          {slideComments.length > 0 && (
            <span className="px-2 py-0.5 bg-[#ffd700] text-black rounded-full text-xs font-semibold">
              {slideComments.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {slideComments.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              No comments yet. Add one below!
            </div>
          ) : (
            slideComments.map((comment) => (
              <motion.div
                key={comment.id}
                className="bg-gray-800 rounded-lg p-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-white">{comment.author}</div>
                    <div className="text-xs text-gray-400">
                      {comment.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteComment(comment.id)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    <Trash2 size={14} className="text-gray-400" />
                  </button>
                </div>
                <div className="text-sm text-gray-300">{comment.text}</div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700] text-sm"
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-[#ffd700] hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};



