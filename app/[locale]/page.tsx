import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/site";
import LandingPage from "./components/landing/LandingPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  return { alternates: localizedAlternates("", locale) };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <LandingPage locale={locale} />;
}
