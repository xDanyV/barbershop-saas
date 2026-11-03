import type { Metadata } from "next";
import LegalPage from "../components/legal/LegalPage";
import { getLegalDocument } from "@/lib/legal-documents";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    return { title: getLegalDocument("privacy", locale).title };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return <LegalPage kind="privacy" locale={locale} />;
}
