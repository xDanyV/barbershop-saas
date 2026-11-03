import { getLocale } from "next-intl/server";
import { redirect } from "../../../../i18n/routing";

// La reserva se hace desde la página de cada negocio; /dashboard/customer lleva al inicio del cliente
export default async function CustomerDashboardIndex() {
    const locale = await getLocale();
    return redirect({ href: "/dashboard/customer/home", locale });
}
