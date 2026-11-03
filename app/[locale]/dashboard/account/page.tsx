import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { LEGAL_INFO } from "@/lib/legal";
import { DEFAULT_TIMEZONE } from "@/lib/time/zoned";
import { brandFontClasses } from "../../brand";
import AccountForms from "./AccountForms";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const headerList = await headers();
    const userId = headerList.get("x-user-id");
    const role = headerList.get("x-user-role");

    if (!userId || !role) redirect(`/${locale}/login`);

    const t = await getTranslations({ locale, namespace: "Account" });
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { name: true, email: true, phone: true, termsAcceptedAt: true },
    });

    const acceptedOn = user.termsAcceptedAt
        ? new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-MX", { dateStyle: "long", timeZone: DEFAULT_TIMEZONE }).format(user.termsAcceptedAt)
        : null;

    return (
        <div className={`brand ${brandFontClasses} -mx-4 -mt-4 min-h-[calc(100svh-4rem)] px-5 pb-32 pt-10 sm:-mx-8 sm:px-8 md:pb-16 lg:pt-16`}>
            <div className="mx-auto max-w-3xl">
                <h1 className="brand-display text-[length:clamp(2rem,1.5rem+2vw,3rem)]">{t("title")}</h1>
                <p className="mt-3 text-[var(--brand-muted)]">{t("subtitle")}</p>

                <AccountForms
                    initial={{ name: user.name ?? "", email: user.email, phone: user.phone }}
                    canDelete={role === "CUSTOMER"}
                    acceptedOn={acceptedOn}
                    contactEmail={LEGAL_INFO.email}
                />
            </div>
        </div>
    );
}
