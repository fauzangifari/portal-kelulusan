import { checkRateLimit } from "@/lib/rate-limit";
import { findStudentResultByNisnAndBirthDate } from "@/lib/student-repository";
import { connectToDatabase } from "@/lib/mongoose";
import { getConfigModel } from "@/models/config";

type RequestBody = {
  nisn?: string;
  tanggalLahir?: string;
};

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return false;
  }
  const parsed = new Date(timestamp).toISOString().slice(0, 10);
  if (parsed !== value) {
    return false;
  }
  return timestamp <= Date.now();
}

export async function POST(request: Request) {
  await connectToDatabase();
  const Config = getConfigModel();
  
  // Ambil config dinamis dari database
  const configData = await Config.findOne({ key: "announcementDate" }).lean();
  const announcementDateStr = configData?.value || "2026-05-04T00:00:00+07:00";
  const announcementStartDate = new Date(announcementDateStr);

  // Cek apakah waktu pengumuman sudah tiba
  if (Date.now() < announcementStartDate.getTime()) {
    return Response.json(
      { message: "Pengecekan hasil kelulusan belum dibuka." },
      { status: 403 },
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const rateLimit = checkRateLimit(ipAddress);

  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.ceil((rateLimit.retryAfterMs || 0) / 1000);
    return Response.json(
      { message: "Terlalu banyak percobaan. Coba lagi sebentar." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      },
    );
  }

  const body = (await request.json()) as RequestBody;
  const nisn = body.nisn?.trim();
  const tanggalLahir = body.tanggalLahir?.trim();

  if (!nisn || !tanggalLahir) {
    return Response.json(
      { message: "NISN dan tanggal lahir wajib diisi." },
      { status: 400 },
    );
  }

  if (!/^\d{10}$/.test(nisn)) {
    return Response.json(
      { message: "NISN harus 10 digit angka." },
      { status: 400 },
    );
  }

  if (!isValidDateString(tanggalLahir)) {
    return Response.json(
      { message: "Tanggal lahir tidak valid." },
      { status: 400 },
    );
  }

  const student = await findStudentResultByNisnAndBirthDate(nisn, tanggalLahir);

  if (!student) {
    return Response.json(
      { message: "Data tidak ditemukan. Periksa NISN dan tanggal lahir." },
      { status: 404 },
    );
  }

  return Response.json(student, { status: 200 });
}
