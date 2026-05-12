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
  Clock
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
  setDoc 
} from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  const matchRefs = useRef({});
  const searchInputRef = useRef(null);

  const poolsList = ['A', 'B', 'C', 'Final'];
  const activeBracket = tournamentData.pools?.[activePool];

  // Auto-derive final participants from pool winners
  const finalParticipants = [
    { pool: 'A', name: tournamentData.pools?.A?.matches?.find(m => m.round === tournamentData.pools?.A?.totalRounds)?.winner || null },
    { pool: 'B', name: tournamentData.pools?.B?.matches?.find(m => m.round === tournamentData.pools?.B?.totalRounds)?.winner || null },
    { pool: 'C', name: tournamentData.pools?.C?.matches?.find(m => m.round === tournamentData.pools?.C?.totalRounds)?.winner || null },
  ];
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
        if (snap.exists()) setTournamentData(snap.data());
        else setTournamentData({ pools: {} });
        setLoadingData(false);
      }, (err) => {
        showError("Gagal memuat data turnamen.");
        setLoadingData(false);
      }
    );
    return () => unsub();
  }, [user]);

  // 3. HANDLERS
  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const handleLoginReferee = (e) => {
    e.preventDefault();
    if (e.target.pin.value === '1234') {
      setRole('referee');
      localStorage.setItem('tournament_role', 'referee');
      setIsMenuOpen(false);
    } else {
      showError('PIN Wasit salah!');
    }
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem('tournament_role');
    setIsMenuOpen(false);
  };

  const generateGlobalBracket = async () => {
    let rawNames = bulkInput.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (rawNames.length === 0) return showError("Daftar nama tidak boleh kosong.");
    
    let counter = 1;
    // We need exactly 96 players for 3 pools
    while (rawNames.length < 96) rawNames.push(`Peserta ${counter++}`);
    if (rawNames.length > 96) rawNames = rawNames.slice(0, 96);

    // 1. Identifikasi Tim via Format "[Nama Tim] Peserta"
    const players = rawNames.map((raw, idx) => {
      const match = raw.match(/^\[(.*?)\]\s*(.*)$/);
      if (match) return { team: match[1].trim().toLowerCase(), name: raw };
      return { team: `NONE_${idx}`, name: raw }; // Solo player
    });

    // 2. Kelompokkan berdasarkan tim
    const teamGroups = {};
    players.forEach(p => {
      if (!teamGroups[p.team]) teamGroups[p.team] = [];
      teamGroups[p.team].push(p.name);
    });

    // 3. Urutkan dari tim dengan anggota terbanyak
    const sortedTeams = Object.keys(teamGroups).sort((a, b) => teamGroups[b].length - teamGroups[a].length);

    // 4. Siapkan 3 Pool (A, B, C), masing-masing 8 Sub-Blok (4 slot/blok)
    const poolsMap = {
      'A': Array.from({ length: 8 }, () => []),
      'B': Array.from({ length: 8 }, () => []),
      'C': Array.from({ length: 8 }, () => []),
    };

    const getPoolMembers = (poolId, teamId) => poolsMap[poolId].flat().filter(name => teamGroups[teamId].includes(name));

    // 5. Distribusi Cerdas Global
    for (const team of sortedTeams) {
      for (const member of teamGroups[team]) {
        let validOptions = [];
        for (const poolId of ['A', 'B', 'C']) {
          poolsMap[poolId].forEach((block, bIdx) => {
            if (block.length < 4) validOptions.push({ poolId, bIdx, block });
          });
        }

        // Hitung skor prioritas tiap opsi (semakin kecil skor, semakin prioritas)
        validOptions.forEach(opt => {
          // Hitung Quarter (1 kuarter = 2 sub-blok). Kuarter 0: blok 0-1, dst.
          const qIdx = Math.floor(opt.bIdx / 2);
          const quarterBlocks = [poolsMap[opt.poolId][qIdx * 2], poolsMap[opt.poolId][qIdx * 2 + 1]];
          const quarterMembers = quarterBlocks.flat().filter(name => teamGroups[team].includes(name));

          // Hitung Half / Setengah Bagan (1 Half = 4 sub-blok). Half 0: blok 0-3, Half 1: blok 4-7.
          const hIdx = Math.floor(opt.bIdx / 4);
          const halfBlocks = [
            poolsMap[opt.poolId][hIdx * 4], poolsMap[opt.poolId][hIdx * 4 + 1], 
            poolsMap[opt.poolId][hIdx * 4 + 2], poolsMap[opt.poolId][hIdx * 4 + 3]
          ];
          const halfMembers = halfBlocks.flat().filter(name => teamGroups[team].includes(name));

          opt.poolCount = getPoolMembers(opt.poolId, team).length; // Jauhkan antar pool
          opt.halfCount = halfMembers.length; // Jauhkan antar separuh bagan (mencegah ketemu sebelum Final Pool)
          opt.quarterCount = quarterMembers.length; // Jauhkan antar kuarter (mencegah ketemu di 8 besar)
          opt.blockCount = opt.block.filter(name => teamGroups[team].includes(name)).length; // Jauhkan dalam sub-blok (mencegah ketemu di 16 besar)
          
          opt.totalPoolLength = poolsMap[opt.poolId].flat().length; // Rata jumlah isi pool
          opt.totalBlockLength = opt.block.length; // Rata jumlah isi blok
        });

        // Urutkan prioritas: antar pool -> antar half -> antar kuarter -> antar blok -> seimbang
        validOptions.sort((a, b) => {
          if (a.poolCount !== b.poolCount) return a.poolCount - b.poolCount;
          if (a.halfCount !== b.halfCount) return a.halfCount - b.halfCount;
          if (a.quarterCount !== b.quarterCount) return a.quarterCount - b.quarterCount;
          if (a.blockCount !== b.blockCount) return a.blockCount - b.blockCount;
          if (a.totalPoolLength !== b.totalPoolLength) return a.totalPoolLength - b.totalPoolLength;
          if (a.totalBlockLength !== b.totalBlockLength) return a.totalBlockLength - b.totalBlockLength;
          return 0;
        });

        const bestScore = validOptions[0];
        const bests = validOptions.filter(o => 
          o.poolCount === bestScore.poolCount &&
          o.halfCount === bestScore.halfCount &&
          o.quarterCount === bestScore.quarterCount &&
          o.blockCount === bestScore.blockCount &&
          o.totalPoolLength === bestScore.totalPoolLength &&
          o.totalBlockLength === bestScore.totalBlockLength
        );
        const chosen = bests[Math.floor(Math.random() * bests.length)];
        poolsMap[chosen.poolId][chosen.bIdx].push(member);
      }
    }

    const newData = JSON.parse(JSON.stringify(tournamentData));
    if (!newData.pools) newData.pools = {};

    // 6. Bangun Bracket untuk A, B, C
    ['A', 'B', 'C'].forEach(poolId => {
      poolsMap[poolId].forEach(b => b.sort(() => Math.random() - 0.5));
      const poolNames = poolsMap[poolId].flat();

      let matches = [];
      let matchIdCounter = 1;
      let currentRoundMatches = [];

      for (let i = 0; i < 32; i += 2) {
        const match = { id: `m${matchIdCounter++}`, round: 1, player1: poolNames[i], player2: poolNames[i + 1], winner: null, nextMatchId: null, nextMatchSlot: null };
        matches.push(match);
        currentRoundMatches.push(match);
      }

      let roundNum = 2;
      let prevMatches = currentRoundMatches;
      while (prevMatches.length > 1) {
        currentRoundMatches = [];
        for (let i = 0; i < prevMatches.length; i += 2) {
          const match = { id: `m${matchIdCounter++}`, round: roundNum, player1: null, player2: null, winner: null, nextMatchId: null, nextMatchSlot: null };
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

    if (newData.pools['Final']) delete newData.pools['Final'];

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
      setBulkInput('');
      setShowGlobalSetup(false);
      setActivePool('A');
    } catch (err) {
      showError("Gagal membuat bagan.");
    }
  };

  const setWinner = async (matchId, winnerName) => {
    if (role !== 'referee' || !winnerName) return;
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

  const setMatchState = async (matchId, action) => {
    if (role !== 'referee') return;
    const newData = JSON.parse(JSON.stringify(tournamentData));
    const poolData = newData.pools[activePool];
    if (!poolData) return;

    const match = poolData.matches.find(m => m.id === matchId);
    if (!match) return;

    const now = Date.now();

    if (action === 'play') {
      match.playState = 'playing';
      match.startTime = now;
      if (match.accumulatedTime === undefined) match.accumulatedTime = 0;
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
  };

  const handleUpdatePlayerName = async (newName) => {
    if (!editingPlayer || !newName.trim()) return;
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

  const resetPool = async () => {
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

  // Build/sync round-robin final bracket from pool winners A, B, C
  const syncFinalBracket = async () => {
    const [pA, pB, pC] = finalParticipants.map(p => p.name);
    if (!pA || !pB || !pC) return showError('Semua juara Pool A, B, C harus sudah ada!');
    const matches = [
      { id: 'f1', label: 'Pool A vs Pool B', player1: pA, player2: pB, winner: null },
      { id: 'f2', label: 'Pool A vs Pool C', player1: pA, player2: pC, winner: null },
      { id: 'f3', label: 'Pool B vs Pool C', player1: pB, player2: pC, winner: null },
    ];
    const newData = JSON.parse(JSON.stringify(tournamentData));
    if (!newData.pools) newData.pools = {};
    newData.pools['Final'] = { type: 'roundrobin', matches };
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
    } catch (err) {
      showError('Gagal membuat Bagan Final.');
    }
  };

  const setFinalWinner = async (matchId, winnerName) => {
    if (role !== 'referee' || !winnerName) return;
    const newData = JSON.parse(JSON.stringify(tournamentData));
    const finalData = newData.pools['Final'];
    if (!finalData) return;
    const match = finalData.matches.find(m => m.id === matchId);
    if (!match) return;
    match.winner = match.winner === winnerName ? null : winnerName;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newData);
    } catch (err) {
      showError('Gagal update pemenang final.');
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

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans relative">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-10 text-center text-white">
            <Trophy className="w-14 h-14 text-white mx-auto mb-4 drop-shadow-lg"/>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">PIALA BERGILIR MAJALENGKA</h1>
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
                <input type="password" name="pin" placeholder="Login Wasit" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl outline-none font-bold text-slate-800 focus:border-brand-500 transition-all" required />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl active:scale-95">Login</button>
            </form>
          </div>
        </div>
        {/* Footer for Landing Page */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">© Copyright by Senyap</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-brand-600 p-2.5 rounded-xl shadow-lg shadow-brand-200 hidden md:block">
            <Trophy className="w-6 h-6 text-white"/>
          </div>
          <div>
            <h1 className="font-black text-slate-800 text-sm md:text-xl tracking-tighter leading-none mb-1">
              Turnamen Layangan Piala Bergilir Majalengka
            </h1>
            <p className="text-[9px] md:text-[11px] text-brand-600 font-black uppercase tracking-[0.1em]">
              Kota Angin x Senyap x BL Tempur
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
                <button onClick={() => { setShowGlobalSetup(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-brand-600 text-sm font-bold flex items-center gap-3 hover:bg-brand-50"><Shuffle size={14}/> Pengoclokan Otomatis</button>
                {activeBracket && <button onClick={() => {resetPool(); setIsMenuOpen(false);}} className="w-full text-left px-4 py-3 text-red-600 text-sm font-bold flex items-center gap-3 hover:bg-red-50"><RefreshCw size={14}/> Reset Bagan {activePool}</button>}
              </>
            )}
            <button onClick={logout} className="w-full text-left px-4 py-3 text-slate-600 text-sm font-bold flex items-center gap-3 hover:bg-slate-50"><LogOut size={14}/> Keluar Sistem</button>
          </div>
        )}
      </header>

      {/* Pool Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 flex items-center gap-1 overflow-x-auto sticky top-[77px] z-30 no-scrollbar shadow-sm">
        {poolsList.map(pool => (
          <button key={pool} onClick={() => { setActivePool(pool); setSearchResult(null); setShowSearch(false); setSearchQuery(''); }} className={cn("py-4 px-8 font-black text-xs md:text-sm relative transition-colors", activePool === pool ? (pool === 'Final' ? 'text-yellow-600' : 'text-brand-600') : 'text-slate-400 hover:text-slate-600')}>
            {pool === 'Final' ? 'FINAL' : `BAGAN ${pool}`}
            {activePool === pool && <div className={cn("absolute bottom-0 left-0 right-0 h-1 rounded-t-full", pool === 'Final' ? 'bg-yellow-500 shadow-[0_-2px_10px_rgba(234,179,8,0.4)]' : 'bg-brand-600 shadow-[0_-2px_10px_rgba(16,137,226,0.3)]')}></div>}
          </button>
        ))}
        ))}
      </div>


      {/* Edit Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setEditingPlayer(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-4">Edit Nama Peserta</h3>
            <input autoFocus id="edit-name-input" type="text" defaultValue={editingPlayer.currentName} className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl mb-6 font-bold text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all" onKeyDown={(e) => e.key === 'Enter' && handleUpdatePlayerName(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setEditingPlayer(null)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
              <button onClick={() => handleUpdatePlayerName(document.getElementById('edit-name-input').value)} className="flex-1 bg-brand-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        {/* ===== GLOBAL SEEDING SETUP ===== */}
        {(showGlobalSetup || (!tournamentData.pools?.A && !tournamentData.pools?.B && !tournamentData.pools?.C)) ? (
          role === 'referee' ? (
            <div className="max-w-2xl mx-auto p-4 md:p-8 animate-slide-up">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                {/* Hero Header */}
                <div className="bg-slate-800 p-8 text-white relative overflow-hidden flex items-center justify-between">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Shuffle size={120}/></div>
                  <div className="relative z-10">
                    <h2 className="text-2xl font-black leading-none mb-2">Pengoclokan Global 96 Slot</h2>
                    <p className="text-slate-300 text-sm font-bold">Membangun Bagan A, B, & C Secara Serentak</p>
                  </div>
                  {showGlobalSetup && (
                    <button onClick={() => setShowGlobalSetup(false)} className="relative z-10 bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
                      <X size={20}/>
                    </button>
                  )}
                </div>
                
                {/* Rules & Narrative */}
                <div className="p-4 md:p-8 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-brand-100 p-3 rounded-2xl text-brand-600 shrink-0">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-800 mb-1.5 uppercase tracking-wide">Sistem Seeding Keadilan Mutlak</h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Ditenagai oleh algoritma <strong className="text-brand-600">Smart Global Distribution</strong> kelas turnamen E-Sports. Sistem membaca identitas tim peserta dan mendistribusikannya seadil mungkin secara matematis. Wasit tidak perlu lagi pusing mengatur letak slot secara manual!
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-brand-600">
                        <LayoutGrid size={16} />
                        <h4 className="font-black text-[10px] uppercase tracking-widest">Distribusi Lintas Pool</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                        Jika sebuah tim mendaftar 9 peserta, sistem otomatis membaginya rata: 3 di Bagan A, 3 di Bagan B, dan 3 di Bagan C.
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-emerald-600">
                        <Shield size={16} />
                        <h4 className="font-black text-[10px] uppercase tracking-widest">Anti Perang Saudara</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                        Di dalam satu bagan, anggota tim dipisah paksa ke Kuarter dan Half yang berbeda. <strong>Mustahil bentrok</strong> di babak 32, 16, hingga 8 Besar!
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-yellow-500">
                        <Shuffle size={16} />
                        <h4 className="font-black text-[10px] uppercase tracking-widest">Undian Acak Sempurna</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                        Setelah pemain tim diamankan tempatnya, peserta solo dan sisa slot kosong akan diundi murni dan di-shuffle oleh sistem.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-800 text-white shadow-lg p-5 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5"><Check size={80}/></div>
                    <h4 className="font-black text-[11px] text-brand-400 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                      <AlertCircle size={14}/> Aturan Format Input Wasit (Wajib):
                    </h4>
                    <div className="flex flex-col md:flex-row gap-4 relative z-10">
                      <code className="bg-slate-900/50 p-4 rounded-xl text-sm font-mono font-bold text-slate-300 border border-slate-700 leading-relaxed flex-1">
                        <span className="text-emerald-400">[Senyap]</span> Rian<br/>
                        <span className="text-emerald-400">[Senyap]</span> Budi<br/>
                        <span className="text-yellow-400">[BL Tempur]</span> Joko<br/>
                        <span className="text-slate-400">Peserta Solo Tanpa Tim</span>
                      </code>
                      <div className="flex-1 flex flex-col justify-center">
                        <p className="text-[11px] font-bold text-slate-400 mb-2 leading-relaxed">
                          Gunakan kurung siku <strong className="text-white">[]</strong> untuk menandai nama tim di awal.
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                          Pastikan penulisan nama tim <strong className="text-white">SAMA PERSIS</strong> (ejaan dan spasinya) agar sistem mengenali mereka sebagai satu kesatuan.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-8">
                  <textarea 
                    value={bulkInput} 
                    onChange={(e) => setBulkInput(e.target.value)} 
                    placeholder="[Tim A] Peserta 1&#10;[Tim A] Peserta 2&#10;[Tim B] Peserta 3&#10;Peserta Solo" 
                    rows={12} 
                    className="w-full bg-white border-2 border-slate-200 p-6 rounded-2xl mb-6 font-bold text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none resize-y transition-all shadow-inner" 
                  />
                  <button 
                    onClick={generateGlobalBracket} 
                    className="w-full bg-brand-600 text-white p-5 rounded-2xl font-black shadow-xl shadow-brand-200 hover:bg-brand-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Shuffle size={20}/> OCLOK 96 SLOT SEKARANG
                  </button>
                </div>
              </div>
            </div>
          ) : <div className="flex flex-col items-center justify-center min-h-[60vh] p-20 text-center animate-fade-in"><Trophy size={80} className="text-slate-200 mb-6"/><h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Bagan Belum Siap</h2><p className="text-slate-400 font-bold mt-2">Menunggu panitia mengunggah daftar 96 peserta.</p></div>
        ) : activePool === 'Final' ? (
          <div className="max-w-3xl mx-auto p-6 md:p-12 animate-slide-up">
            {/* Header Final */}
            <div className="relative mb-8">
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur-xl opacity-20"></div>
              <div className="relative bg-white border-2 border-yellow-200 rounded-3xl p-8 flex items-center gap-6 shadow-xl">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-2xl text-white shadow-lg"><Trophy size={36}/></div>
                <div>
                  <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">Grand Final</p>
                  <h2 className="text-2xl font-black text-slate-800">Piala Bergilir Majalengka</h2>
                  <p className="text-xs text-slate-500 font-bold mt-1">Sistem Round-Robin — 3 Finalis Saling Bertemu</p>
                </div>
              </div>
            </div>

            {/* Finalists Status */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {finalParticipants.map((p) => (
                <div key={p.pool} className={cn("rounded-2xl p-5 border-2 text-center", p.name ? 'bg-white border-emerald-200' : 'bg-slate-50 border-slate-200')}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-slate-400">Juara Pool {p.pool}</p>
                  <p className={cn("text-sm font-black", p.name ? 'text-slate-800' : 'text-slate-300 italic')}>{ p.name || 'Belum Ada'}</p>
                  {p.name && <div className="mt-2 w-2 h-2 bg-emerald-500 rounded-full mx-auto"></div>}
                </div>
              ))}
            </div>

            {/* Setup / Reset Button */}
            {role === 'referee' && (
              <div className="mb-8 flex gap-3">
                <button onClick={syncFinalBracket} className={cn("flex-1 p-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2", allFinalistsReady ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed')} disabled={!allFinalistsReady}>
                  <LayoutGrid size={18}/> {activeBracket?.type === 'roundrobin' ? 'Sync Ulang Finalis' : 'Mulai Bagan Final'}
                </button>
                {activeBracket?.type === 'roundrobin' && (
                  <button onClick={resetPool} className="px-6 py-4 rounded-2xl font-black text-sm text-red-600 border-2 border-red-100 hover:bg-red-50 transition-all">
                    Reset
                  </button>
                )}
              </div>
            )}

            {/* Round-Robin Matches */}
            {activeBracket?.type === 'roundrobin' && (
              <div className="space-y-4">
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

            {/* Empty state */}
            {!activeBracket && role !== 'referee' && (
              <div className="text-center py-20"><Trophy size={60} className="text-slate-200 mx-auto mb-4"/><p className="text-slate-400 font-bold">Bagan Final belum dimulai.</p></div>
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
                  <p className="text-slate-500 font-bold mt-2 mb-8">Anda harus menggunakan fitur Pengoclokan Global untuk mengisi ulang bagan.</p>
                  <button onClick={() => setShowGlobalSetup(true)} className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-brand-200 hover:bg-brand-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                    <Shuffle size={20}/> BUKA PENGOCLOKAN GLOBAL (96 SLOT)
                  </button>
                </div>
              ) : <div className="flex flex-col items-center justify-center min-h-[60vh] p-20 text-center animate-fade-in"><Trophy size={80} className="text-slate-200 mb-6"/><h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Bagan {activePool} Belum Siap</h2><p className="text-slate-400 font-bold mt-2">Menunggu panitia mengunggah daftar peserta.</p></div>
            ) : (
              <div className="relative">
                {/* Pinch-to-zoom bracket container */}
                <div
                  className="overflow-auto"
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
                  <div className="p-8 md:p-16 min-w-max pb-40" style={{ transform: `scale(${bracketZoom})`, transformOrigin: 'top left', transition: 'transform 0.15s ease' }}>
                  <div className="flex items-start gap-0">
                    {Array.from({ length: activeBracket.totalRounds }).map((_, idx) => {
                      const roundNum = idx + 1;
                      const matches = activeBracket.matches.filter(m => m.round === roundNum);
                      const roundLabels = ["32 Besar", "16 Besar", "8 Besar", "Semifinal", "Final Pool"];
                      const matchHeight = 164 * Math.pow(2, idx);
                      return (
                        <div key={roundNum} className="flex flex-col" style={{ width: '280px' }}>
                          <div className="h-12 flex items-center border-b-2 border-slate-200 mb-10 mx-4">
                             <span className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">{roundLabels[idx]}</span>
                          </div>
                          <div className="flex flex-col">
                            {matches.map(match => (
                              <div key={match.id} className="relative flex items-center px-4" style={{ height: `${matchHeight}px` }}>
                                <MatchCard
                                  match={match}
                                  role={role}
                                  onSetWinner={setWinner}
                                  onSetMatchState={setMatchState}
                                  onEditName={(slot, name) => setEditingPlayer({matchId: match.id, playerSlot: slot, currentName: name})}
                                  matchRef={el => { matchRefs.current[match.id] = el; }}
                                  highlightedSlot={searchResult?.matchId === match.id ? searchResult.slot : null}
                                />
                                {match.nextMatchId && (
                                  <>
                                    <div className="absolute right-0 top-1/2 w-4 h-0.5 bg-slate-200"></div>
                                    <div className="absolute -right-4 w-0.5 bg-slate-200" style={{ height: `${matchHeight / 2}px`, top: match.nextMatchSlot === 1 ? '50%' : 'auto', bottom: match.nextMatchSlot === 2 ? '50%' : 'auto' }}></div>
                                    {match.nextMatchSlot === 1 && <div className="absolute -right-8 top-[100%] w-4 h-0.5 bg-slate-200"></div>}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex flex-col ml-12">
                       <div className="h-12 flex items-center border-b-2 border-yellow-500 mb-10 mx-4">
                          <span className="text-[11px] font-black text-yellow-600 uppercase tracking-[0.2em]">JUARA POOL {activePool}</span>
                       </div>
                       <div className="flex items-center" style={{ height: '164px' }}>
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
                  </div>
                </div>
                </div>

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
      <footer className="bg-white border-t border-slate-200 p-6 flex flex-col items-center justify-center gap-2 z-40">
        <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kota Angin</p>
           <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senyap</p>
           <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BL Tempur</p>
        </div>
        <p className="text-[11px] font-bold text-slate-400">
          © Copyright by <span className="text-brand-600">Senyap</span>
        </p>
      </footer>

      {errorMessage && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4 animate-slide-up"><AlertCircle size={20} className="text-brand-400"/><span className="text-sm font-bold">{errorMessage}</span><button onClick={() => setErrorMessage('')} className="p-1 hover:bg-white/10 rounded-lg"><X size={16}/></button></div>}
    </div>
  );
}

function MatchCard({ match, role, onSetWinner, onEditName, matchRef, highlightedSlot, onSetMatchState }) {
  const isReferee = role === 'referee';
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval;
    if (match.playState === 'playing') {
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

  return (
    <div className="relative group w-full" ref={matchRef}>
      <div className="absolute -top-3 left-3 px-2 py-0.5 bg-slate-900 rounded shadow-md z-20 flex items-center gap-2">
         <p className="text-[7px] font-black text-white uppercase tracking-widest">Match {match.id.replace('m','')}</p>
         {isPlaying && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
      </div>
      
      {isPlaying && (
        <div className="absolute -top-4 right-4 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-t-lg animate-pulse z-0">
          SEDANG BERTANDING
        </div>
      )}

      <div className={cn(
        "bg-white border-2 rounded-2xl overflow-hidden shadow-sm hover:border-brand-400 hover:shadow-2xl transition-all duration-300 relative z-10 flex flex-col",
        highlightedSlot ? 'border-emerald-400 shadow-lg shadow-emerald-100 ring-4 ring-emerald-400/20' : 
        isPlaying ? 'border-red-500 shadow-lg shadow-red-200 ring-4 ring-red-500/20' : 'border-slate-100'
      )}>
        <div className="flex-1 flex flex-col">
          {[1, 2].map(slot => {
            const playerName = slot === 1 ? match.player1 : match.player2;
            const isWinner = match.winner === playerName && playerName;
            const isHighlighted = highlightedSlot === slot;
            return (
              <div key={slot} className={cn(
                "p-3.5 flex items-center justify-between border-b-2 last:border-0 transition-all duration-300 flex-1",
                isHighlighted ? "bg-emerald-500 text-white" : isWinner ? "bg-brand-600 text-white" : "bg-white"
              )}>
                <button onClick={() => onSetWinner(match.id, playerName)} disabled={!isReferee || !playerName} className="flex-1 flex items-center gap-4 text-left min-w-0">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    isHighlighted ? "bg-white shadow-[0_0_10px_white] animate-pulse" : isWinner ? "bg-white shadow-[0_0_10px_white]" : "bg-slate-200"
                  )}/>
                  <span className={cn(
                    "text-[13px] font-black truncate leading-none",
                    !playerName ? "text-slate-300 italic" : (isHighlighted || isWinner) ? "text-white" : "text-slate-800"
                  )}>{playerName || 'TBA'}</span>
                  {isHighlighted && <span className="ml-auto text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full shrink-0">DITEMUKAN</span>}
                </button>
                {isReferee && playerName && (
                  <button onClick={() => onEditName(slot, playerName)} className={cn("p-1.5 rounded-lg transition-colors ml-2", (isHighlighted || isWinner) ? "text-white/40 hover:text-white" : "text-slate-300 hover:text-brand-600 opacity-0 group-hover:opacity-100")}><Settings size={14}/></button>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Match Controls / Stopwatch */}
        {(match.playState || isReferee) && (
          <div className={cn(
            "flex items-center justify-between px-4 py-2.5 border-t-2",
            isPlaying ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"
          )}>
            <div className={cn("flex items-center gap-2 font-mono text-xs font-black", isPlaying ? "text-red-600" : "text-slate-500")}>
              <Clock size={14}/> {formatTime(elapsed)}
            </div>
            {isReferee && (
              <div className="flex gap-1">
                {isPlaying ? (
                  <button onClick={() => onSetMatchState(match.id, 'pause')} className="p-1.5 text-amber-500 hover:bg-amber-100 rounded transition-colors"><Pause size={14}/></button>
                ) : (
                  <button onClick={() => onSetMatchState(match.id, 'play')} className="p-1.5 text-emerald-500 hover:bg-emerald-100 rounded transition-colors"><Play size={14}/></button>
                )}
                {(match.accumulatedTime > 0 || isPlaying) && (
                  <button onClick={() => onSetMatchState(match.id, 'stop')} className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-red-600 rounded transition-colors"><Square size={14}/></button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
