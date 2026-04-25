"use client";
import * as React from 'react';
import { useState } from 'react';
import { SignIn } from '@clerk/nextjs';

const Page = () => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const leftSection = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top
    });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className='card w-[95%] lg:w-[85%] xl:w-[70%] md:w-[85%] flex flex-col lg:flex-row justify-between min-h-[600px] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl bg-[#08111f]'>
        <div
          className='w-full lg:w-1/2 p-4 sm:p-8 lg:p-16 left h-full relative overflow-hidden flex flex-col justify-center'
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-emerald-500/20 via-[#16a34a]/-10 to-teal-500/20 rounded-full blur-3xl transition-opacity duration-200 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          />
          <div className="form-container sign-in-container h-full z-10 w-full flex flex-col items-center justify-center gap-6">
            {/* Using Clerk's native SignIn completely solves OAuth, OTP, Captchas, Security, and State Management. We styled the Appearance globally in App.tsx. */}
            <SignIn 
                routing="path" 
                path="/sign-in" 
                signUpUrl="/sign-up"
            />
            <div className="text-center max-w-xs px-4">
              <p className="text-[10px] text-gray-500 font-medium">
                Experiencing a "Captcha is not loading" error? 
                Try disabling your ad-blocker/Brave Shields, or ensure you are using the official thetouchlinedribble.in domain.
              </p>
            </div>
          </div>
        </div>
        <div className='hidden lg:block w-1/2 right h-full overflow-hidden relative'>
            {/* Fallback to standard <img> tag since Next.js Image component doesn't work in Vite. We're using a football-themed unsplash stock image instead. */}
            <img
              src="https://images.unsplash.com/photo-1518605368461-1e967aab1e50?crop=entropy&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="Stadium background"
              className="w-full h-full object-cover transition-transform duration-300 opacity-60 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08111f] via-transparent to-transparent pointer-events-none" />
       </div>
      </div>
    </div>
  )
}

export default Page;
