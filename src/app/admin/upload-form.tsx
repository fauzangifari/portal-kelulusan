"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import toast, { Toaster } from 'react-hot-toast';

type StudentRecord = {
  nisn: string;
  nama: string;
  status: "LULUS" | "TIDAK LULUS";
  tanggalLahir: string;
};

const TiptapToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50/50 p-2 rounded-t-3xl">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('bold') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}
      >
        <i className="ri-bold text-lg" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('italic') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}
      >
        <i className="ri-italic text-lg" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('underline') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}
      >
        <i className="ri-underline text-lg" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('strike') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}
      >
        <i className="ri-strikethrough text-lg" />
      </button>
      <div className="w-px h-4 bg-zinc-200 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`h-8 w-8 rounded-lg flex items-center justify-center font-black transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`h-8 w-8 rounded-lg flex items-center justify-center font-black transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}
      >
        H2
      </button>
      <div className="w-px h-4 bg-zinc-200 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('bulletList') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}
      >
        <i className="ri-list-unordered text-lg" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('orderedList') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}
      >
        <i className="ri-list-ordered text-lg" />
      </button>
      <div className="w-px h-4 bg-zinc-200 mx-1" />
      <button
        type="button"
        onClick={setLink}
        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('link') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}
      >
        <i className="ri-link text-lg" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-200 disabled:opacity-30 transition-colors"
      >
        <i className="ri-link-unlink text-lg" />
      </button>
    </div>
  );
};

