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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative">
          <RefreshCw className="animate-spin text-brand-600 w-12 h-12"/>
          <Trophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 opacity-50"/>
        </div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Menghubungkan ke Server...</p>
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

  const activeBracket = tournamentData.pools?.[activePool];
  const inputtedCount = bulkInput.split('\n').map(n => n.trim()).filter(n => n).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 font-sans">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
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
      <div className="bg-white border-b border-slate-200 px-4 flex items-center gap-1 overflow-x-auto sticky top-[61px] z-20 no-scrollbar shadow-sm">
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
                  
                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase">Tips: Jika kurang dari 32, sistem akan mengisi otomatis dengan 'Peserta Kosong'</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
              <div className="bg-slate-100 p-10 rounded-full mb-6">
                <Trophy className="w-20 h-20 text-slate-300"/>
              </div>
              <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Bagan {activePool} Belum Siap</h2>
              <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2 italic">Menunggu panitia mengunggah daftar peserta untuk pool ini.</p>
            </div>
          )
        ) : (
          <div className="p-4 md:p-12 min-h-full overflow-x-auto bracket-scroll">
            <div className="flex gap-12 md:gap-24 min-w-max pb-16 items-start">
              {Array.from({ length: activeBracket.totalRounds }).map((_, idx) => {
                const roundNum = idx + 1;
                const matchesInRound = activeBracket.matches.filter(m => m.round === roundNum);
                
                // Labels for rounds
                const roundLabels = ["Babak 32 Besar", "16 Besar", "Perempat Final", "Semifinal", "Final Pool"];
                
                return (
                  <div key={roundNum} className="flex flex-col gap-8 w-64 md:w-72">
                    <div className="sticky top-0 bg-slate-50/90 backdrop-blur-sm py-2 z-10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                        {roundNum}
                      </div>
                      <h3 className="font-black text-slate-400 text-xs uppercase tracking-[0.2em]">
                        {roundLabels[idx] || `Putaran ${roundNum}`}
                      </h3>
                    </div>

                    <div className="flex flex-col justify-around h-full gap-8">
                      {matchesInRound.map((match) => (
                        <MatchCard 
                          key={match.id} 
                          match={match} 
                          role={role} 
                          onSetWinner={setWinner} 
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Grand Winner of Pool Section */}
              <div className="flex flex-col gap-8 w-64 md:w-80 pt-12 items-center">
                 <div className="relative group w-full">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                    <div className="relative bg-white border border-yellow-100 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[16rem] shadow-2xl">
                      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-5 rounded-2xl shadow-xl shadow-yellow-200 mb-6">
                        <Trophy className="w-12 h-12 text-white drop-shadow-lg"/>
                      </div>
                      <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.3em] mb-2">Pemenang Pool {activePool}</p>
                      <span className={cn(
                        "text-xl md:text-2xl font-black tracking-tighter leading-tight break-words px-2",
                        activeBracket.matches.find(m => m.round === activeBracket.totalRounds)?.winner 
                          ? "text-slate-800" 
                          : "text-slate-300 italic"
                      )}>
                        {activeBracket.matches.find(m => m.round === activeBracket.totalRounds)?.winner || 'BELUM DITENTUKAN'}
                      </span>
                      
                      {activeBracket.matches.find(m => m.round === activeBracket.totalRounds)?.winner && (
                        <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                          <Check size={10}/> LOLOS KE BABAK UTAMA
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Mobile Floating Actions for Admin */}
      {role === 'referee' && !activeBracket && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="bg-slate-900 text-white p-4 rounded-full shadow-2xl"
          >
            <Settings size={24}/>
          </button>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, role, onSetWinner }) {
  const isReferee = role === 'referee';
  
  return (
    <div className="group relative">
      {/* Match Label */}
      <div className="absolute -top-3 left-3 px-2 py-0.5 bg-white border border-slate-100 rounded-md shadow-sm z-10">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Pertandingan {match.id.replace('m', '')}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col w-full">
        {/* Player 1 */}
        <button 
          onClick={() => onSetWinner(match.id, match.player1)} 
          disabled={!isReferee || !match.player1} 
          className={cn(
            "p-4 text-left flex items-center justify-between border-b border-slate-50 transition-all",
            match.winner === match.player1 
              ? "bg-emerald-50 text-emerald-900" 
              : isReferee && match.player1 ? "hover:bg-slate-50" : "",
            !match.player1 ? "bg-slate-50/50" : "bg-white"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-2 h-2 rounded-full",
              match.winner === match.player1 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-200"
            )} />
            <span className={cn(
              "text-xs md:text-sm font-bold truncate pr-2",
              !match.player1 ? "text-slate-300" : "text-slate-700",
              match.winner === match.player1 && "text-emerald-800"
            )}>
              {match.player1 || 'MENUNGGU HASIL'}
            </span>
          </div>
          {match.winner === match.player1 && (
            <div className="bg-emerald-500 p-1 rounded-full">
              <Check className="w-2 h-2 text-white"/>
            </div>
          )}
        </button>

        {/* Player 2 */}
        <button 
          onClick={() => onSetWinner(match.id, match.player2)} 
          disabled={!isReferee || !match.player2} 
          className={cn(
            "p-4 text-left flex items-center justify-between transition-all",
            match.winner === match.player2 
              ? "bg-emerald-50 text-emerald-900" 
              : isReferee && match.player2 ? "hover:bg-slate-50" : "",
            !match.player2 ? "bg-slate-50/50" : "bg-white"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-2 h-2 rounded-full",
              match.winner === match.player2 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-200"
            )} />
            <span className={cn(
              "text-xs md:text-sm font-bold truncate pr-2",
              !match.player2 ? "text-slate-300" : "text-slate-700",
              match.winner === match.player2 && "text-emerald-800"
            )}>
              {match.player2 || 'MENUNGGU HASIL'}
            </span>
          </div>
          {match.winner === match.player2 && (
            <div className="bg-emerald-500 p-1 rounded-full">
              <Check className="w-2 h-2 text-white"/>
            </div>
          )}
        </button>
      </div>
      
      {/* Connector lines visual (Desktop only) */}
      <div className="hidden md:block absolute -right-12 top-1/2 w-12 h-[2px] bg-slate-200 -z-10 group-hover:bg-brand-200 transition-colors"></div>
    </div>
  );
}
