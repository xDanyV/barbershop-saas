"use client";

import { useRouter } from "next/navigation";

type Props = {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

export default function CustomerDashboard({ user }: Props) {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });

      router.push("/login");
      router.refresh(); // opcional pero recomendado
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex justify-between items-center px-8 py-4 bg-indigo-900 text-white">
        <h1 className="text-2xl font-semibold">
          CUSTOMER DASHBOARD
        </h1>

        <form action="/api/auth/logout" method="POST">
          <button
            type="button"
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full text-sm"
          >
            Logout
          </button>
        </form>
      </header>

      <main className="p-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome
          </h2>

          <p className="text-gray-600 mt-2">
            Email: {user.email}
          </p>

          <p className="text-gray-600">
            Role: {user.role}
          </p>
        </div>
      </main>
    </div>
  );
}