import { NextResponse } from "next/server";
import { isCookieTokenValid } from "@/lib/admin-auth";
import { listTracerStudies, deleteTracerStudy, findAllForExport } from "@/lib/tracer-study-repository";

export async function GET(request: Request) {
  const isAuthenticated = await isCookieTokenValid(request.headers.get("cookie"));
  if (!isAuthenticated) {
    return NextResponse.json({ message: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const isExport = searchParams.get("export") === "1";

    if (isExport) {
      const data = await findAllForExport();
      return NextResponse.json(data);
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";

    const result = await listTracerStudies(page, Math.min(limit, 100), search);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Tracer Study API Error:", error);
    return NextResponse.json({ message: "Gagal mengambil data tracer study." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const isAuthenticated = await isCookieTokenValid(request.headers.get("cookie"));
  if (!isAuthenticated) {
    return NextResponse.json({ message: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID diperlukan." }, { status: 400 });
    }

    const deleted = await deleteTracerStudy(id);
    if (!deleted) {
      return NextResponse.json({ message: "Data tracer study tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ message: "Data tracer study berhasil dihapus." }, { status: 200 });
  } catch (error) {
    console.error("Tracer Study API Error:", error);
    return NextResponse.json({ message: "Gagal menghapus data tracer study." }, { status: 500 });
  }
}
