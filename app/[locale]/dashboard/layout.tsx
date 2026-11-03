import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardNavbar from "@/[locale]/components/DashboardNavbar";
import TermsPrompt from "@/[locale]/components/legal/TermsPrompt";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // El proxy valida la sesión y define el rol actual (leído de la base) en cada petición
  const headerList = await headers();
  const userRole = headerList.get("x-user-role");

  if (!userRole) redirect("/login");

  // Cuentas creadas antes de los Términos, o con una versión anterior, deben aceptarlos para continuar
  const termsPending = headerList.get("x-terms-pending") === "true";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <DashboardNavbar role={userRole} />
      {termsPending && <TermsPrompt />}

      <main className="w-full max-w-7xl mx-auto px-4 pt-4 sm:px-8 flex-1">
        {children}
      </main>
    </div>
  );
}
