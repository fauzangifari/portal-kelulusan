import { isCookieTokenValid } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const isAuthenticated = await isCookieTokenValid(request.headers.get("cookie"));

  if (!isAuthenticated) {
    return Response.json(
      { authenticated: false, message: "Sesi admin sudah berakhir." },
      { status: 401 },
    );
  }

  return Response.json({ authenticated: true }, { status: 200 });
}
