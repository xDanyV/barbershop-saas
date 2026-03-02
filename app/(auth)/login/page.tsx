"use client";

import { useState } from "react";

export default function LoginPage() {
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Login
                </h1>

                <form className="space-y-4"
                    onSubmit={async (e) => {
                        e.preventDefault();

                        try {
                            const response = await fetch("/api/login", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                credentials: "include", // importante
                                body: JSON.stringify(form),
                            });

                            const data = await response.json();

                            if (!response.ok) {
                                alert(data.error || "Invalid credentials");
                                return;
                            }

                            window.location.href = "/dashboard";

                        } catch (error) {
                            console.error("Login error:", error);
                        }
                    }}
                >
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-4 py-2 border rounded-lg text-gray-500 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                        value={form.email}
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full px-4 py-2 border rounded-lg text-gray-500 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                        value={form.password}
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                    />

                    <button
                        type="submit"
                        className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}