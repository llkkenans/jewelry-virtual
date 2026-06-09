'use client'
import React, { useState, useCallback, useRef } from 'react';

interface PerspectiveState {
  rotateX: number;
  rotateY: number;
}

interface SpotlightConfig {
  spotlightSize?: number;
  overlayOpacity?: number;
  className?: string;
}

interface ImageSpotlightProps {
  src: string;
  alt: string;
  orientation?: 'landscape' | 'portrait';
  width?: number;
  height?: number;
  config?: SpotlightConfig;
}

export default function ImageSpotlight({
  src,
  alt,
  orientation = 'landscape',
  width,
  height,
  config = {}
}: ImageSpotlightProps) {
  const defaultConfig: Required<SpotlightConfig> = {
    spotlightSize: 80,
    overlayOpacity: 0.6,
    className: ''
  };

  const finalConfig = { ...defaultConfig, ...config };

  const [perspective, setPerspective] = useState<PerspectiveState>({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    containerRef.current.style.setProperty('--mouse-x', `${x}%`);
    containerRef.current.style.setProperty('--mouse-y', `${y}%`);

    const rotateY = ((x - 50) / 50) * 8;
    const rotateX = ((50 - y) / 50) * 8;

    setPerspective({ rotateX, rotateY });
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setPerspective({ rotateX: 0, rotateY: 0 });
  };

  const getContainerDimensions = (): React.CSSProperties => {
    if (width && height) {
      return { width: `${width}px`, height: `${height}px`, maxWidth: '100%' };
    }
    if (orientation === 'landscape') {
      return { width: '800px', height: '450px', maxWidth: '100%' };
    }
    return { width: '450px', height: '600px', maxWidth: '100%' };
  };

  const containerClasses = `relative overflow-hidden cursor-none rounded-lg shadow-md border ${finalConfig.className}`.trim();

  return (
    <div className="flex items-center justify-center">
      <div
        ref={containerRef}
        className={containerClasses}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="img"
        aria-label={alt}
        aria-describedby="spotlight-instructions"
        tabIndex={0}
        style={{
          ...getContainerDimensions(),
          '--mouse-x': '50%',
          '--mouse-y': '50%',
          '--spotlight-size': `${finalConfig.spotlightSize}px`,
          '--overlay-opacity': finalConfig.overlayOpacity,
          transform: `perspective(1000px) rotateX(${perspective.rotateX}deg) rotateY(${perspective.rotateY}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.2s ease-out'
        } as React.CSSProperties}
      >
        <div id="spotlight-instructions" className="sr-only">
          Interactive image with mouse spotlight effect. Move your mouse over the image to reveal different areas.
        </div>

        {/* Blurred base image */}
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          style={{ filter: 'blur(5px)' }}
        />

        {/* Sharp image revealed by spotlight — only when hovered */}
        {isHovered && (
          <img
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            style={{
              maskImage: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black ${finalConfig.spotlightSize * 0.4}px, transparent ${finalConfig.spotlightSize * 1.6}px)`,
              WebkitMaskImage: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black ${finalConfig.spotlightSize * 0.4}px, transparent ${finalConfig.spotlightSize * 1.6}px)`,
              zIndex: 2
            }}
          />
        )}

        {/* Dark overlay — full when not hovered, spotlight cutout when hovered */}
        <div
          className="absolute inset-0 bg-black transition-opacity duration-200 ease-out"
          style={{
            opacity: finalConfig.overlayOpacity,
            maskImage: isHovered
              ? `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), transparent ${finalConfig.spotlightSize * 0.4}px, black ${finalConfig.spotlightSize * 1.6}px)`
              : 'none',
            WebkitMaskImage: isHovered
              ? `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), transparent ${finalConfig.spotlightSize * 0.4}px, black ${finalConfig.spotlightSize * 1.6}px)`
              : 'none',
            zIndex: 10
          }}
        />

        {/* Light bloom — only when hovered */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,248,220,0.35) 0px, rgba(255,220,120,0.12) ${finalConfig.spotlightSize * 0.6}px, transparent ${finalConfig.spotlightSize * 1.4}px)`,
              zIndex: 15
            }}
          />
        )}
      </div>
    </div>
  );
}
