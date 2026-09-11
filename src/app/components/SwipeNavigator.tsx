"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@/lib/router-compat";

interface SwipeNavigatorProps {
  children: React.ReactNode;
  prevUrl?: string;
  nextUrl?: string;
}

export function SwipeNavigator({ children, prevUrl, nextUrl }: SwipeNavigatorProps) {
  const navigate = useNavigate();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance in px
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    // Only active on mobile viewports
    if (window.innerWidth > 768) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (window.innerWidth > 768 || !touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    const diff = currentTouch - touchStart;
    // visual indicator, max drag 80px
    if ((diff > 0 && prevUrl) || (diff < 0 && nextUrl)) {
      setSwipeOffset(Math.max(-80, Math.min(80, diff * 0.5)));
    }
  };

  const onTouchEnd = () => {
    if (window.innerWidth > 768) return;
    setIsSwiping(false);
    setSwipeOffset(0);

    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && nextUrl) {
      navigate(nextUrl);
    } else if (isRightSwipe && prevUrl) {
      navigate(prevUrl);
    }
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={onTouchStart} 
      onTouchMove={onTouchMove} 
      onTouchEnd={onTouchEnd}
      style={{
        transform: isSwiping ? `translateX(${swipeOffset}px)` : 'translateX(0)',
        transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
      }}
      className="relative w-full"
    >
      {/* Visual indicators for swipe */}
      <div className={`absolute top-1/2 -left-12 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-primary/20 text-primary transition-opacity ${swipeOffset > 20 ? 'opacity-100' : 'opacity-0'}`}>
        ←
      </div>
      <div className={`absolute top-1/2 -right-12 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-primary/20 text-primary transition-opacity ${swipeOffset < -20 ? 'opacity-100' : 'opacity-0'}`}>
        →
      </div>
      
      {children}
    </div>
  );
}
