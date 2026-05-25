import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// ─── Firebase Setup (sama persis seperti App.jsx) ─────────────────────────────
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined') {
    try { return JSON.parse(__firebase_config); } catch (e) {}
  }
  return {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  };
};

const firebaseConfig = getFirebaseConfig();
const hasConfig = firebaseConfig && firebaseConfig.apiKey;

let _app, _auth, _db;
if (hasConfig) {
  try {
    _app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    _auth = getAuth(_app);
    _db   = getFirestore(_app);
  } catch (e) { console.error(e); }
}

const APP_ID = typeof __app_id !== 'undefined' ? __app_id : (import.meta.env.VITE_APP_ID || 'default-app-id');

// ─── Round label helper ────────────────────────────────────────────────────────
function getRoundLabel(idx, totalR, isPool) {
  if (!isPool) {
    const labels2 = ['Semifinal', 'Grand Final'];
    const labels3 = ['Perempat Final', 'Semifinal', 'Grand Final'];
    if (totalR === 2) return labels2[idx] || `Round ${idx + 1}`;
    if (totalR === 3) return labels3[idx] || `Round ${idx + 1}`;
    return `Round ${idx + 1}`;
  }
  const fromEnd = totalR - 1 - idx;
  if (fromEnd === 0) return 'Final Pool';
  if (fromEnd === 1) return 'Semifinal';
  if (fromEnd === 2) return '8 Besar';
  if (fromEnd === 3) return '16 Besar';
  if (fromEnd === 4) return '32 Besar';
  if (fromEnd === 5) return '64 Besar';
  return `Babak ${idx + 1}`;
}

