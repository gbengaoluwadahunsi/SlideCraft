"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Unlock, GripVertical, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface Layer {
  id: string;
  name: string;
  type: 'title' | 'subtitle' | 'content' | 'emoji' | 'media' | 'shape' | 'custom';
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

interface LayersPanelProps {
  layers: Layer[];
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onReorderLayers: (newOrder: Layer[]) => void;
  onSelectLayer: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  onUpdateLayer,
  onReorderLayers,
  onSelectLayer,
  isOpen,
  onClose,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['elements']));

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const handleVisibilityToggle = (id: string, currentVisible: boolean) => {
    onUpdateLayer(id, { visible: !currentVisible });
  };

  const handleLockToggle = (id: string, currentLocked: boolean) => {
    onUpdateLayer(id, { locked: !currentLocked });
  };

  const handleZIndexChange = (id: string, direction: 'up' | 'down') => {
    const layer = layers.find(l => l.id === id);
    if (!layer) return;

    const currentIndex = sortedLayers.findIndex(l => l.id === id);
    if (direction === 'up' && currentIndex > 0) {
      const newOrder = [...sortedLayers];
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
      onReorderLayers(newOrder);
    } else if (direction === 'down' && currentIndex < sortedLayers.length - 1) {
      const newOrder = [...sortedLayers];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      onReorderLayers(newOrder);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed top-20 right-4 z-[150] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-80 max-h-[80vh] flex flex-col"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-bold text-white">Layers</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            <div className="space-y-1">
              {sortedLayers.map((layer) => (
                <motion.div
                  key={layer.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition-colors group cursor-pointer"
                  onClick={() => onSelectLayer(layer.id)}
                  whileHover={{ x: 2 }}
                >
                  <GripVertical size={16} className="text-gray-500 group-hover:text-gray-400" />
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVisibilityToggle(layer.id, layer.visible);
                    }}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    {layer.visible ? (
                      <Eye size={16} className="text-gray-400" />
                    ) : (
                      <EyeOff size={16} className="text-gray-600" />
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLockToggle(layer.id, layer.locked);
                    }}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    {layer.locked ? (
                      <Lock size={16} className="text-yellow-500" />
                    ) : (
                      <Unlock size={16} className="text-gray-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{layer.name}</div>
                    <div className="text-xs text-gray-500">{layer.type}</div>
                  </div>

                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleZIndexChange(layer.id, 'up');
                      }}
                      className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                      title="Move up"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleZIndexChange(layer.id, 'down');
                      }}
                      className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                      title="Move down"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {sortedLayers.length === 0 && (
              <div className="text-center text-gray-500 py-8 text-sm">
                No layers available
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

