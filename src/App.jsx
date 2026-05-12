import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Trophy, 
  ChevronRight, 
  RefreshCw, 
  LogOut, 
  Check, 
  AlertCircle, 
  LayoutGrid, 
  UserPlus, 
  Settings,
  X,
  ChevronDown
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
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [tournamentData, setTournamentData] = useState({ pools: {} });
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activePool, setActivePool] = useState('A');
  const [bulkInput, setBulkInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const poolsList = ['A', 'B', 'C', 'D'];

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

    // Shuffle names for fair bracket
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
    
    // Optimistic update logic
    const newData = JSON.parse(JSON.stringify(tournamentData));
    const poolData = newData.pools[activePool];
    if (!poolData) return;

    const matchIndex = poolData.matches.findIndex(m => m.id === matchId);
    const match = poolData.matches[matchIndex];
    
    // Toggle winner if same name clicked
    if (match.winner === winnerName) {
      match.winner = null;
    } else {
      match.winner = winnerName;
    }

    // Cascade changes to next match
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
    
    // Reset winner of next match if player changes
    nextMatch.winner = null;

    // Recurse to next match if exists
    if (nextMatch.nextMatchId) {
      updateNextMatch(matches, nextMatch.nextMatchId, nextMatch.nextMatchSlot, null);
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

  if (!hasConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-red-100">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600"/>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Firebase Belum Dikonfigurasi</h1>
          <p className="text-slate-600 mb-8">
            Silahkan atur <strong>Environment Variables</strong> di Dashboard Vercel Anda (VITE_FIREBASE_API_KEY, dll) untuk menggunakan aplikasi ini.
          </p>
          <div className="bg-slate-50 p-4 rounded-2xl text-left text-xs font-mono text-slate-500 overflow-x-auto">
            VITE_FIREBASE_API_KEY=...<br/>
            VITE_FIREBASE_PROJECT_ID=...
          </div>
        </div>
      </div>
    );
  }

  if (!user || loadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="relative mb-4">
          <RefreshCw className="animate-spin text-brand-600 w-12 h-12"/>
          <Trophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 opacity-50"/>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke Server...</p>
        
        {errorMessage && (
          <div className="mt-8 max-w-sm w-full bg-red-50 border border-red-100 p-4 rounded-2xl animate-slide-up">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <AlertCircle size={18}/>
              <span className="font-bold text-sm">Terjadi Kendala</span>
            </div>
            <p className="text-xs text-red-500 font-medium leading-relaxed mb-4">
              {errorMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-white border border-red-200 text-red-600 py-2 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

        <div className="mt-12 text-center opacity-40">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pastikan Auth & Firestore sudah Aktif di Firebase Console</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-8 text-center text-white relative">
            <div className="absolute top-4 right-4 opacity-20"><LayoutGrid size={80} /></div>
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
                <Trophy className="w-10 h-10 text-white drop-shadow-md"/>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Turnamen Layangan</h1>
              <p className="text-brand-100 text-sm mt-2 font-medium opacity-90">Sistem Bagan Digital v2.0</p>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            {errorMessage && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm flex items-center gap-3 border border-red-100 animate-slide-up">
                <AlertCircle className="w-5 h-5 shrink-0"/> 
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}
            
            <div className="space-y-4">
              <button 
                onClick={() => setRole('spectator')} 
                className="w-full group flex items-center justify-between bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 text-slate-700 p-5 rounded-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white text-brand-600 p-3 rounded-xl shadow-sm group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300">
                    <Users className="w-6 h-6"/>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800">Mode Penonton</h3>
                    <p className="text-xs text-slate-500">Lihat skor & bagan real-time</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors"/>
              </button>
              
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="px-4 bg-white text-slate-400 font-bold">Akses Panitia</span></div>
              </div>

              <form onSubmit={handleLoginReferee} className="space-y-4">
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                  <input 
                    type="password" 
                    name="pin" 
                    placeholder="Masukkan PIN Wasit" 
                    className="w-full bg-slate-50 border border-slate-200 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-slate-800 font-medium" 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-slate-900 hover:bg-black text-white p-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                >
                  <Shield size={18}/>
                  Masuk sebagai Wasit
                </button>
              </form>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by FireBase Real-Time Engine</p>
          </div>
        </div>
      </div>
    );
  }

  const [editingPlayer, setEditingPlayer] = useState(null); // { matchId, playerSlot, currentName }

  const activeBracket = tournamentData.pools?.[activePool];
  const inputtedCount = bulkInput.split('\n').map(n => n.trim()).filter(n => n).length;

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

    // If this player was already the winner, update the winner name too
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 font-sans overflow-hidden">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-200">
            <Trophy className="w-5 h-5 text-white"/>
          </div>
          <div>
            <h1 className="font-extrabold text-slate-800 text-sm md:text-lg tracking-tight leading-none">Turnamen Layangan</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Bagan Pool {activePool}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={cn(
            "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            role === 'referee' ? "bg-slate-900 text-white" : "bg-brand-50 text-brand-700 border border-brand-100"
          )}>
            {role === 'referee' ? <Shield size={12}/> : <Users size={12}/>}
            {role === 'referee' ? 'Mode Wasit' : 'Mode Penonton'}
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
            >
              <Settings className={cn("w-5 h-5 transition-transform duration-300", isMenuOpen && "rotate-90")}/>
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-scale-in">
                  <div className="px-4 py-2 border-b border-slate-50 mb-1 md:hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Role Anda</p>
                    <p className="text-sm font-bold text-brand-600">{role === 'referee' ? 'Wasit' : 'Penonton'}</p>
                  </div>
                  {role === 'referee' && activeBracket && (
                    <button 
                      onClick={() => { resetPool(); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 text-sm font-bold flex items-center gap-3 transition-colors"
                    >
                      <RefreshCw size={16}/> Reset Bagan Ini
                    </button>
                  )}
                  <button 
                    onClick={logout}
                    className="w-full text-left px-4 py-3 text-slate-600 hover:bg-slate-50 text-sm font-bold flex items-center gap-3 transition-colors"
                  >
                    <LogOut size={16}/> Keluar Sistem
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Pool Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 flex items-center gap-1 overflow-x-auto sticky top-[61px] z-30 no-scrollbar shadow-sm">
        {poolsList.map(pool => (
          <button 
            key={pool} 
            onClick={() => setActivePool(pool)} 
            className={cn(
              "py-4 px-6 font-bold text-xs md:text-sm whitespace-nowrap transition-all relative",
              activePool === pool 
                ? "text-brand-600" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            BAGAN {pool}
            {activePool === pool && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-t-full shadow-[0_-2px_8px_rgba(16,137,226,0.4)] animate-fade-in"></div>
            )}
          </button>
        ))}
      </div>

      {errorMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4 animate-slide-up">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
            <AlertCircle className="w-5 h-5 text-brand-400"/>
            <p className="text-sm font-medium">{errorMessage}</p>
            <button onClick={() => setErrorMessage('')} className="ml-auto p-1 hover:bg-white/10 rounded-lg">
              <X size={16}/>
            </button>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setEditingPlayer(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-scale-in">
            <h3 className="text-xl font-black text-slate-800 mb-2">Edit Nama Peserta</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Ubah nama untuk slot ini.</p>
            <input 
              autoFocus
              type="text" 
              defaultValue={editingPlayer.currentName}
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none font-bold text-slate-800 mb-6"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdatePlayerName(e.target.value);
                if (e.key === 'Escape') setEditingPlayer(null);
              }}
              id="edit-name-input"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setEditingPlayer(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-bold transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => handleUpdatePlayerName(document.getElementById('edit-name-input').value)}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-brand-200"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto bg-slate-50">
        {!activeBracket ? (
          role === 'referee' ? (
            <div className="max-w-2xl mx-auto p-6 md:p-12 animate-slide-up">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-brand-100 p-4 rounded-2xl text-brand-600">
                    <UserPlus size={32}/>
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-800">Input Bagan {activePool}</h2>
                    <p className="text-sm text-slate-500 font-medium">Silahkan masukkan 32 nama peserta.</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <textarea 
                      value={bulkInput} 
                      onChange={(e) => setBulkInput(e.target.value)} 
                      placeholder="Contoh:&#10;Budi&#10;Andi&#10;Joko..."
                      rows={10} 
                      className="w-full bg-slate-50 border border-slate-200 p-6 rounded-3xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none text-sm font-medium resize-none transition-all placeholder:text-slate-300" 
                    />
                    <div className={cn(
                      "absolute bottom-4 right-6 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest",
                      inputtedCount === 32 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                    )}>
                      {inputtedCount} / 32 PESERTA
                    </div>
                  </div>
                  
                  <button 
                    onClick={generateBracket} 
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white p-5 rounded-2xl font-bold shadow-lg shadow-brand-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <LayoutGrid size={20}/>
                    Generate Bagan {activePool}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
              <div className="bg-slate-100 p-10 rounded-full mb-6">
                <Trophy className="w-20 h-20 text-slate-300"/>
              </div>
              <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Bagan {activePool} Belum Siap</h2>
            </div>
          )
        ) : (
          <div className="p-4 md:p-12 min-h-full overflow-x-auto bracket-scroll">
            <div className="flex gap-16 md:gap-32 min-w-max pb-16 items-start">
              {Array.from({ length: activeBracket.totalRounds }).map((_, idx) => {
                const roundNum = idx + 1;
                const matchesInRound = activeBracket.matches.filter(m => m.round === roundNum);
                const roundLabels = ["32 Besar", "16 Besar", "Perempat Final", "Semifinal", "Final Pool"];
                
                return (
                  <div key={roundNum} className="flex flex-col w-64 md:w-72">
                    <div className="sticky top-0 bg-slate-50/90 backdrop-blur-sm py-4 z-10 flex items-center gap-3 border-b border-slate-200 mb-8">
                      <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-brand-100">
                        {roundNum}
                      </div>
                      <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">
                        {roundLabels[idx] || `Putaran ${roundNum}`}
                      </h3>
                    </div>

                    <div className="flex flex-col justify-around flex-grow relative" style={{ minHeight: '800px' }}>
                      {matchesInRound.map((match) => (
                        <MatchCard 
                          key={match.id} 
                          match={match} 
                          role={role} 
                          onSetWinner={setWinner} 
                          onEditName={(slot, name) => setEditingPlayer({ matchId: match.id, playerSlot: slot, currentName: name })}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Grand Winner Section */}
              <div className="flex flex-col w-64 md:w-80 pt-16 items-center">
                 <div className="relative group w-full sticky top-48">
                    <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 animate-pulse"></div>
                    <div className="relative bg-white border border-yellow-100 rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[20rem] shadow-2xl">
                      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-2xl shadow-xl shadow-yellow-100 mb-8">
                        <Trophy className="w-16 h-16 text-white drop-shadow-lg"/>
                      </div>
                      <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.4em] mb-3">Juara Pool {activePool}</p>
                      <span className={cn(
                        "text-2xl md:text-3xl font-black tracking-tighter leading-tight break-words px-2",
                        activeBracket.matches.find(m => m.round === activeBracket.totalRounds)?.winner 
                          ? "text-slate-900 bg-clip-text" 
                          : "text-slate-200 italic"
                      )}>
                        {activeBracket.matches.find(m => m.round === activeBracket.totalRounds)?.winner || 'MENUNGGU'}
                      </span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MatchCard({ match, role, onSetWinner, onEditName }) {
  const isReferee = role === 'referee';
  
  return (
    <div className="group relative py-4 w-full">
      {/* Match Label */}
      <div className="absolute -top-1 left-4 px-2 py-0.5 bg-slate-900 rounded-md shadow-lg z-20">
        <p className="text-[7px] font-black text-white uppercase tracking-widest">Match {match.id.replace('m', '')}</p>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-brand-200 hover:shadow-xl hover:shadow-brand-50 transition-all duration-300 overflow-hidden flex flex-col w-full relative z-10">
        {/* Player 1 */}
        <div className={cn(
            "p-4 flex items-center justify-between border-b-2 border-slate-50 transition-all",
            match.winner === match.player1 
              ? "bg-brand-50 text-brand-900" 
              : "bg-white",
            !match.player1 && "bg-slate-50/50"
          )}>
          <button 
            onClick={() => onSetWinner(match.id, match.player1)} 
            disabled={!isReferee || !match.player1} 
            className="flex-1 text-left flex items-center gap-3 min-w-0"
          >
            <div className={cn(
              "w-2.5 h-2.5 rounded-full shrink-0",
              match.winner === match.player1 ? "bg-brand-500 shadow-[0_0_10px_rgba(16,137,226,0.6)]" : "bg-slate-200"
            )} />
            <span className={cn(
              "text-xs md:text-sm font-black truncate",
              !match.player1 ? "text-slate-300 italic" : "text-slate-800",
              match.winner === match.player1 && "text-brand-700"
            )}>
              {match.player1 || 'TBA'}
            </span>
            {match.winner === match.player1 && <Check className="w-3 h-3 text-brand-600 shrink-0"/>}
          </button>
          
          {isReferee && match.player1 && (
            <button 
              onClick={() => onEditName(1, match.player1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-300 hover:text-brand-500 transition-colors ml-2"
            >
              <Settings size={12} className="opacity-50 group-hover:opacity-100"/>
            </button>
          )}
        </div>

        {/* Player 2 */}
        <div className={cn(
            "p-4 flex items-center justify-between transition-all",
            match.winner === match.player2 
              ? "bg-brand-50 text-brand-900" 
              : "bg-white",
            !match.player2 && "bg-slate-50/50"
          )}>
          <button 
            onClick={() => onSetWinner(match.id, match.player2)} 
            disabled={!isReferee || !match.player2} 
            className="flex-1 text-left flex items-center gap-3 min-w-0"
          >
            <div className={cn(
              "w-2.5 h-2.5 rounded-full shrink-0",
              match.winner === match.player2 ? "bg-brand-500 shadow-[0_0_10px_rgba(16,137,226,0.6)]" : "bg-slate-200"
            )} />
            <span className={cn(
              "text-xs md:text-sm font-black truncate",
              !match.player2 ? "text-slate-300 italic" : "text-slate-800",
              match.winner === match.player2 && "text-brand-700"
            )}>
              {match.player2 || 'TBA'}
            </span>
            {match.winner === match.player2 && <Check className="w-3 h-3 text-brand-600 shrink-0"/>}
          </button>

          {isReferee && match.player2 && (
            <button 
              onClick={() => onEditName(2, match.player2)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-300 hover:text-brand-500 transition-colors ml-2"
            >
              <Settings size={12} className="opacity-50 group-hover:opacity-100"/>
            </button>
          )}
        </div>
      </div>
      
      {/* Connector Lines Logic (Desktop) */}
      {match.nextMatchId && (
        <>
          {/* Right horizontal line from current match */}
          <div className="hidden md:block absolute right-[-4rem] top-1/2 w-16 h-0.5 bg-slate-200 group-hover:bg-brand-300 transition-colors -z-10"></div>
          
          {/* Vertical line connecting to the middle point of the pair */}
          <div className={cn(
            "hidden md:block absolute right-[-4rem] w-0.5 bg-slate-200 group-hover:bg-brand-300 transition-colors -z-10",
            match.nextMatchSlot === 1 ? "top-1/2 h-[calc(100%+2rem)]" : "bottom-1/2 h-[calc(100%+2rem)]"
          )}></div>
        </>
      )}
    </div>
  );
}
