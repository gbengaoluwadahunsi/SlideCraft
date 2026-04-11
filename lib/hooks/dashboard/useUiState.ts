'use client';

import { useState } from 'react';

export function useUiState() {
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);
  const [isMobileSlidesOpen, setIsMobileSlidesOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [showQuickExport, setShowQuickExport] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  return {
    isPropertiesPanelOpen, setIsPropertiesPanelOpen,
    isMobileSlidesOpen, setIsMobileSlidesOpen,
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    isSettingsOpen, setIsSettingsOpen,
    isTemplatesOpen, setIsTemplatesOpen,
    isExportOpen, setIsExportOpen,
    isAiModalOpen, setIsAiModalOpen,
    isColorPickerOpen, setIsColorPickerOpen,
    isEmojiPickerOpen, setIsEmojiPickerOpen,
    isImagePickerOpen, setIsImagePickerOpen,
    showQuickExport, setShowQuickExport,
    showGrid, setShowGrid,
    showGuides, setShowGuides,
    previewImageUrl, setPreviewImageUrl,
  };
}
