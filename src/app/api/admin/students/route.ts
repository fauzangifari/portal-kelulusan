import { isCookieTokenValid } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { getStudentModel } from "@/models/student";

export async function GET(request: Request) {
  const isAuthenticated = await isCookieTokenValid(request.headers.get("cookie"));
  if (!isAuthenticated) {
    return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const Student = getStudentModel();
    const students = await Student.find({}).sort({ nama: 1 });

    return Response.json(students, { status: 200 });
  } catch {
    return Response.json({ message: "Gagal mengambil data siswa." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const isAuthenticated = await isCookieTokenValid(request.headers.get("cookie"));
  if (!isAuthenticated) {
    return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const data = await request.json();
    if (!data.nisn || !data.nama) {
      return Response.json({ message: "NISN dan Nama wajib diisi." }, { status: 400 });
    }

    await connectToDatabase();
    const Student = getStudentModel();
    
    // Cek apakah NISN sudah ada
    const existing = await Student.findOne({ nisn: data.nisn });
    if (existing) {
      return Response.json({ message: "Gagal: NISN sudah terdaftar di database." }, { status: 400 });
    }

    const newStudent = await Student.create(data);
    return Response.json({ message: "Siswa berhasil ditambahkan.", student: newStudent }, { status: 201 });
  } catch {
    return Response.json({ message: "Gagal menambahkan data siswa." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const isAuthenticated = await isCookieTokenValid(request.headers.get("cookie"));
  if (!isAuthenticated) {
    return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const { id, ...updateData } = await request.json();
    if (!id) return Response.json({ message: "ID diperlukan." }, { status: 400 });

    await connectToDatabase();
    const Student = getStudentModel();
    
    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedStudent) {
      return Response.json({ message: "Siswa tidak ditemukan." }, { status: 404 });
    }

    return Response.json({ message: "Data berhasil diperbarui.", student: updatedStudent }, { status: 200 });
  } catch {
    return Response.json({ message: "Gagal memperbarui data." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const isAuthenticated = await isCookieTokenValid(request.headers.get("cookie"));
  if (!isAuthenticated) {
    return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    await connectToDatabase();
    const Student = getStudentModel();

    if (all === "true") {
      await Student.deleteMany({});
      return Response.json({ message: "Seluruh data siswa berhasil dihapus." }, { status: 200 });
    }

    if (!id) return Response.json({ message: "ID diperlukan." }, { status: 400 });
    
    const deleted = await Student.findByIdAndDelete(id);
    if (!deleted) {
      return Response.json({ message: "Siswa tidak ditemukan." }, { status: 404 });
    }

    return Response.json({ message: "Data siswa berhasil dihapus." }, { status: 200 });
  } catch {
    return Response.json({ message: "Gagal menghapus data." }, { status: 500 });
  }
}
