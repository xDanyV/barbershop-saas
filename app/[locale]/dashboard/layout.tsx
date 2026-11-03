import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardNavbar from "@/[locale]/components/DashboardNavbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // El proxy valida la sesión y define el rol actual (leído de la base) en cada petición
  const headerList = await headers();
  const userRole = headerList.get("x-user-role");

  if (!userRole) redirect("/login");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <DashboardNavbar role={userRole} />

      <main className="w-full max-w-7xl mx-auto px-4 pt-4 sm:px-8 flex-1">
        {children}
      </main>
    </div>
  );
}
