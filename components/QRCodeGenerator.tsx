"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, X, Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  onInsertQRCode: (url: string, size: number) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ onInsertQRCode, onClose, isOpen }) => {
  const [url, setUrl] = useState('');
  const [size, setSize] = useState(200);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const generateQRCode = () => {
    if (!url.trim()) return;
    
    // Using a QR code API service (you can replace with your preferred service)
    const encodedUrl = encodeURIComponent(url.trim());
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`;
    setQrCodeUrl(qrUrl);
  };

  const handleInsert = () => {
    if (qrCodeUrl) {
      onInsertQRCode(qrCodeUrl, size);
      onClose();
    }
  };

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
          <QrCode size={20} className="text-[#ffd700]" />
          <h3 className="text-lg font-bold text-white">QR Code</h3>
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
          <label className="text-xs text-gray-400 mb-2 block">URL or Text</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700] text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                generateQRCode();
              }
            }}
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-2 block">Size: {size}px</label>
          <input
            type="range"
            min={100}
            max={500}
            step={50}
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
            className="w-full"
            style={{ accentColor: '#ffd700' }}
          />
        </div>

        <button
          onClick={generateQRCode}
          disabled={!url.trim()}
          className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Generate QR Code
        </button>

        {qrCodeUrl && (
          <div className="space-y-3">
            <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center">
              <img src={qrCodeUrl} alt="QR Code" className="max-w-full" />
            </div>
            <button
              onClick={handleInsert}
              className="w-full px-4 py-2 bg-[#ffd700] hover:bg-yellow-400 text-black rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Insert QR Code
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};



