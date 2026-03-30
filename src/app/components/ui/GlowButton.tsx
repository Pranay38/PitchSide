import React, { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/router-compat';

export interface GlowButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

/**
 * An interactive call-to-action button featuring a custom glow effect
 * that tracks the cursor using pure DOM CSS variables for high performance.
 * Perfect for hero or onboarding sections!
 */
export function GlowButton({ 
  href, 
  onClick, 
  children, 
  className = '', 
  glowColor = 'rgba(22, 163, 74, 0.6)' // Brand Green #16A34A with some opacity
}: GlowButtonProps) {
  // Use a generic ref that can apply to either anchor or button elements
  const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update CSS variables directly on the DOM element to avoid heavy React re-renders on mousemove
    ref.current.style.setProperty('--cursor-x', `${x}px`);
    ref.current.style.setProperty('--cursor-y', `${y}px`);
  };

  const baseClasses = `relative inline-flex items-center gap-1.5 px-6 sm:px-8 py-3.5 bg-[#0F172A] dark:bg-[#020617] border border-[#1E293B] hover:border-[#334155] rounded-full overflow-hidden group font-bold text-white transition-all active:scale-[0.98] shadow-lg shadow-black/10 ${className}`;

  const glowEffect = (
    <>
      {/* Outer Border Glow */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(120px circle at var(--cursor-x, 0) var(--cursor-y, 0), ${glowColor}, transparent 40%)`
        }}
      />
      {/* Inner Surface Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(120px circle at var(--cursor-x, 0) var(--cursor-y, 0), rgba(22, 163, 74, 0.15), transparent 40%)`
        }}
      />
    </>
  );

  const content = (
    <>
      {glowEffect}
      <span className="relative z-10 tracking-wide text-sm sm:text-base">{children}</span>
      <ArrowRight className="relative z-10 w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1.5" />
    </>
  );

  if (href) {
    if (href.startsWith('http')) {
      return (
        <a 
          ref={ref as React.RefObject<HTMLAnchorElement>}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={baseClasses}
          onMouseMove={handleMouseMove}
        >
          {content}
        </a>
      );
    }
    return (
      <Link 
        ref={ref as React.RefObject<HTMLAnchorElement>}
        to={href}
        className={baseClasses}
        onMouseMove={handleMouseMove}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      onClick={onClick}
      className={baseClasses}
      onMouseMove={handleMouseMove}
    >
      {content}
    </button>
  );
}
