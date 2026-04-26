import mongoose, { Model, Schema } from "mongoose";

export const TRACER_PATHS = ["LANJUT_STUDI", "BEKERJA"] as const;
export type TracerPath = (typeof TRACER_PATHS)[number];

export type TracerStudyDocument = {
  nisn: string;
  nama: string;
  tahunMasuk: number;
  tahunLulus: number;
  noHp: string;
  noWa: string;
  email: string;
  path: TracerPath;
  universitas?: string;
  jurusan?: string;
  perusahaan?: string;
  jabatan?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const tracerStudySchema = new Schema<TracerStudyDocument>(
  {
    nisn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{10}$/, "NISN harus 10 digit angka."],
    },
    nama: { type: String, required: true, trim: true },
    tahunMasuk: { type: Number, required: true, min: 2000, max: 2100 },
    tahunLulus: { type: Number, required: true, min: 2000, max: 2100 },
    noHp: {
      type: String,
      required: true,
      match: [/^\d{10,15}$/, "No HP harus 10-15 digit angka."],
    },
    noWa: {
      type: String,
      required: true,
      match: [/^\d{10,15}$/, "No WA harus 10-15 digit angka."],
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Format email tidak valid."],
    },
    path: { type: String, required: true, enum: TRACER_PATHS },
    universitas: { type: String, trim: true },
    jurusan: { type: String, trim: true },
    perusahaan: { type: String, trim: true },
    jabatan: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false }
);

tracerStudySchema.pre("validate", function (next) {
  if (this.tahunMasuk >= this.tahunLulus) {
    this.invalidate(
      "tahunMasuk",
      "Tahun masuk harus lebih kecil dari tahun lulus."
    );
  }
  if (this.path === "LANJUT_STUDI") {
    if (!this.universitas || this.universitas.length < 2) {
      this.invalidate("universitas", "Nama universitas minimal 2 karakter.");
    }
    if (!this.jurusan || this.jurusan.length < 2) {
      this.invalidate("jurusan", "Nama jurusan minimal 2 karakter.");
    }
  } else if (this.path === "BEKERJA") {
    if (!this.perusahaan || this.perusahaan.length < 2) {
      this.invalidate("perusahaan", "Nama perusahaan minimal 2 karakter.");
    }
    if (!this.jabatan || this.jabatan.length < 2) {
      this.invalidate("jabatan", "Nama jabatan minimal 2 karakter.");
    }
  }
  next();
});

export function getTracerStudyModel(): Model<TracerStudyDocument> {
  const collectionName = "tracer_studies";
  if (mongoose.models.TracerStudy) {
    delete mongoose.models.TracerStudy;
  }
  return mongoose.model<TracerStudyDocument>(
    "TracerStudy",
    tracerStudySchema,
    collectionName
  );
}
