import { getTranslations } from "next-intl/server";
import PageHeader from "@/[locale]/components/PageHeader";
import ReviewsManager from "@/[locale]/components/reviews/ReviewsManager";

// Reseñas que los clientes le dejaron a este barbero
export default async function BarberReviewsPage() {
    const t = await getTranslations("ReviewsManager");

    return (
        <div className="mx-auto max-w-3xl pb-6">
            <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} />
            <ReviewsManager />
        </div>
    );
}
