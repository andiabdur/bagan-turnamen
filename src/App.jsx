import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Users, 
  Trophy, 
  RefreshCw, 
  LogOut, 
  Check, 
  AlertCircle, 
  LayoutGrid, 
  UserPlus, 
  Settings,
  X,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Search,
  Shuffle,
  Play,
  Pause,
  Square,
  Clock,
  Flag,
  Megaphone,
  Archive,
  Trash2,
  Crown,
  Medal,
  Award,
  Printer
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc,
  collection,
  deleteDoc
} from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import MatchCard from './components/MatchCard';
import SetupWizard from './components/SetupWizard';

// Helper for tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Firebase Configuration Helper
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined') {
    try {
      return JSON.parse(__firebase_config);
    } catch (e) {
      console.error("Failed to parse __firebase_config", e);
    }
  }
  
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
};

const firebaseConfig = getFirebaseConfig();
const hasConfig = firebaseConfig && firebaseConfig.apiKey;

// Initialize Firebase only if config exists
let app, auth, db;
if (hasConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed", error);
  }
}

const appId = typeof __app_id !== 'undefined' ? __app_id : (import.meta.env.VITE_APP_ID || 'default-app-id');

export default function App() {
  // 1. ALL HOOKS AT TOP LEVEL
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(() => localStorage.getItem('tournament_role'));
  const [tournamentData, setTournamentData] = useState({ pools: {} });
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activePool, setActivePool] = useState('A');
  const [bracketSize, setBracketSize] = useState('32'); // '16', '32', '64', 'auto'
  const [finalFormat, setFinalFormat] = useState('roundrobin'); // 'roundrobin', 'bracket'
  const [bulkInput, setBulkInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null); // { matchId, playerSlot, currentName }
  const [bracketZoom, setBracketZoom] = useState(1);
  // Ref to persist pinch state across synthetic event calls
  const pinchRef = useRef({ active: false, startDist: 0, startZoom: 1 });
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResult, setSearchResult] = useState(null); // { matchId, slot }
  const [showGlobalSetup, setShowGlobalSetup] = useState(false);
  const [tournamentTitle, setTournamentTitle] = useState('Turnamen Layangan Kabupaten Majalengka');
  const [tournamentOrganizer, setTournamentOrganizer] = useState('Majalengka');
  const [winnerConfirm, setWinnerConfirm] = useState(null); // { matchId, winnerName, isFinal }
  const [doubleLife, setDoubleLife] = useState(false);
  const [prelimPointsSystem, setPrelimPointsSystem] = useState(false);
  const [isOpenTournament, setIsOpenTournament] = useState(false);
  const [logoBase64, setLogoBase64] = useState('');
  const [archivesList, setArchivesList] = useState([]);
  const matchRefs = useRef({});
  const searchInputRef = useRef(null);
  const [viewingArchive, setViewingArchive] = useState(null);
  const [showArchiveManagement, setShowArchiveManagement] = useState(false);

  const currentTournament = viewingArchive || tournamentData;

  const poolsList = [
    ...Object.keys(currentTournament.pools || {})
      .filter(p => p !== 'Final')
      .sort((a, b) => a.localeCompare(b)), 
    'Final'
  ];
  const activeBracket = currentTournament.pools?.[activePool];

  // Auto-derive final participants from pool winners
  const finalParticipants = Object.keys(currentTournament.pools || {})
    .filter(p => p !== 'Final')
    .sort()
    .map(poolId => ({
      pool: poolId,
      name: currentTournament.pools[poolId].matches?.find(m => m.round === currentTournament.pools[poolId].totalRounds)?.winner || null
    }));
  const allFinalistsReady = finalParticipants.every(p => p.name);

  // 2. EFFECTS
  useEffect(() => {
    if (!hasConfig || !auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        showError("Gagal otentikasi: " + error.message);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
    const unsub = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setTournamentData(data);
          if (data.title) setTournamentTitle(data.title);
          if (data.organizer) setTournamentOrganizer(data.organizer);
          if (data.doubleLife !== undefined) setDoubleLife(data.doubleLife);
          if (data.prelimPointsSystem !== undefined) setPrelimPointsSystem(data.prelimPointsSystem);
          if (data.isOpenTournament !== undefined) setIsOpenTournament(data.isOpenTournament);
          if (data.finalFormat !== undefined) setFinalFormat(data.finalFormat);
        } else {
          setTournamentData({ pools: {} });
        }
        setLoadingData(false);
      }, (err) => {
        showError("Gagal memuat data turnamen.");
        setLoadingData(false);
      }
    );

    const archivesCol = collection(db, 'artifacts', appId, 'public', 'data', 'tournament', 'archive_hub', 'items');
    const unsubArchives = onSnapshot(archivesCol, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push(doc.data());
      });
      list.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
      setArchivesList(list);
    }, (err) => {
      console.error("Gagal memuat riwayat arsip:", err);
    });

    return () => {
      unsub();
      unsubArchives();
    };
  }, [user]);

  // 2.5 REUSABLE BRACKET RENDERER
  const renderBracket = () => {
    if (!activeBracket || !activeBracket.matches) return null;
    
    return (
      <div
        id="bracket-root-container"
        className="overflow-auto no-scrollbar bracket-print-container"
        style={{ touchAction: 'pan-x pan-y' }}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            pinchRef.current = {
              active: true,
              startDist: Math.hypot(dx, dy),
              startZoom: bracketZoom,
            };
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && pinchRef.current.active) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const { startDist, startZoom } = pinchRef.current;
            if (startDist === 0) return;
            const next = Math.min(2, Math.max(0.4,
              parseFloat((startZoom * (dist / startDist)).toFixed(2))
            ));
            setBracketZoom(next);
          }
        }}
        onTouchEnd={() => { pinchRef.current.active = false; }}
      >
        {/* Print-Only Header */}
        <div className="hidden print:block mb-8 border-b-2 border-slate-300 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">{tournamentTitle || 'TURNAMEN LAYANGAN'}</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Penyelenggara: {tournamentOrganizer || 'Panitia'}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black text-brand-600 uppercase tracking-widest">
                {activePool === 'Final' ? 'BAGAN FINAL' : `BAGAN POOL ${activePool}`}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-16 min-w-max pb-40 bracket-tree-wrapper" style={{ transform: `scale(${bracketZoom})`, transformOrigin: 'top left', transition: 'transform 0.15s ease' }}>
          {(() => {
            const totalR = activeBracket.totalRounds;
            
            // Generate labels once
            let roundLabels = [];
            if (activePool === 'Final') {
              if (activeBracket.type === 'double') {
                roundLabels = ["Semifinal", "Final & Juara 3"];
              } else if (totalR === 2) {
                roundLabels = ["Semifinal", "Grand Final"];
              } else if (totalR === 3) {
                roundLabels = ["Perempat Final", "Semifinal", "Grand Final"];
              } else {
                roundLabels = Array.from({length: totalR || 2}, (_, i) => `Round ${i+1}`);
              }
            } else {
              const tr = totalR || 5;
              roundLabels = Array.from({ length: tr }, (_, i) => {
                const roundsFromEnd = tr - 1 - i;
                if (roundsFromEnd === 0) return "Final Pool";
                if (roundsFromEnd === 1) return "Semifinal";
                if (roundsFromEnd === 2) return "8 Besar";
                if (roundsFromEnd === 3) return "16 Besar";
                if (roundsFromEnd === 4) return "32 Besar";
                if (roundsFromEnd === 5) return "64 Besar";
                if (roundsFromEnd === 6) return "128 Besar";
                return `Babak ${i + 1}`;
              });
            }

            const isTwoSided = false; // two-sided layout disabled — keep normal left-to-right for all views

            const renderColumn = (idx, side) => {
              const roundNum = idx + 1;
              const allMatches = activeBracket.matches.filter(m => m.round === roundNum);
              
              let matches = allMatches;
              if (isTwoSided && roundNum < totalR) {
                 const mid = Math.ceil(allMatches.length / 2);
                 matches = side === 'left' ? allMatches.slice(0, mid) : allMatches.slice(mid);
              }

              const multiplier = Math.pow(2, idx);
              return (
                <div key={`${side}-${roundNum}`} className="flex flex-col" style={{ width: '280px' }}>
                  <div className="h-12 flex items-center border-b-2 border-slate-200 mb-10 mx-4 print:mb-2 print:h-8">
                     <span className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">{roundLabels[idx] || `Round ${roundNum}`}</span>
                  </div>
                  <div className="flex flex-col">
                    {matches.map(match => (
                      <div key={match.id} className="relative flex items-center px-4" style={{ height: `calc(var(--base-match-height, 180px) * ${multiplier})` }}>
                        <MatchCard
                          match={match}
                          role={role}
                          onSetWinner={activePool === 'Final' ? setFinalWinner : setWinner}
                          onSetMatchState={setMatchState}
                          onEditName={(slot, name) => setEditingPlayer({matchId: match.id, playerSlot: slot, currentName: name})}
                          matchRef={el => { matchRefs.current[match.id] = el; }}
                          highlightedSlot={searchResult?.matchId === match.id ? searchResult.slot : null}
                          prelimPointsSystem={tournamentData.prelimPointsSystem}
                        />
                        {match.nextMatchId && (side === 'left' || side === 'center') && (
                          <>
                            <div className="absolute right-0 top-1/2 w-4 h-0.5 bg-slate-200"></div>
                            <div className="absolute -right-4 w-0.5 bg-slate-200" style={{ height: `calc((var(--base-match-height, 180px) * ${multiplier}) / 2)`, top: match.nextMatchSlot === 1 ? '50%' : 'auto', bottom: match.nextMatchSlot === 2 ? '50%' : 'auto' }}></div>
                            {match.nextMatchSlot === 1 && <div className="absolute -right-8 top-[100%] w-4 h-0.5 bg-slate-200"></div>}
                          </>
                        )}
                        {match.nextMatchId && side === 'right' && (
                          <>
                            <div className="absolute left-0 top-1/2 w-4 h-0.5 bg-slate-200"></div>
                            <div className="absolute -left-4 w-0.5 bg-slate-200" style={{ height: `calc((var(--base-match-height, 180px) * ${multiplier}) / 2)`, top: match.nextMatchSlot === 1 ? '50%' : 'auto', bottom: match.nextMatchSlot === 2 ? '50%' : 'auto' }}></div>
                            {match.nextMatchSlot === 1 && <div className="absolute -left-8 top-[100%] w-4 h-0.5 bg-slate-200"></div>}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            };

            if (!isTwoSided) {
              return (
                <div className="flex items-start gap-0">
                  {Array.from({ length: totalR }).map((_, idx) => renderColumn(idx, 'left'))}
                </div>
              );
            }

            return (
              <div className="flex items-center gap-0">
                <div className="flex items-start gap-0">
                  {Array.from({ length: totalR - 1 }).map((_, idx) => renderColumn(idx, 'left'))}
                </div>
                <div className="flex items-start gap-0">
                  {renderColumn(totalR - 1, 'center')}
                </div>
                <div className="flex items-start gap-0 flex-row-reverse">
                  {Array.from({ length: totalR - 1 }).map((_, idx) => renderColumn(idx, 'right'))}
                </div>
              </div>
            );
          })()}  {activePool !== 'Final' && (
            <div className="flex flex-col ml-12">
               <div className="h-12 flex items-center border-b-2 border-yellow-500 mb-10 mx-4">
                  <span className="text-[11px] font-black text-yellow-600 uppercase tracking-[0.2em]">JUARA POOL {activePool}</span>
               </div>
               <div className="flex items-center" style={{ height: '180px' }}>
                  <div className="relative group ml-4">
                    <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-1000 animate-pulse"></div>
                    <div className="relative bg-white border-2 border-yellow-200 rounded-3xl p-8 shadow-2xl flex items-center gap-6 min-w-[280px]">
                      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-2xl text-white shadow-lg shadow-yellow-100"><Trophy size={32} className="drop-shadow-md"/></div>
                      <div>
                        <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">Winner</p>
                        <p className="text-xl font-black text-slate-800 tracking-tight">{activeBracket.matches.find(m => m.round === activeBracket.totalRounds)?.winner || 'BELUM ADA'}</p>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 3. HANDLERS
  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const handleLoginReferee = (e) => {
    e.preventDefault();
    if (e.target.pin.value === 'majalengkawani2026' || e.target.pin.value === 'Indo1234!') {
      setRole('referee');
      localStorage.setItem('tournament_role', 'referee');
      setIsMenuOpen(false);
    } else {
      showError('Password Wasit salah!');
    }
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem('tournament_role');
    setIsMenuOpen(false);
  };

  const handlePrintPDF = () => {
    if (!activeBracket) return;

    const poolName = activePool === 'Final' ? 'FINAL' : `POOL ${activePool}`;

    // Get the bracket wrapper DOM element
    const bracketEl = document.querySelector('.bracket-tree-wrapper');
    if (!bracketEl) return;

    // Temporarily reset transform to measure real natural size
    const prevTransform = bracketEl.style.transform;
    bracketEl.style.transform = 'scale(1)';
    const rect = bracketEl.getBoundingClientRect();
    const naturalW = rect.width;
    const naturalH = rect.height;
    bracketEl.style.transform = prevTransform;

    // A4 landscape usable px area (297mm x 210mm, 6mm margin each side @ 96dpi)
    // 1mm = 3.7795px at 96dpi
    const PX_PER_MM = 3.7795;
    const MARGIN_MM = 6;
    const PAGE_W_PX = Math.floor((297 - MARGIN_MM * 2) * PX_PER_MM); // ~1059px
    const PAGE_H_PX = Math.floor((210 - MARGIN_MM * 2) * PX_PER_MM) - 60; // ~722px minus header

    const scaleX = PAGE_W_PX / naturalW;
    const scaleY = PAGE_H_PX / naturalH;
    const scale = Math.min(1, scaleX, scaleY);

    // Clone just the bracket content HTML
    const bracketHTML = bracketEl.outerHTML;

    // Grab all existing stylesheets from current page
    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => `<link rel="stylesheet" href="${l.href}">`)
      .join('\n');
    const inlineStyles = Array.from(document.querySelectorAll('style'))
      .map(s => `<style>${s.innerHTML}</style>`)
      .join('\n');

    const dateStr = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    const printHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bagan ${poolName} - ${tournamentTitle || 'Turnamen Layangan'}</title>
  ${styleLinks}
  ${inlineStyles}
  <style>
    @page { size: A4 landscape; margin: 6mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: white; font-family: 'Inter', sans-serif; }
    
    /* Header */
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 2px solid #cbd5e1;
      margin-bottom: 10px;
    }
    .print-header h1 { font-size: 18px; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 0.1em; margin: 0; }
    .print-header p { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; margin: 2px 0 0; }
    .print-header h2 { font-size: 15px; font-weight: 900; color: #2563eb; text-transform: uppercase; letter-spacing: 0.1em; margin: 0; text-align: right; }
    .print-header small { font-size: 8px; color: #94a3b8; display: block; text-align: right; margin-top: 2px; }

    /* Bracket scaled to fit */
    .bracket-scale-wrapper {
      transform-origin: top left;
      transform: scale(${scale.toFixed(4)});
      width: ${naturalW}px;
    }

    /* Restore bracket styles that might be stripped */
    .bracket-tree-wrapper {
      transform: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .no-scrollbar { overflow: visible !important; }
  </style>
</head>
<body>
  <div class="print-header">
    <div>
      <h1>${tournamentTitle || 'TURNAMEN LAYANGAN'}</h1>
      <p>Penyelenggara: ${tournamentOrganizer || 'Panitia'}</p>
    </div>
    <div>
      <h2>BAGAN ${poolName}</h2>
      <small>Dicetak: ${dateStr}</small>
    </div>
  </div>
  <div class="bracket-scale-wrapper">
    ${bracketHTML}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); window.close(); }, 500);
    };
  <\/script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
    }
  };


  const generateGlobalBracket = async () => {
    let rawNames = bulkInput.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (rawNames.length === 0) return showError("Daftar nama tidak boleh kosong.");
    
    // 1. Determine Capacity & Pool Count
    let capacity = parseInt(bracketSize);
    if (bracketSize === 'auto') {
      if (rawNames.length <= 16) capacity = 16;
      else if (rawNames.length <= 32) capacity = 32;
      else if (rawNames.length <= 64) capacity = 64;
      else capacity = 32; // Default back to split 32 for large tournaments
    }

    const numPools = Math.max(1, Math.ceil(rawNames.length / capacity));
    const totalSlots = numPools * capacity;
    const poolIds = Array.from({ length: numPools }, (_, i) => String.fromCharCode(65 + i)); // A, B, C...

    // Fill with BYEs if needed
    let counter = 1;
    const fullNames = [...rawNames];
    while (fullNames.length < totalSlots) fullNames.push(`BYE_${counter++}`);

    // 2. Identifikasi Tim & Daerah berdasarkan Mode Turnamen
    const players = fullNames.map((raw, idx) => {
      if (raw.startsWith('BYE_')) {
        return { team: 'BYE', region: 'BYE', name: raw, isBye: true };
      }
      
      if (isOpenTournament) {
        // Open tournament mode: parse [Daerah-Tim] Nama Peserta
        const match = raw.match(/^\[(.*?)-(.*?)\]\s*(.*)$/);
        if (match) {
          return { 
            region: match[1].trim().toLowerCase(), 
            team: match[2].trim().toLowerCase(), 
            name: raw, 
            isBye: false 
          };
        }
        
        // Fallback if missing dash: e.g. [Majalengka] Andi
        const fallbackMatch = raw.match(/^\[(.*?)\]\s*(.*)$/);
        if (fallbackMatch) {
          return { 
            region: fallbackMatch[1].trim().toLowerCase(), 
            team: `SOLO_${idx}`, 
            name: raw, 
            isBye: false 
          };
        }
        
        // Fully solo
        return { region: `SOLO_REG_${idx}`, team: `SOLO_${idx}`, name: raw, isBye: false };
      } else {
        // Normal tournament mode: parse [Tim] Nama Peserta
        const match = raw.match(/^\[(.*?)\]\s*(.*)$/);
        if (match) {
          return { 
            region: 'NONE', 
            team: match[1].trim().toLowerCase(), 
            name: raw, 
            isBye: false 
          };
        }
        return { region: 'NONE', team: `SOLO_${idx}`, name: raw, isBye: false };
      }
    });

    const playerInfoMap = {};
    players.forEach(p => {
      playerInfoMap[p.name] = p;
    });

    // 3. Kelompokkan berdasarkan tim untuk menentukan urutan distribusi
    const teamGroups = {};
    players.forEach(p => {
      if (!teamGroups[p.team]) teamGroups[p.team] = [];
      teamGroups[p.team].push(p.name);
    });

    const sortedTeams = Object.keys(teamGroups)
      .filter(t => t !== 'BYE')
      .sort((a, b) => teamGroups[b].length - teamGroups[a].length);

    // 4. Siapkan Pools (Masing-masing dibagi 8 Sub-Blok untuk persebaran)
    const poolsMap = {};
    poolIds.forEach(id => {
      poolsMap[id] = Array.from({ length: 8 }, () => []);
    });

    const getTeamPoolMembers = (poolId, teamId) => 
      poolsMap[poolId].flat().filter(name => playerInfoMap[name]?.team === teamId);
    
    const getRegionPoolMembers = (poolId, regionId) => 
      poolsMap[poolId].flat().filter(name => playerInfoMap[name]?.region === regionId);

    // 5. Distribusi Cerdas Lintas Pool & Lintas Kuarter (Menghindari Bentrok Tim & Daerah)
    //
    // Definisi "Final Half" berdasarkan skema silang bagan:
    //   - 2 pool : A vs B (final langsung, tak ada masalah half)
    //   - 3 pool : A+C satu half, B sendiri
    //   - 4 pool : A+C = half-0, B+D = half-1 (semifinal: A vs C, B vs D)
    //
    // Aturan: Anggota tim yang sama HARUS di half yang berbeda
    // sehingga mereka hanya bisa bertemu di Grand Final, bukan di Semifinal.
    const getFinalHalf = (poolId) => {
      const idx = poolIds.indexOf(poolId); // 0=A,1=B,2=C,3=D,...
      if (poolIds.length <= 2) return idx;        // setiap pool adalah half sendiri
      if (poolIds.length === 3) return idx === 1 ? 1 : 0; // B sendiri, A+C sama
      // 4+ pools: gunakan pola silang — pool 0 & 2 (A,C) = half-0, pool 1 & 3 (B,D) = half-1, dst.
      return idx % 2; // pool ke-0,2,4... = half-0; pool ke-1,3,5... = half-1
    };

    const getTeamSameHalfCount = (poolId, teamId) => {
      let count = 0;
      const candidateHalf = getFinalHalf(poolId);
      poolIds.forEach(pid => {
        if (pid === poolId) return; // pool sendiri sudah dihitung di teamPoolCount
        if (getFinalHalf(pid) === candidateHalf) {
          count += poolsMap[pid].flat().filter(name => playerInfoMap[name]?.team === teamId).length;
        }
      });
      return count;
    };

    const getRegionSameHalfCount = (poolId, regionId) => {
      if (regionId === 'NONE') return 0;
      let count = 0;
      const candidateHalf = getFinalHalf(poolId);
      poolIds.forEach(pid => {
        if (pid === poolId) return;
        if (getFinalHalf(pid) === candidateHalf) {
          count += poolsMap[pid].flat().filter(name => playerInfoMap[name]?.region === regionId).length;
        }
      });
      return count;
    };

    for (const team of sortedTeams) {
      for (const member of teamGroups[team]) {
        const pInfo = playerInfoMap[member];
        const teamId = pInfo.team;
        const regionId = pInfo.region;

        let validOptions = [];
        poolIds.forEach(poolId => {
          poolsMap[poolId].forEach((block, bIdx) => {
            if (block.length < (capacity / 8)) validOptions.push({ poolId, bIdx, block });
          });
        });

        validOptions.forEach(opt => {
          const poolFlat = poolsMap[opt.poolId].flat();

          // *** PRIORITAS ABSOLUT: Nama identik dilarang masuk pool yang sama ***
          // Jika [MJL-KOTA ANGIN]1 sudah ada di pool ini (meskipun di block lain),
          // pool ini mendapat skor sangat tinggi sehingga selalu dihindari.
          opt.sameNameInPool = poolFlat.filter(n => n === member).length;

          const qIdx = Math.floor(opt.bIdx / 2);
          const quarterBlocks = [poolsMap[opt.poolId][qIdx * 2], poolsMap[opt.poolId][qIdx * 2 + 1]];
          const quarterMembersTeam = quarterBlocks.flat().filter(name => playerInfoMap[name]?.team === teamId);
          const quarterMembersRegion = quarterBlocks.flat().filter(name => playerInfoMap[name]?.region === regionId);

          const hIdx = Math.floor(opt.bIdx / 4);
          const halfBlocks = [
            poolsMap[opt.poolId][hIdx * 4], poolsMap[opt.poolId][hIdx * 4 + 1], 
            poolsMap[opt.poolId][hIdx * 4 + 2], poolsMap[opt.poolId][hIdx * 4 + 3]
          ];
          const halfMembersTeam = halfBlocks.flat().filter(name => playerInfoMap[name]?.team === teamId);
          const halfMembersRegion = halfBlocks.flat().filter(name => playerInfoMap[name]?.region === regionId);

          // Team conflicts (within same pool)
          opt.teamPoolCount = getTeamPoolMembers(opt.poolId, teamId).length;
          opt.teamHalfCount = halfMembersTeam.length;
          opt.teamQuarterCount = quarterMembersTeam.length;
          opt.teamBlockCount = opt.block.filter(name => playerInfoMap[name]?.team === teamId).length;

          // Same-Half Conflict across pools (Final bracket awareness)
          opt.teamSameHalfCount = getTeamSameHalfCount(opt.poolId, teamId);

          // Region conflicts (Only if isOpenTournament is active)
          opt.regionPoolCount = regionId !== 'NONE' ? getRegionPoolMembers(opt.poolId, regionId).length : 0;
          opt.regionHalfCount = regionId !== 'NONE' ? halfMembersRegion.length : 0;
          opt.regionQuarterCount = regionId !== 'NONE' ? quarterMembersRegion.length : 0;
          opt.regionBlockCount = regionId !== 'NONE' ? opt.block.filter(name => playerInfoMap[name]?.region === regionId).length : 0;

          // Same-Half Region conflict
          opt.regionSameHalfCount = isOpenTournament ? getRegionSameHalfCount(opt.poolId, regionId) : 0;
          
          opt.totalPoolLength = poolFlat.length;
          opt.totalBlockLength = opt.block.length;
        });

        validOptions.sort((a, b) => {
          // Prioritas ABSOLUT (-1): Nama yang PERSIS SAMA harus masuk pool yang BERBEDA.
          // Ini menangani kasus 1 joki punya 2 slot — kedua slot tidak boleh di pool yang sama.
          if (a.sameNameInPool !== b.sameNameInPool) return a.sameNameInPool - b.sameNameInPool;

          // Priority 0: Jangan masukkan tim yang sama ke half final yang sama!
          if (a.teamSameHalfCount !== b.teamSameHalfCount) return a.teamSameHalfCount - b.teamSameHalfCount;

          // Priority 1: Team conflicts (dalam pool yang sama)
          if (a.teamPoolCount !== b.teamPoolCount) return a.teamPoolCount - b.teamPoolCount;
          if (a.teamHalfCount !== b.teamHalfCount) return a.teamHalfCount - b.teamHalfCount;
          if (a.teamQuarterCount !== b.teamQuarterCount) return a.teamQuarterCount - b.teamQuarterCount;
          if (a.teamBlockCount !== b.teamBlockCount) return a.teamBlockCount - b.teamBlockCount;

          // Priority 2: Region conflicts (if Open Tournament is active)
          if (isOpenTournament) {
            // Same-half region juga dipisah dulu
            if (a.regionSameHalfCount !== b.regionSameHalfCount) return a.regionSameHalfCount - b.regionSameHalfCount;
            if (a.regionPoolCount !== b.regionPoolCount) return a.regionPoolCount - b.regionPoolCount;
            if (a.regionHalfCount !== b.regionHalfCount) return a.regionHalfCount - b.regionHalfCount;
            if (a.regionQuarterCount !== b.regionQuarterCount) return a.regionQuarterCount - b.regionQuarterCount;
            if (a.regionBlockCount !== b.regionBlockCount) return a.regionBlockCount - b.regionBlockCount;
          }

          // Priority 3: Size Balance
          if (a.totalPoolLength !== b.totalPoolLength) return a.totalPoolLength - b.totalPoolLength;
          return a.totalBlockLength - b.totalBlockLength;
        });

        const chosen = validOptions[0];
        poolsMap[chosen.poolId][chosen.bIdx].push(member);
      }
    }

    // Fill BYEs into remaining spots
    const byePlayers = teamGroups['BYE'] || [];
    let byeIdx = 0;
    poolIds.forEach(pId => {
      poolsMap[pId].forEach(block => {
        while (block.length < (capacity / 8) && byeIdx < byePlayers.length) {
          block.push(byePlayers[byeIdx++]);
        }
      });
    });

    const newData = { 
      pools: {},
      title: tournamentTitle,
      organizer: tournamentOrganizer,
      logo: logoBase64,
      doubleLife: doubleLife,
      prelimPointsSystem: prelimPointsSystem,
      isOpenTournament: isOpenTournament,
      finalFormat: finalFormat,
      isArchived: false
    };

    const firstRoundOpponents = {};

    // 6. Bangun Bracket Dinamis (Bagan Pertama / Utama)
    poolIds.forEach(poolId => {
      poolsMap[poolId].forEach(b => {
        let bestBlock = [...b];
        let bestConflictCount = Infinity;

        for (let attempt = 0; attempt < 100; attempt++) {
          const shuffled = [...b].sort(() => Math.random() - 0.5);
          let conflicts = 0;
          for (let j = 0; j < shuffled.length; j += 2) {
            if (j + 1 < shuffled.length) {
              const p1 = shuffled[j];
              const p2 = shuffled[j + 1];
              if (p1.startsWith('BYE_') || p2.startsWith('BYE_')) continue;
              const info1 = playerInfoMap[p1];
              const info2 = playerInfoMap[p2];
              if (info1 && info2) {
                if (info1.team === info2.team) conflicts += 10;
                if (isOpenTournament && info1.region !== 'NONE' && info1.region === info2.region) conflicts += 5;
              }
            }
          }
          if (conflicts === 0) {
            bestBlock = shuffled;
            break;
          }
          if (conflicts < bestConflictCount) {
            bestBlock = shuffled;
            bestConflictCount = conflicts;
          }
        }
        
        for (let i = 0; i < b.length; i++) {
          b[i] = bestBlock[i];
        }
      });
      const poolNames = poolsMap[poolId].flat();

      let matches = [];
      let matchIdCounter = 1;
      let currentRoundMatches = [];

      for (let i = 0; i < capacity; i += 2) {
        const p1 = poolNames[i];
        const p2 = poolNames[i + 1];
        const match = { 
          id: `m${matchIdCounter++}`, 
          round: 1, 
          player1: p1.startsWith('BYE_') ? null : p1, 
          player2: p2.startsWith('BYE_') ? null : p2, 
          winner: null, 
          nextMatchId: null, 
          nextMatchSlot: null,
          player1Points: 0,
          player2Points: 0
        };

        // Catat lawan babak 1 untuk penegakan "beda lawan" di bagan selanjutnya jika doubleLife aktif
        if (p1 && p2 && !p1.startsWith('BYE_') && !p2.startsWith('BYE_')) {
          firstRoundOpponents[p1] = p2;
          firstRoundOpponents[p2] = p1;
        }

        // Auto-winner for BYE
        if (p1.startsWith('BYE_') && p2 && !p2.startsWith('BYE_')) match.winner = p2;
        if (p2.startsWith('BYE_') && p1 && !p1.startsWith('BYE_')) match.winner = p1;
        
        matches.push(match);
        currentRoundMatches.push(match);
      }

      let roundNum = 2;
      let prevMatches = currentRoundMatches;
      while (prevMatches.length > 1) {
        currentRoundMatches = [];
        for (let i = 0; i < prevMatches.length; i += 2) {
          const match = { id: `m${matchIdCounter++}`, round: roundNum, player1: null, player2: null, winner: null, nextMatchId: null, nextMatchSlot: null };
          
          // Carry over winners from Round 1 BYEs
          if (prevMatches[i].winner) match.player1 = prevMatches[i].winner;
          if (prevMatches[i+1].winner) match.player2 = prevMatches[i+1].winner;

          matches.push(match);
          currentRoundMatches.push(match);
          prevMatches[i].nextMatchId = match.id;
          prevMatches[i].nextMatchSlot = 1;
          prevMatches[i + 1].nextMatchId = match.id;
          prevMatches[i + 1].nextMatchSlot = 2;
        }
        prevMatches = currentRoundMatches;
        roundNum++;
      }
      newData.pools[poolId] = { matches, totalRounds: roundNum - 1 };
    });

    // 7. Jika doubleLife Aktif, Bangun Bagan Kedua (Crossover: A→C, B→D)
    // Setiap peserta dari Pool A mendapat nyawa ke-2 di Pool C dengan lawan BERBEDA dari babak 1 Pool A.
    // Setiap peserta dari Pool B mendapat nyawa ke-2 di Pool D dengan lawan BERBEDA dari babak 1 Pool B.
    // Struktur Final: SF1 = Juara A vs Juara C, SF2 = Juara B vs Juara D.
    if (doubleLife) {
      // Crossover mapping: Pool A (idx 0) → Pool C (idx 0 + numPools), Pool B (idx 1) → Pool D, dst.
      const set2PoolIds = Array.from({ length: numPools }, (_, i) =>
        String.fromCharCode(65 + numPools + i)
      );

      poolIds.forEach((srcPoolId, pIdx) => {
        const crossPoolId = set2PoolIds[pIdx]; // A→C, B→D, C→E (jika ada), dll.
        
        // Ambil pemain dari pool sumber (nyawa 1) untuk dikocok ulang di pool silang
        const srcPlayers = poolsMap[srcPoolId].flat();
        
        let bestShuffle = [...srcPlayers];
        let bestScore = Infinity;
        let attempts = 0;
        let shuffled = [...srcPlayers];

        // Fisher-Yates shuffle per-pool: cari urutan terbaik dengan:
        // 1. Tidak ada pasangan R1 yang sama dengan nyawa 1 (beda lawan - WAJIB)
        // 2. Minimalisir bentrok tim & daerah dalam R1 nyawa 2
        while (attempts < 600) {
          attempts++;
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          let isOpponentValid = true;
          let score = 0;

          for (let mIdx = 0; mIdx < capacity; mIdx += 2) {
            const p1 = shuffled[mIdx];
            const p2 = shuffled[mIdx + 1];
            if (p1 && p2 && !p1.startsWith('BYE_') && !p2.startsWith('BYE_')) {
              // WAJIB: tidak boleh bertemu lawan yang sama seperti babak 1 nyawa 1
              if (firstRoundOpponents[p1] === p2) {
                isOpponentValid = false;
                break;
              }
              const info1 = playerInfoMap[p1];
              const info2 = playerInfoMap[p2];
              if (info1 && info2) {
                if (info1.team === info2.team) score += 10;
                if (isOpenTournament && info1.region !== 'NONE' && info1.region === info2.region) score += 5;
              }
            }
          }

          if (isOpponentValid) {
            if (score === 0) { bestShuffle = [...shuffled]; bestScore = 0; break; }
            if (score < bestScore) { bestShuffle = [...shuffled]; bestScore = score; }
          }
        }

        // Bangun bracket untuk pool silang menggunakan bestShuffle
        const poolNames = bestShuffle;
        let matches = [];
        let matchIdCounter = 1;
        let currentRoundMatches = [];

        // Kocok tiap blok dalam pool untuk pastikan R1 beda lawan & minim bentrok
        const blockSize = capacity / 8;
        for (let bStart = 0; bStart < capacity; bStart += blockSize) {
          const block = poolNames.slice(bStart, bStart + blockSize);
          let bestBlock = [...block];
          let bestBlockConflict = Infinity;

          for (let attempt = 0; attempt < 100; attempt++) {
            const sb = [...block].sort(() => Math.random() - 0.5);
            let conflicts = 0;
            for (let j = 0; j < sb.length; j += 2) {
              if (j + 1 < sb.length) {
                const p1 = sb[j], p2 = sb[j + 1];
                if (p1.startsWith('BYE_') || p2.startsWith('BYE_')) continue;
                if (firstRoundOpponents[p1] === p2) conflicts += 20;
                const i1 = playerInfoMap[p1], i2 = playerInfoMap[p2];
                if (i1 && i2) {
                  if (i1.team === i2.team) conflicts += 10;
                  if (isOpenTournament && i1.region !== 'NONE' && i1.region === i2.region) conflicts += 5;
                }
              }
            }
            if (conflicts < bestBlockConflict) { bestBlock = sb; bestBlockConflict = conflicts; }
            if (conflicts === 0) break;
          }
          for (let k = 0; k < block.length; k++) poolNames[bStart + k] = bestBlock[k];
        }

        for (let i = 0; i < capacity; i += 2) {
          const p1 = poolNames[i];
          const p2 = poolNames[i + 1];
          const match = {
            id: `m${matchIdCounter++}`,
            round: 1,
            player1: p1.startsWith('BYE_') ? null : p1,
            player2: p2.startsWith('BYE_') ? null : p2,
            winner: null,
            nextMatchId: null,
            nextMatchSlot: null,
            player1Points: 0,
            player2Points: 0
          };
          if (p1.startsWith('BYE_') && p2 && !p2.startsWith('BYE_')) match.winner = p2;
          if (p2.startsWith('BYE_') && p1 && !p1.startsWith('BYE_')) match.winner = p1;
          matches.push(match);
          currentRoundMatches.push(match);
        }

        let roundNum = 2;
        let prevMatches = currentRoundMatches;
        while (prevMatches.length > 1) {
          currentRoundMatches = [];
          for (let i = 0; i < prevMatches.length; i += 2) {
            const match = { id: `m${matchIdCounter++}`, round: roundNum, player1: null, player2: null, winner: null, nextMatchId: null, nextMatchSlot: null };
            if (prevMatches[i].winner) match.player1 = prevMatches[i].winner;
            if (prevMatches[i + 1].winner) match.player2 = prevMatches[i + 1].winner;
            matches.push(match);
            currentRoundMatches.push(match);
            prevMatches[i].nextMatchId = match.id;
            prevMatches[i].nextMatchSlot = 1;
            prevMatches[i + 1].nextMatchId = match.id;
            prevMatches[i + 1].nextMatchSlot = 2;
          }
          prevMatches = currentRoundMatches;
          roundNum++;
        }
        newData.pools[crossPoolId] = {
          matches,
          totalRounds: roundNum - 1,
          crossoverOf: srcPoolId // Tandai bahwa ini adalah nyawa 2 dari pool sumber
        };
      });
    }

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
      setBulkInput('');
      setLogoBase64('');
      setShowGlobalSetup(false);
      setActivePool('A');
    } catch (err) {
      showError("Gagal membuat bagan.");
    }
  };

  const saveGlobalSettings = async () => {
    try {
      const newData = JSON.parse(JSON.stringify(tournamentData));
      newData.title = tournamentTitle;
      newData.organizer = tournamentOrganizer;
      newData.logo = logoBase64;
      newData.doubleLife = doubleLife;
      newData.prelimPointsSystem = prelimPointsSystem;
      newData.isOpenTournament = isOpenTournament;
      newData.finalFormat = finalFormat;

      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
      setShowGlobalSetup(false);
    } catch (err) {
      showError("Gagal menyimpan pengaturan.");
    }
  };

  const executeSetWinner = async (matchId, winnerName) => {
    const newData = JSON.parse(JSON.stringify(tournamentData));
    const poolData = newData.pools[activePool];
    if (!poolData) return;

    const matchIndex = poolData.matches.findIndex(m => m.id === matchId);
    const match = poolData.matches[matchIndex];
    
    if (match.winner === winnerName) match.winner = null;
    else match.winner = winnerName;

    if (match.nextMatchId) {
      updateNextMatch(poolData.matches, match.nextMatchId, match.nextMatchSlot, match.winner);
    }

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
    } catch (err) {
      showError("Gagal mengupdate pemenang.");
    }
  };

  const setWinner = async (matchId, winnerName, isDecrement = false) => {
    if (viewingArchive) return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (role !== 'referee' || !winnerName) return;
    if (tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    const poolData = tournamentData.pools[activePool];
    if (!poolData) return;
    const match = poolData.matches.find(m => m.id === matchId);
    if (!match) return;

    // Check if prelimPointsSystem is active and this is Round 1
    const isPrelimPoints = tournamentData.prelimPointsSystem && match.round === 1;

    if (isPrelimPoints) {
      const isPlayer1 = match.player1 === winnerName;
      const currentPoints = isPlayer1 ? (match.player1Points || 0) : (match.player2Points || 0);

      if (isDecrement) {
        // Decrement points
        const newPoints = Math.max(0, currentPoints - 1);
        await executeSetPoints(matchId, winnerName, newPoints, null);
      } else {
        // Increment points
        if (currentPoints === 0) {
          await executeSetPoints(matchId, winnerName, 1, null);
        } else if (currentPoints === 1) {
          // Confirm reaching score 2 and winning
          if (window.confirm(`Apakah Anda yakin ${winnerName} mendapatkan poin ke-2, memenangkan pertandingan, dan lolos ke babak berikutnya?`)) {
            await executeSetPoints(matchId, winnerName, 2, winnerName);
          }
        } else if (currentPoints >= 2) {
          // Already has 2 points and won. If clicked again, allow resetting the match.
          if (window.confirm(`Batalkan kemenangan ${winnerName} dan reset skor pertandingan ini?`)) {
            await executeSetPoints(matchId, winnerName, 0, null, true); // reset both
          }
        }
      }
    } else {
      // Normal 1 life winner logic
      if (match.winner === winnerName) {
        await executeSetWinner(matchId, winnerName);
      } else {
        setWinnerConfirm({ matchId, winnerName, isFinal: false });
      }
    }
  };

  const executeSetPoints = async (matchId, playerName, points, winnerName, isReset = false) => {
    const newData = JSON.parse(JSON.stringify(tournamentData));
    const poolData = newData.pools[activePool];
    if (!poolData) return;

    const matchIndex = poolData.matches.findIndex(m => m.id === matchId);
    const match = poolData.matches[matchIndex];
    if (!match) return;

    const isPlayer1 = match.player1 === playerName;

    if (isReset) {
      match.player1Points = 0;
      match.player2Points = 0;
      match.winner = null;
    } else {
      if (isPlayer1) {
        match.player1Points = points;
      } else {
        match.player2Points = points;
      }
      
      if (winnerName) {
        match.winner = winnerName;
      } else {
        match.winner = null;
      }
    }

    // Update next round slot
    if (match.nextMatchId) {
      updateNextMatch(poolData.matches, match.nextMatchId, match.nextMatchSlot, match.winner);
    }

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
    } catch (err) {
      showError("Gagal mengupdate poin penyisihan.");
    }
  };

  const setMatchState = async (matchId, action) => {
    if (viewingArchive) return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (role !== 'referee') return;
    if (tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    const newData = JSON.parse(JSON.stringify(tournamentData));
    const poolData = newData.pools[activePool];
    if (!poolData) return;

    const match = poolData.matches.find(m => m.id === matchId);
    if (!match) return;

    // Toggle logic: If same action clicked, reset to idle
    if (match.playState === action || (action === 'play' && match.playState === 'playing')) {
      match.playState = 'idle';
      match.startTime = null;
      match.accumulatedTime = 0;
    } else {
      const now = Date.now();
      if (action === 'play') {
        match.playState = 'playing';
        match.startTime = now;
        if (match.accumulatedTime === undefined) match.accumulatedTime = 0;
      } else if (action === 'prep') {
        match.playState = 'prep';
        match.startTime = null;
        match.accumulatedTime = 0;
      } else if (action === 'call') {
        match.playState = 'call';
        match.startTime = now; // Store start time for 10 minutes countdown
        match.accumulatedTime = 0;
      } else if (action === 'pause') {
        if (match.playState === 'playing') {
          match.accumulatedTime = (match.accumulatedTime || 0) + (now - (match.startTime || now));
        }
        match.playState = 'paused';
      } else if (action === 'stop') {
        match.playState = 'idle';
        match.startTime = null;
        match.accumulatedTime = 0;
      }
    }

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
    } catch (err) {
      showError("Gagal mengupdate status pertandingan.");
    }
  };

  const updateNextMatch = (matches, nextMatchId, slot, winner) => {
    const nextMatchIndex = matches.findIndex(m => m.id === nextMatchId);
    if (nextMatchIndex === -1) return;
    const nextMatch = matches[nextMatchIndex];
    if (slot === 1) nextMatch.player1 = winner;
    else nextMatch.player2 = winner;
    nextMatch.winner = null;
    if (nextMatch.nextMatchId) {
      updateNextMatch(matches, nextMatch.nextMatchId, nextMatch.nextMatchSlot, null);
    }
    if (nextMatch.loserNextMatchId) {
      updateNextMatch(matches, nextMatch.loserNextMatchId, nextMatch.loserNextMatchSlot, null);
    }
  };

  const handleUpdatePlayerName = async (newName) => {
    if (viewingArchive) return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (!editingPlayer || !newName.trim()) return;
    if (tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    const { matchId, playerSlot } = editingPlayer;
    const newData = JSON.parse(JSON.stringify(tournamentData));
    const poolData = newData.pools[activePool];
    const matchIndex = poolData.matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;
    
    const match = poolData.matches[matchIndex];
    const oldName = playerSlot === 1 ? match.player1 : match.player2;
    if (playerSlot === 1) match.player1 = newName;
    else match.player2 = newName;

    if (match.winner === oldName) {
      match.winner = newName;
      if (match.nextMatchId) {
        updateNextMatch(poolData.matches, match.nextMatchId, match.nextMatchSlot, newName);
      }
    }

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
      setEditingPlayer(null);
    } catch (err) {
      showError("Gagal mengubah nama peserta.");
    }
  };

  const handleDisqualifyPlayer = async (matchId, playerSlot) => {
    if (viewingArchive) return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (role !== 'referee') return;
    if (tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    const newData = JSON.parse(JSON.stringify(tournamentData));
    const poolData = newData.pools[activePool];
    if (!poolData) return;

    const matchIndex = poolData.matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;
    const match = poolData.matches[matchIndex];

    const opponentName = playerSlot === 1 ? match.player2 : match.player1;
    const isCurrentlyDis = playerSlot === 1 ? match.player1Disqualified : match.player2Disqualified;

    if (isCurrentlyDis) {
      if (playerSlot === 1) match.player1Disqualified = false;
      else match.player2Disqualified = false;
      
      match.winner = null;
      if (match.nextMatchId) {
        updateNextMatch(poolData.matches, match.nextMatchId, match.nextMatchSlot, null);
      }
    } else {
      if (playerSlot === 1) match.player1Disqualified = true;
      else match.player2Disqualified = true;

      if (opponentName && !opponentName.startsWith('BYE_')) {
        match.winner = opponentName;
        if (match.nextMatchId) {
          updateNextMatch(poolData.matches, match.nextMatchId, match.nextMatchSlot, opponentName);
        }
      } else {
        match.winner = null;
      }
    }

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
      setEditingPlayer(null);
    } catch (err) {
      showError("Gagal memproses diskualifikasi.");
    }
  };

  const archiveTournament = async () => {
    if (role !== 'referee') return;
    if (!tournamentData.pools || Object.keys(tournamentData.pools).length === 0) {
      return showError("Tidak ada bagan aktif untuk diarsipkan.");
    }
    
    if (!window.confirm("Apakah Anda yakin ingin mengarsipkan turnamen ini? Turnamen yang diarsipkan akan disimpan ke riwayat publik dan bagan aktif saat ini akan dikosongkan agar Anda dapat membuat turnamen baru.")) {
      return;
    }
    
    const archiveId = 'archive_' + Date.now();
    const archiveData = {
      id: archiveId,
      title: tournamentData.title || tournamentTitle,
      organizer: tournamentData.organizer || tournamentOrganizer,
      logo: tournamentData.logo || null,
      doubleLife: tournamentData.doubleLife || false,
      pools: tournamentData.pools || {},
      archivedAt: new Date().toISOString()
    };
    
    try {
      // 1. Post to archives collection
      const archiveRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'archive_hub', 'items', archiveId);
      await setDoc(archiveRef, archiveData);
      
      // 2. Clear the active tournament document
      const activeRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(activeRef, { pools: {} });
      
      setIsMenuOpen(false);
      alert("Turnamen berhasil diarsipkan! Bagan aktif telah dikosongkan untuk turnamen baru.");
    } catch (err) {
      console.error(err);
      showError("Gagal mengarsipkan turnamen.");
    }
  };

  const handleDeleteArchive = async (archiveId, title) => {
    if (role !== 'referee') return;
    if (!window.confirm(`Apakah Anda yakin ingin menghapus arsip "${title}" secara permanen?`)) return;
    if (!window.confirm(`PERINGATAN KEDUA: Seluruh bagan dan data pemenang dari turnamen "${title}" akan hilang selamanya. Lanjutkan?`)) return;
    
    try {
      const archiveRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'archive_hub', 'items', archiveId);
      await deleteDoc(archiveRef);
      alert("Arsip berhasil dihapus secara permanen.");
    } catch (err) {
      console.error(err);
      showError("Gagal menghapus arsip.");
    }
  };

  const resetPool = async () => {
    if (viewingArchive) return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    if (!window.confirm(`Hapus semua data di Bagan ${activePool}?`)) return;
    const newData = JSON.parse(JSON.stringify(tournamentData));
    if (newData.pools && newData.pools[activePool]) {
      delete newData.pools[activePool];
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
        await setDoc(docRef, newData);
      } catch (err) {
        showError("Gagal mereset bagan.");
      }
    }
  };

  const getFinalFormatText = () => {
    const format = activeBracket?.type || finalFormat;
    if (format === 'roundrobin') return "Sistem Round-Robin — Finalis Saling Bertemu (Liga)";
    if (format === 'double') return "Sistem Gugur Ganda — Semifinal + Juara 3 + Grand Final";
    return "Sistem Gugur Tunggal — Bagan Eliminasi Langsung";
  };

  const getChampions = () => {
    if (!activeBracket || !activeBracket.matches) return null;
    let j1 = null, j2 = null, j3 = null, j4 = null;

    if (activeBracket.type === 'roundrobin') {
      const standings = computeStandings(activeBracket);
      if (activeBracket.matches.some(m => m.winner)) {
        j1 = standings[0]?.name || null;
        j2 = standings[1]?.name || null;
        j3 = standings[2]?.name || null;
        j4 = standings[3]?.name || null;
      }
    } else if (activeBracket.type === 'double') {
      const fm4 = activeBracket.matches.find(m => m.id === 'fm4');
      const fm3 = activeBracket.matches.find(m => m.id === 'fm3');
      j1 = fm4?.winner || null;
      if (j1 && fm4) {
        j2 = j1 === fm4.player1 ? fm4.player2 : fm4.player1;
      }
      j3 = fm3?.winner || null;
      if (j3 && fm3) {
        j4 = j3 === fm3.player1 ? fm3.player2 : fm3.player1;
      }
    } else {
      const totalR = activeBracket.totalRounds || 1;
      const finalMatch = activeBracket.matches.find(m => m.round === totalR);
      j1 = finalMatch?.winner || null;
      if (j1 && finalMatch) {
        j2 = j1 === finalMatch.player1 ? finalMatch.player2 : finalMatch.player1;
      }
      if (totalR > 1) {
        const sfMatches = activeBracket.matches.filter(m => m.round === totalR - 1);
        if (sfMatches[0] && sfMatches[0].winner) {
          j3 = sfMatches[0].winner === sfMatches[0].player1 ? sfMatches[0].player2 : sfMatches[0].player1;
        }
        if (sfMatches[1] && sfMatches[1].winner) {
          j4 = sfMatches[1].winner === sfMatches[1].player1 ? sfMatches[1].player2 : sfMatches[1].player1;
        }
      }
    }

    return { j1, j2, j3, j4 };
  };

  const renderPodium = () => {
    const champs = getChampions();
    if (!champs || (!champs.j1 && !champs.j2 && !champs.j3 && !champs.j4)) return null;

    const isBracket = activeBracket?.type === 'bracket';

    return (
      <div className="mb-10 max-w-3xl mx-auto p-6 md:p-8 bg-white border-2 border-slate-100 rounded-3xl shadow-xl relative overflow-hidden animate-slide-up">
        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-100/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-100/30 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <div className="relative text-center mb-6">
          <span className="inline-block bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-amber-200/50">
            🥇 Podium Juara
          </span>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-wide">Pemenang Turnamen</h3>
          <p className="text-xs text-slate-500 font-bold mt-1">Daftar pemenang resmi turnamen saat ini</p>
        </div>

        {/* Podium Layout */}
        <div className="flex flex-col gap-4">
          {/* Juara 1 */}
          {champs.j1 && (
            <div className="relative group overflow-hidden bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-white p-4 rounded-2xl shadow-lg shadow-yellow-100 flex items-center justify-between border-2 border-yellow-300 min-h-[88px]">
              <div className="absolute -inset-y-0 -left-12 w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:left-[110%] transition-all duration-1000 ease-out"></div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner bg-white/20 text-yellow-100">
                  <Crown size={26} className="animate-bounce" style={{ animationDuration: '3s' }} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-100 uppercase tracking-widest">Juara 1 (Gold)</p>
                  <p className="text-base font-black tracking-tight">{champs.j1}</p>
                </div>
              </div>
              <Trophy size={32} className="text-white/25 shrink-0 mr-1" />
            </div>
          )}

          {/* Juara 2 */}
          {champs.j2 && (
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 text-white p-4 rounded-2xl shadow-md flex items-center justify-between border border-slate-350 h-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner bg-white/10 text-slate-100">
                  <Medal size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Juara 2 (Silver)</p>
                  <p className="text-sm font-black tracking-tight">{champs.j2}</p>
                </div>
              </div>
              <Medal size={26} className="text-white/20 shrink-0 mr-1" />
            </div>
          )}

          {/* Juara 3 (Bronze) & Juara 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {champs.j3 && (
              <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-700 to-amber-800 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between border border-orange-500/30 h-20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner bg-white/10 text-orange-200">
                    <Medal size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-orange-200 uppercase tracking-widest">
                      {isBracket ? "Juara 3 Bersama" : "Juara 3 (Bronze)"}
                    </p>
                    <p className="text-xs font-black tracking-tight">{champs.j3}</p>
                  </div>
                </div>
                <Medal size={22} className="text-white/20 shrink-0 mr-1" />
              </div>
            )}

            {champs.j4 && (
              <div className={cn(
                "relative overflow-hidden p-4 rounded-2xl flex items-center justify-between border h-20",
                isBracket
                  ? "bg-gradient-to-r from-orange-600 via-amber-700 to-amber-800 text-white border-orange-500/30"
                  : "bg-white text-slate-800 border-slate-200 shadow-sm"
              )}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                    isBracket ? "bg-white/10 text-orange-200" : "bg-slate-100 text-slate-500"
                  )}>
                    {isBracket ? <Medal size={20} /> : <Award size={20} />}
                  </div>
                  <div>
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      isBracket ? "text-orange-200" : "text-slate-400"
                    )}>
                      {isBracket ? "Juara 3 Bersama" : "Juara 4 (Harapan 1)"}
                    </p>
                    <p className="text-xs font-black tracking-tight">{champs.j4}</p>
                  </div>
                </div>
                {isBracket ? (
                  <Medal size={22} className="text-white/20 shrink-0 mr-1" />
                ) : (
                  <Award size={22} className="text-slate-300 shrink-0 mr-1" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const changeFinalFormat = async (newFormat) => {
    if (viewingArchive) return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    
    setFinalFormat(newFormat);
    
    try {
      const newData = JSON.parse(JSON.stringify(tournamentData));
      newData.finalFormat = newFormat;
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
    } catch (err) {
      showError("Gagal mengubah format final.");
    }
  };

  const resetAllPools = async () => {
    if (viewingArchive) return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    if (!window.confirm("Apakah Anda yakin ingin menghapus SEMUA bagan secara permanen? Semua data pertandingan aktif akan hilang!")) return;
    const newData = JSON.parse(JSON.stringify(tournamentData));
    newData.pools = {};
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
      setIsMenuOpen(false);
    } catch (err) {
      showError("Gagal mereset semua bagan.");
    }
  };

  // Build/sync final bracket from pool winners
  const syncFinalBracket = async () => {
    const winners = finalParticipants.map(p => p.name);
    if (winners.length < 2) return showError('Minimal harus ada 2 pool untuk membuat Final.');
    if (winners.some(name => !name)) return showError('Semua juara pool harus sudah ditentukan!');
    
    if (tournamentData.pools?.Final) {
      if (!window.confirm("PERINGATAN: Menyusun ulang finalis akan menghapus bagan final saat ini beserta seluruh skor/pemenang yang sudah tercatat. Lanjutkan?")) return;
    }
    
    const newData = JSON.parse(JSON.stringify(tournamentData));
    if (!newData.pools) newData.pools = {};

    if (finalFormat === 'roundrobin') {
      let matches = [];
      for (let i = 0; i < winners.length; i++) {
        for (let j = i + 1; j < winners.length; j++) {
          matches.push({
            id: `f${matches.length + 1}`,
            label: `Final: ${winners[i]} vs ${winners[j]}`,
            player1: winners[i],
            player2: winners[j],
            winner: null
          });
        }
      }
      newData.pools['Final'] = { type: 'roundrobin', matches };
    } else if (finalFormat === 'double') {
      // Model B: Semifinal + Grand Final + Perebutan Juara 3
      // Pola SILANG: SF1 = Juara A vs Juara C, SF2 = Juara B vs Juara D
      // Urutan winners = [JuaraA, JuaraB, JuaraC, JuaraD, ...]
      // Crossover: slot 0 (A) vs slot 2 (C), slot 1 (B) vs slot 3 (D)
      const rawWinners = [...winners];
      while (rawWinners.length < 4) rawWinners.push(`BYE_FINAL_${rawWinners.length + 1}`);

      // Reorder untuk pola silang: [A, C, B, D]
      const crossover = [
        rawWinners[0], // A → SF1 slot 1
        rawWinners[2], // C → SF1 slot 2
        rawWinners[1], // B → SF2 slot 1
        rawWinners[3], // D → SF2 slot 2
      ];

      // Semifinals (Round 1)
      const match1 = {
        id: 'fm1',
        round: 1,
        label: 'Semifinal 1',
        player1: crossover[0].startsWith('BYE_') ? null : crossover[0],
        player2: crossover[1].startsWith('BYE_') ? null : crossover[1],
        winner: null,
        nextMatchId: 'fm4', // Winner to Grand Final Slot 1
        nextMatchSlot: 1,
        loserNextMatchId: 'fm3', // Loser to Juara 3 Match Slot 1
        loserNextMatchSlot: 1
      };
      const match2 = {
        id: 'fm2',
        round: 1,
        label: 'Semifinal 2',
        player1: crossover[2].startsWith('BYE_') ? null : crossover[2],
        player2: crossover[3].startsWith('BYE_') ? null : crossover[3],
        winner: null,
        nextMatchId: 'fm4', // Winner to Grand Final Slot 2
        nextMatchSlot: 2,
        loserNextMatchId: 'fm3', // Loser to Juara 3 Match Slot 2
        loserNextMatchSlot: 2
      };

      // Auto-winners for BYEs
      if (crossover[0].startsWith('BYE_') && !crossover[1].startsWith('BYE_')) match1.winner = crossover[1];
      if (crossover[1].startsWith('BYE_') && !crossover[0].startsWith('BYE_')) match1.winner = crossover[0];
      if (crossover[2].startsWith('BYE_') && !crossover[3].startsWith('BYE_')) match2.winner = crossover[3];
      if (crossover[3].startsWith('BYE_') && !crossover[2].startsWith('BYE_')) match2.winner = crossover[2];

      // Round 2 Matches
      const match3 = {
        id: 'fm3',
        round: 2,
        player1: null,
        player2: null,
        winner: null,
        nextMatchId: null,
        nextMatchSlot: null,
        label: 'Perebutan Juara 3'
      };
      if (match1.winner) {
        match3.player1 = match1.winner === match1.player1 ? match1.player2 : match1.player1;
      }
      if (match2.winner) {
        match3.player2 = match2.winner === match2.player1 ? match2.player2 : match2.player1;
      }

      const match4 = {
        id: 'fm4',
        round: 2,
        player1: match1.winner || null,
        player2: match2.winner || null,
        winner: null,
        nextMatchId: null,
        nextMatchSlot: null,
        label: 'Grand Final'
      };

      newData.pools['Final'] = {
        type: 'double',
        matches: [match1, match2, match3, match4],
        totalRounds: 2
      };
    } else {
      // Direct Elimination Bracket for Finalists — pola SILANG
      // winners = [JuaraA, JuaraB, JuaraC, JuaraD, ...]
      // Tujuan: SF1 = A vs C, SF2 = B vs D → reorder dulu sebelum dipasangkan
      const capacity = Math.pow(2, Math.ceil(Math.log2(winners.length)));
      const rawWinners = [...winners];
      let counter = 1;
      while (rawWinners.length < capacity) rawWinners.push(`BYE_FINAL_${counter++}`);

      // Crossover reorder untuk pola silang (berlaku untuk 4 finalis):
      // [A(0), B(1), C(2), D(3)] → [A(0), C(2), B(1), D(3)]
      // Untuk jumlah pool lebih dari 4, terapkan pola silang yang sama (0,2,1,3,4,6,5,7,...)
      const poolNames = [];
      for (let i = 0; i < capacity; i += 4) {
        poolNames.push(rawWinners[i] || `BYE_FINAL_${poolNames.length + 1}`);
        poolNames.push(rawWinners[i + 2] || `BYE_FINAL_${poolNames.length + 1}`);
        poolNames.push(rawWinners[i + 1] || `BYE_FINAL_${poolNames.length + 1}`);
        poolNames.push(rawWinners[i + 3] || `BYE_FINAL_${poolNames.length + 1}`);
      }

      let matches = [];
      let matchIdCounter = 1;
      let currentRoundMatches = [];

      for (let i = 0; i < capacity; i += 2) {
        const p1 = poolNames[i];
        const p2 = poolNames[i + 1];
        const sfNum = Math.floor(i / 2) + 1;
        const match = { 
          id: `fm${matchIdCounter++}`, 
          round: 1,
          label: capacity > 2 ? `Semifinal ${sfNum}` : 'Grand Final',
          player1: p1.startsWith('BYE_') ? null : p1, 
          player2: p2.startsWith('BYE_') ? null : p2, 
          winner: null, 
          nextMatchId: null, 
          nextMatchSlot: null 
        };
        if (p1.startsWith('BYE_') && p2 && !p2.startsWith('BYE_')) match.winner = p2;
        if (p2.startsWith('BYE_') && p1 && !p1.startsWith('BYE_')) match.winner = p1;
        
        matches.push(match);
        currentRoundMatches.push(match);
      }

      let roundNum = 2;
      let prevMatches = currentRoundMatches;
      while (prevMatches.length > 1) {
        currentRoundMatches = [];
        for (let i = 0; i < prevMatches.length; i += 2) {
          const match = { id: `fm${matchIdCounter++}`, round: roundNum, player1: null, player2: null, winner: null, nextMatchId: null, nextMatchSlot: null };
          if (prevMatches[i].winner) match.player1 = prevMatches[i].winner;
          if (prevMatches[i+1].winner) match.player2 = prevMatches[i+1].winner;
          matches.push(match);
          currentRoundMatches.push(match);
          prevMatches[i].nextMatchId = match.id;
          prevMatches[i].nextMatchSlot = 1;
          prevMatches[i + 1].nextMatchId = match.id;
          prevMatches[i + 1].nextMatchSlot = 2;
        }
        prevMatches = currentRoundMatches;
        roundNum++;
      }
      newData.pools['Final'] = { type: 'bracket', matches, totalRounds: roundNum - 1 };
    }

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
    } catch (err) {
      showError('Gagal membuat Bagan Final.');
    }
  };

  const executeSetFinalWinner = async (matchId, winnerName) => {
    const newData = JSON.parse(JSON.stringify(tournamentData));
    const finalData = newData.pools['Final'];
    if (!finalData) return;
    const matchIndex = finalData.matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;
    const match = finalData.matches[matchIndex];

    if (match.winner === winnerName) match.winner = null;
    else match.winner = winnerName;

    // Propagate winner
    if (match.nextMatchId) {
      updateNextMatch(finalData.matches, match.nextMatchId, match.nextMatchSlot, match.winner);
    }

    // Propagate loser (for Double / Bronze match format)
    if (match.loserNextMatchId) {
      let loser = null;
      if (match.winner) {
        loser = match.winner === match.player1 ? match.player2 : match.player1;
      }
      updateNextMatch(finalData.matches, match.loserNextMatchId, match.loserNextMatchSlot, loser);
    }

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
    } catch (err) {
      showError('Gagal update pemenang final.');
    }
  };

  const setFinalWinner = async (matchId, winnerName) => {
    if (role !== 'referee' || !winnerName) return;
    if (tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    const finalData = tournamentData.pools['Final'];
    if (!finalData) return;
    const match = finalData.matches.find(m => m.id === matchId);
    if (!match) return;

    if (match.winner === winnerName) {
      await executeSetFinalWinner(matchId, winnerName);
    } else {
      setWinnerConfirm({ matchId, winnerName, isFinal: true });
    }
  };

  // Compute round-robin standings
  const computeStandings = (finalBracket) => {
    if (!finalBracket || finalBracket.type !== 'roundrobin') return [];
    const points = {};
    finalBracket.matches.forEach(m => {
      if (!points[m.player1]) points[m.player1] = { name: m.player1, w: 0, l: 0, pts: 0 };
      if (!points[m.player2]) points[m.player2] = { name: m.player2, w: 0, l: 0, pts: 0 };
      if (m.winner) {
        const loser = m.winner === m.player1 ? m.player2 : m.player1;
        points[m.winner].w += 1;
        points[m.winner].pts += 1;
        points[loser].l += 1;
      }
    });
    return Object.values(points).sort((a, b) => b.pts - a.pts || b.w - a.w);
  };

  // Search participant handler
  const handleSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !activeBracket?.matches) return;
    // Find ALL matches containing the player, then pick the HIGHEST round (rightmost/most advanced)
    const candidates = activeBracket.matches.filter(m =>
      m.player1?.toLowerCase().includes(q) || m.player2?.toLowerCase().includes(q)
    );
    if (!candidates.length) { showError('Peserta tidak ditemukan di bagan ini.'); return; }
    const found = candidates.sort((a, b) => b.round - a.round)[0];
    const slot = found.player1?.toLowerCase().includes(q) ? 1 : 2;
    setSearchResult({ matchId: found.id, slot });
    // Scroll to card
    setTimeout(() => {
      matchRefs.current[found.id]?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }, 50);
    // Auto-clear highlight after 3.5 seconds
    setTimeout(() => setSearchResult(null), 3500);
  };


  // 4. CONDITIONAL RENDERING
  if (!hasConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-red-100">
          <AlertCircle className="w-20 h-20 text-red-600 mx-auto mb-6"/>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Firebase Belum Dikonfigurasi</h1>
          <p className="text-slate-600 mb-8">Silahkan atur Env Vars di Vercel.</p>
        </div>
      </div>
    );
  }

  if (!user || loadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <RefreshCw className="animate-spin text-brand-600 w-12 h-12 mb-4"/>
        <p className="text-slate-500 font-medium">Menghubungkan ke Server...</p>
        {errorMessage && <p className="mt-4 text-red-500 text-sm font-bold">{errorMessage}</p>}
      </div>
    );
  }

  if (!role && !viewingArchive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-12 px-4 font-sans overflow-y-auto">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in shrink-0">
          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-10 text-center text-white flex flex-col items-center">
            {tournamentData.logo ? (
              <img src={tournamentData.logo} alt="Logo" className="w-20 h-20 object-contain rounded-2xl shadow-xl bg-white/10 backdrop-blur-md p-2 mb-4 border border-white/20 animate-scale-in" />
            ) : (
              <Trophy className="w-14 h-14 text-white mx-auto mb-4 drop-shadow-lg"/>
            )}
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none mt-2">{(tournamentData.title || tournamentTitle).toUpperCase()}</h1>
          </div>
          <div className="p-8 space-y-6">
            <button 
              onClick={() => {
                setRole('spectator');
                localStorage.setItem('tournament_role', 'spectator');
              }} 
              className="w-full flex items-center justify-between bg-slate-50 hover:bg-brand-50 border-2 border-slate-100 hover:border-brand-200 p-6 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="bg-white p-3 rounded-xl shadow-sm text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <Users className="w-6 h-6"/>
                </div>
                <div>
                  <h3 className="font-black text-slate-800">Lihat Bagan</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pantau Skor Real-time</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300"/>
            </button>
            <form onSubmit={handleLoginReferee} className="space-y-4">
              <div className="relative">
                <input type="password" name="pin" placeholder="Password Wasit" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl outline-none font-bold text-slate-800 focus:border-brand-500 transition-all" required />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl active:scale-95">Login</button>
            </form>
          </div>

          {/* Section Riwayat Turnamen */}
          {archivesList.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Archive size={14} className="text-brand-500" /> RIWAYAT TURNAMEN ARSIP
              </h3>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                {archivesList.map((archive) => {
                  const dateStr = new Date(archive.archivedAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  return (
                    <div 
                      key={archive.id}
                      onClick={() => {
                        setViewingArchive(archive);
                        if (archive.pools && Object.keys(archive.pools).length > 0) {
                          const sortedPools = Object.keys(archive.pools).sort();
                          setActivePool(sortedPools[0]);
                        }
                      }}
                      className="w-full flex items-center justify-between bg-white border border-slate-100 hover:border-brand-300 p-4 rounded-2xl transition-all shadow-sm cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        {archive.logo ? (
                          <img src={archive.logo} alt="Logo" className="w-10 h-10 object-contain rounded-lg border border-slate-100 p-1 bg-slate-50" />
                        ) : (
                          <div className="bg-brand-50 text-brand-600 p-2 rounded-lg">
                            <Trophy size={16} />
                          </div>
                        )}
                        <div className="text-left">
                          <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight leading-none group-hover:text-brand-600 transition-colors">
                            {archive.title}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                            {archive.organizer} • {dateStr}
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-50 group-hover:bg-brand-50 text-slate-400 group-hover:text-brand-600 p-1.5 rounded-xl transition-all">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer for Landing Page */}
        <div className="text-center px-4 flex flex-col items-center gap-1 mt-8 pb-4 shrink-0">
           <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
             Perkumpulan Pelayang Seluruh Indonesia Kabupaten Majalengka
           </p>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
             © Copyright by Senyap
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 font-sans overflow-hidden">
      {/* Sticky Archive Indicator Banner */}
      {viewingArchive && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-[10px] md:text-xs uppercase tracking-widest py-3.5 px-4 flex items-center justify-between shadow-md z-[45] animate-slide-down shrink-0">
          <span className="flex items-center gap-2">
            <Archive size={14} className="animate-pulse text-amber-100" />
            ANDA SEDANG MELIHAT ARSIP: {viewingArchive.title.toUpperCase()} (READ-ONLY)
          </span>
          <button 
            onClick={() => setViewingArchive(null)} 
            className="bg-white/20 hover:bg-white/30 text-white font-black text-[9px] md:text-[10px] py-1 px-3 rounded-lg transition-colors border border-white/20 active:scale-95 shrink-0"
          >
            KEMBALI KE BERANDA
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          {currentTournament.logo ? (
            <img src={currentTournament.logo} alt="Logo" className="w-10 h-10 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1 shrink-0 shadow-sm" />
          ) : (
            <div className="bg-brand-600 p-2.5 rounded-xl shadow-lg shadow-brand-200 hidden md:block shrink-0">
              <Trophy className="w-6 h-6 text-white"/>
            </div>
          )}
          <div>
            <h1 className="font-black text-slate-800 text-sm md:text-xl tracking-tighter leading-none mb-1 flex items-center flex-wrap">
              {currentTournament.title || tournamentTitle}
              {(currentTournament.isArchived || viewingArchive) && (
                <span className="inline-flex items-center gap-1 text-[8px] font-black bg-red-500 text-white px-2.5 py-0.5 rounded-full uppercase ml-2 animate-pulse shrink-0">
                  <Archive size={8}/> Terarsip
                </span>
              )}
            </h1>
            <p className="text-[9px] md:text-[11px] text-brand-600 font-black uppercase tracking-[0.1em]">
              {currentTournament.organizer || tournamentOrganizer}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex flex-col items-end mr-4 border-r pr-4 border-slate-200">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status Sistem</p>
            <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> ONLINE
            </p>
          </div>
          {/* Search button in header - only when bracket is active */}
          {activeBracket && activePool !== 'Final' && (
            <button
              onClick={() => { setShowSearch(s => !s); setSearchQuery(''); setSearchResult(null); setTimeout(() => searchInputRef.current?.focus(), 80); }}
              className={cn('p-2.5 rounded-xl transition-colors', showSearch ? 'bg-emerald-500 text-white' : 'hover:bg-slate-100 text-slate-600')}
            >
              <Search className="w-5 h-5"/>
            </button>
          )}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors">
            <Settings className="w-5 h-5 text-slate-600"/>
          </button>
        </div>
        
        {isMenuOpen && (
          <div className="absolute right-4 top-20 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-scale-in">
            <div className="px-4 py-2 border-b border-slate-50 mb-2">
               <p className="text-[9px] font-black text-slate-400 uppercase">Akses: {role === 'referee' ? 'Wasit' : 'Penonton'}</p>
            </div>
            {role === 'referee' && (
              <>
                <button onClick={() => { setShowGlobalSetup(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-brand-600 text-sm font-bold flex items-center gap-3 hover:bg-brand-50"><Shuffle size={14}/> Buat Bagan Otomatis</button>
                <button onClick={() => { setShowArchiveManagement(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-slate-700 text-sm font-bold flex items-center gap-3 hover:bg-slate-50 border-b border-slate-100"><Trash2 size={14} className="text-red-500"/> Kelola Arsip</button>
                {activeBracket && <button onClick={() => {resetPool(); setIsMenuOpen(false);}} className="w-full text-left px-4 py-3 text-red-600 text-sm font-bold flex items-center gap-3 hover:bg-red-50"><RefreshCw size={14}/> Reset Bagan {activePool}</button>}
                {Object.keys(tournamentData.pools || {}).length > 0 && (
                  <>
                    <button onClick={() => {resetAllPools(); setIsMenuOpen(false);}} className="w-full text-left px-4 py-3 text-red-700 text-sm font-bold flex items-center gap-3 hover:bg-red-100/50"><RefreshCw size={14}/> Reset Semua Bagan</button>
                    <button onClick={archiveTournament} className="w-full text-left px-4 py-3 text-slate-600 text-sm font-bold flex items-center gap-3 hover:bg-slate-50 border-t border-slate-50 mt-1 pt-2">
                      <Archive size={14}/> Arsipkan Turnamen
                    </button>
                  </>
                )}
              </>
            )}
            <button onClick={logout} className="w-full text-left px-4 py-3 text-slate-600 text-sm font-bold flex items-center gap-3 hover:bg-slate-50"><LogOut size={14}/> Keluar Sistem</button>
          </div>
        )}
      </header>

      {/* Pool Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-[77px] z-30 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
          {poolsList.map(pool => (
            <button key={pool} onClick={() => { setActivePool(pool); setSearchResult(null); setShowSearch(false); setSearchQuery(''); }} className={cn("py-4 px-8 font-black text-xs md:text-sm relative transition-colors", activePool === pool ? (pool === 'Final' ? 'text-yellow-600' : 'text-brand-600') : 'text-slate-400 hover:text-slate-600')}>
              {pool === 'Final' ? 'FINAL' : `BAGAN ${pool}`}
              {activePool === pool && <div className={cn("absolute bottom-0 left-0 right-0 h-1 rounded-t-full", pool === 'Final' ? 'bg-yellow-500 shadow-[0_-2px_10px_rgba(234,179,8,0.4)]' : 'bg-brand-600 shadow-[0_-2px_10px_rgba(16,137,226,0.3)]')}></div>}
            </button>
          ))}
        </div>
        {activeBracket && (
          <button 
            onClick={handlePrintPDF}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 py-2.5 px-4 rounded-xl font-black text-xs transition-all shrink-0 active:scale-95 shadow-sm"
          >
            <Printer size={14}/>
            CETAK PDF
          </button>
        )}
      </div>


      {/* Edit Modal / Setelan Peserta */}
      {editingPlayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setEditingPlayer(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-1">Setelan Peserta</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Kelola: {editingPlayer.currentName}</p>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Ubah Nama Peserta</label>
                <input 
                  autoFocus 
                  id="edit-name-input" 
                  type="text" 
                  defaultValue={editingPlayer.currentName} 
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdatePlayerName(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tindakan Khusus</label>
                {(() => {
                  const poolData = tournamentData.pools[activePool];
                  const match = poolData?.matches?.find(m => m.id === editingPlayer.matchId);
                  const isDis = editingPlayer.playerSlot === 1 ? match?.player1Disqualified : match?.player2Disqualified;
                  
                  return (
                    <button 
                      onClick={() => handleDisqualifyPlayer(editingPlayer.matchId, editingPlayer.playerSlot)}
                      className={cn(
                        "w-full py-4 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-2 border",
                        isDis 
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200" 
                          : "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                      )}
                    >
                      {isDis ? "✅ BATALKAN DISKUALIFIKASI" : "❌ DISKUALIFIKASI PESERTA (DIS)"}
                    </button>
                  );
                })()}
              </div>
            </div>
            
            <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
              <button onClick={() => setEditingPlayer(null)} className="flex-1 bg-slate-100 text-slate-500 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors">Tutup</button>
              <button onClick={() => handleUpdatePlayerName(document.getElementById('edit-name-input').value)} className="flex-1 bg-brand-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all">Simpan Nama</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Management Modal */}
      {showArchiveManagement && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowArchiveManagement(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-100 flex flex-col max-h-[85vh]">
            <h3 className="text-xl font-black text-slate-800 mb-1 flex items-center gap-2">
              <Archive className="text-brand-500" size={24}/> Kelola Arsip Turnamen
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Manajemen Riwayat Turnamen Wasit</p>
            
            <div className="space-y-3 overflow-y-auto pr-2 scrollbar-thin flex-1">
              {archivesList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold">Belum ada turnamen yang diarsipkan.</div>
              ) : (
                archivesList.map((archive) => {
                  const dateStr = new Date(archive.archivedAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  return (
                    <div key={archive.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        {archive.logo ? (
                          <img src={archive.logo} alt="Logo" className="w-10 h-10 object-contain rounded-lg border border-slate-100 p-1 bg-white" />
                        ) : (
                          <div className="bg-brand-50 text-brand-600 p-2 rounded-lg">
                            <Trophy size={16} />
                          </div>
                        )}
                        <div className="text-left">
                          <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight leading-none">
                            {archive.title}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                            {archive.organizer} • {dateStr}
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteArchive(archive.id, archive.title)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition-all border border-red-100 hover:border-red-200 active:scale-95 shrink-0"
                        title="Hapus Arsip"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowArchiveManagement(false)} className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm">
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        {currentTournament.isArchived && (
          <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white font-black text-xs md:text-sm uppercase tracking-widest text-center px-4 py-3 flex items-center justify-center gap-2 shadow-inner relative z-30 animate-pulse">
            <Archive size={16}/> Turnamen ini telah diarsipkan dan bersifat final (Read-Only)
          </div>
        )}

        {/* ===== GLOBAL SEEDING SETUP ===== */}
        {(showGlobalSetup || (!currentTournament.pools?.A && !currentTournament.pools?.B && !currentTournament.pools?.C)) ? (
          <SetupWizard
            showGlobalSetup={showGlobalSetup}
            setShowGlobalSetup={setShowGlobalSetup}
            bracketSize={bracketSize}
            setBracketSize={setBracketSize}
            finalFormat={finalFormat}
            setFinalFormat={setFinalFormat}
            doubleLife={doubleLife}
            setDoubleLife={setDoubleLife}
            prelimPointsSystem={prelimPointsSystem}
            setPrelimPointsSystem={setPrelimPointsSystem}
            isOpenTournament={isOpenTournament}
            setIsOpenTournament={setIsOpenTournament}
            logoBase64={logoBase64}
            setLogoBase64={setLogoBase64}
            bulkInput={bulkInput}
            setBulkInput={setBulkInput}
            generateGlobalBracket={generateGlobalBracket}
            role={role}
            tournamentTitle={tournamentTitle}
            setTournamentTitle={setTournamentTitle}
            tournamentOrganizer={tournamentOrganizer}
            setTournamentOrganizer={setTournamentOrganizer}
            hasExistingTournament={!!currentTournament.pools?.A}
            saveGlobalSettings={saveGlobalSettings}
          />
        ) : activePool === 'Final' ? (
          <div className="max-w-7xl mx-auto p-6 md:p-12 animate-slide-up">
            {/* Header Final */}
            <div className="relative mb-8 max-w-3xl mx-auto">
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur-xl opacity-20"></div>
              <div className="relative bg-white border-2 border-yellow-200 rounded-3xl p-8 flex items-center gap-6 shadow-xl">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-2xl text-white shadow-lg"><Trophy size={36}/></div>
                <div>
                  <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">Grand Final</p>
                  <h2 className="text-2xl font-black text-slate-800">{currentTournament.title || tournamentTitle}</h2>
                  <p className="text-xs text-slate-500 font-bold mt-1">{getFinalFormatText()}</p>
                </div>
              </div>
            </div>

            {/* Finalists Status */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8 max-w-3xl mx-auto">
              {finalParticipants.map((p) => (
                <div key={p.pool} className={cn("rounded-2xl p-5 border-2 text-center", p.name ? 'bg-white border-emerald-200' : 'bg-slate-50 border-slate-200')}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-slate-400">Juara Pool {p.pool}</p>
                  <p className={cn("text-sm font-black", p.name ? 'text-slate-800' : 'text-slate-300 italic')}>{ p.name || 'Belum Ada'}</p>
                  {p.name && <div className="mt-2 w-2 h-2 bg-emerald-500 rounded-full mx-auto"></div>}
                </div>
              ))}
            </div>

            {/* Champions Podium */}
            {renderPodium()}

            {/* Referee Quick Setup Panel */}
            {role === 'referee' && (
              <div className="bg-slate-100/80 border-2 border-slate-200/50 p-6 rounded-3xl mb-8 max-w-3xl mx-auto shadow-sm">
                <div className="flex flex-col gap-6">
                  {/* Format Selector */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block text-center md:text-left">Format Bagan Final</label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-200/60 p-1.5 rounded-2xl">
                      {[
                        { id: 'bracket', label: 'Gugur Tunggal' },
                        { id: 'double', label: 'Gugur Ganda' },
                        { id: 'roundrobin', label: 'Round Robin' }
                      ].map(opt => {
                        const isActive = activeBracket?.type === opt.id || (!activeBracket && finalFormat === opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => changeFinalFormat(opt.id)}
                            className={cn(
                              "py-2.5 px-3 rounded-xl text-xs font-black transition-all",
                              isActive
                                ? "bg-white text-slate-800 shadow-md"
                                : "text-slate-450 hover:text-slate-700"
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button 
                      onClick={syncFinalBracket} 
                      className={cn(
                        "flex-1 p-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2", 
                        allFinalistsReady 
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-200' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      )} 
                      disabled={!allFinalistsReady}
                    >
                      <LayoutGrid size={18}/> {activeBracket ? 'Sync Ulang Finalis' : 'Mulai Bagan Final'}
                    </button>
                    {activeBracket && (
                      <button 
                        onClick={resetPool} 
                        className="px-6 py-4 rounded-2xl font-black text-sm text-red-600 border-2 border-red-150 hover:bg-red-50 transition-all bg-white shadow-sm"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Round-Robin Matches */}
            {activeBracket?.type === 'roundrobin' && (
              <div className="space-y-4 max-w-3xl mx-auto">
                <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest mb-4">Pertandingan Final</h3>
                {activeBracket.matches.map((match, idx) => (
                  <div key={match.id} className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pertandingan {idx + 1}</span>
                      <span className="text-[9px] font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-full">{match.label}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[{name: match.player1, slot: 1}, {name: match.player2, slot: 2}].map(p => (
                        <button key={p.slot} onClick={() => setFinalWinner(match.id, p.name)} disabled={role !== 'referee' || !p.name} className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-xl border-2 font-black text-sm transition-all text-left',
                          match.winner === p.name ? 'bg-brand-600 border-brand-600 text-white' : 'bg-slate-50 border-transparent hover:border-brand-200'
                        )}>
                          <div className={cn('w-3 h-3 rounded-full shrink-0', match.winner === p.name ? 'bg-white' : 'bg-slate-300')}/>
                          {p.name || 'TBA'}
                          {match.winner === p.name && <Check size={14} className="ml-auto"/>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Standings Table */}
                <div className="mt-8">
                  <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest mb-4">Klasemen Sementara</h3>
                  <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-4 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3">
                      <div>Nama</div><div className="text-center">M</div><div className="text-center">K</div><div className="text-center">Poin</div>
                    </div>
                    {computeStandings(activeBracket).map((s, i) => (
                      <div key={s.name} className={cn('grid grid-cols-4 px-6 py-4 border-b last:border-0 items-center', i === 0 && 'bg-yellow-50')}>
                        <div className="flex items-center gap-3">
                          {i === 0 && <Trophy size={14} className="text-yellow-500 shrink-0"/>}
                          <span className="font-black text-sm text-slate-800 truncate">{s.name}</span>
                        </div>
                        <div className="text-center font-black text-emerald-600">{s.w}</div>
                        <div className="text-center font-black text-red-500">{s.l}</div>
                        <div className="text-center font-black text-brand-600 text-lg">{s.pts}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tree Bracket Matches (Gugur Tunggal / Gugur Ganda) */}
            {activeBracket && activeBracket.type !== 'roundrobin' && (
              <div className="relative mt-8 border-t border-slate-150 pt-8 overflow-visible">
                <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest mb-6 text-center">Bagan Pertandingan Final</h3>
                <div className="border-2 border-slate-200/60 rounded-3xl bg-slate-100/30 overflow-hidden shadow-inner">
                  {renderBracket()}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!activeBracket && role !== 'referee' && (
              <div className="text-center py-20 max-w-3xl mx-auto"><Trophy size={60} className="text-slate-200 mx-auto mb-4"/><p className="text-slate-400 font-bold">Bagan Final belum dimulai.</p></div>
            )}
          </div>
        ) : (
          /* ===== BAGAN POOL REGULER ===== */
          <div>
            {!activeBracket ? (
              role === 'referee' ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-20 text-center animate-fade-in">
                  <Shuffle size={80} className="text-slate-200 mb-6"/>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Bagan {activePool} Kosong</h2>
                  <p className="text-slate-500 font-bold mt-2 mb-8">Anda harus menggunakan fitur Buat Bagan Otomatis untuk mengisi ulang bagan.</p>
                  <button onClick={() => setShowGlobalSetup(true)} className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-brand-200 hover:bg-brand-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                    <Shuffle size={20}/> BUAT BAGAN OTOMATIS (96 SLOT)
                  </button>
                </div>
              ) : <div className="flex flex-col items-center justify-center min-h-[60vh] p-20 text-center animate-fade-in"><Trophy size={80} className="text-slate-200 mb-6"/><h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Bagan {activePool} Belum Siap</h2><p className="text-slate-400 font-bold mt-2">Menunggu panitia mengunggah daftar peserta.</p></div>
            ) : (
              <div className="relative">
                {/* Reusable Bracket Renderer */}
                {renderBracket()}

                {/* Floating Controls — Zoom + Search */}
                <div className="fixed bottom-28 right-4 z-50 flex flex-col items-center gap-1 select-none">
                  <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col items-center">
                    <button
                      onClick={() => setBracketZoom(z => Math.min(2, parseFloat((z + 0.1).toFixed(1))))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    >
                      <ZoomIn size={18} className="text-slate-700"/>
                    </button>
                    <div className="w-8 h-px bg-slate-200"/>
                    <div className="w-11 h-8 flex items-center justify-center">
                      <span className="text-[9px] font-black text-slate-500">{Math.round(bracketZoom * 100)}%</span>
                    </div>
                    <div className="w-8 h-px bg-slate-200"/>
                    <button
                      onClick={() => setBracketZoom(z => Math.max(0.4, parseFloat((z - 0.1).toFixed(1))))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    >
                      <ZoomOut size={18} className="text-slate-700"/>
                    </button>
                  </div>
                  <button
                    onClick={() => setBracketZoom(1)}
                    className="mt-1 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg px-3 py-1.5 text-[9px] font-black text-slate-500 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                  >
                    RESET
                  </button>
                  {/* Search button in floating pill */}
                  <button
                    onClick={() => { setShowSearch(s => !s); setSearchQuery(''); setSearchResult(null); setTimeout(() => searchInputRef.current?.focus(), 80); }}
                    className={cn(
                      'mt-1 w-11 h-11 flex items-center justify-center rounded-2xl shadow-xl border transition-all',
                      showSearch
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'bg-white/90 backdrop-blur-md border-slate-200 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <Search size={18}/>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Search Modal Overlay — triggered by floating search button */}
      {showSearch && activeBracket && activePool !== 'Final' && (
        <div className="fixed inset-0 z-[55] flex items-start justify-center pt-24 px-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-4 flex items-center gap-3 animate-scale-in">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSearch();
                    if (e.key === 'Escape') { setShowSearch(false); setSearchQuery(''); setSearchResult(null); }
                  }}
                  placeholder="Ketik nama peserta..."
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-200 active:scale-95 shrink-0"
              >
                Cari
              </button>
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResult(null); }}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              >
                <X size={16} className="text-slate-500"/>
              </button>
            </div>
            {searchResult && (
              <p className="text-center text-[11px] font-black text-emerald-600 mt-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                Peserta ditemukan — bagan sudah digulir ke kartu yang dicari
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="bg-white border-t border-slate-200 p-6 flex flex-col items-center justify-center gap-2 z-40 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
          Perkumpulan Pelayang Seluruh Indonesia Kabupaten Majalengka
        </p>
        <p className="text-[11px] font-bold text-slate-400">
          © Copyright by <span className="text-brand-600">Senyap</span>
        </p>
      </footer>

      {winnerConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setWinnerConfirm(null)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-100 text-center">
            <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-100 animate-bounce">
              <Trophy size={32}/>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Konfirmasi Pemenang</h3>
            <p className="text-slate-500 font-bold text-xs leading-relaxed mb-6">
              Apakah Anda yakin ingin menetapkan <strong className="text-brand-600 font-black">{winnerConfirm.winnerName}</strong> sebagai pemenang pertandingan ini?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setWinnerConfirm(null)} className="flex-1 bg-slate-100 text-slate-500 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
              <button 
                onClick={async () => {
                  const { matchId, winnerName, isFinal } = winnerConfirm;
                  if (isFinal) {
                    await executeSetFinalWinner(matchId, winnerName);
                  } else {
                    await executeSetWinner(matchId, winnerName);
                  }
                  setWinnerConfirm(null);
                }} 
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-brand-200 transition-all"
              >
                Ya, Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4 animate-slide-up"><AlertCircle size={20} className="text-brand-400"/><span className="text-sm font-bold">{errorMessage}</span><button onClick={() => setErrorMessage('')} className="p-1 hover:bg-white/10 rounded-lg"><X size={16}/></button></div>}
    </div>
  );
}

