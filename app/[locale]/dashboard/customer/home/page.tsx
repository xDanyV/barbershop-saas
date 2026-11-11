import { headers } from "next/headers";
import CustomerHome from "./CustomerHome";

export default async function CustomerHomePage() {
    const role = (await headers()).get("x-user-role");

    return <CustomerHome isStaff={role !== "CUSTOMER"} />;
}
