"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";

type StudentResult = {
  nisn: string;
  nama: string;
  status: "LULUS" | "TIDAK LULUS";
};

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isReached: boolean;
};

type PortalConfig = {
  announcementDate: string;
  announcementMemo: string;
};

export default function Home() {
  const cardRef = useRef<HTMLElement>(null);
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const [nisn, setNisn] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [result, setResult] = useState<StudentResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [config, setConfig] = useState<PortalConfig>({
    announcementDate: "2000-01-01T00:00:00+08:00",
    announcementMemo: "Memuat informasi..."
  });
  const [countdown, setCountdown] = useState<Countdown>({ days: 0, hours: 0, minutes: 0, seconds: 0, isReached: false });

  useEffect(() => {
    document.body.classList.add("lock-scroll-desktop");
    return () => {
      document.body.classList.remove("lock-scroll-desktop");
    };
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch {
        console.error("Failed to load portal config");
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { y: 40, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 1, ease: "expo.out" }
    );
  }, []);

  useEffect(() => {
    const target = new Date(config.announcementDate);
    const timer = setInterval(() => {
      setCountdown(getCountdown(target));
    }, 1000);
    return () => clearInterval(timer);
  }, [config.announcementDate]);

  useEffect(() => {
    if (result && modalOverlayRef.current && modalContentRef.current) {
      const tl = gsap.timeline();
      tl.to(modalOverlayRef.current, { opacity: 1, pointerEvents: "auto", duration: 0.3 })
        .fromTo(
          modalContentRef.current,
          { scale: 0.9, opacity: 0, y: 30 },
          { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.2)" },
          "-=0.1"
        );
    }
  }, [result]);

  const closeResult = () => {
    const tl = gsap.timeline();
    tl.to(modalContentRef.current, { scale: 0.9, opacity: 0, y: 10, duration: 0.2, ease: "power2.in" })
      .to(modalOverlayRef.current, { opacity: 0, pointerEvents: "none", duration: 0.2 })
      .add(() => setResult(null));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const targetDate = new Date(config.announcementDate);
    const isTestMode = targetDate.getFullYear() < 2025;
    if (!countdown.isReached && !isTestMode) {
      setError("Pengecekan hasil kelulusan belum dibuka.");
      return;
    }
    if (!/^\d{10}$/.test(nisn)) {
      setError("NISN harus 10 digit angka.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/graduation-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nisn, tanggalLahir }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || "Terjadi kesalahan.");
        return;
      }
      setResult(payload);
      if (payload.status === "LULUS") {
        sessionStorage.setItem("tracerStudyPrefill", JSON.stringify({
          nisn: payload.nisn, nama: payload.nama, tanggalLahir, savedAt: Date.now(),
        }));
      }
    } catch {
      setError("Layanan tidak tersedia.");
    } finally {
      setIsLoading(false);
    }
  }

  const countdownItems = [
    { label: "Hari", value: String(countdown.days).padStart(2, "0") },
    { label: "Jam", value: String(countdown.hours).padStart(2, "0") },
    { label: "Menit", value: String(countdown.minutes).padStart(2, "0") },
    { label: "Detik", value: String(countdown.seconds).padStart(2, "0") },
  ];

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 md:p-8 lg:h-screen lg:overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-white">
         <Image 
           src="/bg-hero.jpeg" 
           alt="Background" 
           fill 
           priority
           className="object-cover opacity-100 blur-[10px] scale-110 brightness-90"
         />
         <div className="absolute inset-0 bg-white/5" />
      </div>

      {/* RESULT MODAL */}
      <div 
        ref={modalOverlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80 opacity-0 pointer-events-none backdrop-blur-lg p-4 md:p-8"
      >
        <div 
          ref={modalContentRef}
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-white p-1 shadow-2xl custom-scrollbar"
        >
          <button 
            onClick={closeResult}
            className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
          >
            <i className="ri-close-line text-2xl" />
          </button>

          <div className="rounded-[calc(2.5rem-4px)] border-4 border-double border-primary/10 bg-white p-6 md:p-12 text-center">
             <div className="mx-auto mb-4 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-white shadow-lg border border-zinc-100 overflow-hidden p-2">
                <Image src="/logo-smansa.jpg" alt="SMANSA Logo" width={60} height={60} className="object-contain" />
             </div>
             <h2 className="text-xl md:text-2xl font-black text-zinc-900 uppercase leading-tight">SMA Negeri 1 Samarinda</h2>
             <p className="text-[9px] md:text-[10px] font-bold text-primary tracking-[0.1em] md:tracking-[0.2em] uppercase mt-1 md:mt-2">Berdasarkan Surat Keputusan
              <br />        
              PLT. Kepala SMA Negeri 1 Samarinda 
              <br />
              Nomor : 400.3.8/0760/SMAN1SMR/2026
              <br />
              tentang Kelulusan Murid Kelas XII Tahun Ajaran 2025/2026 
              <br />
              maka : 
            </p>
             <div className="my-6 space-y-4 rounded-3xl bg-zinc-50 p-5 md:p-8 border border-zinc-100 text-center">
                <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Nama Lengkap</span>
                    <p className="text-sm md:text-base font-black text-zinc-900 uppercase leading-tight">{result?.nama}</p>
                </div>
                <div className="pt-5 md:pt-6 border-t border-zinc-200 text-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 md:mb-4 block">Dinyatakan :</span>
                   <div className={`mx-auto w-fit rounded-2xl px-8 md:px-12 py-3 md:py-4 text-2xl md:text-4xl font-black tracking-[0.1em] shadow-2xl ${
                     result?.status === "LULUS" ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-red-500 text-white shadow-red-200"
                   }`}>
                     {result?.status}
                   </div>
                </div>
             </div>

             <div className="rounded-2xl bg-primary/5 p-4 md:p-5 text-left border border-primary/10 mb-6 md:mb-8">
                <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">Informasi Tambahan / Keterangan:</p>
                <div
                  className="tiptap-content text-[11px] md:text-[12px] max-w-none"
                  dangerouslySetInnerHTML={{ __html: config.announcementMemo }}
                />
             </div>

             {result?.status === "LULUS" && (
                <div className="mb-4 md:mb-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 p-4 md:p-5 text-left relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black text-emerald-900 uppercase tracking-tight mb-1">Tracer Study</h4>
                      <p className="text-[10px] md:text-xs text-emerald-700/80 leading-relaxed font-medium">Bantu sekolah melacak data alumni dengan mengisi form singkat berikut.</p>
                    </div>
                    <Link href={`/tracer-study/${result.nisn}`} className="btn-primary shrink-0 !bg-emerald-500 !shadow-emerald-200/50 hover:!bg-emerald-600 px-4 md:px-6 py-2 md:py-3 text-[10px] md:text-xs w-full md:w-auto text-center">
                      <i className="ri-edit-box-line mr-1.5" /> ISI SEKARANG
                    </Link>
                  </div>
                </div>
             )}

             <button onClick={closeResult} className="btn-primary w-full max-w-[240px] md:max-w-xs py-3.5 md:py-4 text-[10px] md:text-xs tracking-widest">                <i className="ri-arrow-left-line mr-2" /> KEMBALI
             </button>
          </div>
        </div>
      </div>

      {/* PORTAL INTERFACE */}
      <section 
        ref={cardRef}
        className="relative w-full max-w-5xl overflow-hidden rounded-[3rem] border border-white/20 bg-white/90 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] backdrop-blur-xl md:p-4"
      >
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-8 md:p-12 space-y-10">
             <div className="space-y-6">
                <div className="flex items-center justify-center gap-3 md:gap-11 border-b border-zinc-100 pb-8 px-2">
                   <div className="relative h-10 w-10 md:h-16 md:w-16 shrink-0">
                      <Image src="/logo-pemprov.png" alt="Pemprov Kaltim Logo" fill className="object-contain" />
                   </div>
                   <div className="text-center px-1">
                      <p className="text-[6px] md:text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-tight">
                        Dinas Pendidikan dan Kebudayaan <br /> Provinsi Kalimantan Timur
                      </p>
                      <p className="text-[11px] md:text-base font-black text-zinc-900 uppercase tracking-tighter mt-1 leading-tight">SMA Negeri 1 Samarinda</p>
                   </div>
                   <div className="relative h-10 w-10 md:h-16 md:w-16 shrink-0">
                      <Image src="/logo-smansa.jpg" alt="SMANSA Logo" fill className="object-contain rounded-sm" />
                   </div>
                </div>
                <div className="space-y-2 text-center flex flex-col items-center">
                   <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 leading-[0.9]">
                     Portal <br />
                     <span className="text-gradient">Kelulusan</span>
                   </h1>
                   <p className="max-w-md text-sm font-medium leading-relaxed text-zinc-500 pt-2">
                     Akses resmi verifikasi data kelulusan peserta didik Tahun Ajaran 2025/2026.
                   </p>
                </div>
             </div>
             {!countdown.isReached && (
               <div className="space-y-4 flex flex-col items-center">
                  <div className="flex items-center gap-3">
                     <span className="h-px w-8 bg-primary/20" />
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Time Remaining</span>
                     <span className="h-px w-8 bg-primary/20" />
                  </div>
                  <div className="flex gap-4">
                    {countdownItems.map(item => (
                       <div key={item.label} className="flex flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg border border-zinc-100 text-2xl font-black text-primary tabular-nums">
                            {item.value}
                          </div>
                          <span className="mt-2 text-[7px] font-bold uppercase tracking-widest text-zinc-400">{item.label}</span>
                       </div>
                    ))}
                  </div>
               </div>
             )}
             {countdown.isReached && (
               <div className="flex justify-center">
                 <div className="inline-flex items-center gap-3 rounded-2xl bg-emerald-50 px-6 py-3 text-[10px] font-bold text-emerald-600 border border-emerald-100">
                    <i className="ri-checkbox-circle-line text-lg" />
                    <span className="tracking-widest uppercase">Pengecekan Telah Dibuka</span>
                 </div>
               </div>
             )}
          </div>
          <div className="w-full lg:w-[450px] bg-zinc-50/50 border-t lg:border-t-0 lg:border-l border-zinc-100 p-8 md:p-12 lg:pt-24 flex flex-col justify-center lg:justify-start">
             <div className="mb-10 text-center lg:text-left">
                <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Verifikasi Siswa</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">Gunakan NISN Resmi Anda</p>
             </div>
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">NISN (10 Digit)</label>
                   <input type="text" inputMode="numeric" placeholder="Contoh: 0012345678" className="input-field" value={nisn} onChange={(e) => setNisn(e.target.value.replace(/\D/g, "").slice(0, 10))} required />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Tanggal Lahir</label>
                   <input 
                     type="date" 
                     className="input-field" 
                     value={tanggalLahir} 
                     onChange={(e) => setTanggalLahir(e.target.value)} 
                     required 
                   />
                </div>
                <button type="submit" disabled={isLoading || !countdown.isReached} className="btn-primary w-full py-4 text-xs tracking-widest shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale">
                   {isLoading ? <i className="ri-loader-4-line animate-spin text-lg" /> : <i className="ri-search-eye-line text-lg" />}
                   <span className="ml-2 uppercase">{isLoading ? "Verifying..." : countdown.isReached ? "LIHAT HASIL" : "BELUM DIBUKA"}</span>
                </button>
                {error && <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-[10px] font-bold border border-red-100 flex items-center gap-2 animate-shake"><i className="ri-error-warning-fill text-base" />{error}</div>}
             </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function getCountdown(targetDate: Date): Countdown {
  const now = Date.now();
  const distance = targetDate.getTime() - now;
  if (distance <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isReached: true };
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);
  return { days, hours, minutes, seconds, isReached: false };
}
