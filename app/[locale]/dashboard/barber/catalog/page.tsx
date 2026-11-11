import { headers } from "next/headers";
import CatalogClient from "./CatalogClient";

export default async function CatalogPage() {
    const role = (await headers()).get("x-user-role");

    return <CatalogClient isOwner={role === "OWNER"} />;
}
