import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTouchGestures, useMobileDetection } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';
import { Loader2, ZoomIn, ZoomOut, RotateCw, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'video' | 'photo' | 'auto';
  enableZoom?: boolean;
  enablePinchZoom?: boolean;
  enableRotation?: boolean;
  enableDownload?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
}

export function MobileImage({
  src,
  alt,
  className,
  placeholder,
  aspectRatio = 'auto',
  enableZoom = true,
  enablePinchZoom = true,
  enableRotation = false,
  enableDownload = false,
  onLoad,
  onError,
  priority = false
}: MobileImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useMobileDetection();
  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchGestures();

  // Intersection Observer for lazy loading
  const [isInView, setIsInView] = useState(priority);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  }, [onError]);

  // Handle zoom toggle
  const handleZoomToggle = useCallback(() => {
    if (isZoomed) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsZoomed(false);
    } else {
      setZoom(2);
      setIsZoomed(true);
    }
  }, [isZoomed]);

  // Handle rotation
  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Handle download
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = alt || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [src, alt]);

  // Handle touch events for pinch zoom and pan
  useEffect(() => {
    if (!enablePinchZoom || !imageRef.current) return;

    let initialDistance = 0;
    let initialZoom = zoom;
    let lastTouchCenter = { x: 0, y: 0 };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch zoom start
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        initialZoom = zoom;
        lastTouchCenter = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        };
      } else if (e.touches.length === 1 && isZoomed) {
        // Pan start
        setIsDragging(true);
        lastTouchCenter = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 2) {
        // Pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        const scale = currentDistance / initialDistance;
        const newZoom = Math.max(0.5, Math.min(4, initialZoom * scale));
        setZoom(newZoom);
        setIsZoomed(newZoom > 1);
      } else if (e.touches.length === 1 && isDragging && isZoomed) {
        // Pan
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastTouchCenter.x;
        const deltaY = touch.clientY - lastTouchCenter.y;

        setPosition(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));

        lastTouchCenter = {
          x: touch.clientX,
          y: touch.clientY
        };
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    const element = imageRef.current;
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [zoom, isZoomed, isDragging, enablePinchZoom]);

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    photo: 'aspect-[4/3]',
    auto: ''
  };

  const imageTransform = `
    scale(${zoom})
    rotate(${rotation}deg)
    translate(${position.x / zoom}px, ${position.y / zoom}px)
  `;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              className="w-full h-full object-cover opacity-50 blur-sm"
            />
          ) : (
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <X className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Main image */}
      {isInView && (
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-transform duration-200',
            isLoaded ? 'opacity-100' : 'opacity-0',
            isZoomed ? 'cursor-move' : enableZoom ? 'cursor-zoom-in' : ''
          )}
          style={{
            transform: imageTransform,
            transformOrigin: 'center'
          }}
          onClick={enableZoom && !isZoomed ? handleZoomToggle : undefined}
          draggable={false}
        />
      )}

      {/* Controls overlay */}
      {isLoaded && isMobile && (enableZoom || enableRotation || enableDownload) && (
        <div className="absolute top-2 right-2 flex gap-1">
          {enableZoom && (
            <Button
              size="sm"
              variant="secondary"
              className="w-8 h-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
              onClick={handleZoomToggle}
            >
              {isZoomed ? (
                <ZoomOut className="w-4 h-4" />
              ) : (
                <ZoomIn className="w-4 h-4" />
              )}
            </Button>
          )}

          {enableRotation && (
            <Button
              size="sm"
              variant="secondary"
              className="w-8 h-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
              onClick={handleRotate}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          )}

          {enableDownload && (
            <Button
              size="sm"
              variant="secondary"
              className="w-8 h-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Zoom hint */}
      {isZoomed && isMobile && (
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
            Pinch to zoom • Drag to pan • Tap to zoom out
          </div>
        </div>
      )}
    </div>
  );
}

// Gallery component for multiple images with swipe navigation
interface MobileImageGalleryProps {
  images: Array<{ src: string; alt: string; placeholder?: string }>;
  className?: string;
  onImageChange?: (index: number) => void;
}

export function MobileImageGallery({
  images,
  className,
  onImageChange
}: MobileImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchGestures();

  const handleSwipe = useCallback(() => {
    const result = onTouchEnd();
    if (!result) return;

    if (result.isLeftSwipe && currentIndex < images.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onImageChange?.(newIndex);
    } else if (result.isRightSwipe && currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onImageChange?.(newIndex);
    }
  }, [onTouchEnd, currentIndex, images.length, onImageChange]);

  useEffect(() => {
    document.addEventListener('touchend', handleSwipe);
    return () => document.removeEventListener('touchend', handleSwipe);
  }, [handleSwipe]);

  return (
    <div className={cn('relative', className)}>
      <div
        className="relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`
          }}
        >
          {images.map((image, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <MobileImage
                src={image.src}
                alt={image.alt}
                placeholder={image.placeholder}
                priority={index === 0}
                enableZoom
                enablePinchZoom
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              )}
              onClick={() => {
                setCurrentIndex(index);
                onImageChange?.(index);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}