import mongoose, { Model, Schema } from "mongoose";

export const STUDENT_STATUS = ["LULUS", "TIDAK LULUS"] as const;
export type StudentStatus = (typeof STUDENT_STATUS)[number];

export type StudentDocument = {
  nisn: string;
  nama: string;
  status: StudentStatus;
  tanggalLahir: string;
};

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const studentSchema = new Schema<StudentDocument>(
  {
    nisn: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, "NISN harus 10 digit angka."],
    },
    nama: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: STUDENT_STATUS },
    tanggalLahir: {
      type: String,
      required: true,
      trim: true,
      match: [dateRegex, "Format tanggalLahir harus YYYY-MM-DD."],
    },
  },
  { versionKey: false },
);

studentSchema.index({ nisn: 1, tanggalLahir: 1 }, { unique: true });

export function getStudentModel(): Model<StudentDocument> {
  const collectionName = process.env.MONGODB_COLLECTION || "students";
  
  // Next.js hot-reloading seringkali menyimpan cache model lama.
  // Kita paksa hapus model lama dari cache mongoose jika sudah ada,
  // agar menggunakan schema baru yang sudah kita update.
  if (mongoose.models.Student) {
    delete mongoose.models.Student;
  }
  
  return mongoose.model<StudentDocument>("Student", studentSchema, collectionName);
}
