import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// ─── Firebase Setup ──────────────────────────────────────────────────────────
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

// ─── Layout constants ────────────────────────────────────────────────────────
// A4 landscape @ 8mm margin = usable 281×194mm = ~1062×733px at 96dpi
// Subtract print header (≈55px): bracket gets ~678px height
const PRINT_W   = 1062;
const PRINT_H   = 678;
const COL_W     = 175;   // natural column width (before scaling)
const SLOT_H    = 80;    // natural slot height for round-1 match (before scaling)
const LABEL_H   = 38;    // column header height
const CONN_W    = 16;    // connector arm width
const CENTER_W  = COL_W + 28; // center final column width

// ─── Colors ──────────────────────────────────────────────────────────────────
const CLR = {
  win:    '#1d4ed8',
  dis:    '#dc2626',
  border: '#cbd5e1',
  conn:   '#94a3b8',
  label:  '#334155',
  hdr:    '#1e293b',
  name:   '#0f172a',
  tba:    '#94a3b8',
  gold:   '#d97706',
  goldLt: '#fef3c7',
};

// ─── Match Card ──────────────────────────────────────────────────────────────
function MatchCard({ match }) {
  const rows = [
    { name: match.player1, dis: match.player1Disqualified },
    { name: match.player2, dis: match.player2Disqualified },
  ];
  return (
    <div style={{ background:'#fff', border:`1.5px solid ${CLR.border}`, borderRadius:6, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.07)', width:'100%' }}>
      {/* Match ID strip */}
      <div style={{ background:CLR.hdr, padding:'1.5px 6px' }}>
        <span style={{ color:'#fff', fontSize:6.5, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.08em' }}>
          {match.label || `Match ${match.id.replace('fm','F').replace('m','')}`}
        </span>
      </div>
      {/* Player rows */}
      {rows.map((r, i) => {
        const isWin = match.winner && match.winner === r.name && r.name;
        const bg    = r.dis ? CLR.dis : isWin ? CLR.win : '#fff';
        const color = (isWin || r.dis) ? '#fff' : r.name ? CLR.name : CLR.tba;
        return (
          <div key={i} style={{ padding:'4px 7px', background:bg, color, borderTop: i ? `1px solid ${CLR.border}` : 'none', display:'flex', alignItems:'center', gap:5, minHeight:22 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:(isWin||r.dis)?'rgba(255,255,255,.6)':CLR.border, flexShrink:0 }}/>
            <span style={{ fontSize:9, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontStyle:r.name?'normal':'italic' }}>
              {r.name || 'TBA'}{r.dis ? ' ✗' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Round Label ─────────────────────────────────────────────────────────────
function roundLabel(idx, totalR, isPool) {
  if (isPool) {
    const d = totalR - 1 - idx;
    return d===0?'Final Pool': d===1?'Semifinal': d===2?'8 Besar': d===3?'16 Besar': d===4?'32 Besar': d===5?'64 Besar': `Babak ${idx+1}`;
  }
  if (totalR===2) return ['Semifinal','Grand Final'][idx]||`Round ${idx+1}`;
  if (totalR===3) return ['Perempat Final','Semifinal','Grand Final'][idx]||`Round ${idx+1}`;
  return `Round ${idx+1}`;
}

// ─── Bracket Column ───────────────────────────────────────────────────────────
function BracketColumn({ matches, roundIdx, totalR, isPool, side, slotH, colW }) {
  const mult  = Math.pow(2, roundIdx);
  const cellH = slotH * mult;
  const label = roundLabel(roundIdx, totalR, isPool);

  return (
    <div style={{ width:colW, flexShrink:0, display:'flex', flexDirection:'column' }}>
      {/* Column header */}
      <div style={{
        height: LABEL_H,
        display:'flex', alignItems:'center',
        paddingLeft: side==='right' ? 0 : 8,
        paddingRight: side==='right' ? 8 : 0,
        justifyContent: side==='right' ? 'flex-end' : 'flex-start',
        borderBottom:`2px solid ${CLR.border}`,
      }}>
        <span style={{ fontSize:7, fontWeight:900, color:CLR.label, textTransform:'uppercase', letterSpacing:'0.12em' }}>
          {label}
        </span>
      </div>

      {/* Match slots */}
      {matches.map(match => (
        <div key={match.id} style={{
          position:'relative',
          height: cellH,
          display:'flex',
          alignItems:'center',
          paddingLeft:  side==='right' ? 0 : CONN_W,
          paddingRight: side==='right' ? CONN_W : 0,
          justifyContent: side==='right' ? 'flex-end' : 'flex-start',
          boxSizing:'border-box',
        }}>
          <div style={{ flex:1, maxWidth: colW - CONN_W - 2 }}>
            <MatchCard match={match} />
          </div>

          {/* Connector lines */}
          {match.nextMatchId && (
            side === 'left' ? (
              <>
                {/* → horizontal arm right */}
                <div style={{ position:'absolute', right:0, top:'50%', width:CONN_W, height:1.5, background:CLR.conn }}/>
                {/* | vertical bridge */}
                <div style={{
                  position:'absolute', right:-1, width:1.5, background:CLR.conn,
                  height: cellH/2,
                  top:    match.nextMatchSlot===1 ? '50%' : 'auto',
                  bottom: match.nextMatchSlot===2 ? '50%' : 'auto',
                }}/>
                {/* → cap at junction end */}
                {match.nextMatchSlot===1 && (
                  <div style={{ position:'absolute', right:-1, top:'100%', width:CONN_W, height:1.5, background:CLR.conn }}/>
                )}
              </>
            ) : (
              <>
                {/* ← horizontal arm left */}
                <div style={{ position:'absolute', left:0, top:'50%', width:CONN_W, height:1.5, background:CLR.conn }}/>
                {/* | vertical bridge */}
                <div style={{
                  position:'absolute', left:-1, width:1.5, background:CLR.conn,
                  height: cellH/2,
                  top:    match.nextMatchSlot===1 ? '50%' : 'auto',
                  bottom: match.nextMatchSlot===2 ? '50%' : 'auto',
                }}/>
                {/* ← cap at junction end */}
                {match.nextMatchSlot===1 && (
                  <div style={{ position:'absolute', left:-1, top:'100%', width:CONN_W, height:1.5, background:CLR.conn }}/>
                )}
              </>
            )
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Center Final Column ──────────────────────────────────────────────────────
function FinalColumn({ match, roundIdx, totalR, isPool, bracketH, centerW }) {
  const label  = roundLabel(roundIdx, totalR, isPool);
  const winner = match?.winner;

  return (
    <div style={{ width:centerW, flexShrink:0, display:'flex', flexDirection:'column', height: bracketH }}>
      <div style={{ height:LABEL_H, display:'flex', alignItems:'center', justifyContent:'center', borderBottom:`2px solid #f59e0b` }}>
        <span style={{ fontSize:7, fontWeight:900, color:'#92400e', textTransform:'uppercase', letterSpacing:'0.12em' }}>
          {label}
        </span>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, paddingTop:16 }}>
        {/* Final match card */}
        {match && (
          <div style={{ background:'#fff', border:'2px solid #fde68a', borderRadius:8, overflow:'hidden', width:centerW-8, boxShadow:'0 2px 12px rgba(245,158,11,.18)' }}>
            <div style={{ background:'#92400e', padding:'2px 8px', textAlign:'center' }}>
              <span style={{ color:CLR.goldLt, fontSize:6.5, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                {match.label || 'Grand Final'}
              </span>
            </div>
            {[{ name:match.player1, dis:match.player1Disqualified },
              { name:match.player2, dis:match.player2Disqualified }].map((r, i) => {
              const isWin = match.winner && match.winner === r.name && r.name;
              const bg    = r.dis ? CLR.dis : isWin ? CLR.gold : '#fff';
              const color = (isWin||r.dis) ? '#fff' : r.name ? CLR.name : CLR.tba;
              return (
                <div key={i} style={{ padding:'5px 10px', background:bg, color, borderTop: i ? '1px solid #fde68a' : 'none', display:'flex', alignItems:'center', gap:6, minHeight:24 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:(isWin||r.dis)?'rgba(255,255,255,.7)':'#fde68a', flexShrink:0 }}/>
                  <span style={{ fontSize:9.5, fontWeight:900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.name || 'TBA'}{r.dis ? ' ✗' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {/* Winner trophy */}
        {winner && (
          <div style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius:8, padding:'8px 14px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 14px rgba(245,158,11,.3)', marginTop:4 }}>
            <span style={{ fontSize:18 }}>🏆</span>
            <div>
              <p style={{ margin:0, fontSize:6.5, fontWeight:900, color:'#fff', textTransform:'uppercase', letterSpacing:'0.1em' }}>JUARA</p>
              <p style={{ margin:'2px 0 0', fontSize:10, fontWeight:900, color:'#fff' }}>{winner}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PrintPage() {
  const params = new URLSearchParams(window.location.search);
  const pool   = params.get('pool') || 'A';

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!hasConfig || !_db) { setError('Firebase tidak terkonfigurasi.'); setLoading(false); return; }
    signInAnonymously(_auth).catch(() => {});
    const ref  = doc(_db, 'artifacts', APP_ID, 'public', 'data', 'tournament', 'all_pools');
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setData(snap.data());
      else setError('Data tidak ditemukan.');
      setLoading(false);
    }, () => { setError('Gagal memuat data Firebase.'); setLoading(false); });
    return () => unsub();
  }, []);

  const center = { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontWeight:700 };
  if (loading) return <div style={{ ...center, color:'#64748b' }}>Memuat data bagan…</div>;
  if (error)   return <div style={{ ...center, color:'#ef4444' }}>{error}</div>;

  const bracket = data?.pools?.[pool];
  if (!bracket?.matches) return (
    <div style={{ ...center, color:'#94a3b8' }}>Bagan Pool {pool} belum tersedia.</div>
  );

  const { matches, totalRounds } = bracket;
  const isPool      = pool !== 'Final';
  const title       = data.title     || 'TURNAMEN LAYANGAN';
  const organizer   = data.organizer || 'Panitia';
  const dateStr     = new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });

  // ── Layout decision ──────────────────────────────────────────────────────
  const isTwoSided = totalRounds >= 3;
  const sideRounds = isTwoSided ? totalRounds - 1 : 0;

  // Split round matches into top/bottom halves
  const getHalf = (round, half) => {
    const rm  = matches.filter(m => m.round === round);
    const mid = Math.ceil(rm.length / 2);
    return half === 'top' ? rm.slice(0, mid) : rm.slice(mid);
  };

  // Number of match slots in left column (= round-1 top half count)
  const r1Count = isTwoSided
    ? Math.ceil(matches.filter(m => m.round === 1).length / 2)
    : matches.filter(m => m.round === 1).length;

  // ── Calculate scale so bracket fits A4 landscape ─────────────────────────
  // Natural dimensions (at full COL_W / SLOT_H constants)
  const naturalW = isTwoSided
    ? sideRounds * COL_W * 2 + CENTER_W
    : totalRounds * COL_W + 200;

  const baseNaturalH = r1Count * SLOT_H + LABEL_H + 16;

  // Scale to fit print area — allow scale up to 1.25x
  const scaleX    = PRINT_W / naturalW;
  const scaleY    = PRINT_H / baseNaturalH;
  const scale     = Math.min(1.25, scaleX, scaleY);

  // Dynamic slot height
  let slotH = SLOT_H;
  if (scaleX < scaleY || scale === 1.25) {
    slotH = Math.min(180, Math.max(SLOT_H, (PRINT_H / scale - LABEL_H - 16) / r1Count));
  }

  const naturalH = r1Count * slotH + LABEL_H + 16;

  // Scaled outer-wrapper dimensions — this is what the page layout "sees"
  // Using these for the wrapper forces the browser to allocate exactly this much space,
  // preventing extra pages when printing.
  const scaledW = Math.ceil(naturalW * scale);
  const scaledH = Math.ceil(naturalH * scale);

  // ── Helpers for actual rendered sizes ────────────────────────────────────
  const colW   = COL_W;    // column width at natural scale
  const ctrW   = CENTER_W; // center column width

  const finalMatch = matches.find(m => m.round === totalRounds);

  // ── Bracket rows content ─────────────────────────────────────────────────
  const leftCols = isTwoSided
    ? Array.from({ length: sideRounds }, (_, i) => ({
        roundIdx: i,
        matches: getHalf(i + 1, 'top'),
        side: 'left',
      }))
    : Array.from({ length: totalRounds }, (_, i) => ({
        roundIdx: i,
        matches: matches.filter(m => m.round === i + 1),
        side: 'left',
      }));

  const rightCols = isTwoSided
    ? Array.from({ length: sideRounds }, (_, i) => ({
        roundIdx: sideRounds - 1 - i, // reversed: from center outward
        matches: getHalf(sideRounds - i, 'bottom'),
        side: 'right',
      }))
    : [];

  return (
    <div style={{ background:'#f8fafc', minHeight:'100vh' }}>

      {/* ── Toolbar (screen only, hidden on print) ── */}
      <div id="toolbar" style={{
        background:CLR.hdr, padding:'10px 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:100,
      }}>
        <div>
          <p style={{ color:'#94a3b8', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', margin:0 }}>
            Tampilan Cetak — {pool === 'Final' ? 'BAGAN FINAL' : `BAGAN POOL ${pool}`}
          </p>
          <p style={{ color:'#fff', fontSize:13, fontWeight:900, margin:'2px 0 0', textTransform:'uppercase' }}>
            {title}
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href={window.location.origin} style={{ background:'#334155', color:'#fff', padding:'8px 16px', borderRadius:8, fontWeight:700, fontSize:12, textDecoration:'none' }}>
            ← Kembali
          </a>
          <button
            onClick={() => window.print()}
            style={{ background:'#2563eb', color:'#fff', padding:'8px 20px', borderRadius:8, fontWeight:900, fontSize:12, border:'none', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.08em' }}
          >
            🖨️ Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* ── Print area ── */}
      <div id="print-area" style={{ padding:'20px 20px 0', background:'#fff' }}>

        {/* Print header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:10, borderBottom:`2px solid ${CLR.border}`, marginBottom:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:18, fontWeight:900, color:CLR.hdr, textTransform:'uppercase', letterSpacing:'0.08em' }}>{title}</h1>
            <p style={{ margin:'2px 0 0', fontSize:9, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.12em' }}>
              Penyelenggara: {organizer}
            </p>
          </div>
          <div style={{ textAlign:'right' }}>
            <h2 style={{ margin:0, fontSize:15, fontWeight:900, color:'#2563eb', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              {pool === 'Final' ? 'BAGAN FINAL' : `BAGAN POOL ${pool}`}
            </h2>
            <small style={{ fontSize:8, color:'#94a3b8', display:'block', marginTop:2 }}>Dicetak: {dateStr}</small>
          </div>
        </div>

        {/*
          ── KEY FIX: Outer wrapper is sized to SCALED dimensions.
             Browser allocates exactly this space → no extra blank pages.
             Inner div is rendered at NATURAL size, then scale() shrinks it visually.
        */}
        <div style={{
          width: scaledW,
          height: PRINT_H,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: Math.max(0, (PRINT_H - scaledH) / 2),
            left: 0,
            width: naturalW,
            transformOrigin: 'top left',
            transform: `scale(${scale.toFixed(6)})`,
          }}>

            {isTwoSided ? (
              /* ═══ TWO-SIDED LAYOUT ═══ */
              <div style={{ display:'flex', alignItems:'flex-start' }}>

                {/* Left side columns: R1 → R(totalR-1) */}
                {leftCols.map(({ roundIdx, matches: m, side }) => (
                  <BracketColumn key={`L${roundIdx}`}
                    matches={m} roundIdx={roundIdx}
                    totalR={totalRounds} isPool={isPool}
                    side={side} slotH={slotH} colW={colW}
                  />
                ))}

                {/* Center: final match */}
                <FinalColumn
                  match={finalMatch}
                  roundIdx={totalRounds - 1}
                  totalR={totalRounds}
                  isPool={isPool}
                  bracketH={naturalH}
                  centerW={ctrW}
                />

                {/* Right side columns: R(totalR-1) → R1 */}
                {rightCols.map(({ roundIdx, matches: m, side }) => (
                  <BracketColumn key={`R${roundIdx}`}
                    matches={m} roundIdx={roundIdx}
                    totalR={totalRounds} isPool={isPool}
                    side={side} slotH={slotH} colW={colW}
                  />
                ))}
              </div>
            ) : (
              /* ═══ LINEAR LAYOUT ═══ */
              <div style={{ display:'flex', alignItems:'flex-start' }}>
                {leftCols.map(({ roundIdx, matches: m, side }) => (
                  <BracketColumn key={roundIdx}
                    matches={m} roundIdx={roundIdx}
                    totalR={totalRounds} isPool={isPool}
                    side={side} slotH={slotH} colW={colW}
                  />
                ))}
                {/* Pool winner */}
                {isPool && (
                  <div style={{ width:180, paddingLeft:20 }}>
                    <div style={{ height:LABEL_H, display:'flex', alignItems:'center', borderBottom:'2px solid #f59e0b' }}>
                      <span style={{ fontSize:7, fontWeight:900, color:'#92400e', textTransform:'uppercase', letterSpacing:'0.12em' }}>
                        Juara Pool {pool}
                      </span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', height: slotH * 2 }}>
                      <div style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius:8, padding:'8px 14px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 14px rgba(245,158,11,.3)' }}>
                        <span style={{ fontSize:16 }}>🏆</span>
                        <div>
                          <p style={{ margin:0, fontSize:6.5, fontWeight:900, color:'#fff', textTransform:'uppercase' }}>JUARA</p>
                          <p style={{ margin:'2px 0 0', fontSize:10, fontWeight:900, color:'#fff' }}>
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
      </div>

      {/* ── Print CSS ── */}
      <style>{`
        @page { size: A4 landscape; margin: 8mm; }

        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }

          /* Hide toolbar */
          #toolbar { display: none !important; }

          /* Remove screen padding */
          #print-area { padding: 0 !important; }

          /* Prevent page breaks inside bracket */
          #print-area > div:last-child {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
