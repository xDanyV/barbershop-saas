"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [role, setRole] = useState<"CUSTOMER" | "BARBER">("CUSTOMER");
    const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Something went wrong");
                return;
            }

            router.push("/login");

        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-16 relative overflow-hidden">

            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-125 h-75 bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-75 h-75 bg-indigo-900/20 blur-[100px] rounded-full pointer-events-none" />

            {/* Grid background */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                }}
            />

            <div className="relative z-10 w-full max-w-4xl">

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <Link href="/" className="inline-block text-white font-black text-2xl tracking-tight">
                        BARBER<span className="text-indigo-400">SAAS</span>
                    </Link>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6 items-start">

                    {/* Form card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="bg-white/4 border border-white/8 rounded-2xl p-8 backdrop-blur-sm"
                    >
                        <h1 className="text-2xl font-black text-white mb-1 tracking-tight">
                            Create account
                        </h1>
                        <p className="text-gray-500 text-sm mb-8">
                            Fill in your details to get started
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {[
                                { name: "name", label: "Full name", placeholder: "John Doe", type: "text" },
                                { name: "phone", label: "Phone number", placeholder: "+1 (555) 000-0000", type: "text" },
                                { name: "email", label: "Email", placeholder: "you@example.com", type: "email" },
                                { name: "password", label: "Password", placeholder: "••••••••", type: "password" },
                            ].map((field) => (
                                <div key={field.name}>
                                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                                        {field.label}
                                    </label>
                                    <input
                                        name={field.name}
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        value={form[field.name as keyof typeof form]}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-white/5 border border-white/8 text-white placeholder:text-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                                    />
                                </div>
                            ))}

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Create account"
                                )}
                            </button>

                        </form>
                    </motion.div>

                    {/* Role selector card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white/4 border border-white/8 rounded-2xl p-8 backdrop-blur-sm"
                    >
                        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
                            I am a...
                        </h2>
                        <p className="text-gray-500 text-sm mb-8">
                            Choose your role to get the right experience
                        </p>

                        <div className="space-y-3">

                            {/* Customer option */}
                            <button
                                type="button"
                                onClick={() => setRole("CUSTOMER")}
                                className={`w-full p-5 rounded-xl border text-left transition-all duration-200 ${role === "CUSTOMER"
                                    ? "bg-indigo-600/20 border-indigo-500/60 shadow-lg shadow-indigo-900/20"
                                    : "bg-white/3 border-white/6 hover:bg-white/6 hover:border-white/12"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors ${role === "CUSTOMER" ? "bg-indigo-500/30" : "bg-white/5"
                                        }`}>
                                        💈
                                    </div>
                                    <div>
                                        <p className={`font-semibold text-sm transition-colors ${role === "CUSTOMER" ? "text-white" : "text-gray-300"
                                            }`}>
                                            Customer
                                        </p>
                                        <p className="text-gray-500 text-xs mt-0.5">
                                            Book appointments with your barber
                                        </p>
                                    </div>
                                    <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${role === "CUSTOMER" ? "border-indigo-400 bg-indigo-400" : "border-gray-600"
                                        }`}>
                                        {role === "CUSTOMER" && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        )}
                                    </div>
                                </div>
                            </button>

                            {/* Barber option */}
                            <button
                                type="button"
                                onClick={() => setRole("BARBER")}
                                className={`w-full p-5 rounded-xl border text-left transition-all duration-200 ${role === "BARBER"
                                    ? "bg-indigo-600/20 border-indigo-500/60 shadow-lg shadow-indigo-900/20"
                                    : "bg-white/3 border-white/6 hover:bg-white/6 hover:border-white/12"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors ${role === "BARBER" ? "bg-indigo-500/30" : "bg-white/5"
                                        }`}>
                                        ✂️
                                    </div>
                                    <div>
                                        <p className={`font-semibold text-sm transition-colors ${role === "BARBER" ? "text-white" : "text-gray-300"
                                            }`}>
                                            Barber
                                        </p>
                                        <p className="text-gray-500 text-xs mt-0.5">
                                            Manage your schedule and clients
                                        </p>
                                    </div>
                                    <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${role === "BARBER" ? "border-indigo-400 bg-indigo-400" : "border-gray-600"
                                        }`}>
                                        {role === "BARBER" && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        )}
                                    </div>
                                </div>
                            </button>

                        </div>

                        {/* Selected role indicator */}
                        <div className="mt-6 px-4 py-3 bg-white/3 border border-white/6 rounded-xl">
                            <p className="text-xs text-gray-500">
                                Registering as{" "}
                                <span className="text-indigo-400 font-semibold">{role}</span>
                                {role === "BARBER"
                                    ? " — you'll manage your own availability and services"
                                    : " — you'll be able to book appointments with any barber"}
                            </p>
                        </div>

                    </motion.div>

                </div>

                {/* Login redirect */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-center text-gray-600 text-sm mt-6"
                >
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                        Sign in
                    </Link>
                </motion.p>

            </div>
        </main>
    );
}