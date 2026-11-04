import type { Metadata } from "next";
import LegalPage from "../components/legal/LegalPage";
import { getLegalDocument } from "@/lib/legal-documents";
import { localizedAlternates } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    return { title: getLegalDocument("privacy", locale).title, alternates: localizedAlternates("/privacy", locale) };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return <LegalPage kind="privacy" locale={locale} />;
}
