"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState, useCallback } from "react";
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import toast, { Toaster } from 'react-hot-toast';
import * as XLSX from 'xlsx';

type StudentRecord = {
  _id?: string;
  nisn: string;
  nama: string;
  status: "LULUS" | "TIDAK LULUS";
  tanggalLahir: string;
};

type TracerStudyRecord = {
  _id: string;
  nisn: string;
  nama: string;
  tahunMasuk: number;
  tahunLulus: number;
  noHp: string;
  noWa: string;
  email: string;
  path: "LANJUT_STUDI" | "BEKERJA" | "TIDAK_BEKERJA";
  universitas?: string;
  jurusan?: string;
  perusahaan?: string;
  jabatan?: string;
  alasan?: string;
  createdAt: string;
  updatedAt: string;
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
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50/50 p-2 rounded-t-2xl md:rounded-t-3xl">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('bold') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}><i className="ri-bold text-lg" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('italic') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}><i className="ri-italic text-lg" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('underline') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}><i className="ri-underline text-lg" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('strike') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}><i className="ri-strikethrough text-lg" /></button>
      <div className="w-px h-4 bg-zinc-200 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`h-8 w-8 rounded-lg flex items-center justify-center font-black transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}>H1</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`h-8 w-8 rounded-lg flex items-center justify-center font-black transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}>H2</button>
      <div className="w-px h-4 bg-zinc-200 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('bulletList') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}><i className="ri-list-unordered text-lg" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('orderedList') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}><i className="ri-list-ordered text-lg" /></button>
      <div className="w-px h-4 bg-zinc-200 mx-1" />
      <button type="button" onClick={setLink} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${editor.isActive('link') ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}><i className="ri-link text-lg" /></button>
      <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')} className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-200 disabled:opacity-30 transition-colors"><i className="ri-link-unlink text-lg" /></button>
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
  const [activeTab, setActiveTab] = useState<"portal" | "database" | "tracer">("portal");

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState<StudentRecord[]>([]);

  // Database Tab State
  const [dbStudents, setDbStudents] = useState<StudentRecord[]>([]);
  const [isFetchingDb, setIsFetchingDb] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination & Editing State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<StudentRecord | null>(null);
  const [isSavingRow, setIsSavingRow] = useState(false);

  // Add Manual State
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [newManualForm, setNewManualForm] = useState<StudentRecord>({ nisn: "", nama: "", status: "LULUS", tanggalLahir: "" });

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'all' | 'tracer'; id?: string; name?: string } | null>(null);

  // Tracer Study State
  const [tracerData, setTracerData] = useState<TracerStudyRecord[]>([]);
  const [tracerTotal, setTracerTotal] = useState(0);
  const [tracerPage, setTracerPage] = useState(1);
  const [tracerSearch, setTracerSearch] = useState("");
  const [tracerLoading, setTracerLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedTracerRow, setExpandedTracerRow] = useState<string | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  const fetchDbStudents = async () => {
    setIsFetchingDb(true);
    try {
      const res = await fetch("/api/admin/students");
      if (res.ok) {
        const data = await res.json();
        setDbStudents(data);
      }
    } catch {
      toast.error("Gagal memuat data dari database.");
    } finally {
      setIsFetchingDb(false);
    }
  };

  const fetchTracers = useCallback(async () => {
    setTracerLoading(true);
    try {
      const url = new URL("/api/admin/tracer-studies", window.location.origin);
      url.searchParams.set("page", tracerPage.toString());
      url.searchParams.set("limit", "10");
      if (tracerSearch) {
        url.searchParams.set("search", tracerSearch);
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setTracerData(data.data);
        setTracerTotal(data.totalPages);
      }
    } catch {
      toast.error("Gagal memuat data tracer study.");
    } finally {
      setTracerLoading(false);
    }
  }, [tracerPage, tracerSearch]);

  useEffect(() => {
    if (activeTab === 'tracer') {
      const timer = setTimeout(() => {
        fetchTracers();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fetchTracers]);

  const handleExportTracer = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Menyiapkan file ekspor...");
    try {
      const res = await fetch("/api/admin/tracer-studies?export=1");
      if (!res.ok) throw new Error("Gagal mengambil data ekspor");
      
      const data = await res.json();
      if (data.length === 0) {
        toast.error("Tidak ada data untuk diekspor", { id: toastId });
        return;
      }

      // Format data for Excel
      const pathLabel = (p: string) =>
        p === "LANJUT_STUDI"  ? "Lanjut Studi"  :
        p === "BEKERJA"       ? "Bekerja"       :
        p === "TIDAK_BEKERJA" ? "Tidak Bekerja" : "-";

      const exportData = data.map((item: TracerStudyRecord, index: number) => ({
        "No": index + 1,
        "Nama Lengkap": item.nama,
        "NISN": item.nisn,
        "Jalur": pathLabel(item.path),
        "Tahun Masuk": item.tahunMasuk,
        "Tahun Lulus": item.tahunLulus,
        "No HP": item.noHp,
        "No WhatsApp": item.noWa,
        "Email": item.email,
        "Universitas/Kampus": item.universitas || "-",
        "Fakultas/Jurusan": item.jurusan || "-",
        "Perusahaan/Usaha": item.perusahaan || "-",
        "Posisi/Jabatan": item.jabatan || "-",
        "Alasan (Tidak Bekerja)": item.alasan || "-",
        "Waktu Submit": new Date(item.createdAt).toLocaleString('id-ID')
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Tracer Study");
      
      const today = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Tracer-Study-SMANSA-${today}.xlsx`);
      
      toast.success("File berhasil diunduh!", { id: toastId });
    } catch {
      toast.error("Gagal mengekspor data", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const startEditing = (student: StudentRecord) => {
    setEditingId(student._id || null);
    setEditForm({ ...student });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleUpdateStudent = async () => {
    if (!editForm || !editingId) return;
    if (!isNisnValid(editForm.nisn) || !isDateValid(editForm.tanggalLahir) || !editForm.nama.trim()) {
      return toast.error("Data tidak valid.");
    }
    setIsSavingRow(true);
    const toastId = toast.loading("Memperbarui data...");
    try {
      const res = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      const payload = await res.json();
      if (res.ok) {
        toast.success(payload.message, { id: toastId });
        setEditingId(null);
        setEditForm(null);
        fetchDbStudents();
      } else {
        toast.error(payload.message, { id: toastId });
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi.", { id: toastId });
    } finally {
      setIsSavingRow(false);
    }
  };

  const handleSaveNewManual = async () => {
    if (!newManualForm.nisn || !newManualForm.nama || !newManualForm.tanggalLahir) {
      return toast.error("Semua kolom wajib diisi.");
    }
    if (!isNisnValid(newManualForm.nisn)) {
      return toast.error("NISN harus 10 digit.");
    }
    const toastId = toast.loading("Menambahkan siswa...");
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newManualForm),
      });
      const payload = await res.json();
      if (res.ok) {
        toast.success(payload.message, { id: toastId });
        setIsAddingManual(false);
        setNewManualForm({ nisn: "", nama: "", status: "LULUS", tanggalLahir: "" });
        fetchDbStudents();
      } else {
        toast.error(payload.message, { id: toastId });
      }
    } catch {
      toast.error("Gagal terhubung ke server.", { id: toastId });
    }
  };

  const handleDeleteStudent = (id: string, name: string) => {
    setDeleteTarget({ type: 'single', id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteAllDb = () => {
    setDeleteTarget({ type: 'all' });
    setShowDeleteModal(true);
  };

  const handleDeleteTracer = (id: string, name: string) => {
    setDeleteTarget({ type: 'tracer', id, name });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const toastId = toast.loading(
      deleteTarget.type === 'all' ? "Menghapus database..." : "Menghapus data..."
    );
    setShowDeleteModal(false);
    try {
      if (deleteTarget.type === 'tracer') {
        const url = `/api/admin/tracer-studies?id=${deleteTarget.id}`;
        const res = await fetch(url, { method: "DELETE" });
        const payload = await res.json();
        if (res.ok) {
          toast.success(payload.message, { id: toastId });
          fetchTracers();
        } else {
          toast.error(payload.message, { id: toastId });
        }
      } else {
        const url = deleteTarget.type === 'all' ? "/api/admin/students?all=true" : `/api/admin/students?id=${deleteTarget.id}`;
        const res = await fetch(url, { method: "DELETE" });
        const payload = await res.json();
        if (res.ok) {
          toast.success(payload.message, { id: toastId });
          if (deleteTarget.type === 'all') { setDbStudents([]); setCurrentPage(1); }
          else { fetchDbStudents(); }
        } else {
          toast.error(payload.message, { id: toastId });
        }
      }
    } catch {
      toast.error("Gagal menghapus data.", { id: toastId });
    } finally {
      setDeleteTarget(null);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeTab === 'database') { fetchDbStudents(); }
  }, [activeTab]);

  const editor = useEditor({
    extensions: [StarterKit, Underline, LinkExtension.configure({ openOnClick: false })],
    content: announcementMemo,
    immediatelyRender: false,
    onUpdate: ({ editor }) => { setAnnouncementMemo(editor.getHTML()); },
    editorProps: { attributes: { class: 'tiptap outline-none focus:bg-primary/5 transition-colors' } },
  });

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
          const dateStr = config.announcementDate || "2000-01-01T00:00:00+08:00";
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
    return () => { isActive = false; };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        if (rows.length < 2) throw new Error("File minimal 1 baris data.");
        const header = rows[0].map((h) => String(h).trim().toLowerCase());
        const nisnIdx = header.indexOf("nisn");
        const namaIdx = header.indexOf("nama");
        const statusIdx = header.indexOf("status");
        const tglIdx = header.indexOf("tanggallahir");
        if (nisnIdx === -1 || namaIdx === -1 || statusIdx === -1 || tglIdx === -1) throw new Error("Header tidak lengkap.");
        const parsed: StudentRecord[] = rows.slice(1).filter(row => row.length >= 4 && row[nisnIdx]).map(row => ({
          nisn: String(row[nisnIdx] || "").trim(),
          nama: String(row[namaIdx] || "").toUpperCase().trim(),
          status: String(row[statusIdx] || "").toUpperCase().trim() === "LULUS" ? "LULUS" : "TIDAK LULUS",
          tanggalLahir: String(row[tglIdx] || "").trim()
        }));
        setReviewData(parsed);
        setShowReviewModal(true);
        toast.success(`${parsed.length} data siswa dimuat.`);
      } catch (err) { toast.error(err instanceof Error ? err.message : "Format file tidak valid."); }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const updateRecord = <K extends keyof StudentRecord>(index: number, field: K, value: StudentRecord[K]) => {
    const newData = [...reviewData];
    newData[index] = { ...newData[index], [field]: value };
    setReviewData(newData);
  };
  const deleteRecord = (index: number) => { setReviewData(reviewData.filter((_, i) => i !== index)); };
  const addNewRecord = () => { setReviewData([{ nisn: "", nama: "", status: "LULUS", tanggalLahir: "" }, ...reviewData]); };
  const isNisnValid = (nisn: string) => /^\d{10}$/.test(nisn);
  const isDateValid = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);

  const handleFinalSync = async () => {
    if (reviewData.length === 0) return toast.error("Data kosong.");
    const invalid = reviewData.filter(r => !isNisnValid(r.nisn) || !isDateValid(r.tanggalLahir) || !r.nama.trim());
    if (invalid.length > 0) return toast.error(`Ada ${invalid.length} data belum valid.`);
    const toastId = toast.loading("Sinkronisasi...");
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/upload-csv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reviewData) });
      const payload = await response.json();
      if (response.ok) { toast.success(payload.message, { id: toastId }); setShowReviewModal(false); fetchDbStudents(); }
      else { toast.error(payload.message, { id: toastId }); }
    } catch { toast.error("Gagal koneksi.", { id: toastId }); }
    finally { setIsLoading(false); }
  };

  async function handleSaveSettings(event: FormEvent) {
    event.preventDefault();
    const toastId = toast.loading("Menyimpan...");
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/admin/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ announcementDate, announcementMemo }) });
      if (res.ok) toast.success("Berhasil diupdate!", { id: toastId });
      else toast.error("Gagal simpan.", { id: toastId });
    } catch { toast.error("Error sistem.", { id: toastId }); }
    finally { setIsSavingSettings(false); }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <main className="flex min-h-screen bg-[#F8FAFC] font-sans selection:bg-primary/10 overflow-x-hidden">
      <Toaster position="top-right" />
      
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
            <button onClick={() => setActiveTab("tracer")} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${activeTab === 'tracer' ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-800'}`}><i className="ri-survey-fill text-lg" /> Tracer Study</button>
         </nav>
         <div className="mt-auto pt-8 border-t border-zinc-800">
            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all"><i className="ri-logout-box-r-line text-lg" /> Keluar Sistem</button>
         </div>
      </aside>

      <section className="flex-1 flex flex-col min-w-0 max-h-screen">
         <header className="flex h-16 md:h-20 shrink-0 items-center justify-between bg-white px-4 md:px-8 border-b border-zinc-200">
            <div className="flex items-center gap-3">
               <div className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-zinc-100 overflow-hidden p-1">
                  <Image src="/logo-smansa.jpg" alt="Logo" width={32} height={32} className="object-contain" />
               </div>
               <h2 className="text-sm md:text-lg font-black text-zinc-900 uppercase tracking-tight truncate">
                 {activeTab === 'portal' ? "Konfigurasi" : activeTab === 'database' ? "Data Management" : "Data Alumni (Tracer Study)"}
               </h2>
            </div>
            <Link href="/" className="h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-primary hover:text-white transition-all"><i className="ri-home-4-line text-lg" /></Link>
         </header>

         {/* Mobile Nav */}
         <div className="flex lg:hidden shrink-0 border-b border-zinc-200 bg-white p-1">
            <button onClick={() => setActiveTab("portal")} className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'portal' ? 'bg-primary/5 text-primary' : 'text-zinc-400'}`}><i className="ri-settings-4-fill text-lg" /><span className="text-[8px] font-bold uppercase tracking-widest mt-0.5">Portal</span></button>
            <button onClick={() => setActiveTab("database")} className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'database' ? 'bg-primary/5 text-primary' : 'text-zinc-400'}`}><i className="ri-database-2-fill text-lg" /><span className="text-[8px] font-bold uppercase tracking-widest mt-0.5">Database</span></button>
            <button onClick={() => setActiveTab("tracer")} className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'tracer' ? 'bg-primary/5 text-primary' : 'text-zinc-400'}`}><i className="ri-survey-fill text-lg" /><span className="text-[8px] font-bold uppercase tracking-widest mt-0.5">Tracer</span></button>
         </div>

         <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {activeTab === 'portal' && (
              <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
                 <div className="rounded-3xl bg-white p-6 md:p-10 shadow-sm border border-zinc-100">
                    <form onSubmit={handleSaveSettings} className="space-y-8">
                       <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-3">
                             <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest"><i className="ri-time-fill text-lg" /> Jadwal Pembukaan</div>
                             <input type="datetime-local" className="w-full rounded-2xl border border-zinc-200 p-4 font-bold text-zinc-900 focus:border-primary outline-none" value={announcementDate} onChange={(e) => setAnnouncementDate(e.target.value)} required />
                          </div>
                          <div className="space-y-3">
                             <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest"><i className="ri-notification-3-fill text-lg" /> Preview</div>
                             <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100"><p className="text-xs font-bold text-zinc-900 leading-tight">{mounted && announcementDate ? new Date(announcementDate).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) : 'Belum diatur'}</p></div>
                          </div>
                       </div>
                       <div className="space-y-4 pt-4 border-t border-zinc-100">
                          <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest"><i className="ri-article-fill text-lg" /> Memo Lanjutan</div>
                          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">{mounted && <><TiptapToolbar editor={editor} /><EditorContent editor={editor} /></>}</div>
                       </div>
                       <div className="flex justify-end"><button type="submit" disabled={isSavingSettings} className="w-full md:w-auto rounded-2xl bg-zinc-900 px-10 py-4 text-xs font-black text-white hover:bg-primary transition-all uppercase tracking-widest shadow-xl">Simpan Perubahan</button></div>
                    </form>
                 </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
                 <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl bg-white p-6 md:p-8 border border-zinc-100 space-y-4">
                       <h3 className="text-lg font-black text-zinc-900 uppercase">Impor Data</h3>
                       <p className="text-xs font-medium text-zinc-500 leading-relaxed">Gunakan format CSV/Excel untuk sinkronisasi massal.</p>
                       <a href="/templates/students-template.csv" download className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-[10px] font-black text-zinc-600 hover:bg-zinc-200 transition-all uppercase tracking-widest">Unduh Template</a>
                    </div>
                    <div className="rounded-3xl bg-zinc-900 p-6 md:p-8 flex flex-col items-center justify-center relative cursor-pointer group">
                       <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} className="absolute inset-0 z-10 cursor-pointer opacity-0" />
                       <i className="ri-upload-2-fill text-3xl text-zinc-600 group-hover:text-primary transition-colors" />
                       <p className="mt-2 text-xs font-black text-zinc-300 uppercase tracking-widest">Pilih File</p>
                    </div>
                 </div>

                 {/* Format Visual Guide */}
                 <div className="rounded-3xl bg-white p-6 md:p-8 border border-zinc-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">Panduan Format Kolom (CSV/Excel)</h4>
                    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                       <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                          <p className="text-[9px] font-black text-primary uppercase mb-1">nisn</p>
                          <p className="text-[10px] font-medium text-zinc-500">10 Digit Angka</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                          <p className="text-[9px] font-black text-primary uppercase mb-1">nama</p>
                          <p className="text-[10px] font-medium text-zinc-500">Nama Lengkap</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                          <p className="text-[9px] font-black text-primary uppercase mb-1">status</p>
                          <p className="text-[10px] font-medium text-zinc-500 leading-tight">LULUS / TIDAK LULUS</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                          <p className="text-[9px] font-black text-primary uppercase mb-1 text-nowrap">tanggalLahir</p>
                          <p className="text-[10px] font-medium text-zinc-500">YYYY-MM-DD</p>
                       </div>
                    </div>
                 </div>

                 <div className="rounded-3xl bg-white shadow-sm border border-zinc-100 overflow-hidden">
                    <div className="p-5 md:p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <div className="flex items-center gap-3">
                          <h3 className="font-black text-zinc-900 uppercase text-sm md:text-lg">Database Siswa</h3>
                          {dbStudents.length > 0 && <button onClick={handleDeleteAllDb} className="rounded-lg bg-red-50 px-3 py-1.5 text-[9px] font-black text-red-500 hover:bg-red-500 hover:text-white transition-all">Hapus Semua</button>}
                       </div>
                       <div className="flex flex-col sm:flex-row gap-2">
                          <button onClick={() => setIsAddingManual(true)} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[10px] font-black text-white hover:bg-zinc-900 transition-all shadow-lg shadow-primary/20"><i className="ri-add-line" /> Tambah Siswa</button>
                          <div className="relative">
                             <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm" />
                             <input type="text" placeholder="Cari..." className="w-full sm:w-64 rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2 text-sm font-bold text-zinc-700 focus:bg-white outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                          </div>
                       </div>
                    </div>

                    <div className="overflow-x-auto">
                       <table className="w-full min-w-[700px]">
                          <thead>
                             <tr className="bg-zinc-50 text-[9px] font-black uppercase text-zinc-400 border-b border-zinc-100">
                                <th className="px-6 py-4 text-left">Nama</th>
                                <th className="px-6 py-4 text-left">NISN</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-left">Tgl Lahir</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                             {isAddingManual && (
                               <tr className="bg-primary/5 animate-in slide-in-from-top-1 duration-200">
                                  <td className="px-4 py-2"><input value={newManualForm.nama} onChange={(e) => setNewManualForm({...newManualForm, nama: e.target.value.toUpperCase()})} className="w-full rounded-lg border border-zinc-200 p-2 text-xs font-black outline-none" placeholder="NAMA" /></td>
                                  <td className="px-4 py-2"><input value={newManualForm.nisn} onChange={(e) => setNewManualForm({...newManualForm, nisn: e.target.value.replace(/\D/g, "").slice(0, 10)})} className="w-full rounded-lg border border-zinc-200 p-2 text-xs font-bold outline-none" placeholder="NISN" /></td>
                                  <td className="px-4 py-2"><select value={newManualForm.status} onChange={(e) => setNewManualForm({...newManualForm, status: e.target.value as StudentRecord["status"]})} className="w-full rounded-lg border border-zinc-200 p-2 text-[10px] font-black outline-none"><option value="LULUS">LULUS</option><option value="TIDAK LULUS">TIDAK LULUS</option></select></td>
                                  <td className="px-4 py-2"><input type="date" value={newManualForm.tanggalLahir} onChange={(e) => setNewManualForm({...newManualForm, tanggalLahir: e.target.value})} className="w-full rounded-lg border border-zinc-200 p-2 text-xs font-bold outline-none" /></td>
                                  <td className="px-4 py-2 text-center"><div className="flex justify-center gap-1"><button onClick={handleSaveNewManual} className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center"><i className="ri-save-line" /></button><button onClick={() => { setIsAddingManual(false); setNewManualForm({ nisn: "", nama: "", status: "LULUS", tanggalLahir: "" }); }} className="h-8 w-8 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center"><i className="ri-close-line" /></button></div></td>
                               </tr>
                             )}
                             {isFetchingDb ? (<tr><td colSpan={5} className="py-20 text-center"><i className="ri-loader-4-line animate-spin text-4xl text-zinc-200" /></td></tr>) : dbStudents.length === 0 ? (<tr><td colSpan={5} className="py-20 text-center text-zinc-400 font-bold uppercase text-xs">Kosong</td></tr>) : (() => {
                                const filtered = dbStudents.filter(s => s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.nisn.includes(searchQuery));
                                const displayed = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                                return displayed.map((student) => {
                                   const isEditing = editingId === student._id;
                                   return (
                                   <tr key={student._id} className="hover:bg-zinc-50 transition-colors">
                                      <td className="px-6 py-4 font-black text-zinc-800 text-xs uppercase">{isEditing ? <input value={editForm?.nama} onChange={(e) => setEditForm(prev => prev ? {...prev, nama: e.target.value.toUpperCase()} : null)} className="w-full rounded-lg border border-zinc-200 p-1.5 outline-none" /> : student.nama}</td>
                                      <td className="px-6 py-4 font-bold text-zinc-500 text-xs tabular-nums">{isEditing ? <input value={editForm?.nisn} onChange={(e) => setEditForm(prev => prev ? {...prev, nisn: e.target.value.replace(/\D/g, "").slice(0, 10)} : null)} className="w-full rounded-lg border border-zinc-200 p-1.5 outline-none" /> : student.nisn}</td>
                                      <td className="px-6 py-4">{isEditing ? (<select value={editForm?.status} onChange={(e) => setEditForm(prev => prev ? {...prev, status: e.target.value as StudentRecord["status"]} : null)} className="w-full rounded-lg border border-zinc-200 p-1.5 text-[10px] font-black outline-none"><option value="LULUS">LULUS</option><option value="TIDAK LULUS">TIDAK LULUS</option></select>) : (<span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${student.status === 'LULUS' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{student.status}</span>)}</td>
                                      <td className="px-6 py-4 font-bold text-zinc-500 text-xs tabular-nums">{isEditing ? <input type="date" value={editForm?.tanggalLahir} onChange={(e) => setEditForm(prev => prev ? {...prev, tanggalLahir: e.target.value} : null)} className="w-full rounded-lg border border-zinc-200 p-1.5 outline-none" /> : student.tanggalLahir}</td>
                                      <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-1">{isEditing ? (<><button onClick={handleUpdateStudent} disabled={isSavingRow} className="h-7 w-7 rounded-lg bg-primary text-white flex items-center justify-center"><i className="ri-check-line" /></button><button onClick={cancelEditing} className="h-7 w-7 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center"><i className="ri-close-line" /></button></>) : (<><button onClick={() => startEditing(student)} className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center"><i className="ri-edit-2-line" /></button><button onClick={() => handleDeleteStudent(student._id!, student.nama)} className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"><i className="ri-delete-bin-6-line" /></button></>)}</div></td>
                                   </tr>
                                   );
                                });
                             })()}
                          </tbody>
                       </table>
                    </div>

                    <div className="p-5 border-t border-zinc-100 bg-zinc-50/30">
                       {(() => {
                          const filteredCount = dbStudents.filter(s => s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.nisn.includes(searchQuery)).length;
                          const totalPages = Math.ceil(filteredCount / itemsPerPage);
                          if (filteredCount <= itemsPerPage) return null;
                          return (
                             <div className="flex items-center justify-between gap-4">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase">Halaman {currentPage} / {totalPages}</p>
                                <div className="flex gap-2">
                                   <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-9 w-9 rounded-xl bg-white border border-zinc-200 text-zinc-400 disabled:opacity-30 flex items-center justify-center"><i className="ri-arrow-left-s-line text-xl" /></button>
                                   <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage >= totalPages} className="h-9 w-9 rounded-xl bg-white border border-zinc-200 text-zinc-400 disabled:opacity-30 flex items-center justify-center"><i className="ri-arrow-right-s-line text-xl" /></button>
                                </div>
                             </div>
                          );
                       })()}
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'tracer' && (
              <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
                 <div className="rounded-3xl bg-white shadow-sm border border-zinc-100 overflow-hidden">
                    <div className="p-5 md:p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/50 to-white">
                       <div className="flex flex-col gap-1">
                          <h3 className="font-black text-emerald-900 uppercase text-sm md:text-lg flex items-center gap-2">
                             <i className="ri-survey-fill text-emerald-500" />
                             Data Tracer Study
                          </h3>
                          <p className="text-[10px] md:text-xs text-emerald-700/80 font-medium">Rekapitulasi rencana alumni setelah kelulusan.</p>
                       </div>
                       <div className="flex flex-col sm:flex-row gap-2">
                          <button onClick={handleExportTracer} disabled={isExporting} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-[10px] font-black text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                             {isExporting ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-file-excel-2-fill" />}
                             Ekspor Excel
                          </button>
                          <div className="relative">
                             <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm" />
                             <input type="text" placeholder="Cari nama / NISN..." className="w-full sm:w-64 rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2 text-sm font-bold text-zinc-700 focus:border-emerald-300 outline-none" value={tracerSearch} onChange={(e) => { setTracerSearch(e.target.value); setTracerPage(1); }} />
                          </div>
                       </div>
                    </div>

                    <div className="overflow-x-auto">
                       <table className="w-full min-w-[900px]">
                          <thead>
                             <tr className="bg-zinc-50 text-[9px] font-black uppercase text-zinc-400 border-b border-zinc-100">
                                <th className="px-6 py-4 text-left">Nama & NISN</th>
                                <th className="px-6 py-4 text-left">Jalur</th>
                                <th className="px-6 py-4 text-left">Angkatan</th>
                                <th className="px-6 py-4 text-left">Tgl Submit</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                             {tracerLoading ? (<tr><td colSpan={5} className="py-20 text-center"><i className="ri-loader-4-line animate-spin text-4xl text-emerald-500/30" /></td></tr>) : tracerData.length === 0 ? (<tr><td colSpan={5} className="py-20 text-center text-zinc-400 font-bold uppercase text-xs">Data tidak ditemukan</td></tr>) : (
                                tracerData.map((item) => {
                                   const isExpanded = expandedTracerRow === item._id;
                                   return (
                                      <tr key={item._id} className={`hover:bg-zinc-50 transition-colors group cursor-pointer ${isExpanded ? 'bg-zinc-50' : ''}`} onClick={() => setExpandedTracerRow(isExpanded ? null : item._id)}>
                                         <td className="px-6 py-4">
                                            <div className="font-black text-zinc-800 text-xs uppercase">{item.nama}</div>
                                            <div className="text-[10px] font-bold text-zinc-400 tabular-nums mt-0.5">{item.nisn}</div>
                                         </td>
                                         <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                                              item.path === 'LANJUT_STUDI' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                              item.path === 'BEKERJA'      ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                                             'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                            }`}>
                                              <i className={
                                                item.path === 'LANJUT_STUDI' ? "ri-graduation-cap-fill" :
                                                item.path === 'BEKERJA'      ? "ri-briefcase-fill"      :
                                                                               "ri-pause-circle-fill"
                                              } />
                                              {item.path === 'LANJUT_STUDI' ? "Lanjut Studi" : item.path === 'BEKERJA' ? "Bekerja" : "Tidak Bekerja"}
                                            </span>
                                         </td>
                                         <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-zinc-600 tabular-nums">{item.tahunMasuk} - {item.tahunLulus}</div>
                                         </td>
                                         <td className="px-6 py-4">
                                            <div className="text-[10px] font-bold text-zinc-500 uppercase">{new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                         </td>
                                         <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                               <button onClick={(e) => { e.stopPropagation(); setExpandedTracerRow(isExpanded ? null : item._id); }} className={`h-8 w-8 rounded-lg transition-all flex items-center justify-center ${isExpanded ? 'bg-zinc-200 text-zinc-600' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}`}>
                                                  <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-lg`} />
                                               </button>
                                               <button onClick={(e) => { e.stopPropagation(); handleDeleteTracer(item._id, item.nama); }} className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center">
                                                  <i className="ri-delete-bin-6-line" />
                                               </button>
                                            </div>
                                         </td>
                                      </tr>
                                   );
                                })
                             )}
                          </tbody>
                       </table>
                       
                       {/* Render expanded details inline with absolute positioning trick or just inline block */}
                       {tracerData.map(item => {
                          if (expandedTracerRow !== item._id) return null;
                          return (
                             <div key={`${item._id}-detail`} className="w-full border-b border-zinc-100 bg-white px-6 py-5 shadow-inner">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                                   <div className="space-y-3">
                                      <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Kontak</h5>
                                      <div className="space-y-1">
                                         <div className="text-xs font-medium text-zinc-600"><i className="ri-phone-fill text-zinc-400 mr-2 w-4 inline-block text-center" /> {item.noHp}</div>
                                         <div className="text-xs font-medium text-zinc-600"><i className="ri-whatsapp-fill text-emerald-500 mr-2 w-4 inline-block text-center" /> {item.noWa}</div>
                                         <div className="text-xs font-medium text-zinc-600"><i className="ri-mail-fill text-zinc-400 mr-2 w-4 inline-block text-center" /> {item.email}</div>
                                      </div>
                                   </div>
                                   <div className="space-y-3">
                                      <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Detail Jalur</h5>
                                      {item.path === 'LANJUT_STUDI' ? (
                                         <div className="space-y-1">
                                            <div className="text-xs font-medium text-zinc-600"><i className="ri-building-4-fill text-zinc-400 mr-2 w-4 inline-block text-center" /> {item.universitas || "-"}</div>
                                            <div className="text-xs font-medium text-zinc-600"><i className="ri-book-open-fill text-zinc-400 mr-2 w-4 inline-block text-center" /> {item.jurusan || "-"}</div>
                                         </div>
                                      ) : item.path === 'BEKERJA' ? (
                                         <div className="space-y-1">
                                            <div className="text-xs font-medium text-zinc-600"><i className="ri-building-4-fill text-zinc-400 mr-2 w-4 inline-block text-center" /> {item.perusahaan || "-"}</div>
                                            <div className="text-xs font-medium text-zinc-600"><i className="ri-user-star-fill text-zinc-400 mr-2 w-4 inline-block text-center" /> {item.jabatan || "-"}</div>
                                         </div>
                                      ) : (
                                         <div className="text-xs font-medium text-zinc-600 whitespace-pre-wrap"><i className="ri-chat-quote-fill text-zinc-400 mr-2 w-4 inline-block align-top text-center" /> <span>{item.alasan || "-"}</span></div>
                                      )}
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                    </div>

                    {tracerTotal > 1 && (
                       <div className="p-5 border-t border-zinc-100 bg-zinc-50/30">
                          <div className="flex items-center justify-between gap-4">
                             <p className="text-[10px] font-bold text-zinc-400 uppercase">Halaman {tracerPage} / {tracerTotal}</p>
                             <div className="flex gap-2">
                                <button onClick={() => setTracerPage(prev => Math.max(1, prev - 1))} disabled={tracerPage === 1} className="h-9 w-9 rounded-xl bg-white border border-zinc-200 text-zinc-400 disabled:opacity-30 flex items-center justify-center"><i className="ri-arrow-left-s-line text-xl" /></button>
                                <button onClick={() => setTracerPage(prev => prev + 1)} disabled={tracerPage >= tracerTotal} className="h-9 w-9 rounded-xl bg-white border border-zinc-200 text-zinc-400 disabled:opacity-30 flex items-center justify-center"><i className="ri-arrow-right-s-line text-xl" /></button>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
            )}
         </div>
      </section>

      {/* REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/90 backdrop-blur-md p-2 md:p-10">
           <div className="flex h-full max-h-[90vh] w-full max-w-6xl flex-col rounded-[2.5rem] bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="flex shrink-0 flex-col md:flex-row md:items-center justify-between border-b border-zinc-100 bg-white px-6 py-6 md:px-10 md:py-8 gap-4">
                 <div>
                    <h2 className="text-xl md:text-2xl font-black text-zinc-900 uppercase">Review Data</h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Total {reviewData.length} data</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <button onClick={addNewRecord} className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all uppercase tracking-widest"><i className="ri-add-line text-lg" /> Tambah Baris</button>
                    <button onClick={() => setShowReviewModal(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-400 hover:text-red-500 transition-colors"><i className="ri-close-line text-2xl" /></button>
                 </div>
              </div>

              <div className="flex-1 overflow-auto p-4 md:p-10 bg-zinc-50/30 custom-scrollbar">
                 <table className="w-full border-separate border-spacing-y-2">
                    <thead>
                       <tr className="text-[10px] font-black uppercase text-zinc-400">
                          <th className="px-6 pb-2 text-left">Nama</th>
                          <th className="px-6 pb-2 text-left">NISN</th>
                          <th className="px-6 pb-2 text-left">Status</th>
                          <th className="px-6 pb-2 text-left">Tanggal Lahir</th>
                          <th className="w-14"></th>
                       </tr>
                    </thead>
                    <tbody>
                       {reviewData.map((student, idx) => (
                          <tr key={idx} className="group">
                             <td className="bg-white p-2 rounded-l-2xl border-y border-l border-zinc-100 shadow-sm"><input value={student.nama} onChange={(e) => updateRecord(idx, 'nama', e.target.value)} placeholder="NAMA" className="w-full bg-transparent px-3 py-2 font-bold text-zinc-800 outline-none text-xs uppercase" /></td>
                             <td className="bg-white p-2 border-y border-zinc-100 shadow-sm"><input value={student.nisn} onChange={(e) => updateRecord(idx, 'nisn', e.target.value.replace(/\D/g, "").slice(0,10))} placeholder="NISN" className="w-full bg-transparent px-3 py-2 font-bold text-zinc-600 outline-none text-xs" /></td>
                             <td className="bg-white p-2 border-y border-zinc-100 shadow-sm"><select value={student.status} onChange={(e) => updateRecord(idx, "status", e.target.value as StudentRecord["status"])} className="w-full rounded-xl bg-zinc-50 px-3 py-1.5 text-[10px] font-black uppercase outline-none"><option value="LULUS">LULUS</option><option value="TIDAK LULUS">TIDAK LULUS</option></select></td>
                             <td className="bg-white p-2 border-y border-zinc-100 shadow-sm"><input type="date" value={student.tanggalLahir} onChange={(e) => updateRecord(idx, 'tanggalLahir', e.target.value)} className="w-full bg-zinc-50 px-3 py-2 rounded-xl outline-none text-xs font-bold" /></td>
                             <td className="bg-white p-2 rounded-r-2xl border-y border-r border-zinc-100 shadow-sm text-center"><button onClick={() => deleteRecord(idx)} className="text-zinc-300 hover:text-red-500 transition-all"><i className="ri-delete-bin-6-line text-lg" /></button></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              <div className="shrink-0 flex flex-col md:flex-row items-center justify-between border-t border-zinc-100 bg-zinc-50 px-6 py-6 md:px-10 md:py-8 gap-6">
                 <div className="text-center md:text-left">
                    <p className="text-xs font-black text-zinc-900 uppercase tracking-widest">Siap Disinkronkan</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1">Pastikan data sudah benar</p>
                 </div>
                 <div className="flex w-full md:w-auto gap-4">
                    <button onClick={() => setShowReviewModal(false)} className="flex-1 md:flex-none px-6 text-xs font-black text-zinc-400 uppercase hover:text-zinc-600">Batal</button>
                    <button onClick={handleFinalSync} disabled={isLoading} className="flex-1 md:flex-none inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-10 py-4 text-xs font-black text-white shadow-2xl hover:bg-zinc-900 transition-all active:scale-95 disabled:opacity-50">
                       {isLoading ? <i className="ri-loader-4-line animate-spin text-lg" /> : <i className="ri-checkbox-circle-fill text-lg" />}
                       <span>SINKRONKAN DATA</span>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500"><i className="ri-error-warning-line text-4xl" /></div>
              <div className="text-center space-y-3">
                 <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Konfirmasi Hapus</h2>
                 <p className="text-sm font-medium text-zinc-500 leading-relaxed">{deleteTarget?.type === 'all' ? "Hapus SELURUH data? Tindakan ini permanen." : <>Hapus data {deleteTarget?.type === 'tracer' ? 'tracer study' : 'siswa'} <span className="font-black text-zinc-900">&quot;{deleteTarget?.name}&quot;</span>?</>}</p>
              </div>
              <div className="mt-10 flex flex-col gap-3">
                 <button onClick={confirmDelete} className="w-full rounded-2xl bg-red-500 py-4 text-xs font-black text-white shadow-xl hover:bg-red-600 transition-all active:scale-95">YA, HAPUS</button>
                 <button onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }} className="w-full rounded-2xl bg-zinc-100 py-4 text-xs font-black text-zinc-500 hover:bg-zinc-200 transition-all uppercase tracking-widest">BATALKAN</button>
              </div>
           </div>
        </div>
      )}
    </main>
  );
}
