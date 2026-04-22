import { checkRateLimit } from "@/lib/rate-limit";
import { isCookieTokenValid } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { getStudentModel } from "@/models/student";

export async function POST(request: Request) {
  const isAuthenticated = await isCookieTokenValid(request.headers.get("cookie"));
  if (!isAuthenticated) {
    return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const rateLimit = checkRateLimit(`admin-upload:${ipAddress}`);

  if (!rateLimit.allowed) {
    return Response.json({ message: "Terlalu banyak percobaan. Tunggu sebentar." }, { status: 429 });
  }

  try {
    const records = await request.json();

    if (!Array.isArray(records) || records.length === 0) {
      return Response.json({ message: "Data tidak valid atau kosong." }, { status: 400 });
    }

    await connectToDatabase();
    const Student = getStudentModel();

    try {
      // BERSINKRONISASI
      await Student.deleteMany({});
      const result = await Student.insertMany(records, { ordered: true });

      return Response.json({ 
        message: `Sinkronisasi Berhasil! ${result.length} data siswa telah diperbarui.`,
        count: result.length
      }, { status: 200 });

    } catch (dbError: unknown) {
      if (dbError && typeof dbError === 'object' && 'code' in dbError && dbError.code === 11000) {
        return Response.json({ 
          message: "Gagal: Terdapat NISN ganda. Pastikan satu NISN unik untuk satu siswa." 
        }, { status: 400 });
      }
      const message = dbError instanceof Error ? dbError.message : "Unknown database error";
      return Response.json({ message: `Database Error: ${message}` }, { status: 400 });
    }

  } catch {
    return Response.json({ message: "Gagal memproses permintaan data." }, { status: 500 });
  }
}