// ─── Match Card (compact, print-friendly) ─────────────────────────────────────
function PrintMatchCard({ match }) {
  const p1 = match.player1;
  const p2 = match.player2;
  return (
    <div style={{
      background: 'white',
      border: '1.5px solid #e2e8f0',
      borderRadius: '8px',
      overflow: 'hidden',
      width: '200px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      fontSize: '10px',
    }}>
      {/* Match label */}
      <div style={{ background: '#1e293b', padding: '2px 6px' }}>
        <span style={{ color: 'white', fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {match.label || `Match ${match.id.replace('fm','F').replace('m','')}`}
        </span>
      </div>
      {/* Players */}
      {[1, 2].map(slot => {
        const name   = slot === 1 ? p1 : p2;
        const isWin  = match.winner && match.winner === name;
        const isDis  = slot === 1 ? match.player1Disqualified : match.player2Disqualified;
        const bg     = isDis ? '#ef4444' : isWin ? '#2563eb' : 'white';
        const color  = (isWin || isDis) ? 'white' : name ? '#1e293b' : '#94a3b8';
        return (
          <div key={slot} style={{
            padding: '5px 8px',
            background: bg,
            color,
            borderTop: slot === 2 ? '1px solid #f1f5f9' : 'none',
            fontWeight: isWin ? 900 : 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            minHeight: '24px',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: (isWin || isDis) ? 'rgba(255,255,255,0.8)' : '#cbd5e1',
              flexShrink: 0,
            }}/>
            <span style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontStyle: name ? 'normal' : 'italic',
              fontSize: '10px',
            }}>
              {name || 'TBA'}{isDis ? ' (DIS)' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Print Page ───────────────────────────────────────────────────────────
export default function PrintPage() {
  const params  = new URLSearchParams(window.location.search);
  const pool    = params.get('pool') || 'A';

  const [tournamentData, setTournamentData] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');

  // Fetch data from Firebase
  useEffect(() => {
    if (!hasConfig || !_db) {
      setError('Firebase tidak terkonfigurasi.');
      setLoading(false);
      return;
    }
    const auth = _auth;
    signInAnonymously(auth).catch(() => {});
    const docRef = doc(_db, 'artifacts', APP_ID, 'public', 'data', 'tournament', 'all_pools');
    const unsub = onSnapshot(docRef, snap => {
      if (snap.exists()) {
        setTournamentData(snap.data());
      } else {
        setError('Data turnamen tidak ditemukan.');
      }
      setLoading(false);
    }, () => {
      setError('Gagal memuat data dari Firebase.');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: '#64748b', fontWeight: 700 }}>
      Memuat data bagan...
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: '#ef4444', fontWeight: 700 }}>
      {error}
    </div>
  );

  const bracket = tournamentData?.pools?.[pool];
  if (!bracket || !bracket.matches) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: '#94a3b8', fontWeight: 700 }}>
      Bagan Pool {pool} belum tersedia.
    </div>
  );

  const { matches, totalRounds } = bracket;
  const isPool      = pool !== 'Final';
  const title       = tournamentData.title || 'TURNAMEN LAYANGAN';
  const organizer   = tournamentData.organizer || 'Panitia';
  const dateStr     = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Card height: compress based on number of matches in round 1
  const CARD_H  = 56;   // px per match card
  const GAP     = 8;    // gap between cards
  const COL_W   = 220;  // column width including connector

  // Calculate total height needed
  const r1Count = matches.filter(m => m.round === 1).length;
  const totalH  = r1Count * (CARD_H + GAP) + 80;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: 'white', minHeight: '100vh' }}>
      {/* ─── Top Bar ─── */}
      <div className="no-print" style={{
        background: '#1e293b',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div>
          <p style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
            Tampilan Cetak — {pool === 'Final' ? 'BAGAN FINAL' : `BAGAN POOL ${pool}`}
          </p>
          <p style={{ color: 'white', fontSize: '13px', fontWeight: 900, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a
            href={window.location.origin}
            style={{
              background: '#334155',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 12,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Kembali
          </a>
          <button
            onClick={() => window.print()}
            style={{
              background: '#2563eb',
              color: 'white',
              padding: '8px 20px',
              borderRadius: 8,
              fontWeight: 900,
              fontSize: 12,
              border: 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            🖨️ Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* ─── Print Header (visible only when printing) ─── */}
      <div className="print-only" style={{ display: 'none', padding: '0 0 10px', borderBottom: '2px solid #e2e8f0', marginBottom: 12, justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{title}</h1>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '2px 0 0' }}>Penyelenggara: {organizer}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            {pool === 'Final' ? 'BAGAN FINAL' : `BAGAN POOL ${pool}`}
          </h2>
          <small style={{ fontSize: 8, color: '#94a3b8', display: 'block', marginTop: 2 }}>Dicetak: {dateStr}</small>
        </div>
      </div>

      {/* ─── Bracket Scroll Container (screen) / Fit Container (print) ─── */}
      <div id="bracket-print-root" style={{ padding: '16px 24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, minWidth: 'max-content' }}>
          {Array.from({ length: totalRounds }, (_, roundIdx) => {
            const roundNum    = roundIdx + 1;
            const roundMatches = matches.filter(m => m.round === roundNum);
            const multiplier  = Math.pow(2, roundIdx);
            const cellH       = multiplier * (CARD_H + GAP * (multiplier - 1) + GAP);

            return (
              <div key={roundNum} style={{ display: 'flex', flexDirection: 'column', width: `${COL_W}px` }}>
                {/* Round label */}
                <div style={{
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '2px solid #e2e8f0',
                  marginBottom: 8,
                  paddingLeft: 8,
                  paddingRight: 8,
                }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                    {getRoundLabel(roundIdx, totalRounds, isPool)}
                  </span>
                </div>

                {/* Match cells */}
                {roundMatches.map(match => (
                  <div key={match.id} style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    height: `${cellH}px`,
                    paddingLeft: 8,
                    paddingRight: 0,
                  }}>
                    <PrintMatchCard match={match} />

                    {/* Connector lines to next round */}
                    {match.nextMatchId && (
                      <>
                        {/* Horizontal line from card to right */}
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: '50%',
                          width: 12,
                          height: 1.5,
                          background: '#cbd5e1',
                        }}/>
                        {/* Vertical line */}
                        <div style={{
                          position: 'absolute',
                          right: -1,
                          width: 1.5,
                          background: '#cbd5e1',
                          height: `${cellH / 2}px`,
                          top: match.nextMatchSlot === 1 ? '50%' : 'auto',
                          bottom: match.nextMatchSlot === 2 ? '50%' : 'auto',
                        }}/>
                        {/* Horizontal line from vertical to next column */}
                        {match.nextMatchSlot === 1 && (
                          <div style={{
                            position: 'absolute',
                            right: -1,
                            top: `calc(50% + ${cellH / 2}px)`,
                            width: 10,
                            height: 1.5,
                            background: '#cbd5e1',
                          }}/>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Winner card for pool (non-final) */}
          {isPool && (
            <div style={{ display: 'flex', flexDirection: 'column', width: '200px', paddingLeft: 20 }}>
              <div style={{ height: 32, display: 'flex', alignItems: 'center', borderBottom: '2px solid #f59e0b', marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  JUARA POOL {pool}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', height: `${CARD_H + GAP}px` }}>
                <div style={{
                  background: 'white',
                  border: '2px solid #fde68a',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  minWidth: 160,
                  boxShadow: '0 4px 12px rgba(245,158,11,0.15)',
                }}>
                  <span style={{ fontSize: 20 }}>🏆</span>
                  <div>
                    <p style={{ fontSize: 7, fontWeight: 900, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Winner</p>
                    <p style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', margin: '2px 0 0' }}>
                      {matches.find(m => m.round === totalRounds)?.winner || 'BELUM ADA'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Print CSS ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

        @page {
          size: A4 landscape;
          margin: 8mm;
        }

        @media print {
          .no-print { display: none !important; }
          .print-only { display: flex !important; }

          body { margin: 0 !important; padding: 0 !important; }

          #bracket-print-root {
            overflow: visible !important;
            padding: 0 !important;
          }

          /* Scale the bracket to fit A4 landscape */
          #bracket-print-root > div {
            transform-origin: top left;
            transform: scale(var(--print-scale, 1));
          }
        }
      `}</style>

      {/* ─── Auto-calculate scale on mount ─── */}
      <ScaleCalculator totalRounds={totalRounds} r1Count={r1Count} COL_W={COL_W} CARD_H={CARD_H} GAP={GAP} />
    </div>
  );
}

// Calculate and set --print-scale CSS variable
function ScaleCalculator({ totalRounds, r1Count, COL_W, CARD_H, GAP }) {
  useEffect(() => {
    const calcScale = () => {
      // A4 landscape usable area minus 8mm margins: ~281mm x 194mm
      // at 96dpi: ~1060px x 733px, minus header ~40px
      const PAGE_W = 1060;
      const PAGE_H = 693;

      const totalW = totalRounds * COL_W + 200 + 20; // columns + winner card
      const totalH = r1Count * (CARD_H + GAP) + 80;  // rows + header

      const scaleX = PAGE_W / totalW;
      const scaleY = PAGE_H / totalH;
      const scale  = Math.min(1, scaleX, scaleY);
      document.documentElement.style.setProperty('--print-scale', scale.toFixed(4));
    };
    calcScale();
  }, [totalRounds, r1Count, COL_W, CARD_H, GAP]);
  return null;
}
