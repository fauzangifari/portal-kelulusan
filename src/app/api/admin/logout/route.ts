import { revokeAdminSessionFromCookie, getAdminCookieHeader } from "@/lib/admin-auth";

export async function POST(request: Request) {
  await revokeAdminSessionFromCookie(request.headers.get("cookie"));

  return Response.json(
    { message: "Logout berhasil." },
    {
      status: 200,
      headers: {
        "Set-Cookie": getAdminCookieHeader("", true), // Kosongkan token dan set Max-Age=0
      },
    },
  );
}
