import React from 'react';
import { 
  Shuffle, 
  X, 
  Shield, 
  LayoutGrid, 
  Check, 
  AlertCircle, 
  Trophy 
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
  generateGlobalBracket,
  role,
  tournamentTitle,
  setTournamentTitle,
  tournamentOrganizer,
  setTournamentOrganizer
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-20 text-center animate-fade-in">
        <Trophy size={80} className="text-slate-200 mb-6"/>
        <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Bagan Belum Siap</h2>
        <p className="text-slate-400 font-bold mt-2">Menunggu panitia mengunggah daftar peserta.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 animate-slide-up">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Hero Header */}
        <div className="bg-slate-800 p-8 text-white relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Shuffle size={120}/></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black leading-none mb-2">Smart Global Setup</h2>
            <p className="text-slate-300 text-sm font-bold uppercase tracking-widest">Inisialisasi Turnamen Multi-Bagan</p>
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
              {isOpenTournament ? (
                <code className="bg-slate-900/50 p-4 rounded-xl text-sm font-mono font-bold text-slate-300 border border-slate-700 leading-relaxed flex-1">
                  <span className="text-emerald-400">[Majalengka-Senyap]</span> Daim<br/>
                  <span className="text-emerald-400">[Majalengka-Senyap]</span> Andi<br/>
                  <span className="text-yellow-400">[Cirebon-Kincir]</span> Joko<br/>
                  <span className="text-slate-400">Peserta Solo Tanpa Tim</span>
                </code>
              ) : (
                <code className="bg-slate-900/50 p-4 rounded-xl text-sm font-mono font-bold text-slate-300 border border-slate-700 leading-relaxed flex-1">
                  <span className="text-emerald-400">[Senyap]</span> Daim<br/>
                  <span className="text-emerald-400">[Senyap]</span> Andi<br/>
                  <span className="text-yellow-400">[Majalengka]</span> Joko<br/>
                  <span className="text-slate-400">Peserta Solo Tanpa Tim</span>
                </code>
              )}
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-[11px] font-bold text-slate-400 mb-2 leading-relaxed">
                  {isOpenTournament ? (
                    <span>Gunakan format <strong className="text-white">[Daerah-Tim]</strong> (contoh: <strong className="text-white">[Majalengka-Senyap]</strong>) untuk menandai daerah dan tim peserta sekaligus.</span>
                  ) : (
                    <span>Gunakan kurung siku <strong className="text-white">[]</strong> untuk menandai nama tim di awal (contoh: <strong className="text-white">[Senyap]</strong>).</span>
                  )}
                </p>
                <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                  Pastikan penulisan ejaan daerah dan tim <strong className="text-white">SAMA PERSIS</strong> agar sistem dapat menyebarkan mereka secara optimal untuk menghindari bentrok awal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 items-center">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Judul Acara Turnamen</label>
              <input 
                type="text" 
                value={tournamentTitle} 
                onChange={(e) => setTournamentTitle(e.target.value)} 
                placeholder="Contoh: Piala Bergilir Majalengka" 
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Panitia Penyelenggara</label>
              <input 
                type="text" 
                value={tournamentOrganizer} 
                onChange={(e) => setTournamentOrganizer(e.target.value)} 
                placeholder="Contoh: Perkumulan Pelayang..." 
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Logo Turnamen</label>
              <div className="flex items-center gap-3">
                {logoBase64 ? (
                  <div className="relative group shrink-0">
                    <img src={logoBase64} alt="Preview Logo" className="w-[52px] h-[52px] object-contain rounded-xl border border-slate-200 bg-slate-50 p-1" />
                    <button 
                      type="button" 
                      onClick={() => setLogoBase64('')}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-colors"
                    >
                      <X size={10}/>
                    </button>
                  </div>
                ) : (
                  <label className="w-[52px] h-[52px] border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-brand-500 cursor-pointer transition-colors bg-slate-50 shrink-0">
                    <span className="text-[9px] font-black uppercase">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
                <span className="text-[9px] font-bold text-slate-400 leading-tight">
                  Upload logo PNG/JPG. Ukuran otomatis dikompres ringan.
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6 bg-slate-50/50 p-4 border-2 border-slate-100 rounded-2xl">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Tipe Cakupan Turnamen (Seeding Mode)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setIsOpenTournament(false)}
                className={cn(
                  "p-4 rounded-xl font-bold transition-all border-2 text-left flex items-start gap-3",
                  !isOpenTournament ? "bg-white border-brand-600 shadow-md" : "bg-white border-slate-100 hover:border-slate-200"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0", !isOpenTournament ? "border-brand-600" : "border-slate-300")}>
                  {!isOpenTournament && <div className="w-2 h-2 rounded-full bg-brand-600" />}
                </div>
                <div>
                  <h4 className={cn("text-xs font-black", !isOpenTournament ? "text-brand-700" : "text-slate-700")}>LOKAL / CLUB MATCH (DEFAULT)</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Format Input: <code>[Tim] Nama</code></p>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold leading-normal normal-case">Hanya memisahkan antar-anggota tim yang sama agar tidak langsung bertanding di Match 1 (e.g. <code>[Senyap] Daim</code>).</p>
                </div>
              </button>

              <button 
                type="button"
                onClick={() => setIsOpenTournament(true)}
                className={cn(
                  "p-4 rounded-xl font-bold transition-all border-2 text-left flex items-start gap-3",
                  isOpenTournament ? "bg-white border-emerald-600 shadow-md" : "bg-white border-slate-100 hover:border-slate-200"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0", isOpenTournament ? "border-emerald-600" : "border-slate-300")}>
                  {isOpenTournament && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                </div>
                <div>
                  <h4 className={cn("text-xs font-black", isOpenTournament ? "text-emerald-700" : "text-slate-700")}>OPEN CUP (LINTAS DAERAH)</h4>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Format Input: <code>[Daerah-Tim] Nama</code></p>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold leading-normal normal-case">Mendeteksi Daerah dan Tim secara bersamaan untuk mencegah bentrok satu daerah & satu tim sekaligus (e.g. <code>[Majalengka-Senyap] Andi</code>).</p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Kapasitas Per Bagan</label>
              <div className="grid grid-cols-4 gap-2">
                {['auto', '16', '32', '64'].map(size => (
                  <button 
                    key={size} 
                    onClick={() => setBracketSize(size)}
                    className={cn(
                      "py-3 rounded-xl font-black text-xs transition-all border-2",
                      bracketSize === size ? "bg-brand-600 border-brand-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    {size === 'auto' ? 'AUTO' : size}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Aturan Nyawa</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setDoubleLife(false)}
                  className={cn(
                    "py-3 rounded-xl font-black text-[10px] transition-all border-2",
                    !doubleLife ? "bg-brand-600 border-brand-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  )}
                >
                  1 NYAWA
                </button>
                <button 
                  onClick={() => setDoubleLife(true)}
                  className={cn(
                    "py-3 rounded-xl font-black text-[10px] transition-all border-2",
                    doubleLife ? "bg-gradient-to-r from-red-500 to-rose-600 border-transparent text-white shadow-lg shadow-red-100" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  )}
                >
                  2 NYAWA (BEDA)
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Format Bagan Final</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setFinalFormat('roundrobin')}
                  className={cn(
                    "py-3 rounded-xl font-black text-[10px] transition-all border-2",
                    finalFormat === 'roundrobin' ? "bg-yellow-500 border-yellow-500 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  )}
                >
                  LIGA (ROBIN)
                </button>
                <button 
                  onClick={() => setFinalFormat('bracket')}
                  className={cn(
                    "py-3 rounded-xl font-black text-[10px] transition-all border-2",
                    finalFormat === 'bracket' ? "bg-brand-600 border-brand-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  )}
                >
                  BAGAN (GUGUR)
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Poin Penyisihan (R1)</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setPrelimPointsSystem(false)}
                  className={cn(
                    "py-3 rounded-xl font-black text-[10px] transition-all border-2",
                    !prelimPointsSystem ? "bg-brand-600 border-brand-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  )}
                >
                  NORMAL (1 NYAWA)
                </button>
                <button 
                  onClick={() => setPrelimPointsSystem(true)}
                  className={cn(
                    "py-3 rounded-xl font-black text-[10px] transition-all border-2",
                    prelimPointsSystem ? "bg-gradient-to-r from-emerald-500 to-teal-600 border-transparent text-white shadow-lg shadow-emerald-100" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  )}
                >
                  DULUAN 2 POIN
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Daftar Peserta ({bulkInput.split('\n').filter(n => n.trim()).length} Orang)</label>
            <textarea 
              value={bulkInput} 
              onChange={(e) => setBulkInput(e.target.value)} 
              placeholder="[Tim A] Peserta 1&#10;[Tim A] Peserta 2&#10;[Tim B] Peserta 3&#10;Peserta Solo" 
              rows={10} 
              className="w-full bg-white border-2 border-slate-200 p-6 rounded-2xl mb-6 font-bold text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none resize-y transition-all shadow-inner" 
            />
          </div>

          <button 
            onClick={generateGlobalBracket} 
            className="w-full bg-brand-600 text-white p-5 rounded-2xl font-black shadow-xl shadow-brand-200 hover:bg-brand-700 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Shuffle size={20}/> GENERATE SEMUA BAGAN
          </button>
        </div>
      </div>
    </div>
  );
}
