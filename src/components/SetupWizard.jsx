import React from 'react';
import { 
  Shuffle, 
  X, 
  Shield, 
  LayoutGrid, 
  Check, 
  AlertCircle, 
  Trophy,
  Save,
  Globe,
  Users,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function SetupWizard({
  showGlobalSetup,
  setShowGlobalSetup,
  bracketSize,
  setBracketSize,
  finalFormat,
  setFinalFormat,
  doubleLife,
  setDoubleLife,
  prelimPointsSystem,
  setPrelimPointsSystem,
  isOpenTournament,
  setIsOpenTournament,
  logoBase64,
  setLogoBase64,
  bulkInput,
  setBulkInput,
  useLocalPool,
  setUseLocalPool,
  bulkInputLocal,
  setBulkInputLocal,

  generateGlobalBracket,
  role,
  tournamentTitle,
  setTournamentTitle,
  tournamentOrganizer,
  setTournamentOrganizer,
  hasExistingTournament,
  saveGlobalSettings
}) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar!');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/png');
        setLogoBase64(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  if (role !== 'referee') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-12 text-center animate-fade-in">
        <div className="w-20 h-20 bg-surface border-2 border-border-strong rounded-2xl shadow-tactical flex items-center justify-center mb-6">
          <Trophy size={40} className="text-border-strong"/>
        </div>
        <h2 className="text-2xl font-black text-border-strong uppercase tracking-widest">Bagan Belum Siap</h2>
        <p className="text-slate-600 font-bold mt-2">Menunggu wasit/panitia menginisialisasi turnamen.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-slide-up">
      <div className="bg-surface rounded-2xl shadow-tactical border-2 border-border-strong overflow-hidden">
        {/* Tactical Header */}
        <div className="bg-border-strong p-6 md:p-8 text-white relative overflow-hidden flex items-center justify-between border-b-2 border-border-strong">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Shuffle size={140}/></div>
          <div className="relative z-10">
            <span className="text-[9px] font-black text-primary-container bg-white px-2.5 py-0.5 rounded uppercase tracking-widest">
              Tournament Engine
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight mt-1">Smart Global Setup</h2>
            <p className="text-slate-300 text-xs font-bold uppercase tracking-wider mt-0.5">Inisialisasi & Konfigurasi Multi-Bagan</p>
          </div>
          {showGlobalSetup && (
            <button 
              onClick={() => setShowGlobalSetup(false)} 
              className="relative z-10 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl border border-white/20 transition-all active:scale-95"
            >
              <X size={20}/>
            </button>
          )}
        </div>
        
        {/* Narrative & Rules Banner */}
        <div className="p-5 md:p-8 bg-surface-bright border-b-2 border-border-subtle space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary text-white p-3 rounded-xl border-2 border-border-strong shadow-tactical-sm shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm text-border-strong mb-1 uppercase tracking-wide">Sistem Seeding Keadilan Mutlak</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-semibold">
                Ditenagai oleh algoritma <strong className="text-primary font-black">Smart Global Distribution</strong> kelas turnamen E-Sports. Sistem membaca identitas tim peserta dan mendistribusikannya seadil mungkin secara matematis untuk menghindari bentrok saudara di babak awal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-surface border-2 border-border-strong p-4 rounded-xl shadow-tactical-sm">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <LayoutGrid size={16} className="stroke-[2.5]" />
                <h4 className="font-black text-[11px] uppercase tracking-wider text-border-strong">Distribusi Lintas Pool</h4>
              </div>
              <p className="text-[11px] text-on-surface-variant font-semibold leading-relaxed">
                Jika sebuah tim mendaftar 9 peserta, sistem otomatis membaginya rata ke seluruh bagan yang tersedia.
              </p>
            </div>
            <div className="bg-surface border-2 border-border-strong p-4 rounded-xl shadow-tactical-sm">
              <div className="flex items-center gap-2 mb-2 text-status-success">
                <Shield size={16} className="stroke-[2.5]" />
                <h4 className="font-black text-[11px] uppercase tracking-wider text-border-strong">Anti Perang Saudara</h4>
              </div>
              <p className="text-[11px] text-on-surface-variant font-semibold leading-relaxed">
                Di dalam satu bagan, anggota tim dipisah ke kuarter berbeda. <strong>Mustahil bentrok</strong> di babak awal!
              </p>
            </div>
            <div className="bg-surface border-2 border-border-strong p-4 rounded-xl shadow-tactical-sm">
              <div className="flex items-center gap-2 mb-2 text-status-warning">
                <Shuffle size={16} className="stroke-[2.5]" />
                <h4 className="font-black text-[11px] uppercase tracking-wider text-border-strong">Undian Acak Sempurna</h4>
              </div>
              <p className="text-[11px] text-on-surface-variant font-semibold leading-relaxed">
                Pemain tim diamankan posisinya, lalu peserta solo dan slot kosong diundi secara acak berimbang.
              </p>
            </div>
          </div>

          <div className="bg-border-strong text-white shadow-tactical p-5 rounded-xl border-2 border-border-strong relative overflow-hidden">
            <h4 className="font-black text-[11px] text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
              <AlertCircle size={15}/> Format Input Nama Peserta (Wajib):
            </h4>
            <div className="flex flex-col md:flex-row gap-4 relative z-10">
              {isOpenTournament ? (
                <code className="bg-black/50 p-3.5 rounded-lg text-xs font-mono font-bold text-slate-200 border border-slate-700 leading-relaxed flex-1">
                  <span className="text-emerald-400 font-black">[Majalengka-Senyap]</span> Daim<br/>
                  <span className="text-emerald-400 font-black">[Majalengka-Senyap]</span> Andi<br/>
                  <span className="text-amber-400 font-black">[Cirebon-Kincir]</span> Joko<br/>
                  <span className="text-slate-400">Peserta Solo Tanpa Tim</span>
                </code>
              ) : (
                <code className="bg-black/50 p-3.5 rounded-lg text-xs font-mono font-bold text-slate-200 border border-slate-700 leading-relaxed flex-1">
                  <span className="text-emerald-400 font-black">[Senyap]</span> Daim<br/>
                  <span className="text-emerald-400 font-black">[Senyap]</span> Andi<br/>
                  <span className="text-amber-400 font-black">[Majalengka]</span> Joko<br/>
                  <span className="text-slate-400">Peserta Solo Tanpa Tim</span>
                </code>
              )}
              <div className="flex-1 flex flex-col justify-center text-slate-300">
                <p className="text-xs font-bold mb-1.5 leading-relaxed">
                  {isOpenTournament ? (
                    <span>Gunakan format <strong className="text-white">[Daerah-Tim]</strong> (contoh: <strong className="text-emerald-400">[Majalengka-Senyap]</strong>) untuk menandai asal daerah dan tim sekaligus.</span>
                  ) : (
                    <span>Gunakan kurung siku <strong className="text-white">[]</strong> untuk menandai nama tim di awal (contoh: <strong className="text-emerald-400">[Senyap]</strong>).</span>
                  )}
                </p>
                <p className="text-[11px] font-semibold text-slate-400 leading-relaxed">
                  Pastikan penulisan ejaan nama tim <strong className="text-white">SAMA PERSIS</strong> agar sistem dapat menyebarkannya dengan optimal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Step 1: Info Dasar */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-border-strong pb-2 mb-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-border-strong flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-border-strong text-white text-[10px] flex items-center justify-center">1</span>
                Informasi & Logo Turnamen
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2 block">Judul Turnamen</label>
                <input 
                  type="text" 
                  value={tournamentTitle} 
                  onChange={(e) => setTournamentTitle(e.target.value)} 
                  placeholder="Contoh: Piala Bergilir Majalengka" 
                  className="w-full bg-surface border-2 border-border-strong p-3.5 rounded-xl font-bold text-xs text-border-strong focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2 block">Penyelenggara</label>
                <input 
                  type="text" 
                  value={tournamentOrganizer} 
                  onChange={(e) => setTournamentOrganizer(e.target.value)} 
                  placeholder="Contoh: Perkumpulan Pelayang..." 
                  className="w-full bg-surface border-2 border-border-strong p-3.5 rounded-xl font-bold text-xs text-border-strong focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2 block">Logo Turnamen</label>
                <div className="flex items-center gap-3">
                  {logoBase64 ? (
                    <div className="relative group shrink-0">
                      <img src={logoBase64} alt="Preview Logo" className="w-12 h-12 object-contain rounded-xl border-2 border-border-strong bg-surface p-1 shadow-sm" />
                      <button 
                        type="button" 
                        onClick={() => setLogoBase64('')}
                        className="absolute -top-1.5 -right-1.5 bg-status-live hover:bg-red-700 text-white p-1 rounded-full shadow transition-colors"
                      >
                        <X size={10}/>
                      </button>
                    </div>
                  ) : (
                    <label className="w-12 h-12 border-2 border-dashed border-border-strong hover:bg-slate-100 rounded-xl flex flex-col items-center justify-center text-border-strong cursor-pointer transition-colors bg-surface shrink-0">
                      <span className="text-[8px] font-black uppercase">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  )}
                  <span className="text-[10px] font-semibold text-on-surface-variant leading-tight">
                    PNG/JPG otomatis dikompres ringan.
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Step 2: Cakupan Turnamen */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-border-strong pb-2 mb-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-border-strong flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-border-strong text-white text-[10px] flex items-center justify-center">2</span>
                Tipe Cakupan Turnamen (Scope)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setIsOpenTournament(false)}
                className={cn(
                  "p-4 rounded-xl font-bold transition-all border-2 text-left flex items-start gap-3.5",
                  !isOpenTournament ? "bg-blue-50/50 border-primary shadow-tactical-sm" : "bg-surface border-border-subtle hover:border-slate-400"
                )}
              >
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0", !isOpenTournament ? "border-primary bg-primary text-white" : "border-slate-300")}>
                  {!isOpenTournament && <Check size={12} className="stroke-[3]" />}
                </div>
                <div>
                  <h4 className={cn("text-xs font-black uppercase tracking-wider", !isOpenTournament ? "text-primary" : "text-border-strong")}>LOKAL / CLUB MATCH (DEFAULT)</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Format: <code>[Tim] Nama</code></p>
                  <p className="text-[11px] text-on-surface-variant mt-1 font-semibold leading-relaxed">Memisahkan anggota tim yang sama agar tidak langsung bertemu di ronde awal (e.g. <code>[Senyap] Daim</code>).</p>
                </div>
              </button>

              <button 
                type="button"
                onClick={() => setIsOpenTournament(true)}
                className={cn(
                  "p-4 rounded-xl font-bold transition-all border-2 text-left flex items-start gap-3.5",
                  isOpenTournament ? "bg-emerald-50/50 border-status-success shadow-tactical-sm" : "bg-surface border-border-subtle hover:border-slate-400"
                )}
              >
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0", isOpenTournament ? "border-status-success bg-status-success text-white" : "border-slate-300")}>
                  {isOpenTournament && <Check size={12} className="stroke-[3]" />}
                </div>
                <div>
                  <h4 className={cn("text-xs font-black uppercase tracking-wider", isOpenTournament ? "text-status-success" : "text-border-strong")}>OPEN CUP (LINTAS DAERAH)</h4>
                  <p className="text-[10px] text-status-success font-bold uppercase mt-1">Format: <code>[Daerah-Tim] Nama</code></p>
                  <p className="text-[11px] text-on-surface-variant mt-1 font-semibold leading-relaxed">Mencegah bentrok satu daerah sekaligus satu tim (e.g. <code>[Majalengka-Senyap] Andi</code>).</p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 3: Konfigurasi Bagan & Aturan */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-border-strong pb-2 mb-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-border-strong flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-border-strong text-white text-[10px] flex items-center justify-center">3</span>
                Kapasitas, Nyawa, & Format Final
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Kapasitas */}
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2 block">Kapasitas Per Bagan</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['auto', '16', '32', '64'].map(size => (
                    <button 
                      key={size} 
                      onClick={() => setBracketSize(size)}
                      className={cn(
                        "py-2.5 rounded-lg font-black text-xs transition-all border-2",
                        bracketSize === size ? "bg-border-strong border-border-strong text-white shadow-tactical-sm" : "bg-surface border-border-subtle text-slate-600 hover:border-slate-400"
                      )}
                    >
                      {size === 'auto' ? 'AUTO' : size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aturan Nyawa */}
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2 block">Aturan Nyawa</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={() => setDoubleLife(false)}
                    className={cn(
                      "py-2.5 rounded-lg font-black text-[10px] transition-all border-2 uppercase",
                      !doubleLife ? "bg-border-strong border-border-strong text-white shadow-tactical-sm" : "bg-surface border-border-subtle text-slate-600 hover:border-slate-400"
                    )}
                  >
                    1 Nyawa
                  </button>
                  <button 
                    onClick={() => setDoubleLife(true)}
                    className={cn(
                      "py-2.5 rounded-lg font-black text-[10px] transition-all border-2 uppercase",
                      doubleLife ? "bg-status-live border-status-live text-white shadow-tactical-sm" : "bg-surface border-border-subtle text-slate-600 hover:border-slate-400"
                    )}
                  >
                    2 Nyawa (Silang)
                  </button>
                </div>
              </div>

              {/* Format Final */}
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2 block">Format Bagan Final</label>
                <div className="grid grid-cols-3 gap-1 mb-1.5">
                  <button 
                    onClick={() => setFinalFormat('bracket')}
                    className={cn(
                      "py-2.5 px-1 rounded-lg font-black text-[9px] transition-all border-2 leading-tight uppercase",
                      finalFormat === 'bracket' ? "bg-primary border-primary text-white shadow-tactical-sm" : "bg-surface border-border-subtle text-slate-600 hover:border-slate-400"
                    )}
                  >
                    Tunggal
                  </button>
                  <button 
                    onClick={() => setFinalFormat('double')}
                    className={cn(
                      "py-2.5 px-1 rounded-lg font-black text-[9px] transition-all border-2 leading-tight uppercase",
                      finalFormat === 'double' ? "bg-status-success border-status-success text-white shadow-tactical-sm" : "bg-surface border-border-subtle text-slate-600 hover:border-slate-400"
                    )}
                  >
                    Ganda
                  </button>
                  <button 
                    onClick={() => setFinalFormat('roundrobin')}
                    className={cn(
                      "py-2.5 px-1 rounded-lg font-black text-[9px] transition-all border-2 leading-tight uppercase",
                      finalFormat === 'roundrobin' ? "bg-status-warning border-status-warning text-white shadow-tactical-sm" : "bg-surface border-border-subtle text-slate-600 hover:border-slate-400"
                    )}
                  >
                    R-Robin
                  </button>
                </div>
              </div>

              {/* Sistem Poin */}
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2 block">Sistem Poin Match</label>
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => setPrelimPointsSystem('normal')}
                    className={cn(
                      "py-1.5 px-2 rounded-lg font-black text-[9px] transition-all border-2 text-left uppercase",
                      (prelimPointsSystem === 'normal' || prelimPointsSystem === false) ? "bg-border-strong border-border-strong text-white shadow-tactical-sm" : "bg-surface border-border-subtle text-slate-600 hover:border-slate-400"
                    )}
                  >
                    Normal (1x Menang)
                  </button>
                  <button 
                    onClick={() => setPrelimPointsSystem('prelim')}
                    className={cn(
                      "py-1.5 px-2 rounded-lg font-black text-[9px] transition-all border-2 text-left uppercase",
                      (prelimPointsSystem === 'prelim' || prelimPointsSystem === true) ? "bg-status-success border-status-success text-white shadow-tactical-sm" : "bg-surface border-border-subtle text-slate-600 hover:border-slate-400"
                    )}
                  >
                    Duluan 2 Poin (R1)
                  </button>
                  <button 
                    onClick={() => setPrelimPointsSystem('all')}
                    className={cn(
                      "py-1.5 px-2 rounded-lg font-black text-[9px] transition-all border-2 text-left uppercase",
                      prelimPointsSystem === 'all' ? "bg-status-warning border-status-warning text-white shadow-tactical-sm" : "bg-surface border-border-subtle text-slate-600 hover:border-slate-400"
                    )}
                  >
                    Duluan 2 Poin (Semua)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Input Daftar Peserta */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-border-strong pb-2 mb-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-border-strong flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-border-strong text-white text-[10px] flex items-center justify-center">4</span>
                {useLocalPool ? 'Daftar Peserta (Jalur Open)' : 'Daftar Peserta'} ({(bulkInput || '').split('\n').filter(n => n.trim()).length} Peserta)
              </h3>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={useLocalPool}
                  onChange={(e) => setUseLocalPool(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-border-strong focus:ring-primary cursor-pointer"
                />
                <span className="text-[10px] font-black text-border-strong uppercase tracking-wider group-hover:text-primary transition-colors">
                  Aktifkan Jalur Pool Lokal
                </span>
              </label>
            </div>

            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={isOpenTournament
                ? "[Cirebon-Kincir] Joko\n[Bandung-Terbang] Aceng\nPeserta Open Tanpa Tim"
                : "[Senyap] Daim\n[LabaLaba] Ucup\nPeserta Solo Tanpa Tim"
              }
              rows={useLocalPool ? 6 : 9}
              className="w-full bg-surface border-2 border-border-strong p-4 rounded-xl font-bold text-xs text-border-strong focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner resize-y placeholder:text-slate-400"
            />

            {useLocalPool && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-status-success uppercase tracking-wider block flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
                    Peserta Pool Lokal Khusus ({(bulkInputLocal || '').split('\n').filter(n => n.trim()).length} Orang)
                  </label>
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Diisi mulai pool terakhir
                  </span>
                </div>
                <textarea
                  value={bulkInputLocal}
                  onChange={(e) => setBulkInputLocal(e.target.value)}
                  placeholder={isOpenTournament
                    ? "[Majalengka-Senyap] Daim\n[Majalengka-Angin] Maman\nOrang Majalengka Asli"
                    : "[Senyap-Lokal] Daim\n[Lokal] Aceng\nPeserta Khusus Tuan Rumah"
                  }
                  rows={6}
                  className="w-full bg-emerald-50/40 border-2 border-status-success p-4 rounded-xl font-bold text-xs text-border-strong focus:outline-none focus:ring-2 focus:ring-status-success transition-all shadow-inner resize-y"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t-2 border-border-subtle">
            {hasExistingTournament ? (
              <div className="flex flex-col md:flex-row gap-3">
                <button 
                  onClick={saveGlobalSettings} 
                  className="flex-1 bg-status-success text-white py-4 px-6 rounded-xl font-black text-xs md:text-sm shadow-tactical hover:bg-emerald-800 transition-all flex items-center justify-center gap-2.5 active:scale-95 uppercase tracking-wider border-2 border-border-strong"
                >
                  <Save size={18}/> SIMPAN PENGATURAN
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm("PERINGATAN: Membuat ulang bagan akan menghapus semua skor dan bagan saat ini secara permanen! Lanjutkan?")) {
                      generateGlobalBracket();
                    }
                  }} 
                  className="flex-1 bg-status-live text-white py-4 px-6 rounded-xl font-black text-xs md:text-sm shadow-tactical hover:bg-red-800 transition-all flex items-center justify-center gap-2.5 active:scale-95 uppercase tracking-wider border-2 border-border-strong"
                >
                  <Shuffle size={18}/> BUAT ULANG BAGAN (RESET)
                </button>
              </div>
            ) : (
              <button 
                onClick={generateGlobalBracket} 
                className="w-full bg-primary text-white py-4 px-6 rounded-xl font-black text-sm md:text-base shadow-tactical hover:bg-primary-container transition-all flex items-center justify-center gap-3 active:scale-95 uppercase tracking-wide border-2 border-border-strong min-h-[52px]"
              >
                <Zap size={20} className="fill-white" /> GENERATE SEMUA BAGAN
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
