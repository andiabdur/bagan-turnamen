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
      {/* Match Header Tag */}
      <div className="absolute -top-3 left-3 px-2 py-0.5 bg-border-strong border border-border-strong rounded shadow-tactical-sm z-20 flex items-center gap-1.5">
        <p className="text-[8px] font-black text-white uppercase tracking-widest">
          {match.label ? match.label : `Match ${match.id.replace('fm', 'F').replace('m','')}`}
        </p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowDetail(true);
          }}
          className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5 shrink-0 focus:outline-none"
          title="Lihat detail pertandingan"
        >
          <Eye size={10} className="stroke-[2.5]" />
        </button>
        {isPlaying && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-live"></span>
          </span>
        )}
        {isPrep && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-warning"></span>
          </span>
        )}
        {isCall && (
          <span className={cn("flex h-2 w-2 relative", isTimeOut ? "animate-bounce" : "animate-pulse")}>
            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isTimeOut ? "bg-red-400" : "bg-blue-400")}></span>
            <span className={cn("relative inline-flex rounded-full h-2 w-2", isTimeOut ? "bg-status-live" : "bg-primary")}></span>
          </span>
        )}
      </div>
      
      {/* Animated Match Status Ribbon */}
      {isPlaying && (
        <div className="absolute -top-4 right-4 bg-status-live text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-t-lg animate-pulse-live z-0 shadow-sm">
          SEDANG BERTANDING
        </div>
      )}
      {isPrep && (
        <div className="absolute -top-4 right-4 bg-status-warning text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-t-lg animate-pulse z-0 shadow-sm">
          SEDANG PERSIAPAN
        </div>
      )}
      {isCall && (
        <div className={cn("absolute -top-4 right-4 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-t-lg z-0 shadow-sm", isTimeOut ? "bg-status-live animate-bounce" : "bg-primary animate-pulse")}>
          {isTimeOut ? "PANGGILAN HABIS (DIS?)" : "HARAP MENUJU LAPAK"}
        </div>
      )}

      {/* Main Card Body */}
      <div className={cn(
        "bg-surface border-2 rounded-xl overflow-hidden shadow-tactical hover:shadow-[5px_5px_0px_0px_#020617] transition-all duration-200 relative z-10 flex flex-col",
        highlightedSlot ? 'border-emerald-500 ring-4 ring-emerald-400/30' : 
        isPlaying ? 'border-status-live ring-4 ring-red-500/20' : 
        isPrep ? 'border-status-warning ring-4 ring-amber-500/20' : 
        isCall ? (isTimeOut ? 'border-status-live ring-4 ring-red-600/30' : 'border-primary ring-4 ring-blue-500/20') : 'border-border-strong'
      )}>
        {/* Left Indicator Accent Stripe */}
        <div className={cn(
          "absolute top-0 left-0 bottom-0 w-1.5 z-20",
          isPlaying ? "bg-status-live" :
          isPrep ? "bg-status-warning" :
          isCall ? (isTimeOut ? "bg-status-live" : "bg-primary") :
          highlightedSlot ? "bg-emerald-500" : "bg-transparent"
        )} />

        <div className="flex-1 flex flex-col pl-1.5">
          {[1, 2].map(slot => {
            const playerName = slot === 1 ? match.player1 : match.player2;
            const isWinner = match.winner === playerName && playerName;
            const isHighlighted = highlightedSlot === slot;
            const isDisqualified = slot === 1 ? match.player1Disqualified : match.player2Disqualified;
            const hasPoints = (prelimPointsSystem === 'all' || 
                              ((prelimPointsSystem === 'prelim' || prelimPointsSystem === true) && match.round === 1));

            return (
              <div key={slot} className={cn(
                "p-0 flex items-center justify-between border-b-2 last:border-0 border-border-subtle transition-all duration-200 flex-1 self-stretch",
                isHighlighted ? "bg-emerald-600 text-white" : 
                isDisqualified ? "bg-status-live text-white" : 
                isWinner ? "bg-primary text-white" : "bg-surface hover:bg-surface-bright"
              )}>
                {/* Left Section: Name & Edit Control */}
                <div className="p-3.5 flex-1 flex items-center min-w-0">
                  <button 
                    onClick={() => onSetWinner(match.id, playerName)} 
                    disabled={!isReferee || !playerName} 
                    className="flex-1 flex items-center gap-3 text-left min-w-0 cursor-pointer disabled:cursor-default"
                  >
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0 border",
                      isHighlighted ? "bg-white border-white shadow-[0_0_8px_white] animate-pulse" : 
                      isDisqualified ? "bg-white border-white shadow-[0_0_8px_white]" : 
                      isWinner ? "bg-white border-white shadow-[0_0_8px_white]" : "bg-slate-200 border-border-subtle"
                    )}/>
                    <span 
                      className={cn(
                        "text-[13px] font-black truncate leading-tight tracking-tight",
                        !playerName ? "text-slate-400 italic" : 
                        (isHighlighted || isDisqualified || isWinner) ? "text-white font-extrabold" : "text-border-strong font-bold"
                      )}
                      title={playerName || 'TBA'}
                    >
                      {playerName || 'TBA'} {isDisqualified && <span className="text-[9px] font-black bg-white/20 px-1.5 py-0.5 rounded ml-1.5">DIS</span>}
                    </span>
                    {isHighlighted && <span className="ml-auto text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full shrink-0 tracking-wider">DITEMUKAN</span>}
                  </button>
                  {isReferee && playerName && (
                    <button 
                      onClick={() => onEditName(slot, playerName)} 
                      className={cn(
                        "p-1.5 rounded-lg transition-colors ml-2 shrink-0", 
                        (isHighlighted || isDisqualified || isWinner) ? "text-white/60 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-primary opacity-0 group-hover:opacity-100 focus:opacity-100"
                      )}
                      title="Setelan Peserta"
                    >
                      <Settings size={14} className="stroke-[2.5]" />
                    </button>
                  )}
                </div>

                {/* Right Section: Score Box */}
                {hasPoints && playerName && (
                  <div className={cn(
                    "w-16 border-l-2 flex items-center justify-center gap-1 self-stretch shrink-0 p-2",
                    isHighlighted ? "border-emerald-400 bg-emerald-700/20" :
                    isDisqualified ? "border-red-400 bg-red-700/20" :
                    isWinner ? "border-primary-container bg-blue-900/20" :
                    "border-border-subtle bg-surface-dim"
                  )}>
                    <span className={cn(
                      "text-[11px] font-black select-none tracking-tight",
                      (isHighlighted || isDisqualified || isWinner) ? "text-white" : "text-border-strong"
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
                            : "text-status-live hover:bg-red-50 border-slate-200"
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
            "flex items-center justify-between px-3.5 py-2.5 border-t-2 border-border-subtle pl-4",
            isPlaying ? "bg-red-50" : 
            isCall ? (isTimeOut ? "bg-red-50" : "bg-blue-50") : "bg-surface-bright"
          )}>
            <div className={cn(
              "flex items-center gap-1.5 font-mono text-xs font-black", 
              isPlaying ? "text-status-live animate-pulse" : 
              isCall ? (isTimeOut ? "text-status-live animate-bounce" : "text-primary animate-pulse") : "text-slate-600"
            )}>
              <Clock size={14} className="stroke-[2.5]" /> {isCall ? (isTimeOut ? "00:00 (HABIS)" : formatTime(remainingTime)) : formatTime(elapsed)}
            </div>
            {isReferee && (
              <div className="flex gap-1 items-center">
                <button 
                  onClick={() => onSetMatchState(match.id, 'call')} 
                  className={cn(
                    "p-1.5 rounded-lg border transition-all active:scale-95", 
                    isCall ? "bg-primary text-white border-primary shadow-tactical-sm" : "bg-surface text-slate-600 border-border-subtle hover:border-primary hover:text-primary"
                  )} 
                  title="Harap Menuju Lapak"
                >
                  <Megaphone size={14} className="stroke-[2.5]" />
                </button>
                <button 
                  onClick={() => onSetMatchState(match.id, 'prep')} 
                  className={cn(
                    "p-1.5 rounded-lg border transition-all active:scale-95", 
                    isPrep ? "bg-status-warning text-white border-status-warning shadow-tactical-sm" : "bg-surface text-slate-600 border-border-subtle hover:border-amber-500 hover:text-amber-600"
                  )} 
                  title="Sedang Persiapan"
                >
                  <Flag size={14} className="stroke-[2.5]" />
                </button>
                {isPlaying ? (
                  <button 
                    onClick={() => onSetMatchState(match.id, 'pause')} 
                    className="p-1.5 rounded-lg border border-amber-300 bg-amber-50 text-status-warning hover:bg-amber-100 transition-all active:scale-95" 
                    title="Pause"
                  >
                    <Pause size={14} className="stroke-[2.5]" />
                  </button>
                ) : (
                  <button 
                    onClick={() => onSetMatchState(match.id, 'play')} 
                    className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-status-success hover:bg-emerald-100 transition-all active:scale-95" 
                    title="Play"
                  >
                    <Play size={14} className="stroke-[2.5]" />
                  </button>
                )}
                {(match.accumulatedTime > 0 || isPlaying || isCall) && (
                  <button 
                    onClick={() => onSetMatchState(match.id, 'stop')} 
                    className="p-1.5 rounded-lg border border-slate-200 bg-surface text-slate-500 hover:border-status-live hover:text-status-live transition-all active:scale-95" 
                    title="Stop/Reset"
                  >
                    <Square size={14} className="stroke-[2.5]" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal detail nama lengkap */}
      {showDetail && (
        <>
          <div 
            className="fixed inset-0 z-[200] bg-slate-950/40 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetail(false);
            }}
          />

          <div 
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-surface border-2 border-border-strong rounded-2xl shadow-tactical p-5 z-[210] flex flex-col gap-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-border-subtle pb-3">
              <div>
                <span className="text-[9px] font-black text-white bg-border-strong px-2 py-0.5 rounded uppercase tracking-wider">
                  {match.label ? match.label : `Match ${match.id.replace('fm', 'F').replace('m','')}`}
                </span>
                <h3 className="text-base font-black text-border-strong mt-1 tracking-tight">Detail Pertandingan</h3>
              </div>
              <button 
                onClick={() => setShowDetail(false)}
                className="w-8 h-8 rounded-lg bg-surface border border-border-subtle hover:border-border-strong text-slate-600 flex items-center justify-center font-bold text-sm transition-all duration-150 active:scale-95"
              >
                <X size={16} />
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
                      "p-3.5 rounded-xl border-2 flex items-center justify-between gap-3 transition-all duration-200",
                      isDisqualified ? "border-status-live bg-red-50" :
                      isWinner ? "border-primary bg-blue-50/70" :
                      "border-border-subtle bg-surface-bright"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "w-3 h-3 rounded-full shrink-0 border-2",
                        isDisqualified ? "bg-status-live border-red-300" : 
                        isWinner ? "bg-primary border-blue-400" : "bg-slate-200 border-slate-300"
                      )}/>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">PESERTA {slot}</span>
                        <span className="text-[13px] font-black text-border-strong break-words mt-0.5 leading-tight">
                          {playerName || 'TBA'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDisqualified && (
                        <span className="text-[8px] font-black bg-status-live text-white px-2 py-0.5 rounded uppercase tracking-wider">
                          DIS
                        </span>
                      )}
                      {isWinner && (
                        <span className="text-[8px] font-black bg-primary text-white px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                          <Trophy size={10} className="stroke-[2.5]" /> MENANG
                        </span>
                      )}
                      {hasPoints && playerName && (
                        <div className="bg-surface border-2 border-border-strong text-border-strong px-2 py-0.5 rounded-lg font-black text-[10px]">
                          {points} PTS
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timer Status */}
            <div className="bg-surface-dim border-2 border-border-subtle rounded-xl p-3 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-slate-500" />
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Status Match</span>
              </div>
              <div className="font-mono text-[11px] font-black text-border-strong uppercase tracking-wide">
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
