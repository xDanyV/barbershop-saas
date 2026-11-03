import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "react-calendar/dist/Calendar.css";
import "../globals.css";

// Importaciones para next-intl
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "../../i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


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
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0f]`}
      >
        {/* 3. Envolvemos la app con el proveedor de traducciones */}
        <NextIntlClientProvider messages={messages}>
          <Toaster position="top-right" reverseOrder={false} />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}