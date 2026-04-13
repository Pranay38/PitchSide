/**
 * PillNav - A premium, GSAP-powered navigation component.
 * Features:
 * - Rising circle background animation on hover
 * - Rotating logo animation
 * - Responsive mobile menu with GSAP transitions
 * - Support for both React Router Link and standard anchor tags
 * - Customizable colors and easing
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from '@/lib/router-compat';
import { gsap } from 'gsap';
import { Menu, X } from 'lucide-react';

export type PillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
};

export interface PillNavProps {
  /** Logo icon component or source URL (image or SVG) */
  logo?: React.ReactNode | string;
  /** Alt text for the logo */
  logoAlt?: string;
  /** Navigation items array */
  items: PillNavItem[];
  /** Optional extra class names for the nav container */
  className?: string;
  /** GSAP easing function */
  ease?: string;
  /** The base background color of the nav pills and logo container */
  baseColor?: string;
  /** The color of the pill when not hovered */
  pillColor?: string;
  /** Text color when the pill is hovered */
  hoveredPillTextColor?: string;
  /** Default text color for the pills */
  pillTextColor?: string;
  /** Callback for mobile menu toggle */
  onMobileMenuClick?: () => void;
  /** Whether to play an entrance animation on mount */
  initialLoadAnimation?: boolean;
}

