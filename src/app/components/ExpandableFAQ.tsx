'use client';

import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface ExpandableFAQProps {
  items: FAQItem[];
}

export default function ExpandableFAQ({ items }: ExpandableFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div 
            key={index} 
            className="border-2 border-zinc-800 bg-zinc-950 transition-colors"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-zinc-900 focus:outline-none transition-colors group"
            >
              <h3 className="text-lg md:text-xl font-outfit font-bold uppercase tracking-wide text-white pr-8">
                {item.question}
              </h3>
              <span className={`text-[#39FF14] text-2xl font-black transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                +
              </span>
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-4 md:p-6 pt-0 border-t-2 border-zinc-800 border-dashed text-zinc-300 font-inter leading-relaxed">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
