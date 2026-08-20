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
  Zap,
  Swords,
  Globe
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 text-center animate-fade-in">
        <div className="w-20 h-20 bg-white border-[3px] border-black shadow-brutal flex items-center justify-center mb-6">
          <Trophy size={40} className="text-black stroke-[2.5]"/>
        </div>
        <h2 className="text-2xl font-black text-black uppercase tracking-tight">Bagan Belum Siap</h2>
        <p className="text-black font-bold mt-2">Menunggu wasit / panitia menginisialisasi turnamen.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-slide-up pb-28 md:pb-12">
      <div className="bg-white border-[3px] border-black shadow-brutal overflow-hidden">
        {/* Brutalist Header */}
        <div className="bg-black p-6 md:p-8 text-white relative overflow-hidden flex items-center justify-between border-b-[3px] border-black">
          <div className="relative z-10">
            <span className="text-[10px] font-black text-black bg-safety-orange px-2.5 py-0.5 uppercase tracking-widest border border-black mb-2 inline-block">
              Setup Engine
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight">Smart Global Setup</h2>
            <p className="text-slate-300 text-xs font-bold uppercase tracking-wider mt-0.5">Inisialisasi & Konfigurasi Multi-Bagan</p>
          </div>
          {showGlobalSetup && (
            <button 
              onClick={() => setShowGlobalSetup(false)} 
              className="relative z-10 bg-white text-black p-2 border-[2px] border-black hover:bg-warning-red hover:text-white transition-colors active:translate-x-0.5 active:translate-y-0.5 shadow-brutal-sm"
            >
              <X size={20} className="stroke-[3]"/>
            </button>
          )}
        </div>
        
        {/* Narrative & Rules Banner */}
        <div className="p-5 md:p-8 bg-surface-bright border-b-[3px] border-black space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-brutal-blue text-white p-3 border-[3px] border-black shadow-brutal-sm shrink-0">
              <Shield className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-sm text-black mb-1 uppercase tracking-wide">Sistem Seeding Keadilan Mutlak</h3>
              <p className="text-xs text-black leading-relaxed font-bold">
                Ditenagai oleh algoritma <strong className="text-brutal-blue font-black underline">Smart Global Distribution</strong> kelas turnamen E-Sports. Sistem membaca identitas tim peserta dan mendistribusikannya seadil mungkin secara matematis untuk menghindari bentrok saudara di babak awal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white border-[2px] border-black p-4 shadow-brutal-sm">
              <div className="flex items-center gap-2 mb-2 text-brutal-blue">
                <LayoutGrid size={16} className="stroke-[3]" />
                <h4 className="font-black text-[11px] uppercase tracking-wider text-black">Distribusi Lintas Pool</h4>
              </div>
              <p className="text-[11px] text-black font-semibold leading-relaxed">
                Jika sebuah tim mendaftar 9 peserta, sistem otomatis membaginya rata ke seluruh bagan yang tersedia.
              </p>
            </div>
            <div className="bg-white border-[2px] border-black p-4 shadow-brutal-sm">
              <div className="flex items-center gap-2 mb-2 text-black">
                <Shield size={16} className="stroke-[3]" />
                <h4 className="font-black text-[11px] uppercase tracking-wider text-black">Anti Perang Saudara</h4>
              </div>
              <p className="text-[11px] text-black font-semibold leading-relaxed">
                Di dalam satu bagan, anggota tim dipisah ke kuarter berbeda. <strong>Mustahil bentrok</strong> di babak awal!
              </p>
            </div>
            <div className="bg-white border-[2px] border-black p-4 shadow-brutal-sm">
              <div className="flex items-center gap-2 mb-2 text-safety-orange">
                <Shuffle size={16} className="stroke-[3]" />
                <h4 className="font-black text-[11px] uppercase tracking-wider text-black">Undian Acak Sempurna</h4>
              </div>
              <p className="text-[11px] text-black font-semibold leading-relaxed">
                Pemain tim diamankan posisinya, lalu peserta solo dan slot kosong diundi secara acak berimbang.
              </p>
            </div>
          </div>

          <div className="bg-black text-white shadow-brutal p-5 border-[3px] border-black">
            <h4 className="font-black text-[11px] text-safety-orange uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertCircle size={15} className="stroke-[3]"/> Format Input Nama Peserta (Wajib):
            </h4>
            <div className="flex flex-col md:flex-row gap-4">
              {isOpenTournament ? (
                <code className="bg-slate-900 p-3.5 text-xs font-mono font-bold text-slate-200 border-2 border-slate-700 leading-relaxed flex-1">
                  <span className="text-success-green font-black">[Majalengka-Senyap]</span> Daim<br/>
                  <span className="text-success-green font-black">[Majalengka-Senyap]</span> Andi<br/>
                  <span className="text-safety-orange font-black">[Cirebon-Kincir]</span> Joko<br/>
                  <span className="text-slate-400">Peserta Solo Tanpa Tim</span>
                </code>
              ) : (
                <code className="bg-slate-900 p-3.5 text-xs font-mono font-bold text-slate-200 border-2 border-slate-700 leading-relaxed flex-1">
                  <span className="text-success-green font-black">[Senyap]</span> Daim<br/>
                  <span className="text-success-green font-black">[Senyap]</span> Andi<br/>
                  <span className="text-safety-orange font-black">[Majalengka]</span> Joko<br/>
                  <span className="text-slate-400">Peserta Solo Tanpa Tim</span>
                </code>
              )}
              <div className="flex-1 flex flex-col justify-center text-slate-200">
                <p className="text-xs font-bold mb-1.5 leading-relaxed">
                  {isOpenTournament ? (
                    <span>Gunakan format <strong className="text-white bg-black px-1 border border-white">[Daerah-Tim]</strong> (contoh: <strong className="text-success-green">[Majalengka-Senyap]</strong>) untuk menandai asal daerah dan tim sekaligus.</span>
                  ) : (
                    <span>Gunakan kurung siku <strong className="text-white bg-black px-1 border border-white">[]</strong> untuk menandai nama tim di awal (contoh: <strong className="text-success-green">[Senyap]</strong>).</span>
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
            <div className="flex items-center justify-between border-b-[3px] border-black pb-2 mb-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-black flex items-center gap-2">
                <span className="w-5 h-5 bg-black text-white text-[10px] font-black flex items-center justify-center">1</span>
                Informasi & Logo Turnamen
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="text-[10px] font-black text-black uppercase tracking-wider mb-2 block">Judul Turnamen</label>
                <input 
                  type="text" 
                  value={tournamentTitle} 
                  onChange={(e) => setTournamentTitle(e.target.value)} 
                  placeholder="Contoh: Piala Bergilir Majalengka" 
                  className="w-full bg-white border-[2px] border-black p-3.5 font-bold text-xs text-black neo-brutalist-input transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-black uppercase tracking-wider mb-2 block">Penyelenggara</label>
                <input 
                  type="text" 
                  value={tournamentOrganizer} 
                  onChange={(e) => setTournamentOrganizer(e.target.value)} 
                  placeholder="Contoh: Perkumpulan Pelayang..." 
                  className="w-full bg-white border-[2px] border-black p-3.5 font-bold text-xs text-black neo-brutalist-input transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-black uppercase tracking-wider mb-2 block">Logo Turnamen</label>
                <div className="flex items-center gap-3">
                  {logoBase64 ? (
                    <div className="relative group shrink-0">
                      <img src={logoBase64} alt="Preview Logo" className="w-12 h-12 object-contain border-[2px] border-black bg-white p-1 shadow-brutal-sm" />
                      <button 
                        type="button" 
                        onClick={() => setLogoBase64('')}
                        className="absolute -top-1.5 -right-1.5 bg-warning-red text-white p-1 border border-black shadow transition-colors"
                      >
                        <X size={10} className="stroke-[3]"/>
                      </button>
                    </div>
                  ) : (
                    <label className="w-12 h-12 border-[2px] border-dashed border-black hover:bg-surface-variant flex flex-col items-center justify-center text-black cursor-pointer transition-colors bg-white shrink-0">
                      <span className="text-[8px] font-black uppercase">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  )}
                  <span className="text-[10px] font-bold text-slate-600 leading-tight">
                    PNG/JPG otomatis dikompres ringan.
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Step 2: Cakupan Turnamen */}
          <div>
            <div className="flex items-center justify-between border-b-[3px] border-black pb-2 mb-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-black flex items-center gap-2">
                <span className="w-5 h-5 bg-black text-white text-[10px] font-black flex items-center justify-center">2</span>
                Tipe Cakupan Turnamen (Format)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setIsOpenTournament(false)}
                className={cn(
                  "p-4 font-bold transition-all border-[3px] border-black text-left flex items-start gap-3.5",
                  !isOpenTournament ? "bg-surface-variant shadow-brutal" : "bg-white hover:bg-surface-container"
                )}
              >
                <div className={cn("w-5 h-5 border-[2px] border-black flex items-center justify-center mt-0.5 shrink-0", !isOpenTournament ? "bg-black text-white" : "bg-white")}>
                  {!isOpenTournament && <Check size={12} className="stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-black">Lokal / Club Match (Default)</h4>
                  <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">Format: <code>[Tim] Nama</code></p>
                  <p className="text-[11px] text-black mt-1 font-semibold leading-relaxed">Memisahkan anggota tim yang sama agar tidak langsung bertemu di ronde awal (e.g. <code>[Senyap] Daim</code>).</p>
                </div>
              </button>

              <button 
                type="button"
                onClick={() => setIsOpenTournament(true)}
                className={cn(
                  "p-4 font-bold transition-all border-[3px] border-black text-left flex items-start gap-3.5",
                  isOpenTournament ? "bg-surface-variant shadow-brutal" : "bg-white hover:bg-surface-container"
                )}
              >
                <div className={cn("w-5 h-5 border-[2px] border-black flex items-center justify-center mt-0.5 shrink-0", isOpenTournament ? "bg-black text-white" : "bg-white")}>
                  {isOpenTournament && <Check size={12} className="stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-black">Open Cup (Lintas Daerah)</h4>
                  <p className="text-[10px] text-black font-bold uppercase mt-1">Format: <code>[Daerah-Tim] Nama</code></p>
                  <p className="text-[11px] text-black mt-1 font-semibold leading-relaxed">Mencegah bentrok satu daerah sekaligus satu tim (e.g. <code>[Majalengka-Senyap] Andi</code>).</p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 3: Konfigurasi Bagan & Aturan */}
          <div>
            <div className="flex items-center justify-between border-b-[3px] border-black pb-2 mb-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-black flex items-center gap-2">
                <span className="w-5 h-5 bg-black text-white text-[10px] font-black flex items-center justify-center">3</span>
                Kapasitas, Nyawa, & Format Final
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Kapasitas */}
              <div>
                <label className="text-[10px] font-black text-black uppercase tracking-wider mb-2 block">Kapasitas Per Bagan</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['auto', '16', '32', '64'].map(size => (
                    <button 
                      key={size} 
                      onClick={() => setBracketSize(size)}
                      className={cn(
                        "py-2.5 font-black text-xs transition-all border-[2px] border-black",
                        bracketSize === size ? "bg-black text-white shadow-brutal-sm" : "bg-white text-black hover:bg-surface-variant"
                      )}
                    >
                      {size === 'auto' ? 'AUTO' : size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aturan Nyawa */}
              <div>
                <label className="text-[10px] font-black text-black uppercase tracking-wider mb-2 block">Aturan Nyawa</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={() => setDoubleLife(false)}
                    className={cn(
                      "py-2.5 font-black text-[10px] transition-all border-[2px] border-black uppercase",
                      !doubleLife ? "bg-black text-white shadow-brutal-sm" : "bg-white text-black hover:bg-surface-variant"
                    )}
                  >
                    1 Nyawa
                  </button>
                  <button 
                    onClick={() => setDoubleLife(true)}
                    className={cn(
                      "py-2.5 font-black text-[10px] transition-all border-[2px] border-black uppercase",
                      doubleLife ? "bg-warning-red text-white shadow-brutal-sm" : "bg-white text-black hover:bg-surface-variant"
                    )}
                  >
                    2 Nyawa (Silang)
                  </button>
                </div>
              </div>

              {/* Format Final */}
              <div>
                <label className="text-[10px] font-black text-black uppercase tracking-wider mb-2 block">Format Bagan Final</label>
                <div className="grid grid-cols-3 gap-1 mb-1.5">
                  <button 
                    onClick={() => setFinalFormat('bracket')}
                    className={cn(
                      "py-2.5 px-1 font-black text-[9px] transition-all border-[2px] border-black leading-tight uppercase",
                      finalFormat === 'bracket' ? "bg-brutal-blue text-white shadow-brutal-sm" : "bg-white text-black hover:bg-surface-variant"
                    )}
                  >
                    Tunggal
                  </button>
                  <button 
                    onClick={() => setFinalFormat('double')}
                    className={cn(
                      "py-2.5 px-1 font-black text-[9px] transition-all border-[2px] border-black leading-tight uppercase",
                      finalFormat === 'double' ? "bg-safety-orange text-white shadow-brutal-sm" : "bg-white text-black hover:bg-surface-variant"
                    )}
                  >
                    Ganda
                  </button>
                  <button 
                    onClick={() => setFinalFormat('roundrobin')}
                    className={cn(
                      "py-2.5 px-1 font-black text-[9px] transition-all border-[2px] border-black leading-tight uppercase",
                      finalFormat === 'roundrobin' ? "bg-black text-white shadow-brutal-sm" : "bg-white text-black hover:bg-surface-variant"
                    )}
                  >
                    R-Robin
                  </button>
                </div>
              </div>

              {/* Sistem Poin */}
              <div>
                <label className="text-[10px] font-black text-black uppercase tracking-wider mb-2 block">Sistem Poin Match</label>
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => setPrelimPointsSystem('normal')}
                    className={cn(
                      "py-1.5 px-2 font-black text-[9px] transition-all border-[2px] border-black text-left uppercase",
                      (prelimPointsSystem === 'normal' || prelimPointsSystem === false) ? "bg-black text-white shadow-brutal-sm" : "bg-white text-black hover:bg-surface-variant"
                    )}
                  >
                    Normal (1x Menang)
                  </button>
                  <button 
                    onClick={() => setPrelimPointsSystem('prelim')}
                    className={cn(
                      "py-1.5 px-2 font-black text-[9px] transition-all border-[2px] border-black text-left uppercase",
                      (prelimPointsSystem === 'prelim' || prelimPointsSystem === true) ? "bg-brutal-blue text-white shadow-brutal-sm" : "bg-white text-black hover:bg-surface-variant"
                    )}
                  >
                    Duluan 2 Poin (R1)
                  </button>
                  <button 
                    onClick={() => setPrelimPointsSystem('all')}
                    className={cn(
                      "py-1.5 px-2 font-black text-[9px] transition-all border-[2px] border-black text-left uppercase",
                      prelimPointsSystem === 'all' ? "bg-safety-orange text-white shadow-brutal-sm" : "bg-white text-black hover:bg-surface-variant"
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
            <div className="flex items-center justify-between border-b-[3px] border-black pb-2 mb-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-black flex items-center gap-2">
                <span className="w-5 h-5 bg-black text-white text-[10px] font-black flex items-center justify-center">4</span>
                {useLocalPool ? 'Daftar Peserta (Jalur Open)' : 'Daftar Peserta'} ({(bulkInput || '').split('\n').filter(n => n.trim()).length} Peserta)
              </h3>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={useLocalPool}
                  onChange={(e) => setUseLocalPool(e.target.checked)}
                  className="w-4 h-4 text-black border-2 border-black focus:ring-0 cursor-pointer"
                />
                <span className="text-[10px] font-black text-black uppercase tracking-wider group-hover:underline">
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
              className="w-full bg-white border-[3px] border-black p-4 font-bold text-xs text-black neo-brutalist-input transition-all shadow-inner resize-y placeholder:text-slate-400"
            />

            {useLocalPool && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-black uppercase tracking-wider block flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-black"></span>
                    Peserta Pool Lokal Khusus ({(bulkInputLocal || '').split('\n').filter(n => n.trim()).length} Orang)
                  </label>
                  <span className="text-[9px] font-bold text-black bg-surface-variant px-2 py-0.5 border border-black">
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
                  className="w-full bg-surface-variant border-[3px] border-black p-4 font-bold text-xs text-black neo-brutalist-input transition-all shadow-inner resize-y"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t-[3px] border-black">
            {hasExistingTournament ? (
              <div className="flex flex-col md:flex-row gap-3">
                <button 
                  onClick={saveGlobalSettings} 
                  className="flex-1 bg-success-green text-black py-4 px-6 font-black text-xs md:text-sm border-[3px] border-black shadow-brutal hover:bg-green-400 transition-all flex items-center justify-center gap-2.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-wider"
                >
                  <Save size={18} className="stroke-[3]"/> SIMPAN PENGATURAN
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm("PERINGATAN: Membuat ulang bagan akan menghapus semua skor dan bagan saat ini secara permanen! Lanjutkan?")) {
                      generateGlobalBracket();
                    }
                  }} 
                  className="flex-1 bg-warning-red text-white py-4 px-6 font-black text-xs md:text-sm border-[3px] border-black shadow-brutal hover:bg-red-700 transition-all flex items-center justify-center gap-2.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-wider"
                >
                  <Shuffle size={18} className="stroke-[3]"/> BUAT ULANG BAGAN (RESET)
                </button>
              </div>
            ) : (
              <button 
                onClick={generateGlobalBracket} 
                className="w-full bg-brutal-blue text-white py-4 px-6 font-black text-sm md:text-base border-[3px] border-black shadow-brutal hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-wide min-h-[54px]"
              >
                <Zap size={20} className="fill-white stroke-[2.5]" /> GENERATE SEMUA BAGAN
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
