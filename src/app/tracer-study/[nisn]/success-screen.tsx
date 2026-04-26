"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function SuccessScreen({ onBack }: { onBack: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { y: 30, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.2)" }
    );
  }, []);

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
