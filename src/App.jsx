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
  Plus,
  Settings,
  X,
  ChevronRight,
  ChevronLeft,
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
  Printer,
  Camera,
  User,
  Key,
  ArrowLeft,
  Edit3,
  Eye,
  Calendar,
  MapPin,
  Phone,
  ExternalLink,
  FileText,
  CheckCircle2,
  Image,
  Sparkles,
  RotateCcw,
  Maximize2
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
import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
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
let app, auth, db, storage;
if (hasConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
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
  const [useLocalPool, setUseLocalPool] = useState(false);
  const [bulkInputLocal, setBulkInputLocal] = useState('');
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
  const [showEditArchiveModal, setShowEditArchiveModal] = useState(false);
  const [editArchiveTitle, setEditArchiveTitle] = useState('');
  const [editArchiveOrganizer, setEditArchiveOrganizer] = useState('');
  const [editArchiveDate, setEditArchiveDate] = useState('');
  const [archiveLogoFile, setArchiveLogoFile] = useState(null);
  const [isSavingArchive, setIsSavingArchive] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxPhotos, setLightboxPhotos] = useState([]);
  const [slideDir, setSlideDir] = useState(1);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const isDraggingLightbox = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef(null);
  const lastTapTime = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartX = useRef(null);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState(null);

  // Upcoming Events State
  const [eventsList, setEventsList] = useState([]);
  const [showEventsHub, setShowEventsHub] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventFormModal, setShowEventFormModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventPosterFile, setEventPosterFile] = useState(null);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [eventDetailTab, setEventDetailTab] = useState('info'); // 'info' | 'poster' | 'rules' | 'participants'
  const [eventParticipantSearch, setEventParticipantSearch] = useState('');
  const [eventFilterStatus, setEventFilterStatus] = useState('all'); // 'all' | 'open' | 'upcoming' | 'closed'

  // Event form fields state
  const [eventFormTitle, setEventFormTitle] = useState('');
  const [eventFormOrganizer, setEventFormOrganizer] = useState('');
  const [eventFormCategory, setEventFormCategory] = useState('');
  const [eventFormDate, setEventFormDate] = useState('');
  const [eventFormTime, setEventFormTime] = useState('');
  const [eventFormLocation, setEventFormLocation] = useState('');
  const [eventFormPrizePool, setEventFormPrizePool] = useState('');
  const [eventFormRegistrationFee, setEventFormRegistrationFee] = useState('');
  const [eventFormContactPerson, setEventFormContactPerson] = useState('');
  const [eventFormStatus, setEventFormStatus] = useState('open'); // 'open' | 'upcoming' | 'closed'
  const [eventFormPosterUrl, setEventFormPosterUrl] = useState('');
  const [eventFormRules, setEventFormRules] = useState('');
  const [eventFormParticipantsText, setEventFormParticipantsText] = useState('');

  // App Settings (for referee password / version)
  const [appSettings, setAppSettings] = useState({ refereePin: 'tempur2026', pinVersion: 1 });
  const [sessionPinVersion, setSessionPinVersion] = useState(() => {
    const v = localStorage.getItem('tournament_pin_version');
    return v ? parseInt(v) : 1;
  });

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

  // Get all unique participant names from other pools for the custom finalists datalist
  const uniqueParticipants = (() => {
    const list = [];
    const seen = new Set();
    Object.keys(currentTournament.pools || {}).forEach(poolId => {
      if (poolId === 'Final') return;
      const matches = currentTournament.pools[poolId].matches || [];
      matches.forEach(m => {
        if (m.player1 && !m.player1.startsWith('BYE_') && !seen.has(m.player1)) {
          seen.add(m.player1);
          list.push({ name: m.player1, pool: poolId });
        }
        if (m.player2 && !m.player2.startsWith('BYE_') && !seen.has(m.player2)) {
          seen.add(m.player2);
          list.push({ name: m.player2, pool: poolId });
        }
      });
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  })();

  const allFinalistsReady = currentTournament.useCustomFinalists
    ? (currentTournament.customFinalists || []).filter(name => name && name.trim() !== '').length >= 2
    : finalParticipants.every(p => p.name);

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

    const eventsCol = collection(db, 'artifacts', appId, 'public', 'data', 'tournament', 'upcoming_events', 'items');
    const unsubEvents = onSnapshot(eventsCol, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push(doc.data());
      });
      list.sort((a, b) => new Date(a.eventDate || a.createdAt) - new Date(b.eventDate || b.createdAt));
      setEventsList(list);
    }, (err) => {
      console.error("Gagal memuat event mendatang:", err);
    });

    // Listen to App Settings for Session / Password Versioning
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'app_settings');
    const unsubSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setAppSettings(snapshot.data());
      } else {
        // First run initialization
        const defaultSettings = { refereePin: 'tempur2026', pinVersion: 1 };
        setDoc(settingsRef, defaultSettings).catch(console.error);
        setAppSettings(defaultSettings);
      }
    });

    return () => {
      unsub();
      unsubArchives();
      unsubEvents();
      unsubSettings();
    };
  }, [user]);

  // Handle force logout if password version increments in database
  useEffect(() => {
    if (role === 'referee') {
      if (appSettings.pinVersion > sessionPinVersion) {
        // Password has been changed by someone else
        setRole(null);
        localStorage.removeItem('tournament_role');
        localStorage.removeItem('tournament_pin_version');
        setErrorMessage('Sesi berakhir: Password wasit telah diubah oleh admin lain. Silakan login kembali.');
        setTimeout(() => setErrorMessage(''), 8000);
      }
    }
  }, [appSettings.pinVersion, sessionPinVersion, role]);

  // Keyboard navigation & zoom shortcuts for lightbox carousel
  useEffect(() => {
    if (lightboxIndex === null || lightboxPhotos.length === 0) return;
    const total = lightboxPhotos.length;
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') {
        if (lightboxZoom === 1) {
          setSlideDir(1);
          setLightboxIndex(i => (i + 1) % total);
          setLightboxZoom(1);
          setLightboxPan({ x: 0, y: 0 });
        }
      } else if (e.key === 'ArrowLeft') {
        if (lightboxZoom === 1) {
          setSlideDir(-1);
          setLightboxIndex(i => (i - 1 + total) % total);
          setLightboxZoom(1);
          setLightboxPan({ x: 0, y: 0 });
        }
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
      } else if (e.key === '+' || e.key === '=') {
        setLightboxZoom(z => Math.min(4, Math.round((z + 0.5) * 10) / 10));
      } else if (e.key === '-' || e.key === '_') {
        setLightboxZoom(z => {
          const next = Math.max(1, Math.round((z - 0.5) * 10) / 10);
          if (next === 1) setLightboxPan({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, lightboxPhotos, lightboxZoom]);

  // Update viewingArchive state if the archive in the list has changed
  useEffect(() => {
    if (viewingArchive) {
      const updated = archivesList.find(a => a.id === viewingArchive.id);
      if (updated) {
        if (JSON.stringify(updated) !== JSON.stringify(viewingArchive)) {
          setViewingArchive(updated);
        }
      }
    }
  }, [archivesList, viewingArchive]);

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
          })()}
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
    if (e.target.pin.value === appSettings.refereePin) {
      setRole('referee');
      localStorage.setItem('tournament_role', 'referee');
      localStorage.setItem('tournament_pin_version', appSettings.pinVersion.toString());
      setSessionPinVersion(appSettings.pinVersion);
      setIsMenuOpen(false);
    } else {
      showError('Password Wasit salah!');
    }
  };

  const handleChangePassword = async () => {
    setIsMenuOpen(false);
    const oldPin = window.prompt("Keamanan: Masukkan password wasit saat ini:");
    if (!oldPin) return;

    if (oldPin !== appSettings.refereePin) {
      alert("Password saat ini salah! Batal mengubah password.");
      return;
    }

    const newPin = window.prompt("Masukkan password wasit BARU:");
    if (!newPin || newPin.trim() === '') {
      alert("Password baru tidak boleh kosong!");
      return;
    }

    try {
      const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'app_settings');
      const nextVersion = appSettings.pinVersion + 1;

      // Update our local session version first so we don't get kicked out by our own change
      setSessionPinVersion(nextVersion);
      localStorage.setItem('tournament_pin_version', nextVersion.toString());

      await setDoc(settingsRef, {
        refereePin: newPin.trim(),
        pinVersion: nextVersion
      }, { merge: true });

      alert("Password wasit berhasil diubah! Anggota wasit di perangkat lain yang sedang aktif harus login ulang.");
    } catch (err) {
      console.error("Gagal mengganti password:", err);
      alert("Terjadi kesalahan saat mengganti password.");
    }
  };

  const logout = () => {
    setRole(null);
    setViewingArchive(null);
    localStorage.removeItem('tournament_role');
    localStorage.removeItem('tournament_pin_version');
    setIsMenuOpen(false);
  };

  const handlePrintPDF = () => {
    if (!activeBracket) return;
    const printUrl = `${window.location.origin}${window.location.pathname}?page=print&pool=${encodeURIComponent(activePool)}`;
    window.open(printUrl, '_blank');
  };


  const generateGlobalBracket = async () => {
    let rawNamesOpen = bulkInput.split('\n').map(n => n.trim()).filter(n => n !== '');
    let rawNamesLocal = (bulkInputLocal || '').split('\n').map(n => n.trim()).filter(n => n !== '');
    
    if (rawNamesOpen.length === 0) return showError("Daftar nama (Open) tidak boleh kosong.");
    if (useLocalPool && rawNamesLocal.length === 0) return showError("Daftar nama (Lokal) tidak boleh kosong saat jalur lokal aktif.");
    
    let capacity = parseInt(bracketSize);
    
    const buildPoolsMap = (namesList, startCharCode) => {
      let cap = capacity;
      if (bracketSize === 'auto') {
        if (namesList.length <= 16) cap = 16;
        else if (namesList.length <= 32) cap = 32;
        else if (namesList.length <= 64) cap = 64;
        else cap = 32;
      }
      
      const pCount = Math.max(1, Math.ceil(namesList.length / cap));
      let pIds = Array.from({ length: pCount }, (_, i) => String.fromCharCode(startCharCode + i));
      
      const fullNames = [...namesList];
      let counter = 1;
      while (fullNames.length < pCount * cap) {
        fullNames.push(`BYE_${Date.now()}_${counter++}`);
      }

      const playerInfoMap = {};
      const teamGroups = {};
      const regionGroups = {};
      
      fullNames.forEach((raw, idx) => {
        let team = 'NONE';
        let region = 'NONE';
        let name = raw;
        
        if (raw.startsWith('BYE_')) {
          team = 'BYE';
          name = raw;
        } else {
          const match = raw.match(/^\[(.*?)-(.*?)\]\s*(.*)$/);
          if (match) {
            region = match[1].trim();
            team = match[2].trim();
            name = match[3].trim();
          } else {
            const fallbackMatch = raw.match(/^\[(.*?)\].*?\s*(.*)$/);
            if (fallbackMatch && !raw.includes('-')) {
               team = fallbackMatch[1].trim();
               name = raw.substring(raw.indexOf(']') + 1).trim();
            } else {
               const m2 = raw.match(/^\[(.*?)\]\s*(.*)$/);
               if (m2) {
                   team = m2[1].trim();
                   name = m2[2].trim();
               }
            }
          }
        }
        
        playerInfoMap[raw] = { team, region, name, originalName: raw, isBye: raw.startsWith('BYE_') };
        if (!teamGroups[team]) teamGroups[team] = [];
        teamGroups[team].push(raw);
        if (region !== 'NONE') {
          if (!regionGroups[region]) regionGroups[region] = [];
          regionGroups[region].push(raw);
        }
      });
      
      const mapObj = {};
      pIds.forEach(p => {
        mapObj[p] = Array.from({ length: cap / 2 }, () => []);
      });

      const getTeamPoolMembers = (map, pId, teamId) => {
        let res = [];
        for (let b of map[pId]) res.push(...b);
        return res.filter(n => playerInfoMap[n]?.team === teamId);
      };
      
      const getRegionPoolMembers = (map, pId, regionId) => {
        let res = [];
        for (let b of map[pId]) res.push(...b);
        return res.filter(n => playerInfoMap[n]?.region === regionId);
      };
      
      const getFinalHalf = (poolId) => {
        const idxx = pIds.indexOf(poolId);
        if (pIds.length === 3) return idxx === 1 ? 1 : 0;
        return idxx % 2;
      };
      
      const getTeamHalfCount = (map, poolId, teamId) => {
        let count = 0;
        const candidateHalf = getFinalHalf(poolId);
        for (const pid of pIds) {
          if (pid === poolId) continue;
          if (getFinalHalf(pid) === candidateHalf) {
            count += getTeamPoolMembers(map, pid, teamId).length;
          }
        }
        return count;
      };

      const sortedTeams = Object.keys(teamGroups)
        .filter(t => t !== 'BYE')
        .sort((a, b) => teamGroups[b].length - teamGroups[a].length);
        
      for (const team of sortedTeams) {
        for (const member of teamGroups[team]) {
          const regionId = playerInfoMap[member].region;
          let validOptions = [];
          
          for (const pid of pIds) {
            for (let bIdx = 0; bIdx < mapObj[pid].length; bIdx++) {
              if (mapObj[pid][bIdx].length < 2) {
                validOptions.push({ poolId: pid, bIdx });
              }
            }
          }
          
          validOptions.forEach(opt => {
            const teamId = playerInfoMap[member].team;
            opt.teamPoolCount = getTeamPoolMembers(mapObj, opt.poolId, teamId).length;
            opt.teamHalfCount = getTeamHalfCount(mapObj, opt.poolId, teamId);
            opt.regionPoolCount = regionId !== 'NONE' ? getRegionPoolMembers(mapObj, opt.poolId, regionId).length : 0;
            opt.teamBlockCount = mapObj[opt.poolId][opt.bIdx].filter(n => playerInfoMap[n]?.team === teamId).length;
            
            let pFlat = [];
            for (let b of mapObj[opt.poolId]) pFlat.push(...b);
            opt.totalPoolLength = pFlat.length;
            opt.totalBlockLength = mapObj[opt.poolId][opt.bIdx].length;
          });
          
          validOptions.sort((a, b) => {
            if (a.teamBlockCount !== b.teamBlockCount) return a.teamBlockCount - b.teamBlockCount;
            if (a.teamPoolCount !== b.teamPoolCount) return a.teamPoolCount - b.teamPoolCount;
            if (a.teamHalfCount !== b.teamHalfCount) return a.teamHalfCount - b.teamHalfCount;
            if (a.regionPoolCount !== b.regionPoolCount) return a.regionPoolCount - b.regionPoolCount;
            if (a.totalPoolLength !== b.totalPoolLength) return a.totalPoolLength - b.totalPoolLength;
            return a.totalBlockLength - b.totalBlockLength;
          });
          
          const chosen = validOptions[0];
          mapObj[chosen.poolId][chosen.bIdx].push(member);
        }
      }
      
      const byePlayers = teamGroups['BYE'] || [];
      let byeIdx = 0;
      pIds.forEach(pId => {
        mapObj[pId].forEach(block => {
          while (block.length < 2 && byeIdx < byePlayers.length) {
            block.push(byePlayers[byeIdx++]);
          }
        });
      });
      
      return { mapObj, pIds, playerInfoMap };
    };

    let poolIds = [];
    let poolsMap = {};
    let playerInfoMap = {};
    
    if (useLocalPool) {
      const openResult = buildPoolsMap(rawNamesOpen, 65);
      const openPoolCount = openResult.pIds.length;
      const nextCharCode = 65 + openPoolCount;
      const localResult = buildPoolsMap(rawNamesLocal, nextCharCode);
      
      poolIds = [...openResult.pIds, ...localResult.pIds];
      poolsMap = { ...openResult.mapObj, ...localResult.mapObj };
      playerInfoMap = { ...openResult.playerInfoMap, ...localResult.playerInfoMap };
    } else {
      const result = buildPoolsMap(rawNamesOpen, 65);
      poolIds = result.pIds;
      poolsMap = result.mapObj;
      playerInfoMap = result.playerInfoMap;
    }

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
      const poolCap = poolNames.length;

      // Reorder pairs supaya setim/sedaerah masuk section bracket berbeda (R2=4, R3=8, R4=16)
      {
        const pairs = [];
        for (let i = 0; i < poolCap; i += 2) pairs.push([poolNames[i], poolNames[i + 1]]);
        let bestPairs = [...pairs], bestScore = Infinity;
        for (let attempt = 0; attempt < 300; attempt++) {
          const sp = [...pairs].sort(() => Math.random() - 0.5);
          const flat = sp.flat();
          let score = 0;
          for (const [sSize, w] of [[4, 1000], [8, 300], [16, 100], [32, 30]]) {
            if (sSize > poolCap) break;
            for (let s = 0; s < poolCap; s += sSize) {
              const sec = flat.slice(s, s + sSize);
              const tc = {}, rc = {};
              sec.forEach(p => {
                if (p.startsWith('BYE_')) return;
                const info = playerInfoMap[p];
                if (!info) return;
                if (info.team !== 'SOLO') tc[info.team] = (tc[info.team] || 0) + 1;
                if (isOpenTournament && info.region !== 'NONE') rc[info.region] = (rc[info.region] || 0) + 1;
              });
              for (const k in tc) if (tc[k] > 1) score += (tc[k] - 1) * w;
              if (isOpenTournament) for (const k in rc) if (rc[k] > 1) score += (rc[k] - 1) * (w >> 1);
            }
          }
          if (score < bestScore) { bestScore = score; bestPairs = sp; }
          if (score === 0) break;
        }
        const reordered = bestPairs.flat();
        for (let i = 0; i < poolCap; i++) poolNames[i] = reordered[i];
      }

      let matches = [];
      let matchIdCounter = 1;
      let currentRoundMatches = [];

      for (let i = 0; i < poolCap; i += 2) {
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
      // Crossover mapping: Pool A (idx 0) → Pool C (idx 0 + poolIds.length), Pool B (idx 1) → Pool D, dst.
      const set2PoolIds = Array.from({ length: poolIds.length }, (_, i) =>
        String.fromCharCode(65 + poolIds.length + i)
      );

      poolIds.forEach((srcPoolId, pIdx) => {
        const crossPoolId = set2PoolIds[pIdx]; // A→C, B→D, C→E (jika ada), dll.
        
        // Ambil pemain dari pool sumber (nyawa 1) untuk dikocok ulang di pool silang
        const srcPlayers = poolsMap[srcPoolId].flat();
        const poolCap = srcPlayers.length;

        let bestShuffle = [...srcPlayers];
        let bestScore = Infinity;
        let attempts = 0;
        let shuffled = [...srcPlayers];

        // Fisher-Yates shuffle per-pool: cari urutan terbaik dengan:
        // 1. Tidak ada pasangan R1 yang sama dengan nyawa 1 (beda lawan - WAJIB)
        // 2. Minimalisir bentrok tim & daerah dalam R1 nyawa 2 serta sebaran Kuarter & Half
        while (attempts < 1500) {
          attempts++;
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          let isOpponentValid = true;
          let score = 0;

          for (let mIdx = 0; mIdx < poolCap; mIdx += 2) {
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
                if (info1.team === info2.team) score += 100;
                if (isOpenTournament && info1.region !== 'NONE' && info1.region === info2.region) score += 50;
              }
            }
          }

          if (isOpponentValid) {
            // Smart distribution penalty: avoid putting same team/region in same block, quarter, or half
            const teamQuarterCounts = {};
            const teamHalfCounts = {};
            const teamBlockCounts = {};
            
            const regionQuarterCounts = {};
            const regionHalfCounts = {};
            const regionBlockCounts = {};

            const blockSize = poolCap / 8;
            const quarterSize = poolCap / 4;
            const halfSize = poolCap / 2;

            for (let i = 0; i < poolCap; i++) {
              const p = shuffled[i];
              if (p.startsWith('BYE_')) continue;
              const info = playerInfoMap[p];
              if (!info) continue;

              const bIdx = Math.floor(i / blockSize);
              const qIdx = Math.floor(i / quarterSize);
              const hIdx = Math.floor(i / halfSize);

              // Team Check
              if (info.team !== 'SOLO' && info.team !== 'BYE') {
                const qKey = info.team + '_' + qIdx;
                const hKey = info.team + '_' + hIdx;
                const bKey = info.team + '_' + bIdx;

                teamQuarterCounts[qKey] = (teamQuarterCounts[qKey] || 0) + 1;
                teamHalfCounts[hKey] = (teamHalfCounts[hKey] || 0) + 1;
                teamBlockCounts[bKey] = (teamBlockCounts[bKey] || 0) + 1;
              }

              // Region Check
              if (isOpenTournament && info.region !== 'NONE' && info.region !== 'BYE') {
                const qKey = info.region + '_' + qIdx;
                const hKey = info.region + '_' + hIdx;
                const bKey = info.region + '_' + bIdx;

                regionQuarterCounts[qKey] = (regionQuarterCounts[qKey] || 0) + 1;
                regionHalfCounts[hKey] = (regionHalfCounts[hKey] || 0) + 1;
                regionBlockCounts[bKey] = (regionBlockCounts[bKey] || 0) + 1;
              }
            }

            // Add team penalties
            for (const key in teamBlockCounts) {
              if (teamBlockCounts[key] > 1) {
                score += (teamBlockCounts[key] - 1) * 1000;
              }
            }
            for (const key in teamQuarterCounts) {
              if (teamQuarterCounts[key] > 1) {
                score += (teamQuarterCounts[key] - 1) * 300;
              }
            }
            for (const key in teamHalfCounts) {
              if (teamHalfCounts[key] > 1) {
                score += (teamHalfCounts[key] - 1) * 100;
              }
            }

            // Add region penalties (lower weight than team)
            if (isOpenTournament) {
              for (const key in regionBlockCounts) {
                if (regionBlockCounts[key] > 1) {
                  score += (regionBlockCounts[key] - 1) * 500;
                }
              }
              for (const key in regionQuarterCounts) {
                if (regionQuarterCounts[key] > 1) {
                  score += (regionQuarterCounts[key] - 1) * 150;
                }
              }
              for (const key in regionHalfCounts) {
                if (regionHalfCounts[key] > 1) {
                  score += (regionHalfCounts[key] - 1) * 50;
                }
              }
            }

            if (score === 0) { bestShuffle = [...shuffled]; bestScore = 0; break; }
            if (score < bestScore) { bestShuffle = [...shuffled]; bestScore = score; }
          }
        }

        // Bangun bracket untuk pool silang menggunakan bestShuffle
        const poolNames = bestShuffle;

        // Reorder pairs supaya setim/sedaerah masuk section bracket berbeda (R2=4, R3=8, R4=16)
        {
          const pairs = [];
          for (let i = 0; i < poolCap; i += 2) pairs.push([poolNames[i], poolNames[i + 1]]);
          let bestPairs = [...pairs], bestScore = Infinity;
          for (let attempt = 0; attempt < 300; attempt++) {
            const sp = [...pairs].sort(() => Math.random() - 0.5);
            const flat = sp.flat();
            let score = 0;
            for (const [sSize, w] of [[4, 1000], [8, 300], [16, 100], [32, 30]]) {
              if (sSize > poolCap) break;
              for (let s = 0; s < poolCap; s += sSize) {
                const sec = flat.slice(s, s + sSize);
                const tc = {}, rc = {};
                sec.forEach(p => {
                  if (p.startsWith('BYE_')) return;
                  const info = playerInfoMap[p];
                  if (!info) return;
                  if (info.team !== 'SOLO') tc[info.team] = (tc[info.team] || 0) + 1;
                  if (isOpenTournament && info.region !== 'NONE') rc[info.region] = (rc[info.region] || 0) + 1;
                });
                for (const k in tc) if (tc[k] > 1) score += (tc[k] - 1) * w;
                if (isOpenTournament) for (const k in rc) if (rc[k] > 1) score += (rc[k] - 1) * (w >> 1);
              }
            }
            if (score < bestScore) { bestScore = score; bestPairs = sp; }
            if (score === 0) break;
          }
          const reordered = bestPairs.flat();
          for (let i = 0; i < poolCap; i++) poolNames[i] = reordered[i];
        }

        let matches = [];
        let matchIdCounter = 1;
        let currentRoundMatches = [];

        // Kocok tiap blok dalam pool untuk pastikan R1 beda lawan & minim bentrok
        const blockSize = poolCap / 8;
        for (let bStart = 0; bStart < poolCap; bStart += blockSize) {
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

        for (let i = 0; i < poolCap; i += 2) {
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
      setBulkInputLocal('');
      setUseLocalPool(false);
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
    const newData = JSON.parse(JSON.stringify(currentTournament));
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
      const docRef = getTournamentDocRef();
      await setDoc(docRef, newData);
      if (viewingArchive) {
        setViewingArchive(newData);
      }
    } catch (err) {
      showError("Gagal mengupdate pemenang.");
    }
  };

  const getTournamentDocRef = () => {
    if (viewingArchive) {
      return doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'archive_hub', 'items', viewingArchive.id);
    }
    return doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
  };

  const compressImage = (file, maxPx = 1920, quality = 0.78) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width >= height) { height = Math.round(height * maxPx / width); width = maxPx; }
          else { width = Math.round(width * maxPx / height); height = maxPx; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handleUploadImage = async (file, path) => {
    if (!storage) {
      showError("Firebase Storage belum dikonfigurasi atau diaktifkan.");
      return null;
    }
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      const code = error?.code || error?.message || 'unknown';
      showError(`Gagal mengunggah gambar ke Firebase Storage. (${code})`);
      return null;
    }
  };

  const handlePodiumPhotoChange = async (e, slot) => {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file, 600, 0.82);
    const path = `winners/${currentTournament.id || 'live'}_podium_${slot}_${Date.now()}.jpg`;
    const url = await handleUploadImage(compressed, path);
    if (url) {
      // Save URL to currentTournament.podiumPhotos
      const newData = JSON.parse(JSON.stringify(currentTournament));
      if (!newData.podiumPhotos) newData.podiumPhotos = {};
      newData.podiumPhotos[slot] = url;
      
      try {
        const docRef = getTournamentDocRef();
        await setDoc(docRef, newData);
        if (viewingArchive) {
          setViewingArchive(newData);
        }
        alert("Foto pemenang berhasil diperbarui.");
      } catch (err) {
        showError("Gagal menyimpan foto pemenang.");
      }
    }
  };

  const triggerPodiumPhotoUpload = (slot) => {
    if (role !== 'referee') return;
    const input = document.getElementById(`podium-upload-input-${slot}`);
    if (input) input.click();
  };

  const handleDocPhotoChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';

    const baseList = JSON.parse(JSON.stringify(
      currentTournament.documentationPhotos ||
      (currentTournament.documentationPhoto ? [currentTournament.documentationPhoto] : [])
    ));
    let runningList = [...baseList];

    for (let i = 0; i < files.length; i++) {
      setGalleryUploadProgress({ current: i + 1, total: files.length, percent: 0 });

      const compressed = await compressImage(files[i], 1920, 0.78);
      setGalleryUploadProgress({ current: i + 1, total: files.length, percent: 10 });

      if (!storage) { showError("Firebase Storage belum dikonfigurasi."); break; }

      const url = await new Promise((resolve) => {
        const storageRef = ref(storage, `gallery/${currentTournament.id || 'live'}_doc_${Date.now()}_${i}.jpg`);
        const task = uploadBytesResumable(storageRef, compressed);
        task.on('state_changed',
          (snap) => {
            const pct = 10 + Math.round((snap.bytesTransferred / snap.totalBytes) * 90);
            setGalleryUploadProgress({ current: i + 1, total: files.length, percent: pct });
          },
          (err) => { console.error(err); resolve(null); },
          async () => { resolve(await getDownloadURL(task.snapshot.ref)); }
        );
      });

      if (url) {
        runningList = [...runningList, url];
        const newData = JSON.parse(JSON.stringify(currentTournament));
        newData.documentationPhotos = runningList;
        newData.documentationPhoto = runningList[0] || null;
        try {
          await setDoc(getTournamentDocRef(), newData);
          if (viewingArchive) setViewingArchive(newData);
        } catch (err) {
          showError("Gagal menyimpan foto dokumentasi.");
        }
      }
    }

    setGalleryUploadProgress(null);
  };

  const handleRemoveDocPhoto = async (index) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus foto dokumentasi ini dari galeri?")) return;
    const newData = JSON.parse(JSON.stringify(currentTournament));
    const currentList = newData.documentationPhotos || (newData.documentationPhoto ? [newData.documentationPhoto] : []);
    const newList = currentList.filter((_, idx) => idx !== index);
    newData.documentationPhotos = newList;
    newData.documentationPhoto = newList[0] || null;
    
    try {
      const docRef = getTournamentDocRef();
      await setDoc(docRef, newData);
      if (viewingArchive) {
        setViewingArchive(newData);
      }
      alert("Foto dokumentasi berhasil dihapus dari galeri.");
    } catch (err) {
      showError("Gagal menghapus foto dokumentasi.");
    }
  };

  const handlePasteImage = async (e, target) => {
    if (role !== 'referee') return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;

        e.preventDefault();

        if (target === 'archive_logo') {
          setArchiveLogoFile(file);
          alert("Gambar berhasil ditempel dari clipboard sebagai Logo Baru.");
        } else if (target === 'event_poster') {
          setEventPosterFile(file);
          alert("Pamflet event berhasil ditempel dari clipboard!");
        } else if (target === 'j1' || target === 'j2' || target === 'j3' || target === 'j4') {
          const compressed = await compressImage(file, 600, 0.82);
          const path = `winners/${currentTournament.id || 'live'}_podium_${target}_${Date.now()}.jpg`;
          const url = await handleUploadImage(compressed, path);
          if (url) {
            const newData = JSON.parse(JSON.stringify(currentTournament));
            if (!newData.podiumPhotos) newData.podiumPhotos = {};
            newData.podiumPhotos[target] = url;
            try {
              const docRef = getTournamentDocRef();
              await setDoc(docRef, newData);
              if (viewingArchive) {
                setViewingArchive(newData);
              }
              alert(`Foto Podium ${target.toUpperCase().replace('J', 'Juara ')} berhasil diperbarui dari clipboard.`);
            } catch (err) {
              showError("Gagal menyimpan foto podium.");
            }
          }
        } else if (target === 'doc') {
          const compressed = await compressImage(file, 1920, 0.78);
          const path = `gallery/${currentTournament.id || 'live'}_doc_${Date.now()}.jpg`;
          const url = await handleUploadImage(compressed, path);
          if (url) {
            const newData = JSON.parse(JSON.stringify(currentTournament));
            const currentList = newData.documentationPhotos || (newData.documentationPhoto ? [newData.documentationPhoto] : []);
            const newList = [...currentList, url];
            newData.documentationPhotos = newList;
            newData.documentationPhoto = newList[0] || null;
            try {
              const docRef = getTournamentDocRef();
              await setDoc(docRef, newData);
              if (viewingArchive) {
                setViewingArchive(newData);
              }
              alert("Foto dokumentasi berhasil ditambahkan ke galeri dari clipboard.");
            } catch (err) {
              showError("Gagal menyimpan foto dokumentasi.");
            }
          }
        }
        break;
      }
    }
  };

  // ----------------------------------------------------
  // UPCOMING EVENTS CRUD HANDLERS
  // ----------------------------------------------------
  const handleOpenAddEvent = () => {
    setEditingEvent(null);
    setEventFormTitle('');
    setEventFormOrganizer(tournamentOrganizer || 'PELANGI Majalengka');
    setEventFormCategory('Aduan Standar 54/58 (Open Nasional)');
    setEventFormDate('');
    setEventFormTime('08:00 WIB - Selesai');
    setEventFormLocation('Lapang Sirkuit Gelora Majalengka, Jawa Barat');
    setEventFormPrizePool('Rp 25.000.000 + Piala Bergilir & Piagam');
    setEventFormRegistrationFee('Rp 150.000 / Peserta');
    setEventFormContactPerson('081234567890 (Panitia)');
    setEventFormStatus('open');
    setEventFormPosterUrl('');
    setEventFormRules(`1. Layangan aduan ukuran standar 54/58 cm.
2. Benang gelasan bebas (tidak boleh mengandung kawat/metal).
3. Peserta wajib hadir 30 menit sebelum jadwal pertandingan.
4. Sistem gugur (Single Elimination / Double Elimination).
5. Keputusan wasit bersifat mutlak dan tidak dapat diganggu gugat.`);
    setEventFormParticipantsText('');
    setEventPosterFile(null);
    setShowEventFormModal(true);
  };

  const handleOpenEditEvent = (evt) => {
    setEditingEvent(evt);
    setEventFormTitle(evt.title || '');
    setEventFormOrganizer(evt.organizer || '');
    setEventFormCategory(evt.category || '');
    setEventFormDate(evt.eventDate || '');
    setEventFormTime(evt.eventTime || '');
    setEventFormLocation(evt.location || '');
    setEventFormPrizePool(evt.prizePool || '');
    setEventFormRegistrationFee(evt.registrationFee || '');
    setEventFormContactPerson(evt.contactPerson || '');
    setEventFormStatus(evt.status || 'open');
    setEventFormPosterUrl(evt.posterUrl || '');
    setEventFormRules(evt.rules || '');
    setEventFormParticipantsText(Array.isArray(evt.participants) ? evt.participants.join('\n') : (evt.participants || ''));
    setEventPosterFile(null);
    setShowEventFormModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (role !== 'referee') return;
    if (!eventFormTitle.trim()) return showError("Judul event tidak boleh kosong.");

    setIsSavingEvent(true);
    try {
      let finalPosterUrl = eventFormPosterUrl;
      if (eventPosterFile) {
        const compressed = await compressImage(eventPosterFile, 1200, 0.85);
        const path = `events/poster_${Date.now()}_${eventPosterFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const url = await handleUploadImage(compressed, path);
        if (url) {
          finalPosterUrl = url;
        }
      }

      const participantsList = eventFormParticipantsText
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const eventId = editingEvent?.id || ('event_' + Date.now());
      const eventDoc = {
        id: eventId,
        title: eventFormTitle.trim(),
        organizer: eventFormOrganizer.trim(),
        category: eventFormCategory.trim(),
        eventDate: eventFormDate.trim(),
        eventTime: eventFormTime.trim(),
        location: eventFormLocation.trim(),
        prizePool: eventFormPrizePool.trim(),
        registrationFee: eventFormRegistrationFee.trim(),
        contactPerson: eventFormContactPerson.trim(),
        status: eventFormStatus,
        posterUrl: finalPosterUrl || null,
        rules: eventFormRules.trim(),
        participants: participantsList,
        updatedAt: new Date().toISOString(),
        createdAt: editingEvent?.createdAt || new Date().toISOString()
      };

      const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'upcoming_events', 'items', eventId);
      await setDoc(eventRef, eventDoc);

      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent(eventDoc);
      }

      setShowEventFormModal(false);
      setIsSavingEvent(false);
      alert("Event berhasil disimpan!");
    } catch (err) {
      console.error("Gagal menyimpan event:", err);
      showError("Gagal menyimpan event.");
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId, title) => {
    if (role !== 'referee') return;
    if (!window.confirm(`Hapus event "${title}" secara permanen?`)) return;

    try {
      const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'upcoming_events', 'items', eventId);
      await deleteDoc(eventRef);
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null);
      }
      alert("Event berhasil dihapus.");
    } catch (err) {
      console.error("Gagal menghapus event:", err);
      showError("Gagal menghapus event.");
    }
  };

  const handleOpenEditArchiveModal = () => {
    if (!viewingArchive) return;
    setEditArchiveTitle(viewingArchive.title || '');
    setEditArchiveOrganizer(viewingArchive.organizer || '');
    if (viewingArchive.archivedAt) {
      const d = new Date(viewingArchive.archivedAt);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const ddVal = String(d.getDate()).padStart(2, '0');
      setEditArchiveDate(`${yyyy}-${mm}-${ddVal}`);
    } else {
      setEditArchiveDate('');
    }
    setArchiveLogoFile(null);
    setShowEditArchiveModal(true);
  };

  const handleSaveArchiveEdit = async (e) => {
    e.preventDefault();
    if (!viewingArchive) return;
    setIsSavingArchive(true);

    try {
      let logoUrl = viewingArchive.logo || null;

      // Handle logo upload if a new file is selected
      if (archiveLogoFile) {
        const path = `logos/${viewingArchive.id}_logo_${Date.now()}.png`;
        const uploadedUrl = await handleUploadImage(archiveLogoFile, path);
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      let archivedAtIso = viewingArchive.archivedAt;
      if (editArchiveDate) {
        archivedAtIso = new Date(editArchiveDate + 'T12:00:00').toISOString();
      }

      const newData = {
        ...viewingArchive,
        title: editArchiveTitle,
        organizer: editArchiveOrganizer,
        archivedAt: archivedAtIso,
        logo: logoUrl,
      };

      const docRef = getTournamentDocRef();
      await setDoc(docRef, newData);

      setViewingArchive(newData);
      setShowEditArchiveModal(false);
      alert("Detail arsip berhasil diperbarui.");
    } catch (err) {
      console.error("Error updating archive details:", err);
      showError("Gagal memperbarui detail arsip.");
    } finally {
      setIsSavingArchive(false);
    }
  };

  const setWinner = async (matchId, winnerName, isDecrement = false) => {
    if (viewingArchive && role !== 'referee') return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (role !== 'referee' || !winnerName) return;
    if (!viewingArchive && tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    const poolData = currentTournament.pools[activePool];
    if (!poolData) return;
    const match = poolData.matches.find(m => m.id === matchId);
    if (!match) return;

    const isPrelimPoints =
      currentTournament.prelimPointsSystem === 'all' ||
      ((currentTournament.prelimPointsSystem === 'prelim' || currentTournament.prelimPointsSystem === true) && match.round === 1);

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
          if (window.confirm(`Apakah Anda yakin ingin menambah 1 poin untuk ${winnerName}?`)) {
            await executeSetPoints(matchId, winnerName, 1, null);
          }
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
    const newData = JSON.parse(JSON.stringify(currentTournament));
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
      const docRef = getTournamentDocRef();
      await setDoc(docRef, newData);
      if (viewingArchive) {
        setViewingArchive(newData);
      }
    } catch (err) {
      showError("Gagal mengupdate poin penyisihan.");
    }
  };

  const setMatchState = async (matchId, action) => {
    if (viewingArchive && role !== 'referee') return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (role !== 'referee') return;
    if (!viewingArchive && tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    const newData = JSON.parse(JSON.stringify(currentTournament));
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
      const docRef = getTournamentDocRef();
      await setDoc(docRef, newData);
      if (viewingArchive) {
        setViewingArchive(newData);
      }
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
    if (viewingArchive && role !== 'referee') return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (!editingPlayer || !newName.trim()) return;
    if (!viewingArchive && tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    const { matchId, playerSlot } = editingPlayer;
    const newData = JSON.parse(JSON.stringify(currentTournament));
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
      const docRef = getTournamentDocRef();
      await setDoc(docRef, newData);
      if (viewingArchive) {
        setViewingArchive(newData);
      }
      setEditingPlayer(null);
    } catch (err) {
      showError("Gagal mengubah nama peserta.");
    }
  };

  const handleDisqualifyPlayer = async (matchId, playerSlot) => {
    if (viewingArchive && role !== 'referee') return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (role !== 'referee') return;
    if (!viewingArchive && tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    const newData = JSON.parse(JSON.stringify(currentTournament));
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
      const docRef = getTournamentDocRef();
      await setDoc(docRef, newData);
      if (viewingArchive) {
        setViewingArchive(newData);
      }
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
      prelimPointsSystem: tournamentData.prelimPointsSystem !== undefined ? tournamentData.prelimPointsSystem : prelimPointsSystem,
      isOpenTournament: tournamentData.isOpenTournament !== undefined ? tournamentData.isOpenTournament : isOpenTournament,
      finalFormat: tournamentData.finalFormat !== undefined ? tournamentData.finalFormat : finalFormat,
      useCustomFinalists: tournamentData.useCustomFinalists || false,
      customFinalistsCount: tournamentData.customFinalistsCount || 4,
      customFinalists: tournamentData.customFinalists || [],
      podiumPhotos: tournamentData.podiumPhotos || {},
      documentationPhotos: tournamentData.documentationPhotos || (tournamentData.documentationPhoto ? [tournamentData.documentationPhoto] : []),
      documentationPhoto: tournamentData.documentationPhoto || null,
      pools: tournamentData.pools || {},
      archivedAt: new Date().toISOString(),
      isArchived: true
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

  const getChampionsForBracket = (bracket) => {
    if (!bracket || !bracket.matches) return null;
    let j1 = null, j2 = null, j3 = null, j4 = null;

    if (bracket.type === 'roundrobin') {
      const standings = computeStandings(bracket);
      if (bracket.matches.some(m => m.winner)) {
        j1 = standings[0]?.name || null;
        j2 = standings[1]?.name || null;
        j3 = standings[2]?.name || null;
        j4 = standings[3]?.name || null;
      }
    } else if (bracket.type === 'double') {
      const fm4 = bracket.matches.find(m => m.id === 'fm4');
      const fm3 = bracket.matches.find(m => m.id === 'fm3');
      j1 = fm4?.winner || null;
      if (j1 && fm4) {
        j2 = j1 === fm4.player1 ? fm4.player2 : fm4.player1;
      }
      j3 = fm3?.winner || null;
      if (j3 && fm3) {
        j4 = j3 === fm3.player1 ? fm3.player2 : fm3.player1;
      }
    } else {
      const totalR = bracket.totalRounds || 1;
      const finalMatch = bracket.matches.find(m => m.round === totalR);
      j1 = finalMatch?.winner || null;
      if (j1 && finalMatch) {
        j2 = j1 === finalMatch.player1 ? finalMatch.player2 : finalMatch.player1;
      }
      if (totalR > 1) {
        const sfMatches = bracket.matches.filter(m => m.round === totalR - 1);
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

  const getChampions = () => getChampionsForBracket(activeBracket);

  const getArchiveChampion = (archive) => {
    if (!archive) return null;
    if (archive.champion) return archive.champion;
    if (archive.winner) return archive.winner;
    
    // Check pools.Final or pools.FINAL
    const finalBracket = archive.pools?.Final || archive.pools?.FINAL || archive.pools?.final;
    if (finalBracket) {
      const res = getChampionsForBracket(finalBracket);
      if (res?.j1) return res.j1;
    }

    // Check all pools in archive
    if (archive.pools) {
      for (const p of Object.keys(archive.pools)) {
        const res = getChampionsForBracket(archive.pools[p]);
        if (res?.j1) return res.j1;
      }
    }

    return null;
  };

  const renderPodium = () => {
    const champs = getChampions();
    if (!champs || (!champs.j1 && !champs.j2 && !champs.j3 && !champs.j4)) return null;

    const isBracket = activeBracket?.type === 'bracket';
    const podiumPhotos = currentTournament.podiumPhotos || {};

    const openPodiumLightbox = (slot) => {
      const photos = [];
      if (podiumPhotos.j1) photos.push(podiumPhotos.j1);
      if (podiumPhotos.j2) photos.push(podiumPhotos.j2);
      if (podiumPhotos.j3) photos.push(podiumPhotos.j3);
      if (podiumPhotos.j4) photos.push(podiumPhotos.j4);
      const targetPhoto = podiumPhotos[slot];
      if (targetPhoto) {
        const idx = photos.indexOf(targetPhoto);
        setLightboxPhotos(photos.length > 0 ? photos : [targetPhoto]);
        setSlideDir(1);
        setLightboxIndex(idx >= 0 ? idx : 0);
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
      }
    };

    return (
      <div className="mb-10 max-w-3xl mx-auto p-4 sm:p-6 md:p-8 bg-white border-[3px] border-black shadow-brutal relative overflow-hidden animate-slide-up">
        <div className="relative text-center mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-1.5 bg-safety-orange text-white px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 border border-black shadow-brutal-sm">
            <Trophy size={12} className="stroke-[2.5]" /> Podium Kejuaraan
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">Podium Juara</h3>
          <p className="text-[10px] sm:text-xs text-black font-bold uppercase mt-1">{currentTournament.title || 'Selamat kepada para juara'}</p>
        </div>

        {/* 3D Podium container */}
        <div className="flex items-end justify-center gap-1.5 sm:gap-4 md:gap-6 pt-10 sm:pt-16 pb-1 select-none max-w-lg mx-auto w-full px-1 sm:px-4">
          
          {/* 2nd Place: Silver (Left) */}
          {champs.j2 && (
            <div className="w-1/3 flex flex-col items-center justify-end z-10 relative animate-fade-in-left">
              {/* Avatar section */}
              <div className="relative mb-2 sm:mb-3 flex flex-col items-center">
                <input 
                  type="file" 
                  id="podium-upload-input-j2" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handlePodiumPhotoChange(e, 'j2')}
                />
                <div 
                  onClick={() => {
                    if (podiumPhotos.j2) {
                      openPodiumLightbox('j2');
                    } else if (role === 'referee') {
                      triggerPodiumPhotoUpload('j2');
                    }
                  }}
                  tabIndex={role === 'referee' || podiumPhotos.j2 ? 0 : -1}
                  onPaste={(e) => handlePasteImage(e, 'j2')}
                  title={podiumPhotos.j2 ? "Klik untuk melihat foto lebih besar / zoom" : (role === 'referee' ? "Klik untuk memilih file foto" : undefined)}
                  className={cn(
                    "w-11 h-11 sm:w-14 sm:h-14 md:w-18 md:h-18 border-[2px] sm:border-[3px] border-black shadow-brutal-sm overflow-hidden bg-surface-variant flex items-center justify-center text-black relative transition-transform hover:scale-105 focus:outline-none",
                    (podiumPhotos.j2 || role === 'referee') && "cursor-pointer group"
                  )}
                >
                  {podiumPhotos.j2 ? (
                    <img src={podiumPhotos.j2} alt="Silver" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-black" />
                  )}
                  {role === 'referee' && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerPodiumPhotoUpload('j2');
                      }}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[7px] sm:text-[8px] font-black text-center p-0.5 uppercase leading-none"
                    >
                      <Camera size={12} className="mb-0.5" />
                      <span>{podiumPhotos.j2 ? 'Ganti' : 'Foto'}</span>
                    </div>
                  )}
                </div>
                <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 bg-surface-variant text-black text-[7px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 border border-black flex items-center gap-0.5 sm:gap-1 shrink-0 whitespace-nowrap shadow-brutal-sm">
                  <Medal size={9} className="stroke-[2.5]" /> Silver
                </div>
              </div>

              {/* Name */}
              <div className="w-full text-center my-1 sm:my-2 px-0.5">
                <p className="text-[9px] sm:text-[11px] md:text-xs font-black text-black uppercase tracking-tight truncate max-w-full block">
                  {champs.j2}
                </p>
              </div>

              {/* 3D step block */}
              <div className="w-full bg-surface-variant border-[2px] sm:border-[3px] border-black shadow-brutal h-18 sm:h-24 md:h-30 flex flex-col items-center justify-center text-black relative">
                <span className="text-2xl sm:text-4xl md:text-5xl font-black text-black">2</span>
              </div>
            </div>
          )}

          {/* 1st Place: Gold (Center) */}
          {champs.j1 && (
            <div className="w-1/3 flex flex-col items-center justify-end z-20 relative animate-scale-in">
              {/* Avatar section */}
              <div className="relative mb-2 sm:mb-3 flex flex-col items-center">
                <input 
                  type="file" 
                  id="podium-upload-input-j1" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handlePodiumPhotoChange(e, 'j1')}
                />
                <div 
                  onClick={() => {
                    if (podiumPhotos.j1) {
                      openPodiumLightbox('j1');
                    } else if (role === 'referee') {
                      triggerPodiumPhotoUpload('j1');
                    }
                  }}
                  tabIndex={role === 'referee' || podiumPhotos.j1 ? 0 : -1}
                  onPaste={(e) => handlePasteImage(e, 'j1')}
                  title={podiumPhotos.j1 ? "Klik untuk melihat foto lebih besar / zoom" : (role === 'referee' ? "Klik untuk memilih file foto" : undefined)}
                  className={cn(
                    "w-14 h-14 sm:w-18 sm:h-18 md:w-22 md:h-22 border-[2px] sm:border-[3px] border-black shadow-brutal overflow-hidden bg-white flex items-center justify-center text-black relative transition-transform hover:scale-105 focus:outline-none",
                    (podiumPhotos.j1 || role === 'referee') && "cursor-pointer group"
                  )}
                >
                  {podiumPhotos.j1 ? (
                    <img src={podiumPhotos.j1} alt="Gold" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-black" />
                  )}
                  {role === 'referee' && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerPodiumPhotoUpload('j1');
                      }}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[7px] sm:text-[8px] font-black text-center p-0.5 uppercase leading-none"
                    >
                      <Camera size={14} className="mb-0.5" />
                      <span>{podiumPhotos.j1 ? 'Ganti' : 'Foto'}</span>
                    </div>
                  )}
                </div>
                {/* Crown Icon */}
                <div className="absolute -top-5 sm:-top-7 left-1/2 -translate-x-1/2 text-black animate-bounce" style={{ animationDuration: '3s' }}>
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 stroke-[2.5]" fill="currentColor" />
                </div>
                <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[7px] sm:text-[9px] font-black px-1.5 sm:px-2.5 py-0.5 border border-black flex items-center gap-0.5 sm:gap-1 shrink-0 whitespace-nowrap shadow-brutal-sm">
                  <Trophy size={9} className="stroke-[2.5]" /> Gold
                </div>
              </div>

              {/* Name */}
              <div className="w-full text-center my-1 sm:my-2 px-0.5">
                <p className="text-[10px] sm:text-xs md:text-sm font-black text-black uppercase tracking-tight truncate max-w-full block">
                  {champs.j1}
                </p>
              </div>

              {/* 3D step block */}
              <div className="w-full bg-warning-red border-[2px] sm:border-[3px] border-black shadow-brutal h-24 sm:h-32 md:h-40 flex flex-col items-center justify-center text-white relative">
                <span className="text-3xl sm:text-5xl md:text-6xl font-black text-white">1</span>
                <Trophy size={16} className="text-white absolute bottom-2 hidden sm:block" />
              </div>
            </div>
          )}

          {/* 3rd Place: Bronze (Right) */}
          {(champs.j3 || (isBracket && champs.j4)) && (
            <div className="w-1/3 flex flex-col items-center justify-end z-10 relative animate-fade-in-right">
              {/* Avatar section */}
              <div className="relative mb-2 sm:mb-3 flex flex-col items-center">
                {/* Inputs for j3 & j4 */}
                <input 
                  type="file" 
                  id="podium-upload-input-j3" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handlePodiumPhotoChange(e, 'j3')}
                />
                {isBracket && champs.j4 && (
                  <input 
                    type="file" 
                    id="podium-upload-input-j4" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handlePodiumPhotoChange(e, 'j4')}
                  />
                )}

                {/* Show joint avatars side by side if isBracket and both exist */}
                {isBracket && champs.j3 && champs.j4 ? (
                  <div className="flex gap-0.5 justify-center">
                    <div 
                      onClick={() => {
                        if (podiumPhotos.j3) {
                          openPodiumLightbox('j3');
                        } else if (role === 'referee') {
                          triggerPodiumPhotoUpload('j3');
                        }
                      }}
                      tabIndex={role === 'referee' || podiumPhotos.j3 ? 0 : -1}
                      onPaste={(e) => handlePasteImage(e, 'j3')}
                      title={podiumPhotos.j3 ? "Klik untuk melihat foto lebih besar / zoom" : (role === 'referee' ? "Klik untuk memilih file foto" : undefined)}
                      className={cn(
                        "w-6 h-6 sm:w-8 sm:h-8 md:w-11 md:h-11 border border-black sm:border-2 shadow-brutal-sm overflow-hidden bg-white flex items-center justify-center text-black relative transition-transform hover:scale-105 focus:outline-none",
                        (podiumPhotos.j3 || role === 'referee') && "cursor-pointer group"
                      )}
                    >
                      {podiumPhotos.j3 ? (
                        <img src={podiumPhotos.j3} alt="Bronze 3" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                      )}
                      {role === 'referee' && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerPodiumPhotoUpload('j3');
                          }}
                          className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[6px] font-black text-center p-0.5 uppercase leading-none"
                        >
                          <Camera size={8} />
                        </div>
                      )}
                    </div>
                    <div 
                      onClick={() => {
                        if (podiumPhotos.j4) {
                          openPodiumLightbox('j4');
                        } else if (role === 'referee') {
                          triggerPodiumPhotoUpload('j4');
                        }
                      }}
                      tabIndex={role === 'referee' || podiumPhotos.j4 ? 0 : -1}
                      onPaste={(e) => handlePasteImage(e, 'j4')}
                      title={podiumPhotos.j4 ? "Klik untuk melihat foto lebih besar / zoom" : (role === 'referee' ? "Klik untuk memilih file foto" : undefined)}
                      className={cn(
                        "w-6 h-6 sm:w-8 sm:h-8 md:w-11 md:h-11 border border-black sm:border-2 shadow-brutal-sm overflow-hidden bg-white flex items-center justify-center text-black relative transition-transform hover:scale-105 focus:outline-none",
                        (podiumPhotos.j4 || role === 'referee') && "cursor-pointer group"
                      )}
                    >
                      {podiumPhotos.j4 ? (
                        <img src={podiumPhotos.j4} alt="Bronze 4" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                      )}
                      {role === 'referee' && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerPodiumPhotoUpload('j4');
                          }}
                          className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[6px] font-black text-center p-0.5 uppercase leading-none"
                        >
                          <Camera size={8} />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      if (podiumPhotos.j3) {
                        openPodiumLightbox('j3');
                      } else if (role === 'referee') {
                        triggerPodiumPhotoUpload('j3');
                      }
                    }}
                    tabIndex={role === 'referee' || podiumPhotos.j3 ? 0 : -1}
                    onPaste={(e) => handlePasteImage(e, 'j3')}
                    title={podiumPhotos.j3 ? "Klik untuk melihat foto lebih besar / zoom" : (role === 'referee' ? "Klik untuk memilih file foto" : undefined)}
                    className={cn(
                      "w-11 h-11 sm:w-14 sm:h-14 md:w-18 md:h-18 border-[2px] sm:border-[3px] border-black shadow-brutal-sm overflow-hidden bg-white flex items-center justify-center text-black relative transition-transform hover:scale-105 focus:outline-none",
                      (podiumPhotos.j3 || role === 'referee') && "cursor-pointer group"
                    )}
                  >
                    {podiumPhotos.j3 ? (
                      <img src={podiumPhotos.j3} alt="Bronze" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-black" />
                    )}
                    {role === 'referee' && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerPodiumPhotoUpload('j3');
                        }}
                        className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[7px] sm:text-[8px] font-black text-center p-0.5 uppercase leading-none"
                      >
                        <Camera size={12} className="mb-0.5" />
                        <span>{podiumPhotos.j3 ? 'Ganti' : 'Foto'}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 bg-safety-orange text-white text-[7px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 border border-black flex items-center gap-0.5 sm:gap-1 shrink-0 whitespace-nowrap shadow-brutal-sm">
                  <Award size={9} className="stroke-[2.5]" /> {isBracket ? "Juara 3" : "Bronze"}
                </div>
              </div>

              {/* Name */}
              <div className="w-full text-center my-1 sm:my-2 px-0.5">
                {isBracket && champs.j3 && champs.j4 ? (
                  <p className="text-[8px] sm:text-[10px] md:text-xs font-black text-black uppercase tracking-tight leading-tight truncate max-w-full block">
                    {champs.j3} & {champs.j4}
                  </p>
                ) : (
                  <p className="text-[8px] sm:text-[10px] md:text-xs font-black text-black uppercase tracking-tight truncate max-w-full block">
                    {champs.j3}
                  </p>
                )}
              </div>

              {/* 3D step block */}
              <div className="w-full bg-safety-orange border-[2px] sm:border-[3px] border-black shadow-brutal h-14 sm:h-18 md:h-22 flex flex-col items-center justify-center text-white relative">
                <span className="text-xl sm:text-3xl md:text-4xl font-black text-white">3</span>
              </div>
            </div>
          )}

        </div>
        
        {/* Base ground line */}
        <div className="w-full max-w-lg mx-auto h-2.5 sm:h-3.5 bg-black mt-0 shadow-brutal-sm border-t-2 border-black"></div>

        {/* 4th Place: Harapan 1 (For non-bracket format e.g. roundrobin / double) */}
        {!isBracket && champs.j4 && (
          <div className="mt-4 max-w-md mx-auto p-3 sm:p-4 bg-white border-[3px] border-black flex items-center justify-between shadow-brutal-sm">
            <input 
              type="file" 
              id="podium-upload-input-j4" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => handlePodiumPhotoChange(e, 'j4')}
            />
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div 
                onClick={() => {
                  if (podiumPhotos.j4) {
                    openPodiumLightbox('j4');
                  } else if (role === 'referee') {
                    triggerPodiumPhotoUpload('j4');
                  }
                }}
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 border-2 border-black overflow-hidden bg-white relative transition-transform hover:scale-105 shadow-brutal-sm",
                  (podiumPhotos.j4 || role === 'referee') && "cursor-pointer group"
                )}
              >
                {podiumPhotos.j4 ? (
                  <img src={podiumPhotos.j4} alt="Harapan 1" className="w-full h-full object-cover" />
                ) : (
                  <Award size={18} className="text-black" />
                )}
                {role === 'referee' && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerPodiumPhotoUpload('j4');
                    }}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Camera size={10} />
                  </div>
                )}
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-[8px] sm:text-[9px] font-black text-black uppercase tracking-widest">Juara 4 (Harapan 1)</p>
                <p className="text-xs sm:text-sm font-black text-black uppercase tracking-tight truncate">{champs.j4}</p>
              </div>
            </div>
            <Award size={20} className="text-black shrink-0 ml-2" />
          </div>
        )}
      </div>
    );
  };

  const renderDocumentationSection = () => {
    const photos = currentTournament.documentationPhotos || 
                   (currentTournament.documentationPhoto ? [currentTournament.documentationPhoto] : []);

    return (
      <div 
        id="gallery-section"
        tabIndex={role === 'referee' ? 0 : -1}
        onPaste={(e) => handlePasteImage(e, 'doc')}
        title={role === 'referee' ? "Klik area ini lalu tekan Ctrl+V/Cmd+V untuk menempel gambar dari clipboard" : undefined}
        className="mb-10 max-w-3xl mx-auto p-6 md:p-8 bg-surface border-2 border-border-strong rounded-2xl shadow-tactical relative overflow-hidden animate-slide-up focus:outline-none focus:ring-4 focus:ring-primary/30"
      >
        <div className="relative text-center mb-6">
          <span className="inline-flex items-center gap-1.5 bg-surface-dim text-border-strong px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border-2 border-border-strong shadow-tactical-sm">
            <Camera size={12} className="stroke-[2.5]" /> Dokumentasi Turnamen
          </span>
          <h3 className="text-2xl font-black text-border-strong uppercase tracking-tight">Galeri Foto</h3>
          <p className="text-xs text-on-surface-variant font-bold mt-1">
            Foto kenangan dari keseruan turnamen
          </p>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative group rounded-2xl overflow-hidden shadow-md border border-slate-100 bg-slate-50 aspect-video md:aspect-[4/3]">
                <img
                  src={photo}
                  alt={`Dokumentasi ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                  onClick={() => { setLightboxPhotos(photos); setSlideDir(1); setLightboxIndex(idx); }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button
                    onClick={() => { setLightboxPhotos(photos); setSlideDir(1); setLightboxIndex(idx); }}
                    className="bg-white hover:bg-slate-50 text-slate-800 p-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center"
                    title="Perbesar Foto"
                  >
                    <Search size={16} className="text-slate-700 stroke-[3]" />
                  </button>
                  {role === 'referee' && (
                    <button 
                      onClick={() => handleRemoveDocPhoto(idx)}
                      className="bg-warning-red hover:bg-red-700 text-white p-2.5 border-2 border-black transition-all shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center animate-scale-in"
                      title="Hapus Foto"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {role === 'referee' && (
              <div 
                onClick={() => document.getElementById('add-more-doc-photo-input').click()}
                className="border-[3px] border-dashed border-black hover:bg-surface-variant p-4 text-center flex flex-col items-center justify-center bg-white cursor-pointer transition-all aspect-video md:aspect-[4/3] group shadow-brutal-sm"
                title="Klik untuk menambahkan foto baru"
              >
                <input
                  type="file"
                  id="add-more-doc-photo-input"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleDocPhotoChange}
                />
                {galleryUploadProgress ? (
                  <div className="w-full px-2 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-black text-brutal-blue uppercase tracking-wider text-center">
                      Foto {galleryUploadProgress.current}/{galleryUploadProgress.total}
                    </p>
                    <div className="w-full bg-slate-200 border border-black h-2 overflow-hidden">
                      <div
                        className="h-full bg-brutal-blue transition-all duration-300"
                        style={{ width: `${galleryUploadProgress.percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-black text-black">{galleryUploadProgress.percent}%</p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-black text-white border-2 border-black shadow-brutal-sm group-hover:bg-brutal-blue transition-colors">
                      <Plus size={20} className="stroke-[3]" />
                    </div>
                    <p className="text-[10px] font-black text-black uppercase tracking-wider mt-2">Tambah Foto</p>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="border-[3px] border-dashed border-black p-8 text-center flex flex-col items-center justify-center bg-white min-h-[200px] shadow-brutal-sm">
            <input
              type="file"
              id="upload-doc-photo-input"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleDocPhotoChange}
            />
            {role === 'referee' ? (
              <div className="flex flex-col items-center gap-3">
                {galleryUploadProgress ? (
                  <div className="w-full max-w-[200px] flex flex-col items-center gap-2">
                    <p className="text-xs font-black text-brutal-blue uppercase">
                      Foto {galleryUploadProgress.current}/{galleryUploadProgress.total} · {galleryUploadProgress.percent}%
                    </p>
                    <div className="w-full bg-slate-200 border border-black h-2 overflow-hidden">
                      <div
                        className="h-full bg-brutal-blue transition-all duration-300"
                        style={{ width: `${galleryUploadProgress.percent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-black text-white border-2 border-black shadow-brutal-sm">
                      <Camera size={32} />
                    </div>
                    <p className="text-xs text-black font-bold max-w-sm">
                      Belum ada foto dokumentasi. Unggah foto penyerahan piala atau momen seru turnamen Anda.
                    </p>
                    <button
                      onClick={() => document.getElementById('upload-doc-photo-input').click()}
                      className="mt-2 bg-black hover:bg-brutal-blue text-white font-black text-xs py-3 px-6 border-2 border-black transition-all shadow-brutal active:translate-x-0.5 active:translate-y-0.5 uppercase tracking-wide"
                    >
                      + Unggah Foto Dokumentasi
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-black">
                <Camera size={28} />
                <p className="text-xs font-bold uppercase">Belum ada foto dokumentasi.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const changeFinalFormat = async (newFormat) => {
    if (viewingArchive && role !== 'referee') return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (!viewingArchive && tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    
    setFinalFormat(newFormat);
    
    try {
      const newData = JSON.parse(JSON.stringify(currentTournament));
      newData.finalFormat = newFormat;
      const docRef = getTournamentDocRef();
      await setDoc(docRef, newData);
      if (viewingArchive) {
        setViewingArchive(newData);
      }
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

  // Helper to save custom finalist settings to Firebase
  const updateCustomFinalistSettings = async (updates) => {
    if (viewingArchive && role !== 'referee') return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (!viewingArchive && tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    
    try {
      const newData = JSON.parse(JSON.stringify(currentTournament));
      if (updates.useCustomFinalists !== undefined) {
        newData.useCustomFinalists = updates.useCustomFinalists;
      }
      if (updates.customFinalistsCount !== undefined) {
        newData.customFinalistsCount = updates.customFinalistsCount;
        // Adjust customFinalists array size
        const currentList = newData.customFinalists || [];
        const targetLen = updates.customFinalistsCount;
        if (currentList.length < targetLen) {
          while (currentList.length < targetLen) currentList.push('');
        } else {
          currentList.length = targetLen;
        }
        newData.customFinalists = currentList;
      }
      if (updates.customFinalists !== undefined) {
        newData.customFinalists = updates.customFinalists;
      }

      const docRef = getTournamentDocRef();
      await setDoc(docRef, newData);
      if (viewingArchive) {
        setViewingArchive(newData);
      }
    } catch (err) {
      showError("Gagal menyimpan pengaturan finalis kustom.");
    }
  };

  // Build/sync final bracket from pool winners
  const syncFinalBracket = async () => {
    if (viewingArchive && role !== 'referee') return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (!viewingArchive && tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");

    const useCustom = currentTournament.useCustomFinalists;
    const customList = currentTournament.customFinalists || [];
    
    const winners = useCustom 
      ? customList.filter(name => name && name.trim() !== '') 
      : finalParticipants.map(p => p.name);

    if (useCustom) {
      if (winners.length < 2) return showError('Minimal harus mengisi 2 nama finalis.');
    } else {
      if (winners.length < 2) return showError('Minimal harus ada 2 pool untuk membuat Final.');
      if (winners.some(name => !name)) return showError('Semua juara pool harus sudah ditentukan!');
    }
    
    if (currentTournament.pools?.Final) {
      if (!window.confirm("PERINGATAN: Menyusun ulang finalis akan menghapus bagan final saat ini beserta seluruh skor/pemenang yang sudah tercatat. Lanjutkan?")) return;
    }
    
    const newData = JSON.parse(JSON.stringify(currentTournament));
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
      if (capacity === 2) {
        poolNames.push(rawWinners[0]);
        poolNames.push(rawWinners[1]);
      } else {
        for (let i = 0; i < capacity; i += 4) {
          poolNames.push(rawWinners[i] || `BYE_FINAL_${poolNames.length + 1}`);
          poolNames.push(rawWinners[i + 2] || `BYE_FINAL_${poolNames.length + 1}`);
          poolNames.push(rawWinners[i + 1] || `BYE_FINAL_${poolNames.length + 1}`);
          poolNames.push(rawWinners[i + 3] || `BYE_FINAL_${poolNames.length + 1}`);
        }
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
      const docRef = getTournamentDocRef();
      await setDoc(docRef, newData);
      if (viewingArchive) {
        setViewingArchive(newData);
      }
    } catch (err) {
      showError('Gagal membuat Bagan Final.');
    }
  };

  const executeSetFinalWinner = async (matchId, winnerName) => {
    const newData = JSON.parse(JSON.stringify(currentTournament));
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
      const docRef = getTournamentDocRef();
      await setDoc(docRef, newData);
      if (viewingArchive) {
        setViewingArchive(newData);
      }
    } catch (err) {
      showError('Gagal update pemenang final.');
    }
  };

  const setFinalWinner = async (matchId, winnerName) => {
    if (viewingArchive && role !== 'referee') return showError("Anda sedang berada di mode arsip (Read-Only).");
    if (role !== 'referee' || !winnerName) return;
    if (!viewingArchive && tournamentData.isArchived) return showError("Turnamen sudah diarsipkan.");
    const finalData = currentTournament.pools['Final'];
    if (!finalData) return;
    const match = finalData.matches.find(m => m.id === matchId);
    if (!match) return;

    if (match.winner === winnerName) {
      await executeSetFinalWinner(matchId, winnerName);
    } else {
      setWinnerConfirm({ matchId, winnerName, isFinal: true });
    }
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

  // ----------------------------------------------------
  // EVENT MODAL RENDERERS (USABLE IN LANDING & APP VIEWS)
  // ----------------------------------------------------
  const renderEventsHubModal = () => {
    if (!showEventsHub) return null;
    const filteredEvents = eventsList.filter(e => eventFilterStatus === 'all' || e.status === eventFilterStatus);

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowEventsHub(false)}></div>
        <div className="relative bg-white w-full max-w-2xl p-4 sm:p-6 md:p-8 shadow-brutal animate-scale-in border-[3px] border-black flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex justify-between items-start border-b-[3px] border-black pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-safety-orange text-white text-[9px] font-black px-2 py-0.5 border border-black uppercase tracking-widest">
                  Agenda & Turnamen
                </span>
                {eventsList.length > 0 && (
                  <span className="bg-black text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">
                    {eventsList.length} Event
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-black mt-1 flex items-center gap-2 tracking-tight uppercase">
                <Calendar className="text-black stroke-[2.5]" size={24}/> Event Mendatang
              </h3>
              <p className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                Jadwal, Pamflet, Peraturan & Daftar Peserta Turnamen Layangan
              </p>
            </div>
            <button 
              onClick={() => setShowEventsHub(false)}
              className="w-8 h-8 bg-white border-2 border-black text-black flex items-center justify-center font-black transition-all hover:bg-black hover:text-white active:translate-x-0.5 active:translate-y-0.5 shadow-brutal-sm shrink-0"
            >
              <X size={16} className="stroke-[3]" />
            </button>
          </div>

          {/* Action Bar (Filter & Add Button) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'open', label: 'Pendaftaran Buka' },
                { id: 'upcoming', label: 'Segera Hadir' },
                { id: 'closed', label: 'Ditutup' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setEventFilterStatus(filter.id)}
                  className={cn(
                    "px-3 py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider border-2 border-black transition-all shrink-0 active:translate-x-0.5 active:translate-y-0.5",
                    eventFilterStatus === filter.id
                      ? "bg-black text-white shadow-brutal-sm"
                      : "bg-white text-black hover:bg-surface-variant"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Panitia / Wasit Add Event Button */}
            {role === 'referee' && (
              <button
                onClick={handleOpenAddEvent}
                className="bg-success-green hover:bg-green-400 text-black px-4 py-2 font-black text-xs uppercase tracking-wider border-2 border-black shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus size={16} className="stroke-[3]" />
                <span>Tambah Event</span>
              </button>
            )}
          </div>

          {/* Events List */}
          <div className="space-y-4 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin flex-1">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-black/30 bg-surface-variant/50 p-6">
                <Calendar size={36} className="text-slate-400 mx-auto mb-2 stroke-[1.5]" />
                <p className="text-black font-black uppercase text-xs sm:text-sm">Belum ada event mendatang yang terdaftar.</p>
                {role === 'referee' ? (
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Klik tombol "+ Tambah Event" untuk mempublikasikan event baru.</p>
                ) : (
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Pantau terus halaman ini untuk update turnamen berikutnya!</p>
                )}
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const participantsCount = Array.isArray(evt.participants) ? evt.participants.length : 0;
                const statusColors = {
                  open: 'bg-success-green text-black',
                  upcoming: 'bg-brutal-blue text-white',
                  closed: 'bg-warning-red text-white'
                };
                const statusLabels = {
                  open: 'Pendaftaran Dibuka',
                  upcoming: 'Segera Hadir',
                  closed: 'Pendaftaran Ditutup'
                };

                return (
                  <div 
                    key={evt.id} 
                    className="bg-white border-[3px] border-black p-4 sm:p-5 shadow-brutal transition-all hover:-translate-y-0.5 flex flex-col md:flex-row gap-4 items-start"
                  >
                    {/* Poster Thumbnail or Icon */}
                    {evt.posterUrl ? (
                      <div 
                        onClick={() => {
                          setSelectedEvent(evt);
                          setEventDetailTab('poster');
                        }}
                        className="w-full md:w-36 h-36 bg-surface-variant border-2 border-black overflow-hidden shrink-0 shadow-brutal-sm cursor-pointer group relative"
                        title="Klik untuk lihat poster"
                      >
                        <img src={evt.posterUrl} alt="Pamflet" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye size={20} className="stroke-[2.5]" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full md:w-36 h-28 md:h-36 bg-surface-variant border-2 border-black flex flex-col items-center justify-center text-black shrink-0 shadow-brutal-sm p-3 text-center">
                        <Calendar size={28} className="stroke-[2.5] text-brutal-blue mb-1" />
                        <span className="text-[9px] font-black uppercase text-slate-500">Pamflet Belum Diunggah</span>
                      </div>
                    )}

                    {/* Event Details */}
                    <div className="flex-1 min-w-0 w-full flex flex-col justify-between self-stretch">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border border-black shadow-brutal-sm",
                            statusColors[evt.status] || 'bg-black text-white'
                          )}>
                            {statusLabels[evt.status] || evt.status}
                          </span>
                          {evt.category && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-surface-variant text-black px-2 py-0.5 border border-black">
                              {evt.category}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm sm:text-base font-black text-black uppercase tracking-tight leading-snug">
                          {evt.title}
                        </h4>

                        <p className="text-[10px] font-black text-brutal-blue uppercase tracking-wider mt-0.5">
                          Penyelenggara: {evt.organizer}
                        </p>

                        {/* Info grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t-2 border-black/20 text-[10px] font-bold text-black uppercase">
                          {evt.eventDate && (
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-black shrink-0 stroke-[2.5]" />
                              <span className="truncate">
                                {new Date(evt.eventDate).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                {evt.eventTime ? ` • ${evt.eventTime}` : ''}
                              </span>
                            </div>
                          )}
                          {evt.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-black shrink-0 stroke-[2.5]" />
                              <span className="truncate">{evt.location}</span>
                            </div>
                          )}
                          {evt.prizePool && (
                            <div className="flex items-center gap-1.5">
                              <Trophy size={13} className="text-warning-red shrink-0 stroke-[2.5]" />
                              <span className="truncate">Hadiah: <strong>{evt.prizePool}</strong></span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Users size={13} className="text-black shrink-0 stroke-[2.5]" />
                            <span>{participantsCount} Peserta Terdaftar</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t-2 border-black/20">
                        <button
                          onClick={() => {
                            setSelectedEvent(evt);
                            setEventDetailTab('info');
                          }}
                          className="flex-1 bg-black hover:bg-brutal-blue text-white font-black text-[10px] sm:text-xs uppercase tracking-wider py-2.5 px-4 transition-all border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5"
                        >
                          <Eye size={14} className="stroke-[2.5]" />
                          <span>Lihat Detail, Pamflet & Peserta</span>
                        </button>

                        {role === 'referee' && (
                          <>
                            <button
                              onClick={() => handleOpenEditEvent(evt)}
                              className="bg-white hover:bg-surface-variant text-black p-2.5 transition-all border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center shrink-0"
                              title="Edit Event"
                            >
                              <Edit3 size={15} className="stroke-[2.5]" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(evt.id, evt.title)}
                              className="bg-warning-red hover:bg-red-700 text-white p-2.5 transition-all border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center shrink-0"
                              title="Hapus Event"
                            >
                              <Trash2 size={15} className="stroke-[2.5]" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Close */}
          <div className="mt-4 pt-4 border-t-[3px] border-black flex justify-end">
            <button onClick={() => setShowEventsHub(false)} className="w-full sm:w-auto bg-black hover:bg-brutal-blue text-white px-6 py-2.5 font-black transition-all shadow-brutal border-2 border-black active:translate-x-0.5 active:translate-y-0.5 text-xs uppercase tracking-wider text-center">
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEventDetailModal = () => {
    if (!selectedEvent) return null;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedEvent(null)}></div>
        <div className="relative bg-white w-full max-w-2xl p-4 sm:p-6 md:p-8 shadow-brutal animate-scale-in border-[3px] border-black flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex justify-between items-start border-b-[3px] border-black pb-3 mb-3">
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border border-black",
                  selectedEvent.status === 'open' ? 'bg-success-green text-black' :
                  selectedEvent.status === 'upcoming' ? 'bg-brutal-blue text-white' : 'bg-warning-red text-white'
                )}>
                  {selectedEvent.status === 'open' ? 'Pendaftaran Dibuka' : selectedEvent.status === 'upcoming' ? 'Segera Hadir' : 'Pendaftaran Ditutup'}
                </span>
                {selectedEvent.category && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-surface-variant text-black px-2 py-0.5 border border-black">
                    {selectedEvent.category}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-xl font-black text-black uppercase tracking-tight leading-snug">
                {selectedEvent.title}
              </h3>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider mt-0.5">
                Penyelenggara: {selectedEvent.organizer}
              </p>
            </div>
            <button 
              onClick={() => setSelectedEvent(null)}
              className="w-8 h-8 bg-white border-2 border-black text-black flex items-center justify-center font-black transition-all hover:bg-black hover:text-white active:translate-x-0.5 active:translate-y-0.5 shadow-brutal-sm shrink-0"
            >
              <X size={16} className="stroke-[3]" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 border-b-2 border-black pb-2 mb-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'info', label: 'Informasi', icon: FileText },
              { id: 'poster', label: 'Pamflet', icon: Image },
              { id: 'rules', label: 'Peraturan', icon: CheckCircle2 },
              { id: 'participants', label: `Peserta (${selectedEvent.participants?.length || 0})`, icon: Users }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setEventDetailTab(tab.id)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider border-2 border-black transition-all flex items-center gap-1.5 shrink-0 active:translate-x-0.5 active:translate-y-0.5",
                    eventDetailTab === tab.id
                      ? "bg-black text-white shadow-brutal-sm"
                      : "bg-white text-black hover:bg-surface-variant"
                  )}
                >
                  <Icon size={13} className="stroke-[2.5]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin space-y-4">
            {/* Tab 1: Informasi */}
            {eventDetailTab === 'info' && (
              <div className="space-y-4">
                {/* Quick Hero Banner */}
                {selectedEvent.posterUrl && (
                  <div 
                    onClick={() => {
                      setLightboxPhotos([selectedEvent.posterUrl]);
                      setLightboxIndex(0);
                    }}
                    className="w-full h-44 sm:h-56 bg-black border-2 border-black overflow-hidden shadow-brutal-sm cursor-pointer relative group"
                  >
                    <img src={selectedEvent.posterUrl} alt="Pamflet" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-black px-2 py-1 border border-white uppercase flex items-center gap-1">
                      <ZoomIn size={12} /> Klik untuk Perbesar Pamflet
                    </div>
                  </div>
                )}

                {/* Grid of Key Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-surface-variant border-2 border-black p-3 shadow-brutal-sm">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <Calendar size={11} className="stroke-[3] text-black" /> Tanggal & Waktu
                    </span>
                    <p className="text-xs sm:text-sm font-black text-black uppercase">
                      {selectedEvent.eventDate ? new Date(selectedEvent.eventDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBA'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-700 uppercase mt-0.5">{selectedEvent.eventTime || '08:00 WIB - Selesai'}</p>
                  </div>

                  <div className="bg-surface-variant border-2 border-black p-3 shadow-brutal-sm">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <MapPin size={11} className="stroke-[3] text-black" /> Lokasi / Venue
                    </span>
                    <p className="text-xs sm:text-sm font-black text-black uppercase">
                      {selectedEvent.location || 'Lokasi Pertandingan'}
                    </p>
                  </div>

                  <div className="bg-surface-variant border-2 border-black p-3 shadow-brutal-sm">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <Trophy size={11} className="stroke-[3] text-warning-red" /> Total Hadiah (Prize Pool)
                    </span>
                    <p className="text-xs sm:text-sm font-black text-black uppercase">
                      {selectedEvent.prizePool || 'Hadiah Menarik + Tropi'}
                    </p>
                  </div>

                  <div className="bg-surface-variant border-2 border-black p-3 shadow-brutal-sm">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <Award size={11} className="stroke-[3] text-black" /> Biaya Pendaftaran (HTM)
                    </span>
                    <p className="text-xs sm:text-sm font-black text-black uppercase">
                      {selectedEvent.registrationFee || 'Gratis / Sesuai Ketentuan'}
                    </p>
                  </div>
                </div>

                {/* WhatsApp Contact Box */}
                {selectedEvent.contactPerson && (
                  <div className="bg-success-green/10 border-2 border-black p-3.5 shadow-brutal-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-success-green text-black border-2 border-black flex items-center justify-center shrink-0 shadow-brutal-sm">
                        <Phone size={18} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Narahubung / Pendaftaran</span>
                        <p className="text-xs sm:text-sm font-black text-black uppercase">{selectedEvent.contactPerson}</p>
                      </div>
                    </div>

                    {(() => {
                      const rawPhone = selectedEvent.contactPerson.replace(/[^0-9]/g, '');
                      const cleanPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;
                      if (!cleanPhone) return null;
                      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Halo Panitia, saya ingin menanyakan / mendaftar untuk event: ${selectedEvent.title}`)}`;
                      return (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-success-green hover:bg-green-400 text-black font-black text-xs uppercase tracking-wider py-2.5 px-4 border-2 border-black shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <span>Chat WhatsApp</span>
                          <ExternalLink size={13} className="stroke-[3]" />
                        </a>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Pamflet Poster */}
            {eventDetailTab === 'poster' && (
              <div className="space-y-3">
                {selectedEvent.posterUrl ? (
                  <div className="flex flex-col items-center">
                    <div 
                      onClick={() => {
                        setLightboxPhotos([selectedEvent.posterUrl]);
                        setLightboxIndex(0);
                      }}
                      className="w-full max-w-md bg-black border-2 border-black overflow-hidden shadow-brutal cursor-pointer group relative"
                      title="Klik untuk melihat fullscreen"
                    >
                      <img src={selectedEvent.posterUrl} alt="Pamflet Event" className="w-full h-auto object-contain" />
                      <div className="p-2 bg-black text-white text-center text-[10px] font-black uppercase flex items-center justify-center gap-1">
                        <ZoomIn size={13} /> Klik untuk Melihat Layar Penuh
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-black/30 p-6 bg-surface-variant">
                    <Image size={32} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-black font-bold uppercase text-xs">Belum ada gambar pamflet untuk event ini.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Peraturan */}
            {eventDetailTab === 'rules' && (
              <div className="bg-surface-variant border-2 border-black p-4 sm:p-5 shadow-brutal-sm space-y-3">
                <h4 className="text-xs sm:text-sm font-black text-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black/20 pb-2">
                  <CheckCircle2 size={16} className="text-brutal-blue stroke-[2.5]" /> Peraturan & Tata Tertib Pertandingan
                </h4>
                {selectedEvent.rules ? (
                  <div className="text-xs font-bold text-black leading-relaxed whitespace-pre-line">
                    {selectedEvent.rules}
                  </div>
                ) : (
                  <p className="text-slate-500 font-bold uppercase text-[10px]">Belum ada peraturan spesifik yang dicantumkan.</p>
                )}
              </div>
            )}

            {/* Tab 4: Peserta Terdaftar */}
            {eventDetailTab === 'participants' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-black uppercase tracking-wider">
                    Total Peserta: {selectedEvent.participants?.length || 0} Terdaftar
                  </span>
                  <div className="relative w-48 sm:w-56">
                    <input
                      type="text"
                      value={eventParticipantSearch}
                      onChange={(e) => setEventParticipantSearch(e.target.value)}
                      placeholder="Cari nama peserta..."
                      className="w-full bg-white border-2 border-black px-2.5 py-1.5 text-xs font-bold text-black outline-none"
                    />
                  </div>
                </div>

                {(!selectedEvent.participants || selectedEvent.participants.length === 0) ? (
                  <div className="text-center py-10 border-2 border-dashed border-black/30 bg-surface-variant p-4">
                    <Users size={28} className="text-slate-400 mx-auto mb-1" />
                    <p className="text-black font-bold uppercase text-xs">Belum ada peserta yang terdaftar.</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Daftar sekarang melalui kontak panitia di atas!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {selectedEvent.participants
                      .filter(p => !eventParticipantSearch || p.toLowerCase().includes(eventParticipantSearch.toLowerCase()))
                      .map((name, idx) => (
                        <div key={idx} className="bg-white border-2 border-black p-2.5 flex items-center gap-2.5 shadow-brutal-sm">
                          <span className="w-6 h-6 bg-black text-white text-[10px] font-black flex items-center justify-center shrink-0 border border-black">
                            {idx + 1}
                          </span>
                          <span className="font-black text-xs text-black uppercase truncate">{name}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t-[3px] border-black flex flex-wrap items-center justify-between gap-2">
            {role === 'referee' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEditEvent(selectedEvent);
                  }}
                  className="bg-white hover:bg-surface-variant text-black px-3.5 py-2 font-black text-xs uppercase tracking-wider border-2 border-black shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5"
                >
                  <Edit3 size={14} className="stroke-[2.5]" />
                  <span>Edit Event</span>
                </button>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id, selectedEvent.title)}
                  className="bg-warning-red hover:bg-red-700 text-white px-3.5 py-2 font-black text-xs uppercase tracking-wider border-2 border-black shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5"
                >
                  <Trash2 size={14} className="stroke-[2.5]" />
                  <span>Hapus</span>
                </button>
              </div>
            ) : <div />}

            <button 
              onClick={() => setSelectedEvent(null)} 
              className="bg-black hover:bg-brutal-blue text-white px-6 py-2 font-black transition-all shadow-brutal border-2 border-black active:translate-x-0.5 active:translate-y-0.5 text-xs uppercase tracking-wider"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEventFormModal = () => {
    if (!showEventFormModal) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
        <div className="bg-white max-w-xl w-full shadow-brutal border-[3px] border-black overflow-hidden animate-scale-in flex flex-col max-h-[92vh]">
          <div className="bg-black p-4 sm:p-5 text-white border-b-[3px] border-black flex justify-between items-center">
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wide flex items-center gap-2">
                <Calendar size={20} /> {editingEvent ? 'Edit Event Mendatang' : 'Tambah Event Mendatang Baru'}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase mt-0.5">
                Publikasikan turnamen baru untuk penonton dan calon peserta
              </p>
            </div>
            <button 
              onClick={() => setShowEventFormModal(false)}
              className="w-7 h-7 bg-white text-black border-2 border-black flex items-center justify-center font-black hover:bg-slate-200"
            >
              <X size={15} className="stroke-[3]" />
            </button>
          </div>

          <form 
            onSubmit={handleSaveEvent} 
            onPaste={(e) => handlePasteImage(e, 'event_poster')} 
            className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1 scrollbar-thin"
          >
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-black uppercase tracking-widest">Judul Event / Turnamen *</label>
              <input 
                type="text" 
                required
                value={eventFormTitle} 
                onChange={(e) => setEventFormTitle(e.target.value)}
                className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs text-black outline-none neo-brutalist-input transition-all"
                placeholder="Contoh: TURNAMEN LAYANGAN PIALA BUPATI 2026"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Penyelenggara</label>
                <input 
                  type="text" 
                  value={eventFormOrganizer} 
                  onChange={(e) => setEventFormOrganizer(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs text-black outline-none neo-brutalist-input transition-all"
                  placeholder="Contoh: PELANGI Majalengka"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Kategori Turnamen</label>
                <input 
                  type="text" 
                  value={eventFormCategory} 
                  onChange={(e) => setEventFormCategory(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs text-black outline-none neo-brutalist-input transition-all"
                  placeholder="Contoh: Aduan 54/58 (Open Nasional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Tanggal Pelaksanaan</label>
                <input 
                  type="date" 
                  value={eventFormDate} 
                  onChange={(e) => setEventFormDate(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs text-black outline-none neo-brutalist-input transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Waktu / Jam</label>
                <input 
                  type="text" 
                  value={eventFormTime} 
                  onChange={(e) => setEventFormTime(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs text-black outline-none neo-brutalist-input transition-all"
                  placeholder="08:00 WIB - Selesai"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Status Pendaftaran</label>
                <select
                  value={eventFormStatus}
                  onChange={(e) => setEventFormStatus(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs text-black outline-none neo-brutalist-input transition-all"
                >
                  <option value="open">Pendaftaran Dibuka</option>
                  <option value="upcoming">Segera Hadir</option>
                  <option value="closed">Pendaftaran Ditutup</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-black uppercase tracking-widest">Lokasi / Venue</label>
              <input 
                type="text" 
                value={eventFormLocation} 
                onChange={(e) => setEventFormLocation(e.target.value)}
                className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs text-black outline-none neo-brutalist-input transition-all"
                placeholder="Contoh: Lapang Sirkuit Gelora Majalengka"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Total Hadiah (Prize Pool)</label>
                <input 
                  type="text" 
                  value={eventFormPrizePool} 
                  onChange={(e) => setEventFormPrizePool(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs text-black outline-none neo-brutalist-input transition-all"
                  placeholder="Rp 25.000.000 + Piala"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Biaya Pendaftaran (HTM)</label>
                <input 
                  type="text" 
                  value={eventFormRegistrationFee} 
                  onChange={(e) => setEventFormRegistrationFee(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs text-black outline-none neo-brutalist-input transition-all"
                  placeholder="Rp 150.000 / Peserta"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-black uppercase tracking-widest">Kontak Narahubung / WhatsApp</label>
              <input 
                type="text" 
                value={eventFormContactPerson} 
                onChange={(e) => setEventFormContactPerson(e.target.value)}
                className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs text-black outline-none neo-brutalist-input transition-all"
                placeholder="081234567890 (Panitia Turnamen)"
              />
            </div>

            {/* Poster Upload & Paste */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-black uppercase tracking-widest">
                Pamflet Poster Event (Upload atau Paste via Ctrl+V)
              </label>
              <div className="flex items-center gap-3 mt-1">
                {(eventPosterFile || eventFormPosterUrl) && (
                  <img 
                    src={eventPosterFile ? URL.createObjectURL(eventPosterFile) : eventFormPosterUrl} 
                    alt="Preview" 
                    className="w-14 h-14 object-cover border-2 border-black bg-white shrink-0 shadow-brutal-sm" 
                  />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setEventPosterFile(e.target.files[0])}
                  className="block w-full text-xs text-black file:mr-3 file:py-2 file:px-3 file:border-2 file:border-black file:text-xs file:font-black file:bg-white file:text-black hover:file:bg-surface-variant cursor-pointer"
                />
              </div>
            </div>

            {/* Rules */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-black uppercase tracking-widest">Peraturan & Tata Tertib Pertandingan</label>
              <textarea 
                rows={4}
                value={eventFormRules} 
                onChange={(e) => setEventFormRules(e.target.value)}
                className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs text-black outline-none neo-brutalist-input transition-all font-mono"
                placeholder="Ketik peraturan pertandingan..."
              />
            </div>

            {/* Participants Text */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">
                  Daftar Peserta Terdaftar (1 Nama per Baris)
                </label>
                <span className="text-[9px] font-black text-slate-500 uppercase">
                  {eventFormParticipantsText.split('\n').filter(p => p.trim().length > 0).length} Peserta
                </span>
              </div>
              <textarea 
                rows={4}
                value={eventFormParticipantsText} 
                onChange={(e) => setEventFormParticipantsText(e.target.value)}
                className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs text-black outline-none neo-brutalist-input transition-all font-mono"
                placeholder="Contoh:&#10;Bintang Kites - Majalengka&#10;Garuda Perkasa - Cirebon&#10;Naga Hitam Team - Bandung"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t-[3px] border-black">
              <button 
                type="button" 
                onClick={() => setShowEventFormModal(false)}
                className="flex-1 py-3 px-4 text-xs font-black border-2 border-black text-black bg-white hover:bg-surface-variant active:translate-x-0.5 active:translate-y-0.5 uppercase transition-all"
                disabled={isSavingEvent}
              >
                BATAL
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 px-4 text-xs font-black bg-black text-white hover:bg-brutal-blue border-2 border-black active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-brutal-sm flex items-center justify-center gap-2 uppercase tracking-wider"
                disabled={isSavingEvent}
              >
                {isSavingEvent ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span> MENYIMPAN...
                  </>
                ) : (editingEvent ? 'SIMPAN PERUBAHAN' : 'PUBLIKASIKAN EVENT')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderCarouselLightbox = () => {
    if (lightboxIndex === null || lightboxPhotos.length === 0) return null;
    const total = lightboxPhotos.length;
    const currentPhoto = lightboxPhotos[lightboxIndex];

    const resetLightboxZoom = () => {
      setLightboxZoom(1);
      setLightboxPan({ x: 0, y: 0 });
    };

    const handleZoomIn = () => {
      setLightboxZoom(z => Math.min(4, Math.round((z + 0.5) * 10) / 10));
    };

    const handleZoomOut = () => {
      setLightboxZoom(z => {
        const next = Math.max(1, Math.round((z - 0.5) * 10) / 10);
        if (next === 1) setLightboxPan({ x: 0, y: 0 });
        return next;
      });
    };

    const handleToggleZoom = () => {
      if (lightboxZoom > 1) {
        resetLightboxZoom();
      } else {
        setLightboxZoom(2.5);
      }
    };

    const goNext = () => {
      setSlideDir(1);
      setLightboxIndex(i => (i + 1) % total);
      resetLightboxZoom();
    };

    const goPrev = () => {
      setSlideDir(-1);
      setLightboxIndex(i => (i - 1 + total) % total);
      resetLightboxZoom();
    };

    const handleClose = () => {
      setLightboxIndex(null);
      resetLightboxZoom();
    };

    // Desktop mouse wheel zoom
    const handleWheel = (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setLightboxZoom(z => Math.min(4, Math.round((z + 0.25) * 100) / 100));
      } else {
        setLightboxZoom(z => {
          const next = Math.max(1, Math.round((z - 0.25) * 100) / 100);
          if (next === 1) setLightboxPan({ x: 0, y: 0 });
          return next;
        });
      }
    };

    // Desktop mouse drag when zoomed in
    const handleMouseDown = (e) => {
      if (lightboxZoom > 1) {
        isDraggingLightbox.current = true;
        dragStartPos.current = {
          x: e.clientX - lightboxPan.x,
          y: e.clientY - lightboxPan.y
        };
      }
    };

    const handleMouseMove = (e) => {
      if (isDraggingLightbox.current && lightboxZoom > 1) {
        setLightboxPan({
          x: e.clientX - dragStartPos.current.x,
          y: e.clientY - dragStartPos.current.y
        });
      }
    };

    const handleMouseUp = () => {
      isDraggingLightbox.current = false;
    };

    // Mobile touch events: supports 1-finger swipe / pan & 2-finger pinch-to-zoom
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapTime.current < 300) {
          handleToggleZoom();
          lastTapTime.current = 0;
          return;
        }
        lastTapTime.current = now;

        touchStartPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };

        if (lightboxZoom > 1) {
          isDraggingLightbox.current = true;
          dragStartPos.current = {
            x: e.touches[0].clientX - lightboxPan.x,
            y: e.touches[0].clientY - lightboxPan.y
          };
        } else {
          touchStartX.current = e.touches[0].clientX;
        }
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastTouchDistance.current = dist;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1 && lightboxZoom > 1 && isDraggingLightbox.current) {
        setLightboxPan({
          x: e.touches[0].clientX - dragStartPos.current.x,
          y: e.touches[0].clientY - dragStartPos.current.y
        });
      } else if (e.touches.length === 2 && lastTouchDistance.current) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = dist / lastTouchDistance.current;
        setLightboxZoom(z => {
          const next = Math.min(4, Math.max(1, Math.round(z * ratio * 100) / 100));
          if (next === 1) setLightboxPan({ x: 0, y: 0 });
          return next;
        });
        lastTouchDistance.current = dist;
      }
    };

    const handleTouchEnd = (e) => {
      isDraggingLightbox.current = false;
      lastTouchDistance.current = null;

      if (lightboxZoom === 1 && touchStartX.current !== null && e.changedTouches.length === 1) {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 44) {
          diff > 0 ? goNext() : goPrev();
        }
        touchStartX.current = null;
      }
    };

    return (
      <div
        className="fixed inset-0 z-[150] flex flex-col items-center justify-between bg-black/95 backdrop-blur-md animate-fade-in select-none"
        onMouseUp={handleMouseUp}
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between px-3 sm:px-6 pt-safe pt-3 sm:pt-4 z-20 gap-2">
          {/* Photo Counter Pill */}
          <div className="flex items-center gap-2">
            <span className="text-white text-[10px] sm:text-xs font-black tracking-widest tabular-nums bg-black border-2 border-white px-2.5 sm:px-3 py-1 shadow-brutal-sm">
              {lightboxIndex + 1} / {total}
            </span>
          </div>

          {/* Brutalist Zoom & Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Zoom Controls Pill */}
            <div className="flex items-center bg-black border-2 border-white shadow-brutal-sm">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={lightboxZoom <= 1}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-white hover:text-black disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white transition-all"
                title="Perkecil (-)"
              >
                <ZoomOut size={15} className="stroke-[2.5]" />
              </button>
              
              <button
                type="button"
                onClick={handleToggleZoom}
                className="px-2 h-8 flex items-center justify-center text-white text-[10px] sm:text-xs font-mono font-black border-x border-white/40 hover:bg-white hover:text-black transition-all min-w-[52px]"
                title="Klik untuk ubah zoom (100% / 250%)"
              >
                {Math.round(lightboxZoom * 100)}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={lightboxZoom >= 4}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-white hover:text-black disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white transition-all"
                title="Perbesar (+)"
              >
                <ZoomIn size={15} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Reset Zoom Button */}
            {lightboxZoom > 1 && (
              <button
                type="button"
                onClick={resetLightboxZoom}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-black text-white border-2 border-white hover:bg-white hover:text-black transition-all shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
                title="Reset Ukuran (0 / R)"
              >
                <RotateCcw size={15} className="stroke-[2.5]" />
              </button>
            )}

            {/* Open Original Full Resolution */}
            {currentPhoto && (
              <a
                href={currentPhoto}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-black text-white border-2 border-white hover:bg-white hover:text-black transition-all shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
                title="Buka Gambar Asli di Tab Baru"
              >
                <ExternalLink size={15} className="stroke-[2.5]" />
              </a>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-warning-red text-white border-2 border-white hover:bg-red-700 transition-all shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
              title="Tutup (Esc)"
            >
              <X size={17} className="stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Main Image Stage */}
        <div 
          className="relative flex-1 w-full flex items-center justify-center overflow-hidden p-2 sm:p-4 my-auto cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleToggleZoom}
        >
          {/* Previous Button */}
          {total > 1 && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 sm:left-4 md:left-6 z-30 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white text-black border-2 border-black hover:bg-surface-variant transition-all active:translate-x-0.5 active:translate-y-0.5 shadow-brutal"
              title="Foto Sebelumnya (Panah Kiri)"
            >
              <ChevronLeft size={22} strokeWidth={3} />
            </button>
          )}

          {/* The Zoomable Image */}
          <div 
            className="flex items-center justify-center max-w-full max-h-[76vh] transition-transform"
            style={{
              transform: `translate3d(${lightboxPan.x}px, ${lightboxPan.y}px, 0px) scale(${lightboxZoom})`,
              transition: isDraggingLightbox.current ? 'none' : 'transform 0.15s ease-out',
              willChange: 'transform'
            }}
          >
            <img
              key={`lb-${lightboxIndex}-${slideDir}`}
              src={currentPhoto}
              alt={`Foto ${lightboxIndex + 1}`}
              draggable={false}
              className={cn(
                "max-w-full max-h-[74vh] object-contain border-[3px] border-white shadow-2xl pointer-events-none select-none",
                slideDir >= 0 ? "animate-slide-from-right" : "animate-slide-from-left"
              )}
            />
          </div>

          {/* Next Button */}
          {total > 1 && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 sm:right-4 md:right-6 z-30 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white text-black border-2 border-black hover:bg-surface-variant transition-all active:translate-x-0.5 active:translate-y-0.5 shadow-brutal"
              title="Foto Berikutnya (Panah Kanan)"
            >
              <ChevronRight size={22} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Bottom Bar: Hints & Dot Indicators */}
        <div className="w-full flex flex-col items-center gap-2 pb-safe pb-4 z-20 px-4">
          {/* Helper hint */}
          <div className="bg-black/80 border border-white/40 text-white/90 text-[9px] sm:text-[10px] font-bold px-3 py-1 uppercase tracking-wider text-center shadow-lg">
            {lightboxZoom > 1 ? (
              <span>Zoom aktif ({Math.round(lightboxZoom * 100)}%) • Geser untuk menggeser gambar • Klik 2x / Reset untuk normal</span>
            ) : (
              <span>Gunakan Cubit / Scroll / Double Tap untuk Zoom • Geser untuk ganti foto</span>
            )}
          </div>

          {/* Dot indicators (≤10 foto) */}
          {total > 1 && total <= 10 && (
            <div className="flex items-center gap-1.5 mt-1">
              {lightboxPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSlideDir(i > lightboxIndex ? 1 : -1);
                    setLightboxIndex(i);
                    resetLightboxZoom();
                  }}
                  className={cn(
                    "transition-all duration-200 border border-black",
                    i === lightboxIndex ? "w-5 h-2.5 bg-safety-orange border-white" : "w-2.5 h-2.5 bg-white/70 hover:bg-white"
                  )}
                />
              ))}
            </div>
          )}

          {/* Counter pill (>10 foto) */}
          {total > 10 && (
            <div className="bg-black border border-white px-3 py-0.5 mt-1">
              <span className="text-white text-[10px] font-black tabular-nums">{lightboxIndex + 1} / {total}</span>
            </div>
          )}
        </div>
      </div>
    );
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white py-12 px-4 font-sans overflow-y-auto">
        <div className="max-w-md w-full bg-white shadow-brutal border-[3px] border-black overflow-hidden animate-scale-in shrink-0">
          <div className="bg-black p-8 text-center text-white flex flex-col items-center border-b-[3px] border-black relative">
            {tournamentData.logo ? (
              <img src={tournamentData.logo} alt="Logo" className="w-20 h-20 object-contain border-2 border-black bg-white p-2 mb-3 shadow-brutal-sm animate-scale-in" />
            ) : (
              <div className="w-16 h-16 bg-white border-2 border-black flex items-center justify-center text-black mb-3 shadow-brutal-sm">
                <Trophy className="w-8 h-8 stroke-[2.5]"/>
              </div>
            )}
            <span className="text-[10px] font-black text-black bg-safety-orange uppercase tracking-widest px-2.5 py-0.5 border border-black mb-2 inline-block">
              Live Tournament System
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight mt-1 text-white">{(tournamentData.title || tournamentTitle).toUpperCase()}</h1>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <button 
              onClick={() => {
                setRole('spectator');
                localStorage.setItem('tournament_role', 'spectator');
              }} 
              className="w-full flex items-center justify-between bg-white hover:bg-surface-variant border-[3px] border-black p-5 transition-all group shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="bg-brutal-blue text-white p-3 border-2 border-black shadow-brutal-sm shrink-0">
                  <Users className="w-5 h-5"/>
                </div>
                <div>
                  <h3 className="font-black text-black text-sm uppercase">Lihat Bagan Pertandingan</h3>
                  <p className="text-[10px] text-black font-bold uppercase tracking-wider mt-0.5">Pantau Skor Real-time (Penonton)</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform stroke-[3]"/>
            </button>

            {/* Event Mendatang Action Button */}
            <button 
              onClick={() => setShowEventsHub(true)} 
              className="w-full flex items-center justify-between bg-safety-orange hover:bg-orange-600 text-white border-[3px] border-black p-4 transition-all group shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <div className="flex items-center gap-3.5 text-left">
                <div className="bg-black text-white p-2.5 border-2 border-black shadow-brutal-sm shrink-0">
                  <Calendar className="w-5 h-5"/>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-xs sm:text-sm uppercase">Event Mendatang</h3>
                    {eventsList.length > 0 && (
                      <span className="bg-black text-white text-[8px] font-black px-1.5 py-0.2 uppercase border border-black">
                        {eventsList.length} Event
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-white/90 font-bold uppercase tracking-wider mt-0.5">Pamflet, Jadwal, Peserta & Aturan</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform stroke-[3]"/>
            </button>

            <form onSubmit={handleLoginReferee} className="space-y-3 pt-2 border-t-[3px] border-black">
              <label className="text-[10px] font-black text-black uppercase tracking-wider block">Login Wasit / Panitia</label>
              <div className="relative">
                <input type="password" name="pin" placeholder="Masukkan Password Wasit" className="w-full bg-white border-[3px] border-black p-4 font-bold text-xs text-black outline-none focus:ring-0 neo-brutalist-input transition-all shadow-inner" required />
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 font-black text-sm hover:bg-brutal-blue transition-all shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-wide border-[3px] border-black">Login Wasit</button>
            </form>
          </div>

          {/* Section Riwayat Turnamen */}
          {archivesList.length > 0 && (
            <div className="p-4 sm:p-6 border-t-[3px] border-black bg-surface-variant">
              <h3 className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Archive size={14} className="text-brutal-blue" /> RIWAYAT TURNAMEN ARSIP
              </h3>
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                {archivesList.map((archive) => {
                  const dateStr = new Date(archive.archivedAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  const champName = getArchiveChampion(archive);
                  return (
                    <div 
                      key={archive.id}
                      onClick={() => {
                        setViewingArchive(archive);
                        if (archive.pools) {
                          if (archive.pools['Final']) {
                            setActivePool('Final');
                          } else if (Object.keys(archive.pools).length > 0) {
                            const sortedPools = Object.keys(archive.pools).sort();
                            setActivePool(sortedPools[0]);
                          }
                        }
                      }}
                      className="w-full flex items-center justify-between bg-white border-[2px] border-black hover:bg-surface-variant p-3 transition-all shadow-brutal-sm cursor-pointer group active:translate-x-0.5 active:translate-y-0.5 active:shadow-none gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {archive.logo ? (
                          <img src={archive.logo} alt="Logo" className="w-10 h-10 object-contain border-2 border-black p-0.5 bg-white shrink-0 shadow-brutal-sm" />
                        ) : (
                          <div className="w-10 h-10 bg-black text-white border-2 border-black flex items-center justify-center shrink-0 shadow-brutal-sm">
                            <Trophy size={16} className="stroke-[2.5]" />
                          </div>
                        )}
                        <div className="text-left min-w-0 flex-1">
                          <h4 className="font-black text-black text-xs uppercase tracking-tight leading-snug truncate group-hover:text-brutal-blue transition-colors">
                            {archive.title}
                          </h4>
                          <p className="text-[9px] text-black font-bold uppercase tracking-wider mt-0.5 truncate">
                            {archive.organizer} • {dateStr}
                          </p>
                          {champName && (
                            <div className="mt-1 flex items-center gap-1 text-[9px] font-black text-black bg-warning-red/10 border border-black/20 px-1.5 py-0.5 w-fit">
                              <Trophy size={9} className="text-warning-red stroke-[3]" />
                              <span className="uppercase text-[8px]">Juara: <span className="underline">{champName}</span></span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-black text-white p-2 border-2 border-black shadow-brutal-sm shrink-0 group-hover:bg-brutal-blue transition-all">
                        <ChevronRight size={14} className="stroke-[3]" />
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
           <p className="text-[9px] md:text-[10px] font-black text-black uppercase tracking-widest leading-relaxed">
             Perkumpulan Pelayang Seluruh Indonesia Kabupaten Majalengka
           </p>
           <p className="text-[10px] font-black text-black uppercase tracking-[0.2em] mt-0.5">
             © Copyright by Senyap
           </p>
        </div>

        {/* Modals on Landing Page */}
        {renderEventsHubModal()}
        {renderEventDetailModal()}
        {renderEventFormModal()}
        {renderCarouselLightbox()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col text-black font-sans overflow-x-hidden pb-20 md:pb-0">
      {/* Sticky Archive Indicator Banner */}
      {viewingArchive && (
        <div className="bg-safety-orange border-b-[3px] border-black px-3 md:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-brutal-sm z-[45] animate-slide-down shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white text-[10px] md:text-[11px] font-black uppercase px-2.5 py-1 border border-black shadow-brutal-sm flex items-center gap-1.5 shrink-0">
              <Archive size={12} className="text-safety-orange" />
              MODE ARSIP {role === 'referee' ? '(WASIT)' : '(PENONTON)'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {role === 'referee' ? (
              <button 
                onClick={handleOpenEditArchiveModal} 
                className="bg-white hover:bg-surface-variant text-black font-black text-[10px] md:text-xs py-1.5 px-3 transition-all border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 shrink-0 uppercase flex items-center gap-1.5"
              >
                <Edit3 size={12} className="stroke-[2.5]" />
                <span>Edit Detail Arsip</span>
              </button>
            ) : (
              <button 
                onClick={() => {
                  const pin = window.prompt("Masukkan Password Wasit untuk Mengedit Arsip:");
                  if (pin === appSettings.refereePin) {
                    setRole('referee');
                    localStorage.setItem('tournament_role', 'referee');
                    localStorage.setItem('tournament_pin_version', appSettings.pinVersion.toString());
                    setSessionPinVersion(appSettings.pinVersion);
                    alert("Berhasil login sebagai Wasit! Sekarang Anda dapat mengedit arsip ini.");
                  } else if (pin !== null) {
                    alert("Password Wasit salah!");
                  }
                }} 
                className="bg-white hover:bg-surface-variant text-black font-black text-[10px] md:text-xs py-1.5 px-3 transition-all border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 shrink-0 uppercase flex items-center gap-1.5"
              >
                <Key size={12} className="stroke-[2.5]" />
                <span>Login Wasit</span>
              </button>
            )}
            <button 
              onClick={() => {
                setViewingArchive(null);
                if (!role || role === 'spectator') {
                  setRole(null);
                }
              }} 
              className="bg-black hover:bg-brutal-blue text-white font-black text-[10px] md:text-xs py-1.5 px-3 transition-all border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 shrink-0 uppercase flex items-center gap-1.5"
            >
              <ArrowLeft size={12} className="stroke-[2.5]" />
              <span>Kembali</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b-[3px] border-black px-4 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-brutal-sm">
        <div className="flex items-center gap-3 md:gap-4">
          {currentTournament.logo ? (
            <img src={currentTournament.logo} alt="Logo" className="w-10 h-10 object-contain border-2 border-black bg-white p-1 shrink-0 shadow-brutal-sm" />
          ) : (
            <div className="bg-black text-white p-2.5 border-2 border-black shadow-brutal-sm hidden md:block shrink-0">
              <Trophy className="w-5 h-5"/>
            </div>
          )}
          <div>
            <h1 className="font-black text-black text-sm md:text-lg tracking-tight leading-none mb-1 flex items-center flex-wrap gap-1.5 uppercase">
              {currentTournament.title || tournamentTitle}
              {(currentTournament.isArchived || viewingArchive) && (
                <span className="inline-flex items-center gap-1 text-[8px] font-black bg-warning-red text-white px-2 py-0.5 uppercase border border-black animate-pulse shrink-0">
                  <Archive size={8}/> Terarsip
                </span>
              )}
            </h1>
            <p className="text-[9px] md:text-[10px] text-brutal-blue font-black uppercase tracking-wider">
              {currentTournament.organizer || tournamentOrganizer}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex flex-col items-end mr-3 border-r-2 pr-4 border-black">
            <p className="text-[8px] font-black text-black uppercase tracking-widest">Status Sistem</p>
            <p className="text-[10px] font-black text-success-green flex items-center gap-1">
              <span className="w-2 h-2 bg-success-green border border-black rounded-full animate-pulse"></span> ONLINE
            </p>
          </div>
          {/* Quick Referee Login button for Spectator in Header */}
          {role !== 'referee' && !viewingArchive && (
            <button
              onClick={() => {
                const pin = window.prompt("Masukkan Password Wasit:");
                if (pin === appSettings.refereePin) {
                  setRole('referee');
                  localStorage.setItem('tournament_role', 'referee');
                  localStorage.setItem('tournament_pin_version', appSettings.pinVersion.toString());
                  setSessionPinVersion(appSettings.pinVersion);
                  alert("Berhasil login sebagai Wasit!");
                } else if (pin !== null) {
                  alert("Password Wasit salah!");
                }
              }}
              className="px-2.5 py-1.5 bg-black text-white hover:bg-brutal-blue font-black text-[10px] md:text-xs border-2 border-black shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 uppercase flex items-center gap-1.5 shrink-0"
              title="Login Wasit"
            >
              <Key size={12} className="stroke-[2.5]" />
              <span className="hidden sm:inline">Login Wasit</span>
              <span className="sm:hidden">Wasit</span>
            </button>
          )}

          {/* Event Mendatang Header Button */}
          <button
            onClick={() => setShowEventsHub(true)}
            className="px-2.5 py-1.5 bg-safety-orange hover:bg-orange-600 text-white font-black text-[10px] md:text-xs border-2 border-black shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 uppercase flex items-center gap-1.5 shrink-0"
            title="Event Mendatang"
          >
            <Calendar size={13} className="stroke-[2.5]" />
            <span className="hidden sm:inline">Event</span>
            {eventsList.length > 0 && (
              <span className="bg-black text-white text-[8px] font-black px-1 py-0.2 border border-black">
                {eventsList.length}
              </span>
            )}
          </button>

          {/* Search button in header - only when bracket is active */}
          {activeBracket && activePool !== 'Final' && (
            <button
              onClick={() => { setShowSearch(s => !s); setSearchQuery(''); setSearchResult(null); setTimeout(() => searchInputRef.current?.focus(), 80); }}
              className={cn('p-2.5 border-2 border-black transition-all active:translate-x-0.5 active:translate-y-0.5 shadow-brutal-sm', showSearch ? 'bg-success-green text-black' : 'bg-white hover:bg-surface-variant text-black')}
              title="Cari Peserta"
            >
              <Search className="w-4 h-4 stroke-[3]"/>
            </button>
          )}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="p-2.5 bg-white hover:bg-surface-variant text-black border-2 border-black shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="Menu & Pengaturan"
          >
            <Settings className="w-4 h-4 stroke-[3] text-black"/>
          </button>
        </div>
        
        {isMenuOpen && (
          <div className="absolute right-4 top-16 w-64 bg-white shadow-brutal border-[3px] border-black py-2 z-50 animate-scale-in">
            <div className="px-4 py-2 border-b-2 border-black mb-1 bg-surface-variant flex items-center justify-between">
               <p className="text-[9px] font-black text-black uppercase tracking-wider">
                 {viewingArchive 
                   ? `Arsip: ${role === 'referee' ? 'Mode Wasit' : 'Mode Penonton'}` 
                   : `Akses: ${role === 'referee' ? 'Wasit / Panitia' : 'Mode Penonton'}`}
               </p>
               {role === 'referee' ? (
                 <span className="bg-black text-white text-[8px] font-black px-1.5 py-0.5 uppercase">Wasit</span>
               ) : (
                 <span className="bg-white text-black text-[8px] font-black px-1.5 py-0.5 border border-black uppercase">Publik</span>
               )}
            </div>
            
            {viewingArchive ? (
              <>
                {role === 'referee' ? (
                  <>
                    <button onClick={() => { handleOpenEditArchiveModal(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-brutal-blue hover:text-white text-xs font-black flex items-center gap-3 transition-colors uppercase">
                      <Edit3 size={14}/> Edit Detail Arsip
                    </button>
                    <button onClick={() => { setShowEventsHub(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 transition-colors uppercase">
                      <Calendar size={14}/> Event Mendatang
                    </button>
                    <button onClick={() => { setShowArchiveManagement(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 transition-colors uppercase">
                      <Archive size={14}/> Kelola Arsip Lainnya
                    </button>
                    <button onClick={() => { handlePrintPDF(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 transition-colors uppercase">
                      <Printer size={14}/> Cetak Bagan Arsip (PDF)
                    </button>
                    <button onClick={() => { setViewingArchive(null); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 border-t border-black transition-colors uppercase">
                      <ArrowLeft size={14}/> Kembali ke Turnamen Aktif
                    </button>
                    <button onClick={() => { handleChangePassword(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 border-t border-black transition-colors uppercase">
                      <Key size={14}/> Ganti Password Wasit
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { 
                      setIsMenuOpen(false);
                      const pin = window.prompt("Masukkan Password Wasit untuk Mengedit Arsip:");
                      if (pin === appSettings.refereePin) {
                        setRole('referee');
                        localStorage.setItem('tournament_role', 'referee');
                        localStorage.setItem('tournament_pin_version', appSettings.pinVersion.toString());
                        setSessionPinVersion(appSettings.pinVersion);
                        alert("Berhasil login sebagai Wasit! Sekarang Anda dapat mengedit arsip ini.");
                      } else if (pin !== null) {
                        alert("Password Wasit salah!");
                      }
                    }} className="w-full text-left px-4 py-2.5 text-black hover:bg-brutal-blue hover:text-white text-xs font-black flex items-center gap-3 transition-colors uppercase">
                      <Key size={14}/> Login Wasit (Edit Arsip)
                    </button>
                    <button onClick={() => { setShowEventsHub(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 transition-colors uppercase">
                      <Calendar size={14}/> Event Mendatang
                    </button>
                    <button onClick={() => { setShowArchiveManagement(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 transition-colors uppercase">
                      <Archive size={14}/> Lihat Arsip Lainnya
                    </button>
                    <button onClick={() => { handlePrintPDF(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 transition-colors uppercase">
                      <Printer size={14}/> Cetak Bagan (PDF)
                    </button>
                    <button onClick={() => { setViewingArchive(null); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 border-t border-black transition-colors uppercase">
                      <ArrowLeft size={14}/> Kembali ke Turnamen Aktif
                    </button>
                  </>
                )}
              </>
            ) : (
              role === 'referee' ? (
                <>
                  <button onClick={() => { setShowGlobalSetup(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-brutal-blue hover:text-white text-xs font-black flex items-center gap-3 transition-colors uppercase">
                    <Shuffle size={14}/> Buat Bagan Otomatis
                  </button>
                  <button onClick={() => { setShowEventsHub(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 transition-colors uppercase">
                    <Calendar size={14}/> Event Mendatang
                  </button>
                  <button onClick={() => { setShowArchiveManagement(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 border-b-2 border-black transition-colors uppercase">
                    <Archive size={14}/> Kelola Arsip Turnamen
                  </button>
                  <button onClick={() => { handlePrintPDF(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 transition-colors uppercase">
                    <Printer size={14}/> Cetak Bagan (PDF)
                  </button>
                  {activeBracket && (
                    <button onClick={() => {resetPool(); setIsMenuOpen(false);}} className="w-full text-left px-4 py-2.5 text-warning-red hover:bg-warning-red hover:text-white text-xs font-black flex items-center gap-3 transition-colors uppercase">
                      <RefreshCw size={14}/> Reset Bagan {activePool}
                    </button>
                  )}
                  {Object.keys(tournamentData.pools || {}).length > 0 && (
                    <>
                      <button onClick={() => {resetAllPools(); setIsMenuOpen(false);}} className="w-full text-left px-4 py-2.5 text-warning-red hover:bg-warning-red hover:text-white text-xs font-black flex items-center gap-3 transition-colors uppercase">
                        <RefreshCw size={14}/> Reset Semua Bagan
                      </button>
                      <button onClick={archiveTournament} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 border-t border-black mt-1 pt-2 transition-colors uppercase">
                        <Archive size={14}/> Arsipkan Turnamen
                      </button>
                    </>
                  )}
                  <button onClick={handleChangePassword} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 border-t border-black mt-1 pt-2 transition-colors uppercase">
                    <Key size={14}/> Ganti Password Wasit
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { 
                    setIsMenuOpen(false);
                    const pin = window.prompt("Masukkan Password Wasit:");
                    if (pin === appSettings.refereePin) {
                      setRole('referee');
                      localStorage.setItem('tournament_role', 'referee');
                      localStorage.setItem('tournament_pin_version', appSettings.pinVersion.toString());
                      setSessionPinVersion(appSettings.pinVersion);
                      alert("Berhasil login sebagai Wasit!");
                    } else if (pin !== null) {
                      alert("Password Wasit salah!");
                    }
                  }} className="w-full text-left px-4 py-2.5 text-black hover:bg-brutal-blue hover:text-white text-xs font-black flex items-center gap-3 transition-colors uppercase">
                    <Key size={14}/> Login Wasit (Akses Penuh)
                  </button>
                  <button onClick={() => { setShowEventsHub(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 transition-colors uppercase">
                    <Calendar size={14}/> Event Mendatang
                  </button>
                  <button onClick={() => { setShowArchiveManagement(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 transition-colors uppercase">
                    <Archive size={14}/> Riwayat Arsip Turnamen
                  </button>
                  <button onClick={() => { handlePrintPDF(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 transition-colors uppercase">
                    <Printer size={14}/> Cetak Bagan (PDF)
                  </button>
                  <button onClick={() => { window.location.reload(); }} className="w-full text-left px-4 py-2.5 text-black hover:bg-surface-variant text-xs font-black flex items-center gap-3 transition-colors uppercase">
                    <RefreshCw size={14}/> Segarkan Data (Live)
                  </button>
                </>
              )
            )}
            <button onClick={logout} className="w-full text-left px-4 py-2.5 text-black hover:bg-warning-red hover:text-white text-xs font-black flex items-center gap-3 border-t-2 border-black transition-colors uppercase">
              <LogOut size={14}/> Keluar Sistem
            </button>
          </div>
        )}
      </header>

      {/* Pool Tabs */}
      <div className="bg-white border-b-[3px] border-black px-4 py-2.5 flex items-center justify-between sticky top-[65px] z-30 shadow-brutal-sm">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 py-1">
          {poolsList.map(pool => (
            <button 
              key={pool} 
              onClick={() => { setActivePool(pool); setSearchResult(null); setShowSearch(false); setSearchQuery(''); }} 
              className={cn(
                "py-2.5 px-6 font-black text-xs md:text-sm transition-all border-[3px] border-black active:translate-x-0.5 active:translate-y-0.5 shrink-0 uppercase tracking-wider", 
                activePool === pool 
                  ? (pool === 'Final' ? 'bg-safety-orange text-white shadow-brutal-sm' : 'bg-brutal-blue text-white shadow-brutal-sm') 
                  : 'bg-white text-black hover:bg-surface-variant'
              )}
            >
              {pool === 'Final' ? 'FINAL' : `BAGAN ${pool}`}
            </button>
          ))}
        </div>
        {activeBracket && (
          <button 
            onClick={handlePrintPDF}
            className="flex items-center gap-2 bg-white border-[3px] border-black hover:bg-black hover:text-white text-black py-2 px-4 font-black text-xs transition-all shrink-0 active:translate-x-0.5 active:translate-y-0.5 shadow-brutal-sm ml-2 uppercase tracking-wide"
          >
            <Printer size={14} className="stroke-[2.5]" />
            <span className="hidden sm:inline">CETAK / PDF</span>
          </button>
        )}
      </div>


      {/* Edit Modal / Setelan Peserta */}
      {editingPlayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setEditingPlayer(null)}></div>
          <div className="relative bg-white w-full max-w-md p-6 md:p-8 shadow-brutal animate-scale-in border-[3px] border-black">
            <h3 className="text-xl font-black text-black mb-1 uppercase tracking-tight">Setelan Peserta</h3>
            <p className="text-xs font-bold text-black uppercase tracking-wider mb-6">Kelola: {editingPlayer.currentName}</p>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-black uppercase tracking-wider mb-2 block">Ubah Nama Peserta</label>
                <input 
                  autoFocus 
                  id="edit-name-input" 
                  type="text" 
                  defaultValue={editingPlayer.currentName} 
                  className="w-full bg-white border-[2px] border-black p-3.5 font-bold text-xs text-black outline-none neo-brutalist-input transition-all shadow-inner"
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdatePlayerName(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-black uppercase tracking-wider mb-2 block">Tindakan Khusus</label>
                {(() => {
                  const poolData = tournamentData.pools[activePool];
                  const match = poolData?.matches?.find(m => m.id === editingPlayer.matchId);
                  const isDis = editingPlayer.playerSlot === 1 ? match?.player1Disqualified : match?.player2Disqualified;
                  
                  return (
                    <button 
                      onClick={() => handleDisqualifyPlayer(editingPlayer.matchId, editingPlayer.playerSlot)}
                      className={cn(
                        "w-full py-3.5 font-black text-xs transition-all flex items-center justify-center gap-2 border-[2px] border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 uppercase tracking-wide",
                        isDis 
                          ? "bg-success-green hover:bg-green-400 text-black" 
                          : "bg-warning-red hover:bg-red-700 text-white"
                      )}
                    >
                      {isDis ? (
                        <>
                          <Check size={14} className="stroke-[3]" /> BATALKAN DISKUALIFIKASI
                        </>
                      ) : (
                        <>
                          <X size={14} className="stroke-[3]" /> DISKUALIFIKASI PESERTA (DIS)
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
            
            <div className="flex gap-3 mt-8 pt-5 border-t-[3px] border-black">
              <button onClick={() => setEditingPlayer(null)} className="flex-1 bg-white border-2 border-black text-black py-3 font-black text-xs hover:bg-surface-variant transition-all active:translate-x-0.5 active:translate-y-0.5 uppercase">Tutup</button>
              <button onClick={() => handleUpdatePlayerName(document.getElementById('edit-name-input').value)} className="flex-1 bg-brutal-blue border-2 border-black text-white py-3 font-black text-xs shadow-brutal-sm hover:bg-blue-700 transition-all active:translate-x-0.5 active:translate-y-0.5 uppercase tracking-wide">Simpan Nama</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Management Modal */}
      {showArchiveManagement && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowArchiveManagement(false)}></div>
          <div className="relative bg-white w-full max-w-lg p-4 sm:p-6 md:p-8 shadow-brutal animate-scale-in border-[3px] border-black flex flex-col max-h-[90vh]">
            <h3 className="text-lg sm:text-xl font-black text-black mb-1 flex items-center gap-2 tracking-tight uppercase">
              <Archive className="text-black stroke-[2.5]" size={20}/> {role === 'referee' ? 'Kelola Arsip Turnamen' : 'Riwayat Arsip Turnamen'}
            </h3>
            <p className="text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider mb-4 sm:mb-6">
              {role === 'referee' ? 'Manajemen Riwayat Turnamen Wasit' : 'Daftar Turnamen & Hasil Rekam Jejak Masa Lalu'}
            </p>
            
            <div className="space-y-3 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin flex-1">
              {archivesList.length === 0 ? (
                <div className="text-center py-12 text-black font-bold uppercase text-xs">Belum ada turnamen yang diarsipkan.</div>
              ) : (
                archivesList.map((archive) => {
                  const dateStr = new Date(archive.archivedAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  const champName = getArchiveChampion(archive);
                  return (
                    <div key={archive.id} className="bg-surface-variant border-2 border-black p-3 sm:p-4 shadow-brutal-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        {archive.logo ? (
                          <img src={archive.logo} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain border-2 border-black p-1 bg-white shrink-0 shadow-brutal-sm" />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-black p-2 border-2 border-black shrink-0 flex items-center justify-center shadow-brutal-sm">
                            <Trophy size={18} className="stroke-[2.5]" />
                          </div>
                        )}
                        <div className="text-left min-w-0 flex-1">
                          <h4 className="font-black text-black text-xs sm:text-sm uppercase tracking-tight leading-snug break-words">
                            {archive.title}
                          </h4>
                          <p className="text-[9px] sm:text-[10px] text-black font-bold uppercase tracking-wider mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-brutal-blue font-black">{archive.organizer}</span>
                            <span>•</span>
                            <span>{dateStr}</span>
                          </p>
                          {champName && (
                            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-black text-white px-2 py-0.5 border border-black shadow-brutal-sm text-[9px] sm:text-[10px] font-black uppercase">
                              <Trophy size={10} className="text-warning-red stroke-[2.5]" />
                              <span>Juara 1: <span className="text-white underline">{champName}</span></span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-black/20">
                        <button 
                          onClick={() => {
                            setViewingArchive(archive);
                            setShowArchiveManagement(false);
                            if (archive.pools) {
                              if (archive.pools['Final']) {
                                setActivePool('Final');
                              } else if (Object.keys(archive.pools).length > 0) {
                                const sortedPools = Object.keys(archive.pools).sort();
                                setActivePool(sortedPools[0]);
                              }
                            }
                          }}
                          className="flex-1 sm:flex-none bg-brutal-blue hover:bg-blue-700 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider py-2 sm:py-2.5 px-3.5 transition-all border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <Eye size={13} />
                          <span>Lihat / Buka</span>
                        </button>
                        {role === 'referee' && (
                          <button 
                            onClick={() => handleDeleteArchive(archive.id, archive.title)}
                            className="bg-warning-red hover:bg-red-700 text-white p-2 sm:p-2.5 transition-all border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center shrink-0"
                            title="Hapus Arsip"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-[3px] border-black flex justify-end">
              <button onClick={() => setShowArchiveManagement(false)} className="w-full sm:w-auto bg-black hover:bg-brutal-blue text-white px-6 py-3 font-black transition-all shadow-brutal border-2 border-black active:translate-x-0.5 active:translate-y-0.5 text-xs uppercase tracking-wider text-center">
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white">
        {currentTournament.isArchived && !viewingArchive && (
          role === 'referee' ? (
            <div className="bg-success-green text-black font-black text-xs md:text-sm uppercase tracking-widest text-center px-4 py-3 flex items-center justify-center gap-2 border-b-[3px] border-black shadow-brutal-sm relative z-30">
              <Archive size={16}/> Turnamen ini telah diarsipkan (Mode Edit Wasit Aktif)
            </div>
          ) : (
            <div className="bg-warning-red text-white font-black text-xs md:text-sm uppercase tracking-widest text-center px-4 py-3 flex items-center justify-center gap-2 border-b-[3px] border-black shadow-brutal-sm relative z-30 animate-pulse">
              <Archive size={16}/> Turnamen ini telah diarsipkan dan bersifat final (Read-Only)
            </div>
          )
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
            useLocalPool={useLocalPool}
            setUseLocalPool={setUseLocalPool}
            bulkInputLocal={bulkInputLocal}
            setBulkInputLocal={setBulkInputLocal}
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
              <div className="relative bg-white border-[3px] border-black p-6 md:p-8 flex items-center gap-6 shadow-brutal">
                <div className="bg-black p-4 text-white border-2 border-black shadow-brutal-sm"><Trophy size={36}/></div>
                <div>
                  <span className="text-[10px] font-black text-black bg-safety-orange px-2 py-0.5 uppercase tracking-widest border border-black inline-block mb-1">
                    Grand Final
                  </span>
                  <h2 className="text-2xl font-black text-black uppercase tracking-tight">{currentTournament.title || tournamentTitle}</h2>
                  <p className="text-xs text-black font-bold uppercase mt-1">{getFinalFormatText()}</p>
                </div>
              </div>
            </div>

            {/* Champions Podium */}
            {renderPodium()}

            {/* Event Documentation */}
            {renderDocumentationSection()}

            {/* Finalists Status */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8 max-w-3xl mx-auto">
              {currentTournament.useCustomFinalists ? (
                (currentTournament.customFinalists || Array(currentTournament.customFinalistsCount || 4).fill('')).map((name, idx) => (
                  <div key={idx} className={cn("p-5 border-[2px] border-black text-center shadow-brutal-sm", name ? 'bg-surface-variant' : 'bg-white')}>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-black">Finalis #{idx + 1}</p>
                    <p className={cn("text-sm font-black uppercase", name ? 'text-black' : 'text-slate-400 italic')}>{ name || 'TBA'}</p>
                    {name && <div className="mt-2 w-2 h-2 bg-black rounded-full mx-auto"></div>}
                  </div>
                ))
              ) : (
                finalParticipants.map((p) => (
                  <div key={p.pool} className={cn("p-5 border-[2px] border-black text-center shadow-brutal-sm", p.name ? 'bg-surface-variant' : 'bg-white')}>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-black">Juara Pool {p.pool}</p>
                    <p className={cn("text-sm font-black uppercase", p.name ? 'text-black' : 'text-slate-400 italic')}>{ p.name || 'Belum Ada'}</p>
                    {p.name && <div className="mt-2 w-2 h-2 bg-black rounded-full mx-auto"></div>}
                  </div>
                ))
              )}
            </div>

            {/* Referee Quick Setup Panel */}
            {role === 'referee' && (
              <div className="bg-surface-variant border-[3px] border-black p-6 mb-8 max-w-3xl mx-auto shadow-brutal">
                <div className="flex flex-col gap-6">
                  {/* Finalists Data Source Configuration */}
                  <div className="border-b-[2px] border-black pb-5">
                    <label className="text-[10px] font-black text-black uppercase tracking-widest mb-3 block">Sumber Data Finalis</label>
                    <div className="flex gap-2 p-1 mb-4">
                      <button 
                        onClick={() => updateCustomFinalistSettings({ useCustomFinalists: false })} 
                        className={cn(
                          "flex-1 py-2 px-4 text-xs font-black transition-all border-2 border-black uppercase", 
                          !currentTournament.useCustomFinalists 
                            ? "bg-black text-white shadow-brutal-sm" 
                            : "bg-white text-black hover:bg-surface-container"
                        )}
                      >
                        Otomatis (Juara Pool)
                      </button>
                      <button 
                        onClick={() => updateCustomFinalistSettings({ useCustomFinalists: true })} 
                        className={cn(
                          "flex-1 py-2 px-4 text-xs font-black transition-all border-2 border-black uppercase", 
                          currentTournament.useCustomFinalists 
                            ? "bg-black text-white shadow-brutal-sm" 
                            : "bg-white text-black hover:bg-surface-container"
                        )}
                      >
                        Kustom (Pilih Manual)
                      </button>
                    </div>

                    {currentTournament.useCustomFinalists && (
                      <div className="bg-white border-2 border-black p-5 flex flex-col gap-4 shadow-brutal-sm">
                        <div className="flex items-center justify-between border-b-2 border-black pb-3">
                          <span className="text-[10px] font-black text-black uppercase tracking-widest">Daftar Finalis Kustom</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-black uppercase">Jumlah Slot:</span>
                            <select 
                              value={currentTournament.customFinalistsCount || 4} 
                              onChange={(e) => updateCustomFinalistSettings({ customFinalistsCount: parseInt(e.target.value) })}
                              className="bg-white border-2 border-black px-2.5 py-1 text-xs font-black text-black outline-none"
                            >
                              {[2, 4, 8, 16].map(num => (
                                <option key={num} value={num}>{num} Pemain</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {Array.from({ length: currentTournament.customFinalistsCount || 4 }).map((_, idx) => {
                            const name = (currentTournament.customFinalists || [])[idx] || '';
                            return (
                              <div key={idx} className="flex flex-col gap-1.5">
                                <span className="text-[8px] font-black text-black uppercase tracking-wider">Slot Finalis #{idx + 1}</span>
                                <input 
                                  type="text"
                                  list="all-participants-list"
                                  value={name}
                                  onChange={(e) => {
                                    const newList = [...(currentTournament.customFinalists || [])];
                                    while (newList.length <= idx) newList.push('');
                                    newList[idx] = e.target.value;
                                    if (viewingArchive) {
                                      setViewingArchive(prev => ({
                                        ...prev,
                                        customFinalists: newList
                                      }));
                                    } else {
                                      setTournamentData(prev => ({
                                        ...prev,
                                        customFinalists: newList
                                      }));
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const newList = [...(currentTournament.customFinalists || [])];
                                    while (newList.length <= idx) newList.push('');
                                    newList[idx] = e.target.value;
                                    updateCustomFinalistSettings({ customFinalists: newList });
                                  }}
                                  placeholder={`Ketik nama atau pilih dari bagan...`}
                                  className="w-full bg-white border-2 border-black p-3 outline-none font-bold text-xs text-black neo-brutalist-input transition-all"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Format Selector */}
                  <div>
                    <label className="text-[10px] font-black text-black uppercase tracking-widest mb-3 block text-center md:text-left">Format Bagan Final</label>
                    <div className="grid grid-cols-3 gap-2 p-1">
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
                              "py-2.5 px-3 text-xs font-black transition-all border-2 border-black uppercase",
                              isActive
                                ? "bg-brutal-blue text-white shadow-brutal-sm"
                                : "bg-white text-black hover:bg-surface-container"
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
                        "flex-1 p-4 font-black text-xs md:text-sm transition-all flex items-center justify-center gap-2 border-[3px] border-black uppercase tracking-wide", 
                        allFinalistsReady 
                          ? 'bg-success-green hover:bg-green-400 text-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed border-2'
                      )} 
                      disabled={!allFinalistsReady}
                    >
                      <LayoutGrid size={18}/> {activeBracket ? 'Sync Ulang Finalis' : 'Mulai Bagan Final'}
                    </button>
                    {activeBracket && (
                      <button 
                        onClick={resetPool} 
                        className="px-6 py-4 font-black text-xs md:text-sm text-white bg-warning-red hover:bg-red-700 transition-all border-[3px] border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 uppercase"
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
              <div className="space-y-5 max-w-3xl mx-auto">
                <div className="flex items-center justify-between border-b-[3px] border-black pb-2">
                  <h3 className="font-black text-black text-xs uppercase tracking-widest">Pertandingan Final</h3>
                  <span className="text-[10px] font-black text-black uppercase tracking-wider">{activeBracket.matches.length} Pertandingan</span>
                </div>
                <div className="space-y-3">
                  {activeBracket.matches.map((match, idx) => (
                    <div key={match.id} className="bg-white border-[3px] border-black p-4 md:p-5 shadow-brutal-sm hover:shadow-brutal transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-black text-black uppercase tracking-wider">Match #{idx + 1}</span>
                        <span className="text-[9px] font-black text-white bg-black px-2.5 py-0.5 uppercase tracking-wider border border-black">{match.label}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {[{name: match.player1, slot: 1}, {name: match.player2, slot: 2}].map(p => (
                          <button 
                            key={p.slot} 
                            onClick={() => setFinalWinner(match.id, p.name)} 
                            disabled={role !== 'referee' || !p.name} 
                            className={cn(
                              'w-full flex items-center gap-3 p-3.5 border-2 border-black font-black text-xs md:text-sm transition-all text-left uppercase active:translate-x-0.5 active:translate-y-0.5',
                              match.winner === p.name 
                                ? 'bg-brutal-blue text-white shadow-brutal-sm' 
                                : 'bg-white hover:bg-surface-variant text-black'
                            )}
                          >
                            <div className={cn('w-3.5 h-3.5 shrink-0 border-2 border-black', match.winner === p.name ? 'bg-white' : 'bg-black')}/>
                            <span className="truncate">{p.name || 'TBA'}</span>
                            {match.winner === p.name && <Check size={14} className="ml-auto stroke-[3]"/>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Standings Table */}
                <div className="mt-8">
                  <div className="flex items-center justify-between border-b-[3px] border-black pb-2 mb-3">
                    <h3 className="font-black text-black text-xs uppercase tracking-widest flex items-center gap-2">
                      <Trophy size={14} className="text-black" /> Klasemen Sementara
                    </h3>
                  </div>
                  <div className="bg-white border-[3px] border-black overflow-hidden shadow-brutal">
                    <div className="grid grid-cols-4 bg-black text-white text-[10px] font-black uppercase tracking-widest px-4 md:px-6 py-3">
                      <div>Nama Peserta</div>
                      <div className="text-center">Menang (M)</div>
                      <div className="text-center">Kalah (K)</div>
                      <div className="text-center">Poin (PTS)</div>
                    </div>
                    {computeStandings(activeBracket).map((s, i) => (
                      <div 
                        key={s.name} 
                        className={cn(
                          'grid grid-cols-4 px-4 md:px-6 py-3.5 border-b-2 last:border-0 border-black items-center transition-colors', 
                          i === 0 && 'bg-safety-orange/20 border-l-4 border-l-safety-orange',
                          i === 1 && 'bg-surface-variant border-l-4 border-l-black',
                          i === 2 && 'bg-amber-100 border-l-4 border-l-amber-600',
                          i > 2 && 'bg-white'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {i === 0 && <Trophy size={14} className="text-black shrink-0 stroke-[2.5]"/>}
                          {i === 1 && <Medal size={14} className="text-black shrink-0 stroke-[2.5]"/>}
                          {i === 2 && <Award size={14} className="text-black shrink-0 stroke-[2.5]"/>}
                          {i > 2 && <span className="text-[10px] font-black text-black w-4 text-center shrink-0">{i + 1}</span>}
                          <span className="font-black text-xs md:text-sm text-black truncate uppercase">{s.name}</span>
                        </div>
                        <div className="text-center font-black text-xs md:text-sm text-success-green">{s.w}</div>
                        <div className="text-center font-black text-xs md:text-sm text-warning-red">{s.l}</div>
                        <div className="text-center font-black text-sm md:text-base text-brutal-blue">{s.pts}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tree Bracket Matches (Gugur Tunggal / Gugur Ganda) */}
            {activeBracket && activeBracket.type !== 'roundrobin' && (
              <div className="relative mt-8 border-t-[3px] border-black pt-8 overflow-visible">
                <h3 className="font-black text-black text-xs uppercase tracking-widest mb-6 text-center">Bagan Pertandingan Final</h3>
                <div className="border-[3px] border-black bg-white overflow-hidden shadow-brutal">
                  {renderBracket()}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!activeBracket && role !== 'referee' && (
              <div className="text-center py-20 max-w-3xl mx-auto"><Trophy size={60} className="text-black mx-auto mb-4"/><p className="text-black font-black uppercase">Bagan Final belum dimulai.</p></div>
            )}
          </div>
        ) : (
          /* ===== BAGAN POOL REGULER ===== */
          <div>
            {!activeBracket ? (
              role === 'referee' ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-20 text-center animate-fade-in">
                  <Shuffle size={80} className="text-black mb-6 stroke-[2]"/>
                  <h2 className="text-2xl font-black text-black uppercase tracking-widest">Bagan {activePool} Kosong</h2>
                  <p className="text-black font-bold mt-2 mb-8">Anda harus menggunakan fitur Buat Bagan Otomatis untuk mengisi ulang bagan.</p>
                  <button onClick={() => setShowGlobalSetup(true)} className="bg-brutal-blue text-white px-8 py-4 font-black text-sm border-[3px] border-black shadow-brutal hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:translate-x-0.5 active:translate-y-0.5 uppercase tracking-wide">
                    <Shuffle size={20}/> BUAT BAGAN OTOMATIS
                  </button>
                </div>
              ) : <div className="flex flex-col items-center justify-center min-h-[60vh] p-20 text-center animate-fade-in"><Trophy size={80} className="text-black mb-6 stroke-[2]"/><h2 className="text-2xl font-black text-black uppercase tracking-widest">Bagan {activePool} Belum Siap</h2><p className="text-black font-bold mt-2 uppercase">Menunggu panitia mengunggah daftar peserta.</p></div>
            ) : (
              <div className="relative">
                {/* Reusable Bracket Renderer */}
                {renderBracket()}

                {/* Floating Controls — Zoom + Search */}
                <div className="fixed bottom-28 right-4 z-50 flex flex-col items-center gap-1.5 select-none">
                  <div className="bg-white border-[3px] border-black shadow-brutal flex flex-col items-center">
                    <button
                      onClick={() => setBracketZoom(z => Math.min(2, parseFloat((z + 0.1).toFixed(1))))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-surface-variant active:bg-slate-200 transition-colors"
                    >
                      <ZoomIn size={18} className="text-black stroke-[2.5]"/>
                    </button>
                    <div className="w-8 h-[2px] bg-black"/>
                    <div className="w-11 h-8 flex items-center justify-center">
                      <span className="text-[9px] font-black text-black">{Math.round(bracketZoom * 100)}%</span>
                    </div>
                    <div className="w-8 h-[2px] bg-black"/>
                    <button
                      onClick={() => setBracketZoom(z => Math.max(0.4, parseFloat((z - 0.1).toFixed(1))))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-surface-variant active:bg-slate-200 transition-colors"
                    >
                      <ZoomOut size={18} className="text-black stroke-[2.5]"/>
                    </button>
                  </div>
                  <button
                    onClick={() => setBracketZoom(1)}
                    className="mt-1 bg-white border-[2px] border-black shadow-brutal-sm px-3 py-1.5 text-[9px] font-black text-black hover:bg-surface-variant transition-colors uppercase"
                  >
                    RESET
                  </button>
                  {/* Search button in floating pill */}
                  <button
                    onClick={() => { setShowSearch(s => !s); setSearchQuery(''); setSearchResult(null); setTimeout(() => searchInputRef.current?.focus(), 80); }}
                    className={cn(
                      'mt-1 w-11 h-11 flex items-center justify-center border-[3px] border-black shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5',
                      showSearch
                        ? 'bg-success-green text-black'
                        : 'bg-white text-black hover:bg-surface-variant'
                    )}
                  >
                    <Search size={18} className="stroke-[3]"/>
                  </button>
                </div>
              </div>
            )}

            {/* Juara Pool — tampil di bawah setelah bracket selesai */}
            {(() => {
              const poolWinner = activeBracket?.matches?.find(m => m.round === activeBracket?.totalRounds)?.winner;
              if (!poolWinner) return null;
              return (
                <div className="max-w-sm mx-auto px-4 pb-16 pt-8 animate-slide-up">
                  <div className="relative bg-white border-[3px] border-black px-6 py-5 shadow-brutal flex items-center gap-5">
                    <div className="bg-black p-3.5 text-white border-2 border-black shadow-brutal-sm shrink-0">
                      <Trophy size={26} className="stroke-[2.5]"/>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-black uppercase tracking-widest mb-0.5">Juara Pool {activePool}</p>
                      <p className="text-lg font-black text-black tracking-tight truncate uppercase">{poolWinner}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* Search Modal Overlay */}
      {showSearch && activeBracket && activePool !== 'Final' && (
        <div className="fixed inset-0 z-[55] flex items-start justify-center pt-24 px-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md">
            <div className="bg-white border-[3px] border-black shadow-brutal p-4 flex items-center gap-3 animate-scale-in">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-black stroke-[3]"/>
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
                  className="w-full pl-10 pr-4 py-3.5 bg-white border-[2px] border-black text-sm font-bold text-black neo-brutalist-input transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-success-green hover:bg-green-400 text-black px-5 py-3.5 border-2 border-black font-black text-sm transition-all shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 uppercase shrink-0"
              >
                Cari
              </button>
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResult(null); }}
                className="p-2.5 hover:bg-surface-variant border-2 border-black transition-colors shrink-0"
              >
                <X size={16} className="text-black stroke-[3]"/>
              </button>
            </div>
            {searchResult && (
              <p className="text-center text-[11px] font-black text-black mt-2 bg-success-green border-2 border-black px-4 py-2 uppercase shadow-brutal-sm">
                Peserta ditemukan — bagan sudah digulir ke kartu yang dicari
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="bg-white border-t-[3px] border-black p-6 flex flex-col items-center justify-center gap-2 z-40 text-center">
        <p className="text-[10px] font-black text-black uppercase tracking-widest leading-relaxed">
          Perkumpulan Pelayang Seluruh Indonesia Kabupaten Majalengka
        </p>
        <p className="text-[11px] font-black text-black uppercase tracking-wider">
          © Copyright by <span className="text-brutal-blue">Senyap</span>
        </p>
      </footer>

      {winnerConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setWinnerConfirm(null)}></div>
          <div className="relative bg-white w-full max-w-sm p-8 shadow-brutal animate-scale-in border-[3px] border-black text-center">
            <div className="w-16 h-16 bg-white text-black border-2 border-black shadow-brutal-sm flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} className="stroke-[2.5]"/>
            </div>
            <h3 className="text-xl font-black text-black mb-2 uppercase tracking-tight">Konfirmasi Pemenang</h3>
            <p className="text-black font-bold text-xs leading-relaxed mb-6">
              Apakah Anda yakin ingin menetapkan <strong className="text-brutal-blue font-black uppercase">{winnerConfirm.winnerName}</strong> sebagai pemenang pertandingan ini?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setWinnerConfirm(null)} className="flex-1 bg-white text-black border-2 border-black py-3.5 font-black hover:bg-surface-variant transition-colors uppercase">Batal</button>
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
                className="flex-1 bg-brutal-blue hover:bg-blue-700 text-white py-3.5 font-black border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 uppercase tracking-wide"
              >
                Ya, Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-4 shadow-brutal border-2 border-white z-50 flex items-center gap-4 animate-slide-up">
          <AlertCircle size={20} className="text-warning-red"/>
          <span className="text-sm font-black uppercase">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="p-1 hover:bg-white/20 border border-white">
            <X size={16}/>
          </button>
        </div>
      )}

      {/* Edit Archive Modal */}
      {showEditArchiveModal && viewingArchive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white max-w-md w-full shadow-brutal border-[3px] border-black overflow-hidden animate-scale-in">
            <div className="bg-black p-4 sm:p-6 text-white border-b-[3px] border-black">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wide flex items-center gap-2">
                <Archive size={20} /> Edit Detail Arsip
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase mt-1">Ubah metadata untuk turnamen arsip ini</p>
            </div>
            
            <form onSubmit={handleSaveArchiveEdit} onPaste={(e) => handlePasteImage(e, 'archive_logo')} className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Judul Turnamen</label>
                <input 
                  type="text" 
                  required
                  value={editArchiveTitle} 
                  onChange={(e) => setEditArchiveTitle(e.target.value)}
                  className="w-full bg-white border-2 border-black p-3 font-bold text-xs text-black outline-none neo-brutalist-input transition-all"
                  placeholder="Contoh: Turnamen Layangan Nasional"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Penyelenggara</label>
                <input 
                  type="text" 
                  required
                  value={editArchiveOrganizer} 
                  onChange={(e) => setEditArchiveOrganizer(e.target.value)}
                  className="w-full bg-white border-2 border-black p-3 font-bold text-xs text-black outline-none neo-brutalist-input transition-all"
                  placeholder="Contoh: KOPASUS Majalengka"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Tanggal Turnamen</label>
                <input 
                  type="date" 
                  required
                  value={editArchiveDate} 
                  onChange={(e) => setEditArchiveDate(e.target.value)}
                  className="w-full bg-white border-2 border-black p-3 font-bold text-xs text-black outline-none neo-brutalist-input transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Logo Baru (Opsional - Bisa Paste lewat Ctrl+V)</label>
                <div className="flex items-center gap-4 mt-1">
                  {viewingArchive.logo && !archiveLogoFile && (
                    <img src={viewingArchive.logo} alt="Logo lama" className="w-12 h-12 object-contain border-2 border-black p-1 bg-white" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setArchiveLogoFile(e.target.files[0])}
                    className="block w-full text-xs text-black file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:text-xs file:font-black file:bg-white file:text-black hover:file:bg-surface-variant cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t-[3px] border-black">
                <button 
                  type="button" 
                  onClick={() => setShowEditArchiveModal(false)}
                  className="flex-1 py-3 px-4 text-xs font-black border-2 border-black text-black bg-white hover:bg-surface-variant active:translate-x-0.5 active:translate-y-0.5 uppercase transition-all"
                  disabled={isSavingArchive}
                >
                  BATAL
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 px-4 text-xs font-black bg-black text-white hover:bg-brutal-blue border-2 border-black active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-brutal-sm flex items-center justify-center gap-2 uppercase tracking-wider"
                  disabled={isSavingArchive}
                >
                  {isSavingArchive ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span> MENYIMPAN...
                    </>
                  ) : 'SIMPAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals for Main View */}
      {renderEventsHubModal()}
      {renderEventDetailModal()}
      {renderEventFormModal()}
      {renderCarouselLightbox()}

      {/* Mobile Bottom Navigation Bar (Brutalist) */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 py-2 h-[72px] md:hidden z-50 border-t-[3px] border-black bg-white">
        <button
          onClick={() => {
            if (activePool === 'Final') {
              const regularPools = poolsList.filter(p => p !== 'Final');
              if (regularPools.length > 0) setActivePool(regularPools[0]);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={cn(
            "flex flex-col items-center justify-center p-1.5 transition-all duration-75 uppercase",
            activePool !== 'Final' && !viewingArchive
              ? "bg-brutal-blue text-white border-[2px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
              : "text-black hover:bg-surface-variant active:translate-x-0 active:translate-y-0 active:shadow-none"
          )}
        >
          <Play size={17} className="stroke-[3]" />
          <span className="font-black text-[10px] uppercase tracking-wider mt-0.5">Live</span>
        </button>

        <button
          onClick={() => {
            setActivePool('Final');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={cn(
            "flex flex-col items-center justify-center p-1.5 transition-all duration-75 uppercase",
            activePool === 'Final' && !viewingArchive
              ? "bg-safety-orange text-white border-[2px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
              : "text-black hover:bg-surface-variant active:translate-x-0 active:translate-y-0 active:shadow-none"
          )}
        >
          <Trophy size={17} className="stroke-[3]" />
          <span className="font-black text-[10px] uppercase tracking-wider mt-0.5">Finals</span>
        </button>

        <button
          onClick={() => {
            setShowEventsHub(true);
          }}
          className="flex flex-col items-center justify-center p-1.5 text-black hover:bg-surface-variant transition-all duration-75 uppercase active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          <Calendar size={17} className="stroke-[3] text-safety-orange" />
          <span className="font-black text-[10px] uppercase tracking-wider mt-0.5">Events</span>
        </button>

        <button
          onClick={() => {
            setShowArchiveManagement(true);
          }}
          className={cn(
            "flex flex-col items-center justify-center p-1.5 transition-all duration-75 uppercase",
            viewingArchive
              ? "bg-brutal-blue text-white border-[2px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
              : "text-black hover:bg-surface-variant active:translate-x-0 active:translate-y-0 active:shadow-none"
          )}
        >
          <Archive size={17} className="stroke-[3]" />
          <span className="font-black text-[10px] uppercase tracking-wider mt-0.5">History</span>
        </button>

        <button
          onClick={() => {
            setActivePool('Final');
            setTimeout(() => {
              const el = document.getElementById('gallery-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className="flex flex-col items-center justify-center text-black p-1.5 hover:bg-surface-variant transition-all duration-75 uppercase active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          <Camera size={17} className="stroke-[3]" />
          <span className="font-black text-[10px] uppercase tracking-wider mt-0.5">Media</span>
        </button>
      </nav>

      {/* Datalist untuk autocomplete peserta kustom di Bagan Final */}
      <datalist id="all-participants-list">
        {uniqueParticipants.map(p => (
          <option key={p.name} value={p.name}>{`Pool ${p.pool}: ${p.name}`}</option>
        ))}
      </datalist>
    </div>
  );
}

