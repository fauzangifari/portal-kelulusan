import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/app/admin/login/login-form";
import { ADMIN_SESSION_COOKIE, isAdminSessionTokenValid } from "@/lib/admin-auth";

type AdminLoginPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const isSessionExpired = params.reason === "session-expired";

  // Cek apakah sudah ada sesi yang valid
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const isAuthenticated = await isAdminSessionTokenValid(sessionToken || null);

  // Jika sudah login dan sesi valid (dan bukan karena baru saja expired), redirect ke admin
  if (isAuthenticated && !isSessionExpired) {
    redirect("/admin");
  }

  return <AdminLoginForm isSessionExpired={isSessionExpired} />;
}
