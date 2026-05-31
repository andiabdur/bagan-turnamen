import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Megaphone, 
  Flag, 
  Pause, 
  Play, 
  Square, 
  Settings, 
  Check,
  Minus,
  Eye
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
  onSetMatchState,
  prelimPointsSystem
}) {
  const isReferee = role === 'referee';
  const [elapsed, setElapsed] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (!showDetail) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowDetail(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDetail]);

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
          <p className="text-[7px] font-black text-white uppercase tracking-widest">
            {match.label ? match.label : `Match ${match.id.replace('fm', 'F').replace('m','')}`}
          </p>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowDetail(true);
            }}
            className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5 shrink-0 focus:outline-none"
            title="Lihat detail nama lengkap"
          >
            <Eye size={9} className="stroke-[3]" />
          </button>
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
            const hasPoints = (prelimPointsSystem === 'all' || 
                              ((prelimPointsSystem === 'prelim' || prelimPointsSystem === true) && match.round === 1));

            return (
              <div key={slot} className={cn(
                "p-0 flex items-center justify-between border-b-2 last:border-0 transition-all duration-300 flex-1 self-stretch",
                isHighlighted ? "bg-emerald-500 text-white" : 
                isDisqualified ? "bg-red-500 text-white" : 
                isWinner ? "bg-brand-600 text-white" : "bg-white"
              )}>
                {/* Left Section: Name & Edit Control */}
                <div className="p-3.5 flex-1 flex items-center min-w-0">
                  <button 
                    onClick={() => onSetWinner(match.id, playerName)} 
                    disabled={!isReferee || !playerName} 
                    className="flex-1 flex items-center gap-4 text-left min-w-0"
                  >
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0",
                      isHighlighted ? "bg-white shadow-[0_0_10px_white] animate-pulse" : 
                      isDisqualified ? "bg-white shadow-[0_0_10px_white]" : 
                      isWinner ? "bg-white shadow-[0_0_10px_white]" : "bg-slate-200"
                    )}/>
                    <span 
                      className={cn(
                        "text-[13px] font-black truncate leading-none",
                        !playerName ? "text-slate-300 italic" : (isHighlighted || isDisqualified || isWinner) ? "text-white" : "text-slate-800"
                      )}
                      title={playerName || 'TBA'}
                    >
                      {playerName || 'TBA'} {isDisqualified && <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded ml-2">DIS</span>}
                    </span>
                    {isHighlighted && <span className="ml-auto text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full shrink-0">DITEMUKAN</span>}
                  </button>
                  {isReferee && playerName && (
                    <button 
                      onClick={() => onEditName(slot, playerName)} 
                      className={cn(
                        "p-1.5 rounded-lg transition-colors ml-2 shrink-0", 
                        (isHighlighted || isDisqualified || isWinner) ? "text-white/40 hover:text-white" : "text-slate-300 hover:bg-slate-100 hover:text-brand-600 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <Settings size={14}/>
                    </button>
                  )}
                </div>

                {/* Right Section: Score Box */}
                {hasPoints && playerName && (
                  <div className={cn(
                    "w-16 border-l-2 flex items-center justify-center gap-1 self-stretch shrink-0 p-2",
                    isHighlighted ? "border-emerald-400 bg-emerald-600/10" :
                    isDisqualified ? "border-red-400 bg-red-600/10" :
                    isWinner ? "border-brand-500 bg-brand-700/10" :
                    "border-slate-100 bg-slate-50/50"
                  )}>
                    <span className={cn(
                      "text-[10px] font-black select-none",
                      (isHighlighted || isDisqualified || isWinner) ? "text-white" : "text-slate-700"
                    )}>
                      {slot === 1 ? (match.player1Points || 0) : (match.player2Points || 0)} PTS
                    </span>
                    {isReferee && !isWinner && (slot === 1 ? (match.player1Points || 0) : (match.player2Points || 0)) > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetWinner(match.id, playerName, true);
                        }} 
                        className={cn(
                          "p-0.5 rounded transition-all border shrink-0 active:scale-90",
                          (isHighlighted || isDisqualified || isWinner) 
                            ? "text-white hover:bg-white/20 border-white/20" 
                            : "text-red-500 hover:bg-red-50 border-slate-200"
                        )}
                        title="Kurangi 1 Poin"
                      >
                        <Minus size={10} className="stroke-[3]"/>
                      </button>
                    )}
                  </div>
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

      {/* Modal detail nama lengkap */}
      {showDetail && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in"
          onClick={() => setShowDetail(false)}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleUp {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .animate-fade-in {
              animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .animate-scale-up {
              animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
          `}</style>
          <div 
            className="bg-white border border-slate-100 rounded-3xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden flex flex-col gap-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background blur decorative blobs */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl -z-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -z-10" />

            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  {match.label ? match.label : `Match ${match.id.replace('fm', 'F').replace('m','')}`}
                </span>
                <h3 className="text-base font-black text-slate-800 mt-1">Detail Pertandingan</h3>
              </div>
              <button 
                onClick={() => setShowDetail(false)}
                className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold transition-all duration-200"
              >
                ✕
              </button>
            </div>

            {/* Players */}
            <div className="flex flex-col gap-3">
              {[1, 2].map(slot => {
                const playerName = slot === 1 ? match.player1 : match.player2;
                const isWinner = match.winner === playerName && playerName;
                const isDisqualified = slot === 1 ? match.player1Disqualified : match.player2Disqualified;
                const hasPoints = (prelimPointsSystem === 'all' || 
                                  ((prelimPointsSystem === 'prelim' || prelimPointsSystem === true) && match.round === 1));
                const points = slot === 1 ? (match.player1Points || 0) : (match.player2Points || 0);

                return (
                  <div 
                    key={slot} 
                    className={cn(
                      "p-4 rounded-2xl border-2 flex items-center justify-between gap-4 transition-all duration-300",
                      isDisqualified ? "border-red-200 bg-red-50" :
                      isWinner ? "border-brand-200 bg-brand-50/50" :
                      "border-slate-100 bg-slate-50/30"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "w-3 h-3 rounded-full shrink-0 border-2",
                        isDisqualified ? "bg-red-500 border-red-300" : 
                        isWinner ? "bg-brand-600 border-brand-400" : "bg-slate-200 border-slate-300"
                      )}/>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">PESERTA {slot}</span>
                        <span className="text-[13px] font-black text-slate-800 break-words mt-0.5 leading-snug">
                          {playerName || 'TBA'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDisqualified && (
                        <span className="text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                          DIS
                        </span>
                      )}
                      {isWinner && (
                        <span className="text-[8px] font-black bg-brand-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                          🏆 MENANG
                        </span>
                      )}
                      {hasPoints && playerName && (
                        <div className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded-lg font-black text-[10px]">
                          {points} PTS
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timer Status */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Pertandingan</span>
              </div>
              <div className="font-mono text-xs font-black text-slate-600 uppercase tracking-wide">
                {isCall ? (isTimeOut ? "PANGGILAN HABIS" : `PANGGILAN (${formatTime(remainingTime)})`) : 
                 isPlaying ? `BERTANDING (${formatTime(elapsed)})` :
                 isPrep ? `PERSIAPAN (${formatTime(elapsed)})` : "BELUM DIMULAI"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
