import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Megaphone, 
  Flag, 
  Pause, 
  Play, 
  Square, 
  Settings, 
  Check 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function MatchCard({ 
  match, 
  role, 
  onSetWinner, 
  onEditName, 
  matchRef, 
  highlightedSlot, 
  onSetMatchState 
}) {
  const isReferee = role === 'referee';
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval;
    if (match.playState === 'playing' || match.playState === 'call') {
      interval = setInterval(() => {
        setElapsed((match.accumulatedTime || 0) + (Date.now() - match.startTime));
      }, 1000);
    } else {
      setElapsed(match.accumulatedTime || 0);
    }
    return () => clearInterval(interval);
  }, [match.playState, match.startTime, match.accumulatedTime]);

  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isPlaying = match.playState === 'playing';
  const isPrep = match.playState === 'prep';
  const isCall = match.playState === 'call';

  // 10 minutes in milliseconds
  const LIMIT_MS = 10 * 60 * 1000;
  const remainingTime = isCall ? Math.max(0, LIMIT_MS - elapsed) : 0;
  const isTimeOut = isCall && remainingTime === 0;

  return (
    <div className="relative group w-full" ref={matchRef}>
      <div className="absolute -top-3 left-3 px-2 py-0.5 bg-slate-900 rounded shadow-md z-20 flex items-center gap-2">
         <p className="text-[7px] font-black text-white uppercase tracking-widest">Match {match.id.replace('m','')}</p>
         {isPlaying && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
         {isPrep && <span className="flex h-2 w-2 relative"><span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span>}
         {isCall && <span className={cn("flex h-2 w-2 relative", isTimeOut ? "animate-bounce" : "animate-pulse")}><span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isTimeOut ? "bg-red-400" : "bg-blue-400")}></span><span className={cn("relative inline-flex rounded-full h-2 w-2", isTimeOut ? "bg-red-500" : "bg-blue-500")}></span></span>}
      </div>
      
      {isPlaying && (
        <div className="absolute -top-4 right-4 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-t-lg animate-pulse z-0">
          SEDANG BERTANDING
        </div>
      )}
      {isPrep && (
        <div className="absolute -top-4 right-4 bg-yellow-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-t-lg animate-pulse z-0">
          SEDANG PERSIAPAN
        </div>
      )}
      {isCall && (
        <div className={cn("absolute -top-4 right-4 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-t-lg z-0", isTimeOut ? "bg-red-600 animate-bounce" : "bg-blue-500 animate-pulse")}>
          {isTimeOut ? "PANGGILAN HABIS (DIS?)" : "HARAP MENUJU LAPAK"}
        </div>
      )}

      <div className={cn(
        "bg-white border-2 rounded-2xl overflow-hidden shadow-sm hover:border-brand-400 hover:shadow-2xl transition-all duration-300 relative z-10 flex flex-col",
        highlightedSlot ? 'border-emerald-400 shadow-lg shadow-emerald-100 ring-4 ring-emerald-400/20' : 
        isPlaying ? 'border-red-500 shadow-lg shadow-red-200 ring-4 ring-red-500/20' : 
        isPrep ? 'border-yellow-500 shadow-lg shadow-yellow-200 ring-4 ring-yellow-500/20' : 
        isCall ? (isTimeOut ? 'border-red-600 shadow-lg shadow-red-200 ring-4 ring-red-600/20' : 'border-blue-500 shadow-lg shadow-blue-200 ring-4 ring-blue-500/20') : 'border-slate-100'
      )}>
        <div className="flex-1 flex flex-col">
          {[1, 2].map(slot => {
            const playerName = slot === 1 ? match.player1 : match.player2;
            const isWinner = match.winner === playerName && playerName;
            const isHighlighted = highlightedSlot === slot;
            const isDisqualified = slot === 1 ? match.player1Disqualified : match.player2Disqualified;
            return (
              <div key={slot} className={cn(
                "p-3.5 flex items-center justify-between border-b-2 last:border-0 transition-all duration-300 flex-1",
                isHighlighted ? "bg-emerald-500 text-white" : 
                isDisqualified ? "bg-red-500 text-white" : 
                isWinner ? "bg-brand-600 text-white" : "bg-white"
              )}>
                <button onClick={() => onSetWinner(match.id, playerName)} disabled={!isReferee || !playerName} className="flex-1 flex items-center gap-4 text-left min-w-0">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    isHighlighted ? "bg-white shadow-[0_0_10px_white] animate-pulse" : 
                    isDisqualified ? "bg-white shadow-[0_0_10px_white]" : 
                    isWinner ? "bg-white shadow-[0_0_10px_white]" : "bg-slate-200"
                  )}/>
                  <span className={cn(
                    "text-[13px] font-black truncate leading-none",
                    !playerName ? "text-slate-300 italic" : (isHighlighted || isDisqualified || isWinner) ? "text-white" : "text-slate-800"
                  )}>
                    {playerName || 'TBA'} {isDisqualified && <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded ml-2">DIS</span>}
                  </span>
                  {isHighlighted && <span className="ml-auto text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full shrink-0">DITEMUKAN</span>}
                </button>
                {isReferee && playerName && (
                  <button onClick={() => onEditName(slot, playerName)} className={cn("p-1.5 rounded-lg transition-colors ml-2", (isHighlighted || isDisqualified || isWinner) ? "text-white/40 hover:text-white" : "text-slate-300 hover:text-brand-600 opacity-0 group-hover:opacity-100")}><Settings size={14}/></button>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Match Controls / Stopwatch */}
        {(match.playState || isReferee) && (
          <div className={cn(
            "flex items-center justify-between px-4 py-2.5 border-t-2",
            isPlaying ? "bg-red-50 border-red-100" : 
            isCall ? (isTimeOut ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100") : "bg-slate-50 border-slate-100"
          )}>
            <div className={cn(
              "flex items-center gap-2 font-mono text-xs font-black", 
              isPlaying ? "text-red-600 animate-pulse" : 
              isCall ? (isTimeOut ? "text-red-600 animate-bounce" : "text-blue-600 animate-pulse") : "text-slate-500"
            )}>
              <Clock size={14}/> {isCall ? (isTimeOut ? "00:00 (HABIS)" : formatTime(remainingTime)) : formatTime(elapsed)}
            </div>
            {isReferee && (
              <div className="flex gap-1">
                <button onClick={() => onSetMatchState(match.id, 'call')} className={cn("p-1.5 rounded transition-colors", isCall ? "bg-blue-500 text-white" : "text-slate-400 hover:bg-blue-100 hover:text-blue-600")} title="Harap Menuju Lapak"><Megaphone size={14}/></button>
                <button onClick={() => onSetMatchState(match.id, 'prep')} className={cn("p-1.5 rounded transition-colors", isPrep ? "bg-yellow-500 text-white" : "text-slate-400 hover:bg-yellow-100 hover:text-yellow-600")} title="Sedang Persiapan"><Flag size={14}/></button>
                {isPlaying ? (
                  <button onClick={() => onSetMatchState(match.id, 'pause')} className="p-1.5 text-amber-500 hover:bg-amber-100 rounded transition-colors" title="Pause"><Pause size={14}/></button>
                ) : (
                  <button onClick={() => onSetMatchState(match.id, 'play')} className="p-1.5 text-emerald-500 hover:bg-emerald-100 rounded transition-colors" title="Play"><Play size={14}/></button>
                )}
                {(match.accumulatedTime > 0 || isPlaying || isCall) && (
                  <button onClick={() => onSetMatchState(match.id, 'stop')} className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-red-600 rounded transition-colors" title="Stop/Reset"><Square size={14}/></button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
