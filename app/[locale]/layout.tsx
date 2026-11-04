import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "react-calendar/dist/Calendar.css";
import "../globals.css";
import { brandFontClasses } from "./brand";
import ServiceWorkerSetup from "./components/ServiceWorkerSetup";
import { getSiteUrl } from "@/lib/site";

// Importaciones para next-intl
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "../../i18n/routing";

export const viewport: Viewport = {
  themeColor: "#0f2733",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(getSiteUrl()),
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.webmanifest",
    icons: {
      icon: "/icons/favicon-32.png",
      apple: "/icons/apple-touch-icon.png",
    },
    appleWebApp: { capable: true, title: "Citas", statusBarStyle: "default" },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "es_MX",
      title: t("title"),
      description: t("description"),
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // <--- SOLUCIÓN: Envolverlo en Promise
}) {
  const { locale } = await params;

  // 1. Validar que el idioma en la URL (locale) exista en tu routing
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // 2. Cargar los mensajes (diccionarios) para este idioma
  const messages = await getMessages();

  return (
    <html lang={locale} className={brandFontClasses}>
      <body
        className="antialiased bg-gray-50"
      >
        {/* 3. Envolvemos la app con el proveedor de traducciones */}
        <NextIntlClientProvider messages={messages}>
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              style: { borderRadius: "6px", background: "#ffffff", color: "#0f2733", border: "1px solid #dbe0de", fontSize: "15px" },
              success: { iconTheme: { primary: "#1f6f5c", secondary: "#ffffff" } },
              error: { iconTheme: { primary: "#b8431f", secondary: "#ffffff" } },
            }}
          />
          <ServiceWorkerSetup />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}