export default function AdminUploadForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Settings State
  const [announcementDate, setAnnouncementDate] = useState("");
  const [announcementMemo, setAnnouncementMemo] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"portal" | "database">("portal");

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState<StudentRecord[]>([]);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        openOnClick: false,
      }),
    ],
    content: announcementMemo,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setAnnouncementMemo(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap outline-none focus:bg-primary/5 transition-colors',
      },
    },
  });

  // Sync initial content when it arrives from API
  useEffect(() => {
    if (editor && announcementMemo && !editor.isFocused && editor.getHTML() === '<p></p>') {
      editor.commands.setContent(announcementMemo);
    }
  }, [announcementMemo, editor]);

  useEffect(() => {
    let isActive = true;
    const fetchData = async () => {
      try {
        const sessionRes = await fetch("/api/admin/session", { method: "GET", cache: "no-store" });
        if (!sessionRes.ok) {
          if (isActive) window.location.href = "/admin/login?reason=session-expired";
          return;
        }
        const configRes = await fetch("/api/config");
        const config = await configRes.json();
        if (configRes.ok && isActive) {
          const dateStr = config.announcementDate || "2000-01-01T00:00:00+07:00";
          const date = new Date(dateStr);
          const offset = date.getTimezoneOffset() * 60000;
          const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
          setAnnouncementDate(localISOTime);
          setAnnouncementMemo(config.announcementMemo);
        }
      } catch {
        if (isActive) window.location.href = "/admin/login?reason=session-expired";
      }
    };

    void fetchData();

    return () => {
      isActive = false;
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) throw new Error("CSV minimal harus memiliki header dan 1 baris data.");

        const header = lines[0].split(",").map(h => h.trim().toLowerCase());
        const nisnIdx = header.indexOf("nisn");
        const namaIdx = header.indexOf("nama");
        const statusIdx = header.indexOf("status");
        const tglIdx = header.indexOf("tanggallahir");

        if (nisnIdx === -1 || namaIdx === -1 || statusIdx === -1 || tglIdx === -1) {
          throw new Error("Header CSV tidak lengkap (nisn, nama, status, tanggalLahir)");
        }

        const parsed: StudentRecord[] = lines.slice(1).map(line => {
          const cols = line.split(",").map(c => c.trim());
          return {
            nisn: cols[nisnIdx] || "",
            nama: cols[namaIdx]?.toUpperCase() || "",
            status: cols[statusIdx]?.toUpperCase() === "LULUS" ? "LULUS" : "TIDAK LULUS",
            tanggalLahir: cols[tglIdx] || ""
          };
        });

        setReviewData(parsed);
        setShowReviewModal(true);
        toast.success(`${parsed.length} data siswa berhasil dimuat.`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan saat membaca file CSV.";
        toast.error(message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const updateRecord = <K extends keyof StudentRecord>(index: number, field: K, value: StudentRecord[K]) => {
    const newData = [...reviewData];
    newData[index] = { ...newData[index], [field]: value };
    setReviewData(newData);
  };

  const deleteRecord = (index: number) => {
    setReviewData(reviewData.filter((_, i) => i !== index));
  };

  const clearAllRecords = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua data di tabel review ini?")) {
      setReviewData([]);
    }
  };

  const addNewRecord = () => {
    const newRecord: StudentRecord = {
      nisn: "",
      nama: "",
      status: "LULUS",
      tanggalLahir: ""
    };
    setReviewData([newRecord, ...reviewData]);
  };

  const isNisnValid = (nisn: string) => /^\d{10}$/.test(nisn);
  const isDateValid = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);

  const handleFinalSync = async () => {
    if (reviewData.length === 0) return toast.error("Data kosong.");

    const invalidRecords = reviewData.filter(r => !isNisnValid(r.nisn) || !isDateValid(r.tanggalLahir) || !r.nama.trim());
    if (invalidRecords.length > 0) {
      return toast.error(`Terdapat ${invalidRecords.length} data yang belum valid.`);
    }

    const toastId = toast.loading("Sinkronisasi data...");
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/upload-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      });
      const payload = await response.json();
      if (response.ok) {
        toast.success(payload.message, { id: toastId });
        setShowReviewModal(false);
      } else {
        toast.error(payload.message, { id: toastId });
      }
    } catch {
      toast.error("Terjadi kegagalan koneksi.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  async function handleSaveSettings(event: FormEvent) {
    event.preventDefault();
    const toastId = toast.loading("Menyimpan pengaturan...");
    setIsSavingSettings(true);
    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementDate: announcementDate, announcementMemo }),
      });
      if (response.ok) toast.success("Konfigurasi Portal Berhasil Diperbarui!", { id: toastId });
      else toast.error("Gagal menyimpan pengaturan.", { id: toastId });
    } catch {
      toast.error("Terjadi kesalahan sistem.", { id: toastId });
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    toast.success("Berhasil keluar.");
    window.location.href = "/admin/login";
  }

  return (
    <main className="flex min-h-screen bg-[#F8FAFC] font-sans selection:bg-primary/10 overflow-hidden">
      <Toaster position="top-right" />
      
      {/* REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/90 backdrop-blur-md p-2 md:p-10">
           <div className="flex h-full w-full max-w-6xl flex-col rounded-[2.5rem] bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="flex shrink-0 flex-col md:flex-row md:items-center justify-between border-b border-zinc-100 bg-white px-6 py-6 md:px-10 md:py-8 gap-4">
                 <div>
                    <h2 className="text-xl md:text-2xl font-black text-zinc-900 uppercase">Review & Edit Data</h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Total {reviewData.length} data terdeteksi</p>
                 </div>
                 <div className="flex items-center gap-3">
                    {reviewData.length > 0 && (
                      <button 
                        onClick={clearAllRecords}
                        className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-[10px] font-black text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest"
                      >
                         <i className="ri-delete-bin-line text-lg" /> Hapus Semua
                      </button>
                    )}
                    <button 
                      onClick={addNewRecord}
                      className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all uppercase tracking-widest"
                    >
                       <i className="ri-add-line text-lg" /> Tambah Baris
                    </button>
                    <button onClick={() => setShowReviewModal(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-400 hover:text-red-500 transition-colors">
                       <i className="ri-close-line text-2xl" />
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-auto p-4 md:p-10 bg-zinc-50/30 custom-scrollbar">
                 <table className="w-full border-separate border-spacing-y-3">
                    <thead>
                       <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                          <th className="px-6 pb-2 text-left">Nama Lengkap</th>
                          <th className="px-6 pb-2 text-left">NISN</th>
                          <th className="px-6 pb-2 text-left">Status Kelulusan</th>
                          <th className="px-6 pb-2 text-left">Tanggal Lahir</th>
                          <th className="w-14"></th>
                       </tr>
                    </thead>
                    <tbody>
                       {reviewData.map((student, idx) => {
                          const nisnValid = isNisnValid(student.nisn);
                          const dateValid = isDateValid(student.tanggalLahir);
                          const nameValid = student.nama.trim().length > 0;

                          return (
                          <tr key={idx} className="group">
                             <td className="bg-white p-2 rounded-l-[1.5rem] border-y border-l border-zinc-100 group-hover:border-primary/30 transition-all shadow-sm">
                                <div className="relative">
                                  <input 
                                    value={student.nama} 
                                    onChange={(e) => updateRecord(idx, 'nama', e.target.value)} 
                                    placeholder="NAMA SISWA"
                                    className={`w-full bg-transparent px-4 py-3 font-bold text-zinc-800 outline-none text-sm uppercase rounded-xl transition-all ${!nameValid ? 'bg-red-50/50 ring-1 ring-red-200' : 'focus:bg-primary/5'}`}
                                  />
                                  {!nameValid && <span className="absolute -top-1 -left-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                                </div>
                             </td>
                             <td className="bg-white p-2 border-y border-zinc-100 group-hover:border-primary/30 transition-all shadow-sm">
                                <div className="relative">
                                  <input 
                                    value={student.nisn} 
                                    onChange={(e) => updateRecord(idx, 'nisn', e.target.value.replace(/\D/g, "").slice(0,10))} 
                                    placeholder="NISN (10 Digit)"
                                    className={`w-full bg-transparent px-4 py-3 font-bold text-zinc-600 outline-none text-sm tabular-nums rounded-xl transition-all ${!nisnValid ? 'bg-red-50/50 ring-1 ring-red-200 text-red-600' : 'focus:bg-primary/5'}`}
                                  />
                                  {!nisnValid && <i className="ri-error-warning-fill absolute right-4 top-1/2 -translate-y-1/2 text-red-500" />}
                                </div>
                             </td>
                             <td className="bg-white p-2 border-y border-zinc-100 group-hover:border-primary/30 transition-all shadow-sm">
                                <div className="px-2">
                                   <div className="relative group/select">
                                      <select 
                                        value={student.status} 
                                        onChange={(e) => updateRecord(idx, "status", e.target.value === "LULUS" ? "LULUS" : "TIDAK LULUS")}
                                        className={`w-full appearance-none rounded-xl pl-4 pr-10 py-3 text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer transition-all border border-transparent ${student.status === 'LULUS' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100'}`}
                                      >
                                         <option value="LULUS">LULUS</option>
                                         <option value="TIDAK LULUS">TIDAK LULUS</option>
                                      </select>
                                      <i className={`ri-arrow-down-s-line absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-lg ${student.status === 'LULUS' ? 'text-emerald-400' : 'text-red-400'}`} />
                                   </div>
                                </div>
                             </td>
                             <td className="bg-white p-2 border-y border-zinc-100 group-hover:border-primary/30 transition-all shadow-sm">
                                <div className="px-2">
                                   <div className="relative">
                                      <input 
                                        type="date"
                                        value={student.tanggalLahir} 
                                        onChange={(e) => updateRecord(idx, 'tanggalLahir', e.target.value)} 
                                        className={`w-full bg-zinc-50 px-4 py-3 rounded-xl font-bold text-zinc-600 outline-none text-sm tabular-nums border transition-all ${!dateValid ? 'border-red-200 bg-red-50 text-red-600' : 'border-zinc-100 focus:border-primary/30 focus:bg-white'}`}
                                      />
                                   </div>
                                </div>
                             </td>
                             <td className="bg-white p-2 rounded-r-[1.5rem] border-y border-r border-zinc-100 group-hover:border-primary/30 transition-all text-center shadow-sm">
                                <button 
                                  onClick={() => deleteRecord(idx)}
                                  className="h-10 w-10 flex items-center justify-center rounded-xl text-zinc-300 hover:bg-red-50 hover:text-red-500 transition-all group-hover:text-zinc-400"
                                  title="Hapus baris"
                                >
                                   <i className="ri-delete-bin-6-line text-lg" />
                                </button>
                             </td>
                          </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>

              <div className="shrink-0 flex flex-col md:flex-row items-center justify-between border-t border-zinc-100 bg-zinc-50 px-6 py-6 md:px-10 md:py-8 gap-6">
                 <div className="text-center md:text-left">
                    <p className="text-xs font-black text-zinc-900 uppercase tracking-widest">Siap Disinkronkan</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Pastikan format Tanggal & NISN sudah benar</p>
                 </div>
                 <div className="flex w-full md:w-auto gap-4">
                    <button onClick={() => setShowReviewModal(false)} className="flex-1 md:flex-none px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-600">Batal</button>
                    <button 
                      onClick={handleFinalSync} 
                      disabled={isLoading}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-10 py-5 text-xs font-black text-white shadow-2xl hover:bg-zinc-900 transition-all active:scale-95 disabled:opacity-50"
                    >
                       {isLoading ? <i className="ri-loader-4-line animate-spin text-lg" /> : <i className="ri-checkbox-circle-fill text-lg" />}
                       <span className="tracking-[0.2em]">SINKRONKAN DATA</span>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col bg-zinc-900 p-8 text-white shadow-2xl shrink-0">
         <div className="mb-12 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg overflow-hidden p-1.5 shrink-0">
               <Image src="/logo-smansa.jpg" alt="Logo" width={40} height={40} className="object-contain" />
            </div>
            <div>
               <h2 className="text-sm font-black uppercase tracking-tighter leading-none">SMANSA Admin</h2>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Control Panel</p>
            </div>
         </div>
         <nav className="flex flex-1 flex-col gap-2">
            <button onClick={() => setActiveTab("portal")} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${activeTab === 'portal' ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-800'}`}><i className="ri-settings-4-fill text-lg" /> Konfigurasi Portal</button>
            <button onClick={() => setActiveTab("database")} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${activeTab === 'database' ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-800'}`}><i className="ri-database-2-fill text-lg" /> Database Siswa</button>
         </nav>
         <div className="mt-auto pt-8 border-t border-zinc-800">
            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all"><i className="ri-logout-box-r-line text-lg" /> Keluar Sistem</button>
         </div>
      </aside>

      {/* Content Area */}
      <section className="flex-1 flex flex-col h-screen">
         <header className="flex h-20 shrink-0 items-center justify-between bg-white px-8 border-b border-zinc-200">
            <div className="flex items-center gap-3">
               <div className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm border border-zinc-100 overflow-hidden p-1">
                  <Image src="/logo-smansa.jpg" alt="Logo" width={32} height={32} className="object-contain" />
               </div>
               <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight">{activeTab === 'portal' ? "Konfigurasi" : "Data Management"}</h2>
            </div>
            <div className="flex items-center gap-4">
               <Link href="/" className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-primary hover:text-white transition-all"><i className="ri-home-4-line text-xl" /></Link>
            </div>
         </header>

         {/* Mobile Nav */}
         <div className="flex lg:hidden shrink-0 border-b border-zinc-200 bg-white p-1">
            <button onClick={() => setActiveTab("portal")} className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'portal' ? 'bg-primary/5 text-primary' : 'text-zinc-400'}`}><i className="ri-settings-4-fill text-lg" /><span className="text-[8px] font-bold uppercase tracking-widest mt-0.5">Portal</span></button>
            <button onClick={() => setActiveTab("database")} className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'database' ? 'bg-primary/5 text-primary' : 'text-zinc-400'}`}><i className="ri-database-2-fill text-lg" /><span className="text-[8px] font-bold uppercase tracking-widest mt-0.5">Database</span></button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">
            {activeTab === 'portal' && (
              <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-2">
                 <div className="rounded-[2.5rem] bg-white p-8 md:p-12 shadow-sm border border-zinc-100">
                    <form onSubmit={handleSaveSettings} className="space-y-10">
                       <div className="grid gap-10 md:grid-cols-2">
                          <div className="space-y-4">
                             <div className="flex items-center gap-2 text-primary"><i className="ri-time-fill text-xl" /><h3 className="text-sm font-black uppercase tracking-widest">Jadwal Pembukaan</h3></div>
                             <input type="datetime-local" className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 font-bold text-zinc-900 outline-none focus:border-primary shadow-sm" value={announcementDate} onChange={(e) => setAnnouncementDate(e.target.value)} required />
                          </div>
                          <div className="space-y-4">
                             <div className="flex items-center gap-2 text-primary"><i className="ri-notification-3-fill text-xl" /><h3 className="text-sm font-black uppercase tracking-widest">Preview Jadwal</h3></div>
                             <div className="rounded-3xl bg-zinc-50 p-6 border border-zinc-100">
                                <p className="text-sm font-black text-zinc-900 leading-tight">
                                  {mounted && announcementDate ? new Date(announcementDate).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) : 'Belum diatur'}
                                </p>
                              </div>
                           </div>
                       </div>
                       <div className="space-y-4 pt-4 border-t border-zinc-100">
                          <div className="flex items-center gap-2 text-primary"><i className="ri-article-fill text-xl" /><h3 className="text-sm font-black uppercase tracking-widest">Memo Lanjutan</h3></div>
                          <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                             {mounted && (
                               <>
                                 <TiptapToolbar editor={editor} />
                                 <EditorContent editor={editor} />
                               </>
                             )}
                          </div>
                       </div>
                       <div className="flex justify-end"><button type="submit" disabled={isSavingSettings} className="inline-flex items-center gap-3 rounded-2xl bg-zinc-900 px-10 py-5 text-xs font-black text-white shadow-2xl hover:bg-primary transition-all active:scale-95 disabled:opacity-50"><i className="ri-save-3-fill text-lg" /><span className="tracking-[0.2em]">PERBARUI KONFIGURASI</span></button></div>
                    </form>
                 </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-2">
                 <div className="grid gap-8 md:grid-cols-2">
                    <div className="rounded-[2.5rem] bg-white p-10 shadow-sm border border-zinc-100 space-y-6">
                       <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary"><i className="ri-file-list-3-fill text-3xl" /></div>
                       <h3 className="text-xl font-black text-zinc-900 uppercase">Impor Data</h3>
                       <p className="text-sm font-medium text-zinc-500 leading-relaxed">Sinkronisasi hasil kelulusan. Setelah memilih file, Anda dapat mengoreksi data melalui modal review.</p>
                       <div className="rounded-2xl bg-zinc-50 p-5 border border-zinc-100"><code className="text-[10px] font-bold text-primary">nisn, nama, status, tanggalLahir (YYYY-MM-DD)</code></div>
                    </div>
                    <div className="rounded-[2.5rem] bg-zinc-900 p-10 shadow-2xl flex flex-col justify-center items-center relative group overflow-hidden cursor-pointer">
                       <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 z-10 cursor-pointer opacity-0" />
                       <i className="ri-upload-2-fill text-5xl mb-4 text-zinc-600 group-hover:text-primary transition-colors" />
                       <p className="text-sm font-black text-zinc-300 uppercase tracking-widest group-hover:text-white transition-colors">Pilih File CSV</p>
                    </div>
                 </div>
              </div>
            )}
         </div>
      </section>
    </main>
  );
}
