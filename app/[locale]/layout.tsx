import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "react-calendar/dist/Calendar.css";
import "../globals.css";

// Importaciones para next-intl
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
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

// ¡Mejoramos el SEO de paso!
export const metadata: Metadata = {
  title: "BarberSaaS | Manage your business",
  description: "The best platform to book and manage barbershop appointments",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;

  // 1. Validar que el idioma en la URL (locale) exista en tu routing
  if (!routing.locales.includes(locale as any)) {
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