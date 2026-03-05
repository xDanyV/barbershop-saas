"use client";

import { useRouter } from "next/navigation";

export default function DashboardHeader() {

    return (
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold">
                Barber Dashboard
            </h1>
        </header>
    );
}