import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// ─── Firebase Setup ────────────────────────────────────────────────────────────
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
const APP_ID = typeof __app_id !== 'undefined' ? __app_id
  : (import.meta.env.VITE_APP_ID || 'default-app-id');

// ─── Constants ─────────────────────────────────────────────────────────────────
const COL_W      = 168;  // px per round column
const SLOT_H_R1  = 46;   // px height per match slot in round 1
const CARD_W     = 148;  // match card width
const CONN_W     = 18;   // connector arm width (px)
const LABEL_H    = 36;   // column label height

// ─── Colors ────────────────────────────────────────────────────────────────────
const C = {
  win:      '#1d4ed8',
  winLight: '#dbeafe',
  lose:     '#fff',
  dis:      '#dc2626',
  border:   '#cbd5e1',
  label:    '#334155',
  conn:     '#94a3b8',
  name:     '#0f172a',
  tba:      '#94a3b8',
  matchLbl: '#1e293b',
};

// ─── Match Card ────────────────────────────────────────────────────────────────
function BracketCard({ match, side = 'left' }) {
  const slots = [
    { name: match.player1, dis: match.player1Disqualified },
    { name: match.player2, dis: match.player2Disqualified },
  ];
  return (
    <div style={{
      width: CARD_W,
      background: '#fff',
      border: `1.5px solid ${C.border}`,
      borderRadius: 6,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      flexShrink: 0,
    }}>
      {/* Match label */}
      <div style={{
        background: C.matchLbl,
        padding: '1px 5px',
      }}>
        <span style={{ color: '#fff', fontSize: 6.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'sans-serif' }}>
          {match.label || `Match ${match.id.replace('fm', 'F').replace('m', '')}`}
        </span>
      </div>
      {/* Players */}
      {slots.map((s, i) => {
        const isWin = match.winner && match.winner === s.name && s.name;
        const bg    = s.dis ? C.dis : isWin ? C.win : '#fff';
        const color = (isWin || s.dis) ? '#fff' : s.name ? C.name : C.tba;
        return (
          <div key={i} style={{
            padding: '4px 7px',
            background: bg,
            color,
            borderTop: i === 1 ? `1px solid ${C.border}` : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            minHeight: 20,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
              background: (isWin || s.dis) ? 'rgba(255,255,255,0.7)' : C.border,
            }}/>
            <span style={{
              fontSize: 9, fontWeight: 700, fontFamily: 'sans-serif',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontStyle: s.name ? 'normal' : 'italic',
              maxWidth: CARD_W - 28,
            }}>
              {s.name || 'TBA'}{s.dis ? ' ✗' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Round Label ───────────────────────────────────────────────────────────────
function getRoundLabel(roundIdx, totalR, isPool) {
  if (isPool) {
    const fromEnd = totalR - 1 - roundIdx;
    if (fromEnd === 0) return 'Final Pool';
    if (fromEnd === 1) return 'Semifinal';
    if (fromEnd === 2) return '8 Besar';
    if (fromEnd === 3) return '16 Besar';
    if (fromEnd === 4) return '32 Besar';
    if (fromEnd === 5) return '64 Besar';
    return `Babak ${roundIdx + 1}`;
  }
  const lbl3 = ['Perempat Final', 'Semifinal', 'Grand Final'];
  const lbl2 = ['Semifinal', 'Grand Final'];
  if (totalR === 3) return lbl3[roundIdx] || `Round ${roundIdx + 1}`;
  if (totalR === 2) return lbl2[roundIdx] || `Round ${roundIdx + 1}`;
  return `Round ${roundIdx + 1}`;
}

// ─── Single Column of matches (left direction = connectors go right) ────────────
function BracketColumn({ matches, roundIdx, totalR, isPool, side }) {
  const label      = getRoundLabel(roundIdx, totalR, isPool);
  const multiplier = Math.pow(2, roundIdx);
  const slotH      = SLOT_H_R1 * multiplier;

  return (
    <div style={{ width: COL_W, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Label */}
      <div style={{
        height: LABEL_H,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: side === 'right' ? 0 : 8,
        paddingRight: side === 'right' ? 8 : 0,
        justifyContent: side === 'right' ? 'flex-end' : 'flex-start',
        borderBottom: `2px solid ${C.border}`,
        marginBottom: 0,
      }}>
        <span style={{
          fontSize: 7.5, fontWeight: 900, color: C.label,
          textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'sans-serif',
        }}>
          {label}
        </span>
      </div>

      {/* Matches */}
      {matches.map(match => (
        <div key={match.id} style={{
          position: 'relative',
          height: slotH,
          display: 'flex',
          alignItems: 'center',
          // card on right for left-side columns, card on left for right-side columns
          justifyContent: side === 'right' ? 'flex-end' : 'flex-start',
          paddingLeft: side === 'left' ? CONN_W : 0,
          paddingRight: side === 'right' ? CONN_W : 0,
        }}>
          <BracketCard match={match} side={side} />

          {/* Connector lines */}
          {match.nextMatchId && (
            <>
              {side === 'left' ? (
                <>
                  {/* Horizontal arm right from card */}
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    width: CONN_W,
                    height: 1.5,
                    background: C.conn,
                  }}/>
                  {/* Vertical bar */}
                  <div style={{
                    position: 'absolute',
                    right: -1,
                    width: 1.5,
                    background: C.conn,
                    height: slotH / 2,
                    top: match.nextMatchSlot === 1 ? '50%' : 'auto',
                    bottom: match.nextMatchSlot === 2 ? '50%' : 'auto',
                  }}/>
                  {/* Horizontal cap at junction */}
                  {match.nextMatchSlot === 1 && (
                    <div style={{
                      position: 'absolute',
                      right: -1,
                      top: '100%',
                      width: CONN_W,
                      height: 1.5,
                      background: C.conn,
                    }}/>
                  )}
                </>
              ) : (
                <>
                  {/* Horizontal arm left from card */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    width: CONN_W,
                    height: 1.5,
                    background: C.conn,
                  }}/>
                  {/* Vertical bar */}
                  <div style={{
                    position: 'absolute',
                    left: -1,
                    width: 1.5,
                    background: C.conn,
                    height: slotH / 2,
                    top: match.nextMatchSlot === 1 ? '50%' : 'auto',
                    bottom: match.nextMatchSlot === 2 ? '50%' : 'auto',
                  }}/>
                  {/* Horizontal cap at junction */}
                  {match.nextMatchSlot === 1 && (
                    <div style={{
                      position: 'absolute',
                      left: -1,
                      top: '100%',
                      width: CONN_W,
                      height: 1.5,
                      background: C.conn,
                    }}/>
                  )}
                </>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Center Column (Grand Final / Final) ─────────────────────────────────────
function CenterColumn({ match, roundIdx, totalR, isPool, totalHeight }) {
  const label = getRoundLabel(roundIdx, totalR, isPool);
  const winner = match?.winner;

  return (
    <div style={{ width: COL_W + 20, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: LABEL_H, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `2px solid #f59e0b` }}>
        <span style={{ fontSize: 7.5, fontWeight: 900, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'sans-serif' }}>
          {label}
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {match ? (
          <div style={{
            background: '#fff',
            border: '2px solid #fde68a',
            borderRadius: 8,
            overflow: 'hidden',
            width: COL_W + 4,
            boxShadow: '0 2px 12px rgba(245,158,11,0.15)',
          }}>
            <div style={{ background: '#92400e', padding: '2px 8px', textAlign: 'center' }}>
              <span style={{ color: '#fef3c7', fontSize: 6.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'sans-serif' }}>
                {match.label || 'Grand Final'}
              </span>
            </div>
            {[{ name: match.player1, dis: match.player1Disqualified },
              { name: match.player2, dis: match.player2Disqualified }].map((s, i) => {
              const isWin = match.winner && match.winner === s.name && s.name;
              const bg    = s.dis ? C.dis : isWin ? '#d97706' : '#fff';
              const color = (isWin || s.dis) ? '#fff' : s.name ? C.name : C.tba;
              return (
                <div key={i} style={{
                  padding: '5px 9px', background: bg, color,
                  borderTop: i === 1 ? `1px solid #fde68a` : 'none',
                  display: 'flex', alignItems: 'center', gap: 6, minHeight: 22,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: (isWin||s.dis) ? 'rgba(255,255,255,0.7)' : '#fde68a', flexShrink: 0 }}/>
                  <span style={{ fontSize: 9.5, fontWeight: 900, fontFamily: 'sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name || 'TBA'}{s.dis ? ' ✗' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Winner trophy */}
        {winner && (
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: 8, padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
          }}>
            <span style={{ fontSize: 16 }}>🏆</span>
            <div>
              <p style={{ margin: 0, fontSize: 6.5, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'sans-serif' }}>JUARA</p>
              <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 900, color: '#fff', fontFamily: 'sans-serif' }}>{winner}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Print Page ───────────────────────────────────────────────────────────
export default function PrintPage() {
  const params = new URLSearchParams(window.location.search);
  const pool   = params.get('pool') || 'A';

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!hasConfig || !_db) { setError('Firebase tidak terkonfigurasi.'); setLoading(false); return; }
    signInAnonymously(_auth).catch(() => {});
    const ref = doc(_db, 'artifacts', APP_ID, 'public', 'data', 'tournament', 'all_pools');
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setData(snap.data());
      else setError('Data tidak ditemukan.');
      setLoading(false);
    }, () => { setError('Gagal memuat data Firebase.'); setLoading(false); });
    return () => unsub();
  }, []);

  // ── Loading / Error states ──────────────────────────────────────────────────
  const center = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', fontWeight: 700 };
  if (loading) return <div style={{ ...center, color: '#64748b' }}>Memuat data bagan…</div>;
  if (error)   return <div style={{ ...center, color: '#ef4444' }}>{error}</div>;

  const bracket = data?.pools?.[pool];
  if (!bracket?.matches) return (
    <div style={{ ...center, color: '#94a3b8' }}>Bagan Pool {pool} belum tersedia.</div>
  );

  const { matches, totalRounds } = bracket;
  const isPool    = pool !== 'Final';
  const title     = data.title     || 'TURNAMEN LAYANGAN';
  const organizer = data.organizer || 'Panitia';
  const dateStr   = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // ── Decide layout ────────────────────────────────────────────────────────────
  // Two-sided (mirrored) for >= 3 rounds (≥ 8 players)
  const isTwoSided = totalRounds >= 3;

  // Split matches of each round into top/bottom halves
  const getRoundHalf = (round, half) => {
    const rm  = matches.filter(m => m.round === round);
    const mid = Math.ceil(rm.length / 2);
    return half === 'top' ? rm.slice(0, mid) : rm.slice(mid);
  };

  // r1Count = number of round-1 matches on each side (for two-sided)
  const r1All   = matches.filter(m => m.round === 1);
  const r1Count = isTwoSided ? Math.ceil(r1All.length / 2) : r1All.length;

  // Total natural height of bracket
  const totalNaturalH = r1Count * SLOT_H_R1 + LABEL_H + 16;

  // Natural width:
  // Two-sided: (totalRounds-1) cols × 2 sides + 1 center col
  // Linear: totalRounds cols + winner col
  const sideRounds = isTwoSided ? totalRounds - 1 : totalRounds;
  const totalNaturalW = isTwoSided
    ? sideRounds * COL_W * 2 + (COL_W + 20)
    : totalRounds * COL_W + 200;

  // Scale to fit A4 landscape (297×210mm, 8mm margins → ~265mm×174mm usable → ~1001×657px at 96dpi)
  // We account for the print header (~55px)
  const PAGE_W = 1001;
  const PAGE_H = 602; // 657 - 55 header
  const scaleX = PAGE_W / totalNaturalW;
  const scaleY = PAGE_H / totalNaturalH;
  const printScale = Math.min(1, scaleX, scaleY);

  // ── Center / final match ─────────────────────────────────────────────────────
  const finalMatch = matches.find(m => m.round === totalRounds);

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh' }}>

      {/* ── Top toolbar (screen only) ── */}
      <div id="toolbar" style={{
        background: '#1e293b',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div>
          <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
            Tampilan Cetak — {pool === 'Final' ? 'BAGAN FINAL' : `BAGAN POOL ${pool}`}
          </p>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 900, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={window.location.origin} style={{
            background: '#334155', color: '#fff', padding: '8px 16px', borderRadius: 8,
            fontWeight: 700, fontSize: 12, textDecoration: 'none',
          }}>
            ← Kembali
          </a>
          <button
            onClick={() => window.print()}
            style={{
              background: '#2563eb', color: '#fff', padding: '8px 20px', borderRadius: 8,
              fontWeight: 900, fontSize: 12, border: 'none', cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}
          >
            🖨️ Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* ── Print area ── */}
      <div id="print-area" style={{ padding: 20, background: '#fff' }}>

        {/* Print header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 10,
          borderBottom: '2px solid #cbd5e1',
          marginBottom: 12,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Penyelenggara: {organizer}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {pool === 'Final' ? 'BAGAN FINAL' : `BAGAN POOL ${pool}`}
            </h2>
            <small style={{ fontSize: 8, color: '#94a3b8', display: 'block', marginTop: 2 }}>Dicetak: {dateStr}</small>
          </div>
        </div>

        {/* ── Bracket Wrapper (scaled for print) ── */}
        <div id="bracket-scale-root" style={{ transformOrigin: 'top left', transform: `scale(${printScale.toFixed(4)})`, width: totalNaturalW }}>

          {isTwoSided ? (
            /* ═══ TWO-SIDED LAYOUT ═══ */
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>

              {/* Left side: rounds 0 → totalRounds-2 */}
              {Array.from({ length: sideRounds }, (_, i) => (
                <BracketColumn
                  key={`left-${i}`}
                  matches={getRoundHalf(i + 1, 'top')}
                  roundIdx={i}
                  totalR={totalRounds}
                  isPool={isPool}
                  side="left"
                />
              ))}

              {/* Center: final round */}
              <CenterColumn
                match={finalMatch}
                roundIdx={totalRounds - 1}
                totalR={totalRounds}
                isPool={isPool}
                totalHeight={totalNaturalH}
              />

              {/* Right side: rounds totalRounds-2 → 0 (reversed, mirrored) */}
              {Array.from({ length: sideRounds }, (_, i) => {
                const roundIdx = sideRounds - 1 - i; // reversed
                return (
                  <BracketColumn
                    key={`right-${roundIdx}`}
                    matches={getRoundHalf(roundIdx + 1, 'bottom')}
                    roundIdx={roundIdx}
                    totalR={totalRounds}
                    isPool={isPool}
                    side="right"
                  />
                );
              })}
            </div>
          ) : (
            /* ═══ LINEAR LAYOUT (for small brackets) ═══ */
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {Array.from({ length: totalRounds }, (_, i) => (
                <BracketColumn
                  key={i}
                  matches={matches.filter(m => m.round === i + 1)}
                  roundIdx={i}
                  totalR={totalRounds}
                  isPool={isPool}
                  side="left"
                />
              ))}
              {/* Winner card for pools */}
              {isPool && (
                <div style={{ width: 180, paddingLeft: 20, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: LABEL_H, display: 'flex', alignItems: 'center', borderBottom: '2px solid #f59e0b' }}>
                    <span style={{ fontSize: 7.5, fontWeight: 900, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                      Juara Pool {pool}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: SLOT_H_R1 * 2 }}>
                    <div style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}>
                      <span style={{ fontSize: 16 }}>🏆</span>
                      <div>
                        <p style={{ margin: 0, fontSize: 6.5, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>JUARA</p>
                        <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 900, color: '#fff' }}>
                          {matches.find(m => m.round === totalRounds)?.winner || 'BELUM ADA'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Print CSS ── */}
      <style>{`
        @page { size: A4 landscape; margin: 8mm; }

        @media print {
          #toolbar { display: none !important; }

          body { margin: 0 !important; padding: 0 !important; background: white !important; }

          #print-area {
            padding: 0 !important;
          }

          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

          #bracket-scale-root {
            transform: scale(${printScale.toFixed(4)}) !important;
            transform-origin: top left !important;
          }
        }
      `}</style>
    </div>
  );
}
