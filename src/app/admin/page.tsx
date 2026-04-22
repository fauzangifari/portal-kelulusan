import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AdminUploadForm from "@/app/admin/upload-form";
import { ADMIN_SESSION_COOKIE, isAdminSessionTokenValid } from "@/lib/admin-auth";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const isAuthenticated = await isAdminSessionTokenValid(sessionCookie || null);

  if (!isAuthenticated) {
    redirect("/admin/login?reason=session-expired");
  }

  return <AdminUploadForm />;
}
