import React from 'react';

interface FloatingContactProps {
  email?: string;
  label?: string;
}

export default function FloatingContact({ 
  email = 'contact@example.com',
  label = 'GET IN TOUCH'
}: FloatingContactProps) {
  return (
    <a
      href={`mailto:${email}`}
      className="fixed bottom-20 right-6 md:bottom-10 md:right-10 z-[60] group flex items-center gap-3"
      aria-label="Contact us"
    >
      <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-zinc-950 border-2 border-zinc-800 px-4 py-2 font-outfit font-bold uppercase tracking-widest text-xs text-white">
        {label}
      </div>
      
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#39FF14] border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.5)] flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-2 group-active:translate-y-0 group-hover:shadow-[6px_6px_0px_rgba(0,0,0,0.5)]">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="black" 
          strokeWidth="3" 
          strokeLinecap="square" 
          strokeLinejoin="miter"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </div>
    </a>
  );
}
