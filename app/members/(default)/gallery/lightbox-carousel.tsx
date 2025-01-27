'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/members/ui/dialog';
import { CloudinaryImage } from '@/types/members/gallery';

interface LightboxCarouselProps {
  images: CloudinaryImage[];
  selectedIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * A lightbox carousel allowing horizontal flick/scroll between images.
 */
export default function LightboxCarousel({
  images,
  selectedIndex,
  isOpen,
  onClose,
}: LightboxCarouselProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to the selected image whenever the dialog opens or the index changes
  React.useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      // Slight delay ensures the dialog is rendered before scrolling
      setTimeout(() => {
        scrollToIndex(selectedIndex);
      }, 50);
    }
  }, [isOpen, selectedIndex]);

  /**
   * Smooth scroll to the given index. Each item is 100% of container's width.
   */
  function scrollToIndex(index: number) {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const containerWidth = container.clientWidth;
    container.scrollTo({
      left: containerWidth * index,
      behavior: 'smooth',
    });
  }

  // Optional next/prev convenience
  function handleNext() {
    if (selectedIndex < images.length - 1) {
      scrollToIndex(selectedIndex + 1);
    }
  }
  function handlePrev() {
    if (selectedIndex > 0) {
      scrollToIndex(selectedIndex - 1);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-full max-h-full bg-black p-0 overflow-hidden">
        {/* Optional Header */}
        <DialogHeader>
          <DialogTitle className="text-white">
            Swipe or use arrows to navigate
          </DialogTitle>
        </DialogHeader>

        <div
          ref={scrollContainerRef}
          className="
            relative
            flex
            w-full
            h-[80vh]
            overflow-x-auto
            snap-x
            snap-mandatory
            scroll-smooth
            touch-pan-x
            hide-scrollbar        /* If you have a custom utility to hide scrollbars */
          "
        >
          {images.map((image, i) => (
            <div
              key={image.public_id}
              className="
                flex-shrink-0
                w-full
                h-full
                snap-center
                relative
                flex
                items-center
                justify-center
              "
            >
              {/* Using fill for easy responsive sizing */}
              <Image
                src={image.secure_url}
                alt={image.public_id}
                fill
                className="object-contain"
                sizes="100vw"
                priority={i === selectedIndex}
              />
            </div>
          ))}
        </div>

        {/* Optional Next/Prev Buttons */}
        <button
          onClick={handlePrev}
          className="
            absolute left-4 top-1/2 
            -translate-y-1/2 
            bg-white/30 
            text-white 
            px-3 py-2 
            rounded
          "
        >
          Prev
        </button>
        <button
          onClick={handleNext}
          className="
            absolute right-4 top-1/2 
            -translate-y-1/2 
            bg-white/30 
            text-white 
            px-3 py-2 
            rounded
          "
        >
          Next
        </button>
      </DialogContent>
    </Dialog>
  );
}
