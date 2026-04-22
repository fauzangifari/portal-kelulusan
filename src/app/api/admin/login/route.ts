import {
  createAdminSession,
  validateAdminCredentials,
  getAdminCookieHeader,
} from "@/lib/admin-auth";

type Body = { username?: string; password?: string };

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const username = body.username?.trim();
  const password = body.password?.trim();

  if (!username || !password) {
    return Response.json(
      { message: "Username dan password wajib diisi." },
      { status: 400 },
    );
  }

  if (!validateAdminCredentials(username, password)) {
    return Response.json({ message: "Kredensial admin salah." }, { status: 401 });
  }

  const token = await createAdminSession();
  
  return Response.json(
    { message: "Login berhasil." },
    {
      status: 200,
      headers: {
        "Set-Cookie": getAdminCookieHeader(token),
      },
    },
  );
}
