"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import toast, { Toaster } from "react-hot-toast";
import SuccessScreen from "./success-screen";

type FormState = {
  nisn: string;
  nama: string;
  tanggalLahir: string;
  tahunMasuk: number | "";
  tahunLulus: number | "";
  noHp: string;
  noWa: string;
  email: string;
  path: "LANJUT_STUDI" | "BEKERJA" | "";
  universitas: string;
  jurusan: string;
  perusahaan: string;
  jabatan: string;
};

export default function TracerForm({ nisn }: { nisn: string }) {
  const stepContainerRef = useRef<HTMLDivElement>(null);
  
  const [verifying, setVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<FormState>({
    nisn: "",
    nama: "",
    tanggalLahir: "",
    tahunMasuk: "",
    tahunLulus: "",
    noHp: "",
    noWa: "",
    email: "",
    path: "",
    universitas: "",
    jurusan: "",
    perusahaan: "",
    jabatan: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
      try {
        const sessionData = sessionStorage.getItem("tracerStudyPrefill");
        if (!sessionData) {
          setVerifyError("Sesi telah berakhir atau tidak valid. Silakan cek kelulusan kembali di halaman utama.");
          setVerifying(false);
          return;
        }

        const parsed = JSON.parse(sessionData);
        if (parsed.nisn !== nisn) {
          sessionStorage.removeItem("tracerStudyPrefill");
          setVerifyError(`Sesi tidak valid karena NISN berbeda. (URL: ${nisn}, Session: ${parsed.nisn})`);
          setVerifying(false);
          return;
        }
        if (Date.now() - parsed.savedAt > 30 * 60 * 1000) {
          sessionStorage.removeItem("tracerStudyPrefill");
          setVerifyError("Sesi telah kadaluarsa (lebih dari 30 menit).");
          setVerifying(false);
          return;
        }

        // Fetch config to derive tahunLulus
        let tahunLulusDerive = new Date().getFullYear();
        try {
          const configRes = await fetch("/api/config");
          if (configRes.ok) {
            const configData = await configRes.json();
            tahunLulusDerive = new Date(configData.announcementDate).getFullYear();
          }
        } catch {
          // ignore
        }

        const verifyRes = await fetch("/api/tracer-study/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nisn: parsed.nisn, tanggalLahir: parsed.tanggalLahir }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          setVerifyError(verifyData.error || "Gagal verifikasi data.");
          setVerifying(false);
          return;
        }

        const baseData = {
          nisn: parsed.nisn,
          nama: parsed.nama,
          tanggalLahir: parsed.tanggalLahir,
          tahunLulus: tahunLulusDerive,
        };

        if (verifyData.existing) {
          setFormData({
            ...baseData,
            ...verifyData.existing,
          });
        } else {
          setFormData((prev) => ({ ...prev, ...baseData }));
        }

      } catch {
        setVerifyError("Terjadi kesalahan internal.");
      } finally {
        setVerifying(false);
      }
    };

    init();
  }, [nisn]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "noHp" || name === "noWa") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, "") }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.tahunMasuk) newErrors.tahunMasuk = "Wajib diisi.";
    else if (Number(formData.tahunMasuk) >= Number(formData.tahunLulus)) newErrors.tahunMasuk = "Tahun masuk harus lebih kecil dari tahun lulus.";
    
    if (!formData.noHp || !/^\d{10,15}$/.test(formData.noHp)) newErrors.noHp = "No HP harus 10-15 digit.";
    if (!formData.noWa || !/^\d{10,15}$/.test(formData.noWa)) newErrors.noWa = "No WA harus 10-15 digit.";
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Email tidak valid.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.path) {
      toast.error("Pilih jalur rencana Anda.");
      return false;
    }
    
    if (formData.path === "LANJUT_STUDI") {
      if (!formData.universitas || formData.universitas.length < 2) newErrors.universitas = "Minimal 2 karakter.";
      if (!formData.jurusan || formData.jurusan.length < 2) newErrors.jurusan = "Minimal 2 karakter.";
    } else if (formData.path === "BEKERJA") {
      if (!formData.perusahaan || formData.perusahaan.length < 2) newErrors.perusahaan = "Minimal 2 karakter.";
      if (!formData.jabatan || formData.jabatan.length < 2) newErrors.jabatan = "Minimal 2 karakter.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep1()) {
      gsap.to(stepContainerRef.current, {
        x: -30, opacity: 0, duration: 0.2, ease: "power2.in",
        onComplete: () => {
          setStep(2);
          gsap.fromTo(stepContainerRef.current, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" });
        }
      });
    }
  };

  const prevStep = () => {
    gsap.to(stepContainerRef.current, {
      x: 30, opacity: 0, duration: 0.2, ease: "power2.in",
      onComplete: () => {
        setStep(1);
        gsap.fromTo(stepContainerRef.current, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" });
      }
    });
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!validateStep2()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tracer-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan data.");
        return;
      }

      toast.success("Data berhasil disimpan!");
      setSubmitted(true);
      // We don't remove session here so user can edit if they want, or we can handle it in SuccessScreen.
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <i className="ri-loader-4-line animate-spin text-4xl text-primary" />
      </div>
    );
  }

  if (verifyError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
          <i className="ri-error-warning-fill text-3xl" />
        </div>
        <h2 className="text-xl font-black text-zinc-900 mb-2">Akses Ditolak</h2>
        <p className="text-zinc-500 text-sm max-w-md mb-6">{verifyError}</p>
        <Link href="/" className="btn-primary w-full max-w-xs py-3 text-xs">
          KEMBALI KE BERANDA
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 p-4 md:p-8">
        <div className="w-full max-w-xl rounded-3xl bg-white p-6 md:p-10 shadow-xl border border-zinc-100">
          <SuccessScreen onBack={() => { setSubmitted(false); setStep(1); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 p-4 md:p-8 flex items-center justify-center">
      <Toaster position="top-center" />
      <div className="w-full max-w-3xl rounded-[2.5rem] bg-white p-6 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-zinc-100">
        
        {/* Header */}
        <div className="mb-8 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6 border-b border-zinc-100 pb-8">
          <div className="flex items-center gap-4">
            <Image src="/logo-smansa.jpg" alt="Logo" width={56} height={56} className="rounded-lg shadow-sm border border-zinc-100" />
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">Tracer Study</h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">SMA Negeri 1 Samarinda</p>
            </div>
          </div>
          {/* Stepper */}
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step === 1 ? 'bg-primary text-white shadow-lg' : 'bg-emerald-500 text-white'}`}>
              {step === 2 ? <i className="ri-check-line" /> : '1'}
            </div>
            <div className={`h-1 w-8 rounded-full ${step === 2 ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step === 2 ? 'bg-primary text-white shadow-lg' : 'bg-zinc-100 text-zinc-400'}`}>
              2
            </div>
          </div>
        </div>

        <div ref={stepContainerRef}>
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight mb-4">Informasi Dasar</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nama Lengkap</label>
                  <div className="relative">
                    <input type="text" className="input-field bg-zinc-50 text-zinc-500 cursor-not-allowed pl-10" value={formData.nama} readOnly />
                    <i className="ri-lock-line absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">NISN</label>
                  <div className="relative">
                    <input type="text" className="input-field bg-zinc-50 text-zinc-500 cursor-not-allowed pl-10" value={formData.nisn} readOnly />
                    <i className="ri-lock-line absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Tahun Masuk</label>
                  <input type="number" name="tahunMasuk" className={`input-field ${errors.tahunMasuk ? 'border-red-500 ring-red-500' : ''}`} value={formData.tahunMasuk} onChange={handleChange} placeholder="Contoh: 2023" />
                  {errors.tahunMasuk && <p className="text-[10px] text-red-500 ml-1 animate-pulse">{errors.tahunMasuk}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Tahun Lulus</label>
                  <div className="relative">
                    <input type="text" className="input-field bg-zinc-50 text-zinc-500 cursor-not-allowed pl-10" value={formData.tahunLulus} readOnly />
                    <i className="ri-lock-line absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">No HP</label>
                  <input type="tel" name="noHp" className={`input-field ${errors.noHp ? 'border-red-500 ring-red-500' : ''}`} value={formData.noHp} onChange={handleChange} placeholder="Contoh: 081234567890" />
                  {errors.noHp && <p className="text-[10px] text-red-500 ml-1 animate-pulse">{errors.noHp}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">No WhatsApp</label>
                  <input type="tel" name="noWa" className={`input-field ${errors.noWa ? 'border-red-500 ring-red-500' : ''}`} value={formData.noWa} onChange={handleChange} placeholder="Sama dengan HP atau beda" />
                  {errors.noWa && <p className="text-[10px] text-red-500 ml-1 animate-pulse">{errors.noWa}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email Aktif</label>
                <input type="email" name="email" className={`input-field ${errors.email ? 'border-red-500 ring-red-500' : ''}`} value={formData.email} onChange={handleChange} placeholder="Contoh: siswa@gmail.com" />
                {errors.email && <p className="text-[10px] text-red-500 ml-1 animate-pulse">{errors.email}</p>}
              </div>

              <div className="pt-6">
                <button onClick={nextStep} className="btn-primary w-full py-4 text-xs tracking-widest shadow-xl">
                  SELANJUTNYA <i className="ri-arrow-right-line ml-2" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight mb-4">Rencana Setelah Lulus</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Lanjut Studi Card */}
                <div 
                  onClick={() => { setFormData(p => ({ ...p, path: "LANJUT_STUDI" })); setErrors({}); }}
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 ${formData.path === 'LANJUT_STUDI' ? 'border-primary bg-primary/5 scale-[1.02] shadow-xl' : 'border-zinc-100 bg-white hover:border-zinc-200 hover:bg-zinc-50'}`}
                >
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${formData.path === 'LANJUT_STUDI' ? 'bg-primary text-white shadow-lg' : 'bg-zinc-100 text-zinc-500'}`}>
                    <i className="ri-graduation-cap-fill text-2xl" />
                  </div>
                  <h4 className="text-sm font-black text-zinc-900 uppercase">Lanjut Studi</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Kuliah, vokasi, atau sekolah kedinasan.</p>
                </div>

                {/* Bekerja Card */}
                <div 
                  onClick={() => { setFormData(p => ({ ...p, path: "BEKERJA" })); setErrors({}); }}
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 ${formData.path === 'BEKERJA' ? 'border-primary bg-primary/5 scale-[1.02] shadow-xl' : 'border-zinc-100 bg-white hover:border-zinc-200 hover:bg-zinc-50'}`}
                >
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${formData.path === 'BEKERJA' ? 'bg-primary text-white shadow-lg' : 'bg-zinc-100 text-zinc-500'}`}>
                    <i className="ri-briefcase-fill text-2xl" />
                  </div>
                  <h4 className="text-sm font-black text-zinc-900 uppercase">Bekerja / Wirausaha</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Masuk dunia kerja atau merintis usaha.</p>
                </div>
              </div>

              {formData.path === "LANJUT_STUDI" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-[slideIn_0.3s_ease-out]">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Universitas / Kampus</label>
                    <input type="text" name="universitas" className={`input-field ${errors.universitas ? 'border-red-500 ring-red-500' : ''}`} value={formData.universitas} onChange={handleChange} placeholder="Contoh: Universitas Mulawarman" />
                    {errors.universitas && <p className="text-[10px] text-red-500 ml-1 animate-pulse">{errors.universitas}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Fakultas / Jurusan</label>
                    <input type="text" name="jurusan" className={`input-field ${errors.jurusan ? 'border-red-500 ring-red-500' : ''}`} value={formData.jurusan} onChange={handleChange} placeholder="Contoh: Ilmu Komputer" />
                    {errors.jurusan && <p className="text-[10px] text-red-500 ml-1 animate-pulse">{errors.jurusan}</p>}
                  </div>
                </div>
              )}

              {formData.path === "BEKERJA" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-[slideIn_0.3s_ease-out]">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nama Perusahaan / Usaha</label>
                    <input type="text" name="perusahaan" className={`input-field ${errors.perusahaan ? 'border-red-500 ring-red-500' : ''}`} value={formData.perusahaan} onChange={handleChange} placeholder="Contoh: PT. Maju Mundur" />
                    {errors.perusahaan && <p className="text-[10px] text-red-500 ml-1 animate-pulse">{errors.perusahaan}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Posisi / Jabatan</label>
                    <input type="text" name="jabatan" className={`input-field ${errors.jabatan ? 'border-red-500 ring-red-500' : ''}`} value={formData.jabatan} onChange={handleChange} placeholder="Contoh: Staff Admin" />
                    {errors.jabatan && <p className="text-[10px] text-red-500 ml-1 animate-pulse">{errors.jabatan}</p>}
                  </div>
                </div>
              )}

              <div className="pt-6 flex gap-4">
                <button onClick={prevStep} className="btn-primary !bg-white !text-zinc-600 border border-zinc-200 hover:!bg-zinc-50 flex-1 py-4 text-xs tracking-widest shadow-sm">
                  <i className="ri-arrow-left-line mr-2" /> KEMBALI
                </button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary flex-[2] py-4 text-xs tracking-widest shadow-xl disabled:opacity-70 disabled:cursor-not-allowed">
                  {isSubmitting ? <i className="ri-loader-4-line animate-spin text-lg" /> : <i className="ri-send-plane-fill mr-2 text-lg" />}
                  <span className="uppercase">{isSubmitting ? "MENYIMPAN..." : "KIRIM DATA"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
