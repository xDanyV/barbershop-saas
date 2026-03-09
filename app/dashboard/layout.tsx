"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast"

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-900 text-white px-8 py-4 flex justify-between items-center">

        <h1 className="text-xl font-semibold tracking-wide">
          BARBERSHOP - SAAS
        </h1>

        <div className="flex items-center gap-4">
          <form action="/api/logout" method="POST">
            <button
              type="button"
              onClick={handleLogout}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full text-sm cursor-pointer"
            >
              Logout
            </button>
          </form>

        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {children}
      </main>

      <Toaster position="top-right" />

    </div>
  );
}