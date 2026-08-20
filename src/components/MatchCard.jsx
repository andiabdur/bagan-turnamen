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
  Eye,
  Trophy,
  X
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
      {/* Main Brutalist Card Body */}
      <div className={cn(
        "brutal-card flex flex-col relative z-10 transition-all duration-100",
        highlightedSlot ? 'ring-4 ring-emerald-500' : 
        isPlaying ? 'ring-4 ring-warning-red' : 
        isPrep ? 'ring-4 ring-safety-orange' : 
        isCall ? (isTimeOut ? 'ring-4 ring-warning-red animate-pulse' : 'ring-4 ring-brutal-blue') : ''
      )}>
        
        {/* Card Header Bar */}
        <div className={cn(
          "flex justify-between items-center px-3 py-2 border-b-[3px] border-black",
          isPlaying ? "bg-red-100" :
          isPrep ? "bg-amber-100" :
          isCall ? (isTimeOut ? "bg-red-100" : "bg-blue-100") :
          "bg-surface-container"
        )}>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-[11px] text-black uppercase tracking-wider">
              {match.label ? match.label : `Match #${match.id.replace('fm', 'F').replace('m','')}`}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowDetail(true);
              }}
              className="text-black hover:text-brutal-blue transition-colors p-0.5 shrink-0 focus:outline-none"
              title="Lihat detail pertandingan"
            >
              <Eye size={12} className="stroke-[3]" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {isPlaying && (
              <span className="bg-warning-red text-white px-2 py-0.5 border-2 border-black font-black text-[9px] uppercase tracking-wider animate-pulse-live">
                LIVE
              </span>
            )}
            {isPrep && (
              <span className="bg-safety-orange text-white px-2 py-0.5 border-2 border-black font-black text-[9px] uppercase tracking-wider">
                PERSIAPAN
              </span>
            )}
            {isCall && (
              <span className={cn(
                "text-white px-2 py-0.5 border-2 border-black font-black text-[9px] uppercase tracking-wider",
                isTimeOut ? "bg-warning-red animate-bounce" : "bg-brutal-blue"
              )}>
                {isTimeOut ? "HABIS (DIS?)" : "PANGGILAN"}
              </span>
            )}
          </div>
        </div>

        {/* Players Section */}
        <div className="flex flex-col">
          {[1, 2].map(slot => {
            const playerName = slot === 1 ? match.player1 : match.player2;
            const isWinner = match.winner === playerName && playerName;
            const isHighlighted = highlightedSlot === slot;
            const isDisqualified = slot === 1 ? match.player1Disqualified : match.player2Disqualified;
            const hasPoints = (prelimPointsSystem === 'all' || 
                              ((prelimPointsSystem === 'prelim' || prelimPointsSystem === true) && match.round === 1));

            return (
              <div key={slot} className={cn(
                "flex items-center justify-between border-b-[3px] last:border-b-0 border-black transition-colors min-h-[48px]",
                isHighlighted ? "bg-emerald-600 text-white" : 
                isDisqualified ? "bg-warning-red text-white" : 
                isWinner ? "bg-brutal-blue text-white" : "bg-white hover:bg-surface-variant text-black"
              )}>
                {/* Player Name & Action */}
                <div className="px-3 py-2.5 flex-1 flex items-center min-w-0">
                  <button 
                    onClick={() => onSetWinner(match.id, playerName)} 
                    disabled={!isReferee || !playerName} 
                    className="flex-1 flex items-center gap-2.5 text-left min-w-0 cursor-pointer disabled:cursor-default"
                  >
                    <div className={cn(
                      "w-3 h-3 shrink-0 border-2 border-black",
                      (isHighlighted || isDisqualified || isWinner) ? "bg-white" : "bg-black"
                    )}/>
                    <span 
                      className={cn(
                        "text-xs md:text-sm font-black truncate leading-tight tracking-tight uppercase",
                        !playerName ? "text-slate-400 italic normal-case" : 
                        (isHighlighted || isDisqualified || isWinner) ? "text-white" : "text-black"
                      )}
                      title={playerName || 'TBA'}
                    >
                      {playerName || 'TBA'} {isDisqualified && <span className="text-[8px] font-black bg-black text-white px-1.5 py-0.5 ml-1 border border-white uppercase">DIS</span>}
                    </span>
                    {isHighlighted && <span className="ml-auto text-[8px] font-black bg-white text-black px-1.5 py-0.5 shrink-0 uppercase">DITEMUKAN</span>}
                  </button>
                  
                  {isReferee && playerName && (
                    <button 
                      onClick={() => onEditName(slot, playerName)} 
                      className={cn(
                        "p-1 border border-black rounded-none ml-2 shrink-0 transition-colors", 
                        (isHighlighted || isDisqualified || isWinner) 
                          ? "bg-white text-black hover:bg-slate-200" 
                          : "bg-surface-variant text-black hover:bg-black hover:text-white"
                      )}
                      title="Setelan Peserta"
                    >
                      <Settings size={12} className="stroke-[3]" />
                    </button>
                  )}
                </div>

                {/* Score Counter Box */}
                {hasPoints && playerName && (
                  <div className={cn(
                    "w-14 border-l-[3px] border-black flex items-center justify-center gap-1 self-stretch shrink-0 px-1",
                    isHighlighted ? "bg-emerald-800 text-white" :
                    isDisqualified ? "bg-red-800 text-white" :
                    isWinner ? "bg-blue-900 text-white" :
                    "bg-surface-variant text-black"
                  )}>
                    <span className={cn(
                      "text-xs font-black select-none tracking-tight",
                      (isHighlighted || isDisqualified || isWinner) ? "text-white" : "text-black"
                    )}>
                      {slot === 1 ? (match.player1Points || 0) : (match.player2Points || 0)}
                    </span>
                    {isReferee && !isWinner && (slot === 1 ? (match.player1Points || 0) : (match.player2Points || 0)) > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetWinner(match.id, playerName, true);
                        }} 
                        className={cn(
                          "p-0.5 border border-black shrink-0 active:translate-x-0.5 active:translate-y-0.5",
                          (isHighlighted || isDisqualified || isWinner) 
                            ? "bg-white text-black hover:bg-slate-200" 
                            : "bg-warning-red text-white hover:bg-red-700"
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

        {/* Referee Controls & Timer Bar */}
        {(match.playState || isReferee) && (
          <div className={cn(
            "flex items-center justify-between px-3 py-2 border-t-[3px] border-black",
            isPlaying ? "bg-red-50" : 
            isCall ? (isTimeOut ? "bg-red-50" : "bg-blue-50") : "bg-white"
          )}>
            <div className={cn(
              "flex items-center gap-1 font-mono text-xs font-black", 
              isPlaying ? "text-warning-red animate-pulse" : 
              isCall ? (isTimeOut ? "text-warning-red animate-bounce" : "text-brutal-blue animate-pulse") : "text-black"
            )}>
              <Clock size={13} className="stroke-[3]" /> {isCall ? (isTimeOut ? "00:00 (HABIS)" : formatTime(remainingTime)) : formatTime(elapsed)}
            </div>
            
            {isReferee && (
              <div className="flex gap-1 items-center">
                <button 
                  onClick={() => onSetMatchState(match.id, 'call')} 
                  className={cn(
                    "p-1.5 border-[2px] border-black font-black transition-all active:translate-x-0.5 active:translate-y-0.5", 
                    isCall ? "bg-brutal-blue text-white shadow-brutal-sm" : "bg-white text-black hover:bg-surface-variant"
                  )} 
                  title="Panggilan Lapak"
                >
                  <Megaphone size={13} className="stroke-[2.5]" />
                </button>
                <button 
                  onClick={() => onSetMatchState(match.id, 'prep')} 
                  className={cn(
                    "p-1.5 border-[2px] border-black font-black transition-all active:translate-x-0.5 active:translate-y-0.5", 
                    isPrep ? "bg-safety-orange text-white shadow-brutal-sm" : "bg-white text-black hover:bg-surface-variant"
                  )} 
                  title="Persiapan"
                >
                  <Flag size={13} className="stroke-[2.5]" />
                </button>
                {isPlaying ? (
                  <button 
                    onClick={() => onSetMatchState(match.id, 'pause')} 
                    className="p-1.5 border-[2px] border-black bg-safety-orange text-white hover:bg-orange-600 transition-all active:translate-x-0.5 active:translate-y-0.5 shadow-brutal-sm" 
                    title="Pause"
                  >
                    <Pause size={13} className="stroke-[3]" />
                  </button>
                ) : (
                  <button 
                    onClick={() => onSetMatchState(match.id, 'play')} 
                    className="p-1.5 border-[2px] border-black bg-success-green text-black hover:bg-green-600 transition-all active:translate-x-0.5 active:translate-y-0.5 shadow-brutal-sm font-black" 
                    title="Play"
                  >
                    <Play size={13} className="stroke-[3] fill-black" />
                  </button>
                )}
                {(match.accumulatedTime > 0 || isPlaying || isCall) && (
                  <button 
                    onClick={() => onSetMatchState(match.id, 'stop')} 
                    className="p-1.5 border-[2px] border-black bg-white text-warning-red hover:bg-warning-red hover:text-white transition-all active:translate-x-0.5 active:translate-y-0.5" 
                    title="Stop/Reset"
                  >
                    <Square size={13} className="stroke-[3]" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Brutalist Detail Modal */}
      {showDetail && (
        <>
          <div 
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetail(false);
            }}
          />

          <div 
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-sm bg-white border-[3px] border-black shadow-brutal p-5 z-[210] flex flex-col gap-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b-[3px] border-black pb-3">
              <div>
                <span className="text-[10px] font-black text-white bg-black px-2 py-0.5 uppercase tracking-wider border border-black">
                  {match.label ? match.label : `Match #${match.id.replace('fm', 'F').replace('m','')}`}
                </span>
                <h3 className="text-lg font-black text-black mt-1 uppercase tracking-tight">Detail Pertandingan</h3>
              </div>
              <button 
                onClick={() => setShowDetail(false)}
                className="w-8 h-8 bg-white border-[2px] border-black text-black flex items-center justify-center font-black transition-all hover:bg-black hover:text-white active:translate-x-0.5 active:translate-y-0.5 shadow-brutal-sm"
              >
                <X size={16} className="stroke-[3]" />
              </button>
            </div>

            {/* Players List */}
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
                      "p-3.5 border-[2px] border-black flex items-center justify-between gap-3 shadow-brutal-sm",
                      isDisqualified ? "bg-red-50 text-black" :
                      isWinner ? "bg-blue-50 text-black" :
                      "bg-white text-black"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "w-3.5 h-3.5 shrink-0 border-2 border-black",
                        isDisqualified ? "bg-warning-red" : 
                        isWinner ? "bg-brutal-blue" : "bg-surface-variant"
                      )}/>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">PESERTA {slot}</span>
                        <span className="text-sm font-black text-black break-words mt-0.5 leading-tight uppercase">
                          {playerName || 'TBA'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDisqualified && (
                        <span className="text-[9px] font-black bg-warning-red text-white px-2 py-0.5 border border-black uppercase tracking-wider">
                          DIS
                        </span>
                      )}
                      {isWinner && (
                        <span className="text-[9px] font-black bg-brutal-blue text-white px-2 py-0.5 border border-black uppercase tracking-wider flex items-center gap-1">
                          <Trophy size={10} className="stroke-[3]" /> MENANG
                        </span>
                      )}
                      {hasPoints && playerName && (
                        <div className="bg-black text-white px-2 py-0.5 font-black text-xs border border-black">
                          {points} PTS
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status info */}
            <div className="bg-surface-variant border-[2px] border-black p-3 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-black stroke-[2.5]" />
                <span className="text-[10px] font-black text-black uppercase tracking-wider">Status Match</span>
              </div>
              <div className="font-mono text-xs font-black text-black uppercase tracking-wide">
                {isCall ? (isTimeOut ? "PANGGILAN HABIS" : `PANGGILAN (${formatTime(remainingTime)})`) : 
                 isPlaying ? `BERTANDING (${formatTime(elapsed)})` :
                 isPrep ? `PERSIAPAN (${formatTime(elapsed)})` : "BELUM DIMULAI"}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
