'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface LightboxImage {
  url: string;
  category?: string;
  date?: string;
  id?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, isOpen, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) setCurrentIndex(initialIndex);
  }, [isOpen, initialIndex]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  }, [onClose]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(i => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(i => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, goToPrev, goToNext]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleDownload = async () => {
    const current = images[currentIndex];
    try {
      const response = await fetch(current.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `lunia-${current.category || 'image'}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(current.url, '_blank');
    }
  };

  if (!isOpen && !isClosing) return null;

  const current = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={handleClose}
      />

      {/* Panel — slides from left */}
      <div className={`absolute inset-0 flex items-center justify-center ${isClosing ? 'animate-slideToLeft' : 'animate-slideFromLeft'}`}>
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <X size={28} />
        </button>

        {/* Prev arrow */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Image + metadata */}
        <div
          className="flex flex-col items-center gap-4 px-16"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={current.url}
            alt={current.category ?? ''}
            className="max-w-[85vw] max-h-[80vh] object-contain rounded-sm"
          />
          <div className="flex items-center gap-6 text-white/60 text-xs uppercase tracking-[0.15em] font-medium">
            {current.category && <span>{current.category}</span>}
            {current.date && <span>{current.date}</span>}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <Download size={14} />
              İNDİR
            </button>
          </div>
          {images.length > 1 && (
            <span className="text-white/30 text-[10px] tracking-[0.2em] uppercase">
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>

        {/* Next arrow */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
