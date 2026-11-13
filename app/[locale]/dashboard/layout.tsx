import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import DashboardNavbar from "@/[locale]/components/DashboardNavbar";
import TermsPrompt from "@/[locale]/components/legal/TermsPrompt";
import BillingBanner from "@/[locale]/components/BillingBanner";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // El proxy valida la sesión y define el rol actual (leído de la base) en cada petición
  const headerList = await headers();
  const userRole = headerList.get("x-user-role");

  if (!userRole) redirect("/login");

  // Cuentas creadas antes de los Términos, o con una versión anterior, deben aceptarlos para continuar
  const termsPending = headerList.get("x-terms-pending") === "true";
  const ownerBusinessId = userRole === "OWNER" ? headerList.get("x-business-id") : null;

  const t = await getTranslations("States");
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Con teclado o lector de pantalla se puede saltar el menú y llegar directo al contenido */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[10001] focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-gray-900 focus:outline-2 focus:outline-gray-900"
      >
        {t("skipToContent")}
      </a>
      <DashboardNavbar role={userRole} />
      {termsPending && <TermsPrompt />}
      {ownerBusinessId && <BillingBanner businessId={ownerBusinessId} />}

      <main id="contenido" tabIndex={-1} className="w-full max-w-7xl mx-auto px-4 pb-24 sm:px-8 md:pb-8 flex-1 outline-none">
        {children}
      </main>

      {/* En móvil estos enlaces están en "Mi cuenta": la barra inferior ya ocupa ese espacio */}
      <footer className="hidden border-t border-gray-200 md:block">
        <div className="mx-auto flex max-w-7xl gap-6 px-8 py-4 text-sm text-gray-500">
          <Link href={`/${locale}/privacy`} className="hover:text-gray-900 hover:underline">{t("footer.privacy")}</Link>
          <Link href={`/${locale}/terms`} className="hover:text-gray-900 hover:underline">{t("footer.terms")}</Link>
        </div>
      </footer>
    </div>
  );
}
