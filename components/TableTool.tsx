"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, X, Plus, Minus } from 'lucide-react';

interface TableToolProps {
  onInsertTable: (rows: number, cols: number) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const TableTool: React.FC<TableToolProps> = ({ onInsertTable, onClose, isOpen }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed top-20 right-4 z-[150] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 w-80"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Table size={20} className="text-[#ffd700]" />
          <h3 className="text-lg font-bold text-white">Insert Table</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Rows: {rows}</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRows(Math.max(1, rows - 1))}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Minus size={16} className="text-white" />
            </button>
            <input
              type="range"
              min={1}
              max={10}
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value))}
              className="flex-1"
              style={{ accentColor: '#ffd700' }}
            />
            <button
              onClick={() => setRows(Math.min(10, rows + 1))}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Plus size={16} className="text-white" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-2 block">Columns: {cols}</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCols(Math.max(1, cols - 1))}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Minus size={16} className="text-white" />
            </button>
            <input
              type="range"
              min={1}
              max={10}
              value={cols}
              onChange={(e) => setCols(parseInt(e.target.value))}
              className="flex-1"
              style={{ accentColor: '#ffd700' }}
            />
            <button
              onClick={() => setCols(Math.min(10, cols + 1))}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Plus size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-2">Preview</div>
          <div className="inline-block border border-gray-600">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex">
                {Array.from({ length: cols }).map((_, j) => (
                  <div
                    key={j}
                    className="w-8 h-8 border border-gray-600 bg-gray-700"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            onInsertTable(rows, cols);
            onClose();
          }}
          className="w-full px-4 py-2 bg-[#ffd700] hover:bg-yellow-400 text-black rounded-lg font-semibold transition-colors"
        >
          Insert Table
        </button>
      </div>
    </motion.div>
  );
};



