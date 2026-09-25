'use client';
import { useState, useEffect } from 'react';

export default function ContentCalendar() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    // Similarly fetch posts, dummy for now
    setPosts([]);
  }, []);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Content Calendar</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-[#0F172A] border border-gray-800 rounded-lg">
          <div className="text-gray-400 text-sm">Weekly Target</div>
          <div className="text-2xl font-bold text-white mt-1">
            2/4 <span className="text-sm font-normal text-gray-500">posts this week</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '50%' }}></div>
          </div>
        </div>
        <div className="p-4 bg-[#0F172A] border border-gray-800 rounded-lg">
          <div className="text-gray-400 text-sm">Posts This Month</div>
          <div className="text-2xl font-bold text-white mt-1">8</div>
          <div className="text-sm text-green-500 mt-1">↑ On track</div>
        </div>
        <div className="p-4 bg-[#0F172A] border border-gray-800 rounded-lg">
          <div className="text-gray-400 text-sm">Intent Distribution</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-16 h-16 rounded-full border-4 border-green-600 border-r-blue-500"></div>
            <div className="text-sm">
              <div className="text-gray-300"><span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-2"></span>Informational (75%)</div>
              <div className="text-gray-300"><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Commercial (25%)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-[#0F172A] border border-gray-800 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4">Current Week</h2>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, i) => {
            const hasPost = i === 1 || i === 3; // Dummy data
            const isMissed = i === 0;
            let bgColor = 'bg-gray-800';
            if (hasPost) bgColor = 'bg-green-900/40 border-green-600';
            else if (isMissed) bgColor = 'bg-red-900/20 border-red-900/50';

            return (
              <div key={day} className={`p-3 border rounded-md ${bgColor} ${!hasPost && !isMissed ? 'border-gray-800' : ''}`}>
                <div className="text-xs text-gray-400 mb-2">{day}</div>
                {hasPost ? (
                  <div className="text-xs text-green-400 font-medium">Published</div>
                ) : isMissed ? (
                  <div className="text-xs text-red-500 font-medium">Missed</div>
                ) : (
                  <div className="text-xs text-gray-600">-</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
