"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleQuestion, X, Send, Loader2, Sparkles, Bot, Lightbulb, ChevronRight } from 'lucide-react';
import { useAppContextSafe, ProactiveTip } from '@/lib/hooks/useAppContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Simple markdown renderer for chat messages
const renderMarkdown = (text: string): React.ReactNode => {
  // Split by lines first to handle list items
  const lines = text.split('\n');
  
  const processInline = (line: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let keyIndex = 0;
    
    // Process bold (**text** or __text__)
    const boldRegex = /\*\*(.+?)\*\*|__(.+?)__/g;
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(line)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      // Add the bold text
      parts.push(<strong key={`b-${keyIndex++}`}>{match[1] || match[2]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : [line];
  };
  
  return lines.map((line, lineIndex) => {
    // Check for numbered list items (1. 2. etc.)
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      return (
        <div key={lineIndex} className="flex gap-2 ml-1">
          <span className="text-gray-400 shrink-0">{numberedMatch[1]}.</span>
          <span>{processInline(numberedMatch[2])}</span>
        </div>
      );
    }
    
    // Check for bullet points
    const bulletMatch = line.match(/^[-•]\s+(.*)$/);
    if (bulletMatch) {
      return (
        <div key={lineIndex} className="flex gap-2 ml-1">
          <span className="text-gray-400">•</span>
          <span>{processInline(bulletMatch[1])}</span>
        </div>
      );
    }
    
    // Regular line with inline formatting
    const processed = processInline(line);
    return (
      <React.Fragment key={lineIndex}>
        {processed}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const QUICK_QUESTIONS = [
  "How do I create a carousel?",
  "What are Visual vs Text slide styles?",
  "How do I change colors?",
  "How do I export my carousel?",
];

export const HelpChatbot = () => {
  const appContext = useAppContextSafe();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [currentTip, setCurrentTip] = useState<ProactiveTip | null>(null);
  
  // Track client mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [showTipBubble, setShowTipBubble] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Check for proactive tips periodically
  useEffect(() => {
    if (!appContext || isOpen) {
      setShowTipBubble(false);
      return;
    }

    const checkTips = () => {
      const tip = appContext.getProactiveTip();
      if (tip && tip.id !== currentTip?.id) {
        setCurrentTip(tip);
        // Show tip bubble after a delay
        tipTimeoutRef.current = setTimeout(() => {
          setShowTipBubble(true);
        }, 3000);
      }
    };

    checkTips();
    const interval = setInterval(checkTips, 10000); // Check every 10 seconds

    return () => {
      clearInterval(interval);
      if (tipTimeoutRef.current) {
        clearTimeout(tipTimeoutRef.current);
      }
    };
  }, [appContext, isOpen, currentTip?.id]);

  // Hide tip bubble when chat opens
  useEffect(() => {
    if (isOpen) {
      setShowTipBubble(false);
    }
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setShowQuickQuestions(false);
    setIsLoading(true);

    try {
      // Include context in the request
      const contextSummary = appContext?.getContextSummary() || '';
      
      const response = await fetch('/api/ai/help-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: contextSummary,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleTipAction = (tip: ProactiveTip) => {
    setShowTipBubble(false);
    appContext?.dismissTip(tip.id);
    
    if (tip.action === 'tour') {
      // Open chat with a tour request
      setIsOpen(true);
      sendMessage("Give me a quick tour of the main features");
    } else if (tip.action) {
      // Open chat and ask about the action
      setIsOpen(true);
      sendMessage(`Help me with: ${tip.action}`);
    }
  };

  const handleDismissTip = () => {
    if (currentTip) {
      appContext?.dismissTip(currentTip.id);
    }
    setShowTipBubble(false);
  };

  // Get contextual greeting
  const getGreeting = () => {
    if (!appContext) return "Hi there! 👋";
    
    if (appContext.isFirstTimeUser) {
      return "Welcome to Carouslk! 🎉";
    }
    
    if (appContext.currentPage === 'Carousel Editor') {
      if (appContext.slideCount === 0) {
        return "Ready to create something amazing?";
      }
      return "How can I help with your carousel?";
    }
    
    return "Hi there! 👋";
  };

  // Get contextual quick questions
  const getContextualQuestions = () => {
    if (!appContext) return QUICK_QUESTIONS;
    
    const questions = [...QUICK_QUESTIONS];
    
    if (appContext.currentPage === 'Carousel Editor') {
      if (!appContext.hasExported) {
        questions.unshift("How do I export my carousel?");
      }
      if (appContext.currentSection === 'ai-generate') {
        questions.unshift("What's the difference between Visual and Text styles?");
        questions.unshift("How do AI infographics work?");
      }
    }
    
    if (appContext.currentPage === 'Pricing Page') {
      questions.unshift("What's included in Pro?");
    }
    
    // Deduplicate and return first 4 questions
    return [...new Set(questions)].slice(0, 4);
  };

  // Don't render until client is mounted to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Proactive Tip Bubble */}
      <AnimatePresence>
        {showTipBubble && currentTip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 max-w-[300px] bg-[#0f1117] border border-gray-700 rounded-2xl shadow-2xl p-4"
          >
            <button
              onClick={handleDismissTip}
              className="absolute top-2 right-2 w-6 h-6 rounded-full hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-white transition"
            >
              <X size={14} />
            </button>
            
            <div className="flex items-start gap-3 pr-4">
              <div className="w-8 h-8 rounded-lg bg-[#ffd700]/20 flex items-center justify-center shrink-0">
                <Lightbulb size={16} className="text-[#ffd700]" />
              </div>
              <div>
                <p className="text-sm text-gray-200 mb-3">{currentTip.message}</p>
                {currentTip.actionLabel && (
                  <button
                    onClick={() => handleTipAction(currentTip)}
                    className="flex items-center gap-1 text-sm font-medium text-[#ffd700] hover:text-yellow-400 transition"
                  >
                    {currentTip.actionLabel}
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Speech bubble pointer */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-[#0f1117] border-r border-b border-gray-700 transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-[#ffd700] to-yellow-500 rounded-full shadow-lg flex items-center justify-center text-black hover:shadow-xl transition-shadow"
            aria-label="Open help chat"
          >
            <MessageCircleQuestion size={24} />
            
            {/* Notification dot when there's a tip */}
            {currentTip && !showTipBubble && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0f1117] animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-120px)] bg-[#0f1117] border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-[#0f1117] to-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd700] to-yellow-500 flex items-center justify-center">
                  <Sparkles size={20} className="text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Carouslk Assistant</h3>
                  <p className="text-xs text-gray-400">
                    {appContext?.currentPage === 'Carousel Editor' ? 'Here to help you create!' : 'Ask me anything!'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Context Badge */}
            {appContext && appContext.currentPage !== 'Landing Page' && (
              <div className="px-4 py-2 bg-gray-900/50 border-b border-gray-800/50">
                <p className="text-xs text-gray-500">
                  📍 {appContext.currentPage}
                  {appContext.currentSection && ` • ${appContext.currentSection}`}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800/50 flex items-center justify-center">
                    <Bot size={32} className="text-[#ffd700]" />
                  </div>
                  <h4 className="font-semibold text-white mb-2">{getGreeting()}</h4>
                  <p className="text-sm text-gray-400 mb-6">
                    {appContext?.isFirstTimeUser 
                      ? "I'll help you create your first carousel. Ask me anything!"
                      : "I'm here to help. What would you like to know?"
                    }
                  </p>
                  
                  {showQuickQuestions && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Quick questions</p>
                      {getContextualQuestions().map((question) => (
                        <button
                          key={question}
                          onClick={() => handleQuickQuestion(question)}
                          className="block w-full text-left px-4 py-2.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-xl text-sm text-gray-300 transition"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                      message.role === 'user'
                        ? 'bg-[#ffd700] text-black rounded-br-md'
                        : 'bg-gray-800 text-gray-100 rounded-bl-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{renderMarkdown(message.content)}</div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-[#ffd700]" />
                      <span className="text-sm text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-[#0a0d14]">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700]/50 transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 bg-[#ffd700] hover:bg-yellow-400 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-black disabled:text-gray-500 transition"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-gray-600 text-center mt-2">
                Powered by AI • Context-aware assistance
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
