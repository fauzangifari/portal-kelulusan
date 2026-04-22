import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import "remixicon/fonts/remixicon.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal Pengumuman Kelulusan | SMA Negeri 1 Samarinda",
  description:
    "Akses resmi pengumuman kelulusan siswa SMA Negeri 1 Samarinda Tahun Ajaran 2025/2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans selection:bg-[#0056A3]/10 selection:text-[#0056A3]">
        {children}
      </body>
    </html>
  );
}