export const PillNav: React.FC<PillNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  ease = 'power3.out',
  baseColor = 'var(--pill-base)',
  pillColor = 'var(--pill-bg)',
  hoveredPillTextColor = 'var(--pill-hover-text)',
  pillTextColor,
  onMobileMenuClick,
  initialLoadAnimation = true
}) => {
  const resolvedPillTextColor = pillTextColor ?? 'var(--pill-text)';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const activeHref = location.pathname;
  
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([]);
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([]);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | HTMLDivElement | null>(null);

  const renderLogo = () => {
    if (!logo) return null;
    if (typeof logo === 'string') {
      return (
        <img 
          src={logo} 
          alt={logoAlt} 
          ref={logoImgRef} 
          className="w-8 h-8 object-contain pointer-events-none" 
        />
      );
    }
    return (
      <div ref={logoImgRef} className="flex items-center justify-center">
        {logo}
      </div>
    );
  };

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle, index) => {
        if (!circle?.parentElement) return;
        
        const pill = circle.parentElement as HTMLElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        if (h === 0) return;
        
        // Calculate the radius for the expanding circle to cover the pill
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;
        
        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        const label = pill.querySelector<HTMLElement>('.pill-label');
        const white = pill.querySelector<HTMLElement>('.pill-label-hover');
        
        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });
        
        tl.to(circle, { 
          scale: 1.2, 
          xPercent: -50, 
          duration: 0.8, 
          ease, 
          overwrite: 'auto' 
        }, 0);
        
        if (label) {
          tl.to(label, { 
            y: -(h + 8), 
            duration: 0.6, 
            ease, 
            overwrite: 'auto' 
          }, 0);
        }
        
        if (white) {
          gsap.set(white, { y: Math.ceil(h + 20), opacity: 0 });
          tl.to(white, { 
            y: 0, 
            opacity: 1, 
            duration: 0.6, 
            ease, 
            overwrite: 'auto' 
          }, 0);
        }
        
        tlRefs.current[index] = tl;
      });
    };

    layout();
    
    // Tiny delay to ensure fonts/layout are loaded before calc
    const timer = setTimeout(layout, 100);
    
    const onResize = () => layout();
    window.addEventListener('resize', onResize);
    
    if (document.fonts) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    // Initial load animation
    if (initialLoadAnimation) {
      const logo = logoRef.current;
      const navItems = navItemsRef.current;
      
      if (logo) {
        gsap.set(logo, { scale: 0, opacity: 0 });
        gsap.to(logo, {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(1.7)"
        });
      }
      
      if (navItems) {
        const listItems = navItems.querySelectorAll('li');
        gsap.set(listItems, { opacity: 0, x: -20 });
        gsap.to(listItems, {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.05,
          ease: "power2.out",
          delay: 0.1
        });
      }
    }

    return () => {
        window.removeEventListener('resize', onResize);
        clearTimeout(timer);
    };
  }, [items, ease, initialLoadAnimation]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.4,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.3,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLogoEnter = () => {
    const img = logoImgRef.current;
    if (!img) return;
    logoTweenRef.current?.kill();
    logoTweenRef.current = gsap.to(img, {
      rotate: 360,
      duration: 0.8,
      ease: "elastic.out(1, 0.5)",
      overwrite: 'auto',
      onComplete: () => { gsap.set(img, { rotate: 0 }); }
    });
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    
    const menu = mobileMenuRef.current;
    if (menu) {
      if (newState) {
        gsap.set(menu, { display: 'block', opacity: 0, y: -20 });
        gsap.to(menu, {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power3.out"
        });
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: -20,
          duration: 0.3,
          ease: "power3.in",
          onComplete: () => {
            gsap.set(menu, { display: 'none' });
          }
        });
      }
    }
    onMobileMenuClick?.();
  };

  const isExternalLink = (href: string) =>
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#');

  const cssVars = {
    '--pill-base': baseColor,
    '--pill-bg': pillColor,
    '--pill-hover-text': hoveredPillTextColor,
    '--pill-text': resolvedPillTextColor,
    '--nav-h': '40px',
    '--logo-size': '36px',
    '--pill-pad-x': '16px',
    '--pill-gap': '4px'
  } as React.CSSProperties;

  return (
    <div className={`relative z-[50] w-auto mx-auto ${className}`} style={cssVars}>
      <nav
        className="w-full flex items-center justify-between md:justify-center p-1.5 rounded-full dark:bg-[#0F172A] bg-white border dark:border-[#1E293B] border-gray-100 shadow-sm"
        aria-label="Primary"
      >
        {/* Logo Section */}
        {logo && (
          <div 
            ref={el => { logoRef.current = el as HTMLDivElement; }}
            onMouseEnter={handleLogoEnter}
            className="flex-shrink-0"
          >
            {items[0] && !isExternalLink(items[0].href) ? (
              <Link
                to={items[0].href}
                className="flex items-center justify-center rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
                style={{
                  width: 'var(--logo-size)',
                  height: 'var(--logo-size)',
                  background: 'var(--pill-base)',
                  color: 'var(--pill-bg)'
                }}
              >
                {renderLogo()}
              </Link>
            ) : (
              <a
                href={items[0]?.href || '#'}
                className="flex items-center justify-center rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
                style={{
                  width: 'var(--logo-size)',
                  height: 'var(--logo-size)',
                  background: 'var(--pill-base)',
                  color: 'var(--pill-bg)'
                }}
              >
                {renderLogo()}
              </a>
            )}
          </div>
        )}

        {/* Desktop Menu */}
        <div
          ref={navItemsRef}
          className="hidden md:flex items-center rounded-full px-1"
          style={{
            height: 'var(--nav-h)',
          }}
        >
          <ul
            role="menubar"
            className="list-none flex items-stretch m-0 p-0 h-full"
            style={{ gap: 'var(--pill-gap)' }}
          >
            {items.map((item, i) => {
              const isActive = activeHref === item.href || (item.href !== '/' && activeHref.startsWith(item.href));
              
              const pillStyle: React.CSSProperties = {
                background: isActive ? 'var(--pill-base)' : 'transparent',
                color: isActive ? 'var(--pill-hover-text)' : 'inherit',
                paddingLeft: 'var(--pill-pad-x)',
                paddingRight: 'var(--pill-pad-x)',
                boxShadow: isActive ? '0 0 20px rgba(22, 163, 74, 0.3)' : 'none',
                border: isActive ? '1px solid rgba(22, 163, 74, 0.2)' : 'none'
              };

              const PillContent = (
                <>
                  {!isActive && (
                    <span
                      className="hover-circle absolute left-1/2 bottom-0 rounded-full z-[1] block pointer-events-none"
                      style={{
                        background: 'var(--pill-base)',
                        willChange: 'transform'
                      }}
                      aria-hidden="true"
                      ref={el => {
                        circleRefs.current[i] = el;
                      }}
                    />
                  )}
                  <span className="label-stack inline-flex items-center gap-1.5 relative leading-none z-[2] overflow-hidden py-1">
                    <span
                      className="pill-label inline-flex items-center gap-1.5 relative z-[2]"
                      style={{ willChange: 'transform' }}
                    >
                      {item.icon} {item.label}
                    </span>
                    {!isActive && (
                      <span
                        className="pill-label-hover absolute left-0 top-0 h-full w-full inline-flex items-center justify-center gap-1.5 z-[3]"
                        style={{
                          color: 'var(--pill-hover-text)',
                          willChange: 'transform, opacity'
                        }}
                        aria-hidden="true"
                      >
                        {item.icon} {item.label}
                      </span>
                    )}
                  </span>
                </>
              );

              const basePillClasses = "relative overflow-hidden inline-flex items-center justify-center h-[calc(var(--nav-h)-8px)] self-center no-underline rounded-full box-border font-bold text-sm transition-colors duration-200 hover:z-10";

              return (
                <li key={item.href} role="none" className="flex items-center">
                  {!isExternalLink(item.href) ? (
                    <Link
                      role="menuitem"
                      to={item.href}
                      className={`${basePillClasses} ${isActive ? 'text-[var(--pill-hover-text)]' : 'text-[var(--pill-text)]'}`}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={isActive ? undefined : () => handleEnter(i)}
                      onMouseLeave={isActive ? undefined : () => handleLeave(i)}
                    >
                      {PillContent}
                    </Link>
                  ) : (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={`${basePillClasses} ${isActive ? 'text-[var(--pill-hover-text)]' : 'text-[var(--pill-text)]'}`}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={isActive ? undefined : () => handleEnter(i)}
                      onMouseLeave={isActive ? undefined : () => handleLeave(i)}
                    >
                      {PillContent}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Mobile Hamburger */}
        {items.length > 0 && (
          <button
            ref={hamburgerRef}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            className="md:hidden flex items-center justify-center rounded-full transition-transform active:scale-90"
            style={{
              width: 'var(--logo-size)',
              height: 'var(--logo-size)',
              background: 'var(--pill-base)',
              color: 'var(--pill-bg)'
            }}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </nav>

      {/* Mobile Menu Dropdown */}
      <div
        ref={mobileMenuRef}
        className="md:hidden absolute top-full left-0 right-0 mt-3 rounded-2xl overflow-hidden shadow-2xl z-[999] hidden border border-border/10 dark:bg-[#1E293B] bg-white border border-gray-100 dark:border-gray-800"
      >
        <ul className="list-none m-0 p-3 flex flex-col gap-1.5">
          {items.map((item) => {
            const isActive = activeHref === item.href || (item.href !== '/' && activeHref.startsWith(item.href));
            return (
              <li key={item.href}>
                {!isExternalLink(item.href) ? (
                  <Link
                    to={item.href}
                    className={`flex items-center gap-2 py-3 px-6 text-sm font-bold rounded-xl transition-all ${
                      isActive 
                        ? 'bg-[#16A34A] text-white' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0F172A]'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon} {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className={`flex items-center gap-2 py-3 px-6 text-sm font-bold rounded-xl transition-all ${
                      isActive 
                        ? 'bg-[#16A34A] text-white' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0F172A]'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon} {item.label}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PillNav;
