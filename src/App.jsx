import React, { useState, useEffect } from 'react';
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
  ChevronRight
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
  const [role, setRole] = useState(null);
  const [tournamentData, setTournamentData] = useState({ pools: {} });
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activePool, setActivePool] = useState('A');
  const [bulkInput, setBulkInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null); // { matchId, playerSlot, currentName }

  const poolsList = ['A', 'B', 'C', 'D'];
  const activeBracket = tournamentData.pools?.[activePool];

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
      setIsMenuOpen(false);
    } else {
      showError('PIN Wasit salah!');
    }
  };

  const logout = () => {
    setRole(null);
    setIsMenuOpen(false);
  };

  const generateBracket = async () => {
    let names = bulkInput.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (names.length === 0) return showError("Daftar nama tidak boleh kosong.");
    
    let counter = 1;
    while (names.length < 32) names.push(`Peserta ${counter++}`);
    if (names.length > 32) names = names.slice(0, 32);
    names = names.sort(() => Math.random() - 0.5);

    let matches = [];
    let matchIdCounter = 1;
    let currentRoundMatches = [];

    // Round 1
    for (let i = 0; i < 32; i += 2) {
      const match = { 
        id: `m${matchIdCounter++}`, 
        round: 1, 
        player1: names[i], 
        player2: names[i + 1], 
        winner: null, 
        nextMatchId: null, 
        nextMatchSlot: null 
      };
      matches.push(match);
      currentRoundMatches.push(match);
    }

    let roundNum = 2;
    let previousRoundMatches = currentRoundMatches;

    while (previousRoundMatches.length > 1) {
      currentRoundMatches = [];
      for (let i = 0; i < previousRoundMatches.length; i += 2) {
        const match = { 
          id: `m${matchIdCounter++}`, 
          round: roundNum, 
          player1: null, 
          player2: null, 
          winner: null, 
          nextMatchId: null, 
          nextMatchSlot: null 
        };
        matches.push(match);
        currentRoundMatches.push(match);
        
        previousRoundMatches[i].nextMatchId = match.id;
        previousRoundMatches[i].nextMatchSlot = 1;
        previousRoundMatches[i + 1].nextMatchId = match.id;
        previousRoundMatches[i + 1].nextMatchSlot = 2;
      }
      previousRoundMatches = currentRoundMatches;
      roundNum++;
    }

    const newTournamentData = { ...tournamentData };
    if (!newTournamentData.pools) newTournamentData.pools = {};
    newTournamentData.pools[activePool] = { matches, totalRounds: roundNum - 1 };

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
      await setDoc(docRef, newTournamentData);
      setBulkInput('');
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-8 text-center text-white">
            <Trophy className="w-12 h-12 text-white mx-auto mb-4"/>
            <h1 className="text-3xl font-extrabold tracking-tight">Turnamen Layangan</h1>
            <p className="text-brand-100 text-sm mt-2 opacity-90">Sistem Bagan Digital v2.1</p>
          </div>
          <div className="p-8 space-y-6">
            <button onClick={() => setRole('spectator')} className="w-full flex items-center justify-between bg-slate-50 hover:bg-brand-50 border border-slate-200 p-5 rounded-2xl transition-all">
              <div className="flex items-center gap-4 text-left">
                <Users className="w-6 h-6 text-brand-600"/>
                <div><h3 className="font-bold text-slate-800">Mode Penonton</h3><p className="text-xs text-slate-500">Lihat skor & bagan</p></div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300"/>
            </button>
            <form onSubmit={handleLoginReferee} className="space-y-4">
              <input type="password" name="pin" placeholder="PIN Wasit" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none" required />
              <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2"><Shield size={18}/> Masuk Wasit</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-brand-600"/>
          <div><h1 className="font-extrabold text-slate-800 text-sm md:text-lg tracking-tight">Turnamen Layangan</h1><p className="text-[10px] text-slate-500 font-bold uppercase">Pool {activePool}</p></div>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-slate-100 rounded-xl"><Settings className="w-5 h-5"/></button>
        {isMenuOpen && (
          <div className="absolute right-4 top-16 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-scale-in">
            {role === 'referee' && activeBracket && <button onClick={() => {resetPool(); setIsMenuOpen(false);}} className="w-full text-left px-4 py-3 text-red-600 text-sm font-bold flex items-center gap-2"><RefreshCw size={14}/> Reset Bagan</button>}
            <button onClick={logout} className="w-full text-left px-4 py-3 text-slate-600 text-sm font-bold flex items-center gap-2"><LogOut size={14}/> Keluar</button>
          </div>
        )}
      </header>

      {/* Pool Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 flex items-center gap-1 overflow-x-auto sticky top-[61px] z-30 no-scrollbar">
        {poolsList.map(pool => (
          <button key={pool} onClick={() => setActivePool(pool)} className={cn("py-4 px-6 font-bold text-xs md:text-sm relative", activePool === pool ? "text-brand-600" : "text-slate-400")}>
            BAGAN {pool}
            {activePool === pool && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-t-full"></div>}
          </button>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingPlayer(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl p-8 animate-scale-in">
            <h3 className="text-xl font-black text-slate-800 mb-4">Edit Nama</h3>
            <input autoFocus id="edit-name-input" type="text" defaultValue={editingPlayer.currentName} className="w-full bg-slate-50 border p-4 rounded-2xl mb-6 font-bold" onKeyDown={(e) => e.key === 'Enter' && handleUpdatePlayerName(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setEditingPlayer(null)} className="flex-1 bg-slate-100 py-4 rounded-2xl font-bold">Batal</button>
              <button onClick={() => handleUpdatePlayerName(document.getElementById('edit-name-input').value)} className="flex-1 bg-brand-600 text-white py-4 rounded-2xl font-bold">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Bracket */}
      <main className="flex-1 overflow-auto bg-slate-50">
        {!activeBracket ? (
          role === 'referee' ? (
            <div className="max-w-xl mx-auto p-8"><div className="bg-white rounded-3xl p-8 shadow-xl"><h2 className="text-xl font-bold mb-6">Input Bagan {activePool}</h2><textarea value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} placeholder="Tulis 32 nama..." rows={10} className="w-full bg-slate-50 border p-6 rounded-2xl mb-4 font-medium" /><button onClick={generateBracket} className="w-full bg-brand-600 text-white p-4 rounded-2xl font-bold">Generate Bagan</button></div></div>
          ) : <div className="p-20 text-center"><Trophy size={60} className="mx-auto text-slate-200 mb-4"/><h2 className="text-xl font-bold text-slate-300">Bagan Belum Siap</h2></div>
        ) : (
          <div className="p-8 md:p-16 min-w-max">
            <div className="flex gap-16 md:gap-32 items-start">
              {Array.from({ length: activeBracket.totalRounds }).map((_, idx) => {
                const roundNum = idx + 1;
                const matches = activeBracket.matches.filter(m => m.round === roundNum);
                return (
                  <div key={roundNum} className="flex flex-col w-64 md:w-72">
                    <div className="py-2 mb-8 border-b font-black text-xs text-slate-400 uppercase tracking-widest">Babak {idx === 0 ? '32 Besar' : idx === 1 ? '16 Besar' : idx === 2 ? '8 Besar' : idx === 3 ? 'Semifinal' : 'Final'}</div>
                    <div className="flex flex-col justify-around flex-grow gap-8 min-h-[800px]">
                      {matches.map(match => (
                        <MatchCard key={match.id} match={match} role={role} onSetWinner={setWinner} onEditName={(slot, name) => setEditingPlayer({matchId: match.id, playerSlot: slot, currentName: name})}/>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="pt-20 flex flex-col items-center sticky top-20">
                <div className="bg-white border-2 border-yellow-200 rounded-3xl p-10 shadow-2xl text-center">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4"/>
                  <p className="text-[10px] font-black text-yellow-600 uppercase mb-2">Juara Pool {activePool}</p>
                  <h2 className="text-2xl font-black">{activeBracket.matches.find(m => m.round === activeBracket.totalRounds)?.winner || 'MENUNGGU'}</h2>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {errorMessage && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3"><AlertCircle size={16}/><span className="text-xs font-bold">{errorMessage}</span></div>}
    </div>
  );
}

function MatchCard({ match, role, onSetWinner, onEditName }) {
  const isReferee = role === 'referee';
  return (
    <div className="relative group w-full py-2">
      <div className="absolute -top-1 left-2 text-[6px] font-black text-slate-300 uppercase z-20">M{match.id.replace('m','')}</div>
      <div className="bg-white border-2 border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
        {[1, 2].map(slot => {
          const playerName = slot === 1 ? match.player1 : match.player2;
          const isWinner = match.winner === playerName && playerName;
          return (
            <div key={slot} className={cn("p-3 flex items-center justify-between border-b last:border-0", isWinner ? "bg-brand-50" : "bg-white")}>
              <button onClick={() => onSetWinner(match.id, playerName)} disabled={!isReferee || !playerName} className="flex-1 flex items-center gap-2 text-left min-w-0">
                <div className={cn("w-2 h-2 rounded-full", isWinner ? "bg-brand-500" : "bg-slate-200")}/>
                <span className={cn("text-xs font-black truncate", !playerName ? "text-slate-300 italic" : "text-slate-800", isWinner && "text-brand-700")}>{playerName || 'TBA'}</span>
              </button>
              {isReferee && playerName && <button onClick={() => onEditName(slot, playerName)} className="p-1 hover:bg-white rounded opacity-20 group-hover:opacity-100"><Settings size={10}/></button>}
            </div>
          );
        })}
      </div>
      {match.nextMatchId && (
        <>
          <div className="hidden md:block absolute right-[-4rem] top-1/2 w-16 h-0.5 bg-slate-200 group-hover:bg-brand-200 -z-10"></div>
          <div className={cn("hidden md:block absolute right-[-4rem] w-0.5 bg-slate-200 group-hover:bg-brand-200 -z-10", match.nextMatchSlot === 1 ? "top-1/2 h-[calc(100%+2rem)]" : "bottom-1/2 h-[calc(100%+2rem)]")}></div>
        </>
      )}
    </div>
  );
}
