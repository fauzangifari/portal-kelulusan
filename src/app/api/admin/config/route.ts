import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongoose";
import { getConfigModel } from "@/models/config";
import { isAdminSessionTokenValid, ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    const isValid = await isAdminSessionTokenValid(token || null);

    if (!isValid) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { announcementDate, announcementMemo } = body;

    await connectToDatabase();
    const Config = getConfigModel();

    if (announcementDate) {
      await Config.findOneAndUpdate(
        { key: "announcementDate" },
        { value: announcementDate },
        { upsert: true }
      );
    }

    if (announcementMemo) {
      await Config.findOneAndUpdate(
        { key: "announcementMemo" },
        { value: announcementMemo },
        { upsert: true }
      );
    }

    return Response.json({ message: "Konfigurasi berhasil disimpan." }, { status: 200 });
  } catch {
    return Response.json({ message: "Terjadi kesalahan saat menyimpan data." }, { status: 500 });
  }
}
