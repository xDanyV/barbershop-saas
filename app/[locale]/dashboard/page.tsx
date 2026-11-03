import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import type { Role } from "@prisma/client";
import { redirect } from "../../../i18n/routing";
import { getHomePathForRole } from "@/lib/auth/session";

export default async function DashboardPage() {
  // El proxy valida la sesión y define el rol actual en cada petición
  const headerList = await headers();
  const role = headerList.get("x-user-role") as Role | null;
  const locale = await getLocale();

  // redirect de next-intl conserva el idioma actual
  return redirect({
    href: role ? getHomePathForRole(role) : "/login",
    locale,
  });
}
