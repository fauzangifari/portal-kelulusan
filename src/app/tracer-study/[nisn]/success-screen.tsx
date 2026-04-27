"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type SubmittedData = {
  tahunMasuk: number | "";
  noHp: string;
  noWa: string;
  email: string;
  path: "LANJUT_STUDI" | "BEKERJA" | "TIDAK_BEKERJA" | "";
  universitas?: string;
  jurusan?: string;
  perusahaan?: string;
  jabatan?: string;
  alasan?: string;
};

export default function SuccessScreen({
  data,
  onBack,
}: { data: SubmittedData | null; onBack: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { y: 30, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.2)" }
    );
  }, []);

  const pathLabel: Record<string, string> = {
    LANJUT_STUDI: "Lanjut Studi",
    BEKERJA: "Bekerja / Wirausaha",
    TIDAK_BEKERJA: "Tidak Bekerja",
  };

  const rows: { label: string; value: string; icon: string }[] = [];
  if (data) {
    if (data.tahunMasuk) rows.push({ label: "Tahun Masuk", value: String(data.tahunMasuk), icon: "ri-calendar-line" });
    if (data.noHp)       rows.push({ label: "No HP",       value: data.noHp,                icon: "ri-phone-line" });
    if (data.noWa)       rows.push({ label: "No WhatsApp", value: data.noWa,                icon: "ri-whatsapp-line" });
    if (data.email)      rows.push({ label: "Email",       value: data.email,               icon: "ri-mail-line" });
    if (data.path)       rows.push({ label: "Jalur",       value: pathLabel[data.path],     icon: "ri-route-line" });

    if (data.path === "LANJUT_STUDI") {
      if (data.universitas) rows.push({ label: "Universitas", value: data.universitas, icon: "ri-building-4-line" });
      if (data.jurusan)     rows.push({ label: "Jurusan",     value: data.jurusan,     icon: "ri-book-open-line" });
    } else if (data.path === "BEKERJA") {
      if (data.perusahaan)  rows.push({ label: "Perusahaan",  value: data.perusahaan,  icon: "ri-building-4-line" });
      if (data.jabatan)     rows.push({ label: "Jabatan",     value: data.jabatan,     icon: "ri-user-star-line" });
    } else if (data.path === "TIDAK_BEKERJA") {
      if (data.alasan)      rows.push({ label: "Alasan",      value: data.alasan,      icon: "ri-chat-quote-line" });
    }
  }

  return (
    <div ref={containerRef} className="text-center py-10">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
        <i className="ri-check-line text-5xl font-black" />
      </div>
      <h2 className="text-2xl md:text-3xl font-black text-zinc-900 uppercase tracking-tight mb-4">
        Terima Kasih!
      </h2>
      <p className="text-sm text-zinc-500 max-w-md mx-auto mb-8 leading-relaxed">
        Data Tracer Study Anda berhasil disimpan. Informasi ini sangat berharga untuk pengembangan SMANSA ke depannya. Semoga sukses selalu dengan rencana Anda!
      </p>

      {data && rows.length > 0 && (
        <div className="text-left bg-zinc-50 border border-zinc-100 rounded-2xl p-5 mb-8 max-w-md mx-auto">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Ringkasan Data Anda</p>
          <dl className="space-y-3">
            {rows.map((r) => (
              <div key={r.label} className="flex items-start gap-3">
                <i className={`${r.icon} text-zinc-400 mt-0.5 w-4 text-center shrink-0`} />
                <div className="flex-1 min-w-0">
                  <dt className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{r.label}</dt>
                  <dd className="text-xs font-bold text-zinc-800 break-words whitespace-pre-wrap">{r.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="flex flex-col gap-3 justify-center items-center">
        <button onClick={onBack} className="btn-primary !bg-emerald-500 !shadow-emerald-200 hover:!bg-emerald-600 w-full max-w-xs py-4 text-xs tracking-widest">
          <i className="ri-edit-box-line mr-2" /> EDIT DATA
        </button>
        <Link href="/" className="btn-primary !bg-white !text-zinc-600 border border-zinc-200 !shadow-sm hover:!bg-zinc-50 w-full max-w-xs py-4 text-xs tracking-widest">
          <i className="ri-home-line mr-2" /> KEMBALI KE BERANDA
        </Link>
      </div>
    </div>
  );
}
