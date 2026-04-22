import { connectToDatabase } from "@/lib/mongoose";
import { getStudentModel } from "@/models/student";

export type StudentResult = {
  nisn: string;
  nama: string;
  status: "LULUS" | "TIDAK LULUS";
};

export async function findStudentResultByNisnAndBirthDate(
  nisn: string,
  tanggalLahir: string,
) {
  await connectToDatabase();
  const Student = getStudentModel();

  const student = await Student.findOne(
    { nisn, tanggalLahir },
    { _id: 0, nisn: 1, nama: 1, status: 1 },
  )
    .lean<StudentResult>()
    .exec();

  return student;
}
