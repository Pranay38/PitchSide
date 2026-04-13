"use client";
import { useEffect } from "react";

export function useScrollytelling(
  containerRef: React.RefObject<HTMLElement | null>,
  selector: string = ":scope > p, :scope > h2, :scope > h3, :scope > div, :scope > blockquote, :scope > ul, :scope > ol, :scope > figure"
) {
  useEffect(() => {
    if (!containerRef.current) return;
    
    const elements = containerRef.current.querySelectorAll(selector);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: "0px 0px -15% 0px",
      threshold: 0,
    });

    elements.forEach((el) => {
      // Avoid applying scrollytelling to elements that already have animation classes
      if (el.className && typeof el.className === 'string' && el.className.includes("animate-")) {
          return;
      }
      el.classList.add("scrolly-section");
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [containerRef, selector]);
}
