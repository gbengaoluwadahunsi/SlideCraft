"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Eye, RotateCw, Calendar } from 'lucide-react';

export interface Version {
  id: string;
  timestamp: Date;
  name: string;
  snapshot: any; // Slide data snapshot
}

interface VersionHistoryProps {
  versions: Version[];
  currentVersionId: string;
  onRestoreVersion: (version: Version) => void;
  onViewVersion: (version: Version) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  currentVersionId,
  onRestoreVersion,
  onViewVersion,
  onClose,
  isOpen,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  const sortedVersions = [...versions].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

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
          <History size={20} className="text-[#ffd700]" />
          <h3 className="text-lg font-bold text-white">Version History</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sortedVersions.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">
            No version history available
          </div>
        ) : (
          sortedVersions.map((version) => (
            <motion.div
              key={version.id}
              className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                version.id === currentVersionId
                  ? 'border-[#ffd700] bg-[#ffd700]/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800'
              }`}
              onClick={() => setSelectedVersion(version)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{version.name}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <Calendar size={12} />
                    {version.timestamp.toLocaleString()}
                  </div>
                </div>
                {version.id === currentVersionId && (
                  <span className="px-2 py-0.5 bg-[#ffd700] text-black rounded text-xs font-semibold">
                    Current
                  </span>
                )}
              </div>
              
              <div className="flex gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewVersion(version);
                  }}
                  className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Eye size={12} />
                  View
                </button>
                {version.id !== currentVersionId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestoreVersion(version);
                    }}
                    className="flex-1 px-2 py-1 bg-[#ffd700] hover:bg-yellow-400 text-black rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <RotateCw size={12} />
                    Restore
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {selectedVersion && (
        <AnimatePresence>
          <motion.div
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVersion(null)}
          >
            <motion.div
              className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{selectedVersion.name}</h3>
                <button
                  onClick={() => setSelectedVersion(null)}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <div className="text-sm text-gray-300">
                <div className="mb-2">
                  <strong>Timestamp:</strong> {selectedVersion.timestamp.toLocaleString()}
                </div>
                <div className="mb-2">
                  <strong>Slides:</strong> {selectedVersion.snapshot?.slides?.length || 0}
                </div>
                <div className="text-xs text-gray-500 mt-4">
                  Preview of version data (full comparison view coming soon)
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
};



