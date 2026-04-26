import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { findStudentResultByNisnAndBirthDate } from "@/lib/student-repository";
import { upsertTracerStudy } from "@/lib/tracer-study-repository";
import { TRACER_PATHS } from "@/models/tracer-study";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const { allowed, retryAfterMs } = checkRateLimit(`tracer-submit:${ip}`);

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Terlalu banyak permintaan. Silakan coba beberapa saat lagi.",
        retryAfterMs,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((retryAfterMs || 0) / 1000)),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { nisn, tanggalLahir, tahunMasuk, tahunLulus, noHp, noWa, email, path, universitas, jurusan, perusahaan, jabatan } = body;

    if (!nisn || !tanggalLahir) {
      return NextResponse.json(
        { error: "NISN dan tanggal lahir wajib diisi untuk verifikasi." },
        { status: 400 }
      );
    }

    // Server-side validation
    if (!/^\d{10,15}$/.test(noHp)) {
      return NextResponse.json({ error: "Nomor HP tidak valid." }, { status: 400 });
    }
    if (!/^\d{10,15}$/.test(noWa)) {
      return NextResponse.json({ error: "Nomor WA tidak valid." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }
    if (tahunMasuk >= tahunLulus) {
      return NextResponse.json({ error: "Tahun masuk harus lebih kecil dari tahun lulus." }, { status: 400 });
    }
    if (!TRACER_PATHS.includes(path)) {
      return NextResponse.json({ error: "Jalur pilihan tidak valid." }, { status: 400 });
    }
    
    if (path === "LANJUT_STUDI") {
      if (!universitas || universitas.length < 2) return NextResponse.json({ error: "Nama universitas minimal 2 karakter." }, { status: 400 });
      if (!jurusan || jurusan.length < 2) return NextResponse.json({ error: "Nama jurusan minimal 2 karakter." }, { status: 400 });
    } else if (path === "BEKERJA") {
      if (!perusahaan || perusahaan.length < 2) return NextResponse.json({ error: "Nama perusahaan minimal 2 karakter." }, { status: 400 });
      if (!jabatan || jabatan.length < 2) return NextResponse.json({ error: "Nama jabatan minimal 2 karakter." }, { status: 400 });
    }

    // Verification step
    const student = await findStudentResultByNisnAndBirthDate(nisn, tanggalLahir);

    if (!student) {
      return NextResponse.json(
        { error: "Data siswa tidak ditemukan atau tidak cocok." },
        { status: 404 }
      );
    }

    if (student.status !== "LULUS") {
      return NextResponse.json(
        { error: "Hanya siswa lulus yang dapat mengisi tracer study." },
        { status: 403 }
      );
    }

    // Submit data
    const tracerData = {
      nisn,
      nama: student.nama, // Ensure the name from DB is saved
      tahunMasuk,
      tahunLulus,
      noHp,
      noWa,
      email: email.toLowerCase(),
      path,
      universitas: path === "LANJUT_STUDI" ? universitas : undefined,
      jurusan: path === "LANJUT_STUDI" ? jurusan : undefined,
      perusahaan: path === "BEKERJA" ? perusahaan : undefined,
      jabatan: path === "BEKERJA" ? jabatan : undefined,
    };

    const result = await upsertTracerStudy(tracerData);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error("API Submit Error:", error);
    
    // Check for validation errors
    if (typeof error === "object" && error !== null && "name" in error && (error as Error).name === 'ValidationError') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages = Object.values((error as any).errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: messages.join(", ") },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem saat menyimpan data." },
      { status: 500 }
    );
  }
}
