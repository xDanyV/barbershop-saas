import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "react-calendar/dist/Calendar.css";
import "../globals.css";
import { brandFontClasses } from "./brand";

// Importaciones para next-intl
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "../../i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
    description: t("description"),
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
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}