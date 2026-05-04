import { connectToDatabase } from "@/lib/mongoose";
import { getConfigModel } from "@/models/config";
import { normalizeWitaDateString } from "@/lib/datetime";

export async function GET() {
  try {
    await connectToDatabase();
    const Config = getConfigModel();
    const configs = await Config.find({}).lean();
    
    // Convert array to object key-value
    const configMap = configs.reduce((acc: Record<string, string>, curr) => {
      const doc = curr as { key: string; value: string };
      acc[doc.key] = doc.value;
      return acc;
    }, {});

    return Response.json({
      announcementDate: normalizeWitaDateString(
        configMap.announcementDate || "2000-01-01T00:00:00+08:00"
      ),
      announcementMemo: configMap.announcementMemo || "Informasi selanjutnya akan diumumkan melalui wali kelas.",
    }, { status: 200 });
  } catch {
    return Response.json({ message: "Failed to fetch config" }, { status: 500 });
  }
}
