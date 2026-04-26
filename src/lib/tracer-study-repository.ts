import { connectToDatabase } from "@/lib/mongoose";
import { getTracerStudyModel, TracerStudyDocument } from "@/models/tracer-study";

export async function upsertTracerStudy(
  data: Partial<TracerStudyDocument> & { nisn: string }
) {
  await connectToDatabase();
  const TracerStudy = getTracerStudyModel();

  return await TracerStudy.findOneAndUpdate(
    { nisn: data.nisn },
    { $set: data },
    { upsert: true, runValidators: true, new: true, setDefaultsOnInsert: true }
  )
    .lean()
    .exec();
}

export async function findTracerStudyByNisn(nisn: string) {
  await connectToDatabase();
  const TracerStudy = getTracerStudyModel();

  return await TracerStudy.findOne({ nisn }).lean().exec();
}

export async function listTracerStudies(page: number = 1, limit: number = 10, search: string = "") {
  await connectToDatabase();
  const TracerStudy = getTracerStudyModel();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (search) {
    // Search by nama (case-insensitive) OR prefix on nisn
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { nama: { $regex: safeSearch, $options: "i" } },
      { nisn: { $regex: `^${safeSearch}` } }
    ];
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    TracerStudy.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
    TracerStudy.countDocuments(query).exec()
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export async function deleteTracerStudy(id: string) {
  await connectToDatabase();
  const TracerStudy = getTracerStudyModel();

  return await TracerStudy.findByIdAndDelete(id).exec();
}

export async function findAllForExport() {
  await connectToDatabase();
  const TracerStudy = getTracerStudyModel();

  return await TracerStudy.find({}).sort({ createdAt: -1 }).lean().exec();
}
