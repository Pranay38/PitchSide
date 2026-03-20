import React, { useState } from 'react';
import { Trophy, MapPin, Calendar, Clock, Activity, AlignCenter, FileText, ChevronRight } from 'lucide-react';

export interface StadiumMatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  matchDate: string;
  venue: string;
  status: 'upcoming' | 'live' | 'finished';
  minute?: string; // e.g., "67'" or "FT"

  // Overview Tab
  events: {
    id: string;
    type: 'goal' | 'yellow' | 'red' | 'sub' | 'commentary';
    minute: string;
    team: 'home' | 'away' | 'neutral';
    player?: string;
    assist?: string;
    text?: string;
  }[];

  // Stats Tab
  stats: {
    label: string;
    home: number;
    away: number;
    isPercentage?: boolean;
  }[];

  // Lineups Tab
  lineups: {
    home: {
      formation: string; // e.g., "4-3-3"
      startingXI: { id: string; name: string; number: number; position: string; rating?: number; x: number; y: number }[];
      bench: { id: string; name: string; number: number; position: string; rating?: number }[];
    };
    away: {
      formation: string;
      startingXI: { id: string; name: string; number: number; position: string; rating?: number; x: number; y: number }[];
      bench: { id: string; name: string; number: number; position: string; rating?: number }[];
    };
  };
}

// --- Sample Data for Preview ---
const SAMPLE_DATA: StadiumMatchData = {
  id: 'preview',
  homeTeam: 'Arsenal',
  awayTeam: 'Chelsea',
  homeScore: 2,
  awayScore: 1,
  competition: 'Premier League',
  matchDate: new Date().toISOString(),
  venue: 'Emirates Stadium',
  status: 'live',
  minute: "67'",
  events: [
    { id: 'e1', type: 'goal', minute: "23'", team: 'home', player: 'Bukayo Saka', assist: 'Martin Ødegaard' },
    { id: 'e2', type: 'yellow', minute: "34'", team: 'away', player: 'Enzo Fernández' },
    { id: 'e3', type: 'goal', minute: "45+2'", team: 'away', player: 'Cole Palmer', assist: 'Raheem Sterling' },
    { id: 'e4', type: 'sub', minute: "60'", team: 'home', player: 'Leandro Trossard (in) - Gabriel Martinelli (out)' },
    { id: 'e5', type: 'goal', minute: "65'", team: 'home', player: 'Declan Rice', assist: 'Ben White' },
    // Commentary events
    { id: 'c1', type: 'commentary', minute: "67'", team: 'neutral', text: 'Arsenal are piling on the pressure now. Chelsea struggling to get out of their own half.' },
    { id: 'c2', type: 'commentary', minute: "65'", team: 'home', text: 'GOAL! Declan Rice smashes it home from the edge of the box! Atmosphere is electric.' }
  ],
  stats: [
    { label: 'Possession', home: 58, away: 42, isPercentage: true },
    { label: 'Shots', home: 14, away: 8 },
    { label: 'Shots on Target', home: 6, away: 3 },
    { label: 'Corners', home: 7, away: 3 },
    { label: 'Fouls', home: 9, away: 11 },
  ],
  lineups: {
    home: {
      formation: '4-3-3',
      startingXI: [
        { id: 'h1', name: 'Raya', number: 22, position: 'GK', rating: 7.0, x: 50, y: 5 },
        { id: 'h2', name: 'White', number: 4, position: 'RB', rating: 7.5, x: 80, y: 20 },
        { id: 'h3', name: 'Saliba', number: 2, position: 'CB', rating: 8.0, x: 65, y: 15 },
        { id: 'h4', name: 'Gabriel', number: 6, position: 'CB', rating: 7.8, x: 35, y: 15 },
        { id: 'h5', name: 'Zinchenko', number: 35, position: 'LB', rating: 6.5, x: 20, y: 20 },
        { id: 'h6', name: 'Rice', number: 41, position: 'CDM', rating: 8.5, x: 50, y: 35 },
        { id: 'h7', name: 'Odegaard', number: 8, position: 'CM', rating: 8.2, x: 70, y: 45 },
        { id: 'h8', name: 'Havertz', number: 29, position: 'CM', rating: 7.2, x: 30, y: 45 },
        { id: 'h9', name: 'Saka', number: 7, position: 'RW', rating: 8.8, x: 85, y: 70 },
        { id: 'h10', name: 'Jesus', number: 9, position: 'ST', rating: 7.0, x: 50, y: 80 },
        { id: 'h11', name: 'Martinelli', number: 11, position: 'LW', rating: 6.8, x: 15, y: 70 },
      ],
      bench: [
        { id: 'b1', name: 'Ramsdale', number: 1, position: 'GK' },
        { id: 'b2', name: 'Trossard', number: 19, position: 'LW', rating: 7.0 },
      ]
    },
    away: {
      formation: '4-2-3-1',
      startingXI: [
        { id: 'a1', name: 'Petrovic', number: 28, position: 'GK', rating: 6.5, x: 50, y: 95 },
        { id: 'a2', name: 'Gusto', number: 27, position: 'RB', rating: 7.0, x: 20, y: 80 },
        { id: 'a3', name: 'Disasi', number: 2, position: 'CB', rating: 6.0, x: 35, y: 85 },
        { id: 'a4', name: 'Badiashile', number: 5, position: 'CB', rating: 6.2, x: 65, y: 85 },
        { id: 'a5', name: 'Chilwell', number: 21, position: 'LB', rating: 6.8, x: 80, y: 80 },
        { id: 'a6', name: 'Caicedo', number: 25, position: 'CDM', rating: 7.2, x: 35, y: 65 },
        { id: 'a7', name: 'Fernandez', number: 8, position: 'CDM', rating: 6.5, x: 65, y: 65 },
        { id: 'a8', name: 'Palmer', number: 20, position: 'CAM', rating: 8.2, x: 50, y: 55 },
        { id: 'a9', name: 'Madueke', number: 11, position: 'RW', rating: 6.5, x: 15, y: 45 },
        { id: 'a10', name: 'Sterling', number: 7, position: 'LW', rating: 7.0, x: 85, y: 45 },
        { id: 'a11', name: 'Jackson', number: 15, position: 'ST', rating: 6.0, x: 50, y: 30 },
      ],
      bench: [{ id: 'b3', name: 'Mudryk', number: 10, position: 'LW' }]
    }
  }
};

