"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    const [role, setRole] = useState<"CUSTOMER" | "BARBER">("CUSTOMER");

    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...form,
                    role, // ✅ enviamos el rol seleccionado
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Something went wrong");
                return;
            }

            router.push("/login");
        } catch (error) {
            console.error("Register error:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-indigo-900 text-white px-8 py-4">
                <h1 className="text-2xl font-semibold tracking-wide">
                    BARBERSHOP - SAAS
                </h1>
            </header>

            <div className="max-w-6xl mx-auto p-8 grid md:grid-cols-2 gap-12 items-center">

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white shadow-lg rounded-2xl p-8 space-y-5"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Name
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            type="text"
                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Your name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Phone Number
                        </label>
                        <input
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            type="text"
                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Your phone"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            type="email"
                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Your email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            type="password"
                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
                    >
                        Register
                    </button>
                </form>

                {/* ROLE SELECTOR */}
                <div className="flex flex-col items-center">
                    <h2 className="text-lg font-semibold text-gray-700 mb-6">
                        SELECT YOUR ROLE
                    </h2>

                    <div className="flex gap-10 items-center">
                        <div
                            onClick={() => setRole("CUSTOMER")}
                            className={`cursor-pointer transition-all duration-300 rounded-full flex items-center justify-center text-white font-semibold
                ${role === "CUSTOMER"
                                    ? "w-48 h-48 bg-red-600 scale-110 shadow-xl"
                                    : "w-40 h-40 bg-red-400 opacity-80"
                                }
              `}
                        >
                            CUSTOMER
                        </div>

                        <div
                            onClick={() => setRole("BARBER")}
                            className={`cursor-pointer transition-all duration-300 rounded-full flex items-center justify-center text-white font-semibold
                ${role === "BARBER"
                                    ? "w-48 h-48 bg-blue-600 scale-110 shadow-xl"
                                    : "w-40 h-40 bg-blue-400 opacity-80"
                                }
              `}
                        >
                            BARBER
                        </div>
                    </div>

                    <p className="mt-6 text-sm text-gray-500">
                        Selected: <span className="font-medium">{role}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}