import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { findStudentResultByNisnAndBirthDate } from "@/lib/student-repository";
import { findTracerStudyByNisn } from "@/lib/tracer-study-repository";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const { allowed, retryAfterMs } = checkRateLimit(`tracer-verify:${ip}`);

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Terlalu banyak permintaan.",
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
    const { nisn, tanggalLahir } = body;

    if (!nisn || !tanggalLahir) {
      return NextResponse.json(
        { error: "Data tidak lengkap." },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(nisn)) {
      return NextResponse.json(
        { error: "NISN tidak valid." },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahir)) {
      return NextResponse.json(
        { error: "Format tanggal lahir tidak valid." },
        { status: 400 }
      );
    }

    const student = await findStudentResultByNisnAndBirthDate(nisn, tanggalLahir);

    if (!student) {
      return NextResponse.json(
        { error: "Data siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    if (student.status !== "LULUS") {
      return NextResponse.json(
        { error: "Siswa dengan status ini tidak dapat mengisi tracer study." },
        { status: 403 }
      );
    }

    const existing = await findTracerStudyByNisn(nisn);

    return NextResponse.json({ student, existing });
  } catch (error: unknown) {
    console.error("API Verify Error:", error);
    return NextResponse.json(
      { error: `Terjadi kesalahan sistem: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