type TabId = 'overview' | 'lineups' | 'stats' | 'commentary';

export function StadiumMatchCenter({ data: initialData, matchId }: { data?: StadiumMatchData; matchId?: string }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  // In a real app we'd fetch data using matchId if not provided. Using SAMPLE_DATA for demonstration.
  const data = initialData || SAMPLE_DATA;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Clock className="w-4 h-4" /> },
    { id: 'lineups', label: 'Lineups', icon: <AlignCenter className="w-4 h-4" /> },
    { id: 'stats', label: 'Stats', icon: <Activity className="w-4 h-4" /> },
    { id: 'commentary', label: 'Live', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] shadow-xl overflow-hidden my-8 not-prose font-manrope">
      {/* Texture wrapper for dark mode */}
      <div className="dark:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
        
        {/* --- HERO HEADER --- */}
        <div className="relative p-6 sm:p-8 bg-gray-50 dark:bg-[#1E293B]/50 border-b border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-start mb-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-[#16A34A]" /> {data.competition}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {data.venue}</span>
          </div>

          <div className="flex items-center justify-between text-center max-w-2xl mx-auto">
            {/* Home Team */}
            <div className="flex-1">
              <h2 className="text-xl sm:text-3xl font-black font-outfit text-[#0F172A] dark:text-white uppercase">
                {data.homeTeam}
              </h2>
            </div>
            
            {/* Score & Status */}
            <div className="px-6 flex flex-col items-center">
              <div className="flex items-center gap-3 text-5xl sm:text-6xl font-black font-outfit text-[#0F172A] dark:text-white">
                <span>{data.homeScore}</span>
                <span className="text-[#16A34A] animate-pulse">:</span>
                <span>{data.awayScore}</span>
              </div>
              <div className="mt-3">
                {data.status === 'live' ? (
                  <span className="bg-red-500/10 text-red-500 font-bold px-3 py-1 text-sm tracking-widest uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE {data.minute}
                  </span>
                ) : (
                  <span className="text-gray-500 font-bold px-3 py-1 text-sm tracking-widest uppercase">
                    {data.status === 'finished' ? 'Full Time' : formatDate(data.matchDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex-1">
              <h2 className="text-xl sm:text-3xl font-black font-outfit text-[#0F172A] dark:text-white uppercase">
                {data.awayTeam}
              </h2>
            </div>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[#16A34A] border-b-2 border-[#16A34A] bg-[#16A34A]/5'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="min-h-[400px]">
          {activeTab === 'overview' && <OverviewTab data={data} />}
          {activeTab === 'lineups' && <LineupsTab data={data} />}
          {activeTab === 'stats' && <StatsTab data={data} />}
          {activeTab === 'commentary' && <CommentaryTab data={data} />}
        </div>
        
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// OVERVIEW TAB
// ---------------------------------------------------------
function OverviewTab({ data }: { data: StadiumMatchData }) {
  const goalEvents = data.events.filter(e => e.type === 'goal').sort((a, b) => parseInt(a.minute) - parseInt(b.minute));

  return (
    <div className="p-6 sm:p-8">
      <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
        {/* Home Scorers */}
        <div>
          {goalEvents.filter(e => e.team === 'home').map((e, i) => (
            <div key={i} className="flex flex-col mb-4">
              <div className="flex items-center justify-between text-sm font-bold text-[#0F172A] dark:text-white">
                <span>{e.player}</span>
                <span className="text-gray-500">{e.minute}</span>
              </div>
              {e.assist && <span className="text-xs text-gray-500">ast. {e.assist}</span>}
              <div className="mt-1 h-0.5 w-8 bg-[#16A34A]" />
            </div>
          ))}
        </div>

        {/* Away Scorers */}
        <div className="text-right">
          {goalEvents.filter(e => e.team === 'away').map((e, i) => (
            <div key={i} className="flex flex-col mb-4 items-end">
              <div className="flex items-center justify-between text-sm font-bold text-[#0F172A] dark:text-white w-full">
                <span className="text-gray-500">{e.minute}</span>
                <span>{e.player}</span>
              </div>
              {e.assist && <span className="text-xs text-gray-500">ast. {e.assist}</span>}
              <div className="mt-1 h-0.5 w-8 bg-gray-300 dark:bg-gray-600" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// STATS TAB
// ---------------------------------------------------------
function StatsTab({ data }: { data: StadiumMatchData }) {
  return (
    <div className="p-6 sm:p-10 max-w-3xl mx-auto space-y-8">
      {data.stats.map((stat, i) => {
        const total = stat.home + stat.away || 1;
        const homePercent = (stat.home / total) * 100;
        
        return (
          <div key={i} className="group cursor-default">
            {/* Labels */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-black font-outfit text-[#0F172A] dark:text-white">{stat.home}{stat.isPercentage ? '%' : ''}</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">{stat.label}</span>
              <span className="text-2xl font-black font-outfit text-[#0F172A] dark:text-white">{stat.away}{stat.isPercentage ? '%' : ''}</span>
            </div>
            
            {/* Progress Bars */}
            <div className="flex h-2.5 bg-gray-100 dark:bg-[#1E293B] overflow-hidden gap-1 transition-all group-hover:h-3">
              {/* Home Bar */}
              <div className="h-full flex-1 flex justify-end bg-gray-100 dark:bg-transparent">
                  <div className="h-full bg-[#16A34A] transition-all duration-1000 ease-out" style={{ width: `${homePercent}%` }} />
              </div>
              
              {/* Center Divider */}
              <div className="w-1 bg-white dark:bg-[#0F172A]" />
              
              {/* Away Bar */}
              <div className="h-full flex-1 bg-gray-100 dark:bg-transparent">
                  <div className="h-full bg-gray-400 dark:bg-gray-500 transition-all duration-1000 ease-out" style={{ width: `${100 - homePercent}%` }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  );
}

// ---------------------------------------------------------
// LINEUPS TAB (2D pitch)
// ---------------------------------------------------------
function LineupsTab({ data }: { data: StadiumMatchData }) {
  const [view, setView] = useState<'home'|'away'>('home');
  const teamData = view === 'home' ? data.lineups.home : data.lineups.away;
  const teamName = view === 'home' ? data.homeTeam : data.awayTeam;

  const nodeColor = view === 'home' ? 'bg-[#16A34A] text-white border-[#16A34A]' : 'bg-gray-100 dark:bg-gray-800 text-[#0F172A] dark:text-white border-gray-300 dark:border-gray-600';

  return (
    <div className="flex flex-col lg:flex-row min-h-[500px] border-t border-gray-100 dark:border-gray-800">
      
      {/* 2D Pitch (Left) */}
      <div className="lg:w-3/5 bg-[#16A34A]/5 relative p-4 flex items-center justify-center min-h-[400px]">
        {/* Pitch borders */}
        <div className="absolute inset-4 sm:inset-8 border-2 border-gray-200 dark:border-white/10 rounded-sm">
          {/* Halfway line */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-200 dark:bg-white/10 -translate-y-1/2" />
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-gray-200 dark:border-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          {/* Penalty boxes */}
          <div className="absolute top-0 left-1/4 w-1/2 h-1/5 border-2 border-t-0 border-gray-200 dark:border-white/10" />
          <div className="absolute bottom-0 left-1/4 w-1/2 h-1/5 border-2 border-b-0 border-gray-200 dark:border-white/10" />
        </div>

        {/* Players */}
        <div className="absolute inset-4 sm:inset-8">
          {teamData.startingXI.map((player) => {
            // Adjust y coordinate depending on home/away to always shoot "up" in the UI for clarity, or just rely on raw numbers
            // We assume 0 is home goal, 100 is away goal.
            const actualY = view === 'home' ? player.y : (100 - player.y);

            return (
              <div 
                key={player.id} 
                className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 group z-10"
                style={{ top: `${100 - actualY}%`, left: `${player.x}%` }}
              >
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 text-[10px] sm:text-xs font-bold flex items-center justify-center cursor-pointer shadow-lg transition-transform group-hover:scale-110 ${nodeColor}`}>
                  {player.number}
                </div>
                <div className="mt-1 px-1.5 py-0.5 bg-white/90 dark:bg-black/90 text-black dark:text-white text-[9px] sm:text-[10px] whitespace-nowrap rounded font-bold uppercase truncate max-w-[60px] sm:max-w-none">
                  {player.name}
                </div>
                {/* Tooltip on hover */}
                {player.rating && (
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0F172A] text-white text-xs px-2 py-1 flex items-center gap-2 pointer-events-none rounded shadow-xl whitespace-nowrap z-20">
                    <span className="font-bold">{player.name}</span>
                    <span className="bg-[#16A34A] px-1 rounded">{player.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Roster List (Right) */}
      <div className="lg:w-2/5 border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0F172A]">
        {/* Toggle */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          <button 
            onClick={() => setView('home')} 
            className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase transition-colors ${view === 'home' ? 'text-[#16A34A] bg-[#16A34A]/5' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {data.homeTeam}
          </button>
          <button 
            onClick={() => setView('away')} 
            className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase transition-colors border-l border-gray-100 dark:border-gray-800 ${view === 'away' ? 'text-white bg-gray-800 dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {data.awayTeam}
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[500px]">
          <div className="mb-6">
            <h4 className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Starting XI • {teamData.formation}</h4>
            <div className="space-y-1">
              {teamData.startingXI.map(p => (
                <div key={p.id} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 dark:hover:bg-[#1E293B] rounded-lg group cursor-default transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-[10px] text-gray-400 text-right font-mono">{p.number}</span>
                    <span className="text-sm font-bold text-[#0F172A] dark:text-white group-hover:text-[#16A34A] transition-colors">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] tracking-widest text-[#16A34A]">{p.position}</span>
                    {p.rating && <span className="text-xs font-black bg-gray-100 dark:bg-gray-800 px-2 rounded">{p.rating.toFixed(1)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Substitutes</h4>
            <div className="space-y-1">
              {teamData.bench.map(p => (
                <div key={p.id} className="flex justify-between items-center py-2 px-3 text-gray-500">
                  <div className="flex items-center gap-3">
                     <span className="w-5 text-[10px] text-right font-mono">{p.number}</span>
                     <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <span className="text-[10px]">{p.position}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// COMMENTARY TAB
// ---------------------------------------------------------
function CommentaryTab({ data }: { data: StadiumMatchData }) {
  // Combine all commentary and strictly timeline events, reverse chronological
  const timelineEvents = [...data.events].sort((a, b) => {
    // Basic string parse for minutes (e.g., "45+2'" -> 47)
    const parseMin = (m: string) => parseInt(m.replace(/[^0-9]/g, '')) || 0;
    return parseMin(b.minute) - parseMin(a.minute);
  });

  return (
    <div className="p-6 sm:p-10 max-w-3xl mx-auto">
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-[#1E293B] before:to-transparent">
        
        {timelineEvents.map((event, i) => (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            {/* Timeline dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#0F172A] bg-gray-100 dark:bg-[#1E293B] absolute left-0 md:left-1/2 -translate-x-1/2 z-10 text-[10px] font-bold text-gray-500 group-hover:text-[#16A34A] group-hover:border-[#16A34A]/20 transition-all">
              {event.minute}
            </div>

            {/* Content Box */}
            <div className="w-[calc(100%-48px)] md:w-[calc(50%-40px)] p-4 rounded-xl border border-transparent group-hover:border-gray-200 dark:group-hover:border-[#1E293B] group-hover:bg-gray-50 dark:group-hover:bg-[#1E293B]/30 transition-colors ml-12 md:ml-0">
              
              <div className="flex items-center gap-2 mb-2">
                {event.type === 'goal' && <span className="bg-[#16A34A] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">Goal</span>}
                {event.type === 'yellow' && <span className="bg-yellow-400 text-yellow-900 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">Yellow</span>}
                {event.type === 'red' && <span className="bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">Red Card</span>}
                {event.type === 'sub' && <span className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">Sub</span>}
              </div>

              {event.type === 'commentary' ? (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{event.text}</p>
              ) : (
                <div>
                  <p className="text-base font-bold text-[#0F172A] dark:text-white">{event.player}</p>
                  {event.assist && <p className="text-xs text-gray-500 mt-1">Assist by {event.assist}</p>}
                </div>
              )}
            </div>
          </div>
        ))}

        {timelineEvents.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-500 font-bold uppercase tracking-widest">
            Awaiting Kickoff
          </div>
        )}

      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}
