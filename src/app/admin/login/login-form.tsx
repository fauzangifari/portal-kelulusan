"use client";

import { FormEvent, useState } from "react";

type AdminLoginFormProps = {
  isSessionExpired: boolean;
};

export default function AdminLoginForm({ isSessionExpired }: AdminLoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(payload.message || "Autentikasi belum berhasil.");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("Layanan sedang tidak tersedia. Silakan coba kembali.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
            <i className="ri-shield-keyhole-line text-3xl" />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Akses Admin</h1>
          <p className="mt-2 text-sm text-zinc-500 font-medium">Masuk untuk mengelola data kelulusan</p>
        </div>

        <div className="card-official p-8">
          {isSessionExpired && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-700">
              <i className="ri-error-warning-line text-base" />
              Sesi berakhir. Silakan login kembali.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">Username</label>
              <div className="relative">
                <i className="ri-user-line absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Masukkan username"
                  className="input-field pl-11"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">Password</label>
              <div className="relative">
                <i className="ri-lock-line absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-field pl-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
                <i className="ri-error-warning-line text-lg" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <i className="ri-loader-4-line animate-spin text-xl" />
              ) : (
                <i className="ri-login-box-line text-xl" />
              )}
              {isLoading ? "Memverifikasi..." : "Masuk ke Panel"}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
          &copy; 2026 SMA NEGERI 1 SAMARINDA
        </p>
      </div>
    </main>
  );
}
