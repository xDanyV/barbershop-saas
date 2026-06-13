"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
    const t = useTranslations("Register");
    const router = useRouter();
    const [role, setRole] = useState<"CUSTOMER" | "BARBER" | null>(null);
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        businessSlug: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Estado para mostrar/ocultar contraseña
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validaciones del lado del cliente (Frontend)
        if (!role) {
            setError("Please select an account type");
            return;
        }

        if (role === "BARBER" && !form.businessSlug.trim()) {
            setError("Please enter the business slug or public business link");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (form.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setError("");
        setLoading(true);

        const loadingToast = toast.loading("Creating your workspace...");

        try {
            // Excluimos confirmPassword para no enviarlo a la API
            const { confirmPassword, ...apiData } = form;

            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...apiData, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Something went wrong");
                toast.error(data.error || "Failed to create account", { id: loadingToast });
                setLoading(false);
                return;
            }

            toast.success("Welcome aboard! Redirecting...", {
                id: loadingToast,
                duration: 4000
            });

            setTimeout(() => {
                router.push("/login");
            }, 1500);

        } catch {
            setError("Connection error. Please check your internet and try again.");
            toast.error("Connection error. Please try again.", { id: loadingToast });
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-8 md:py-16 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-72 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Grid background */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                }}
            />

            <div className="relative z-10 w-full max-w-5xl">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <Link href="/" className="inline-block text-white font-black text-3xl tracking-tight">
                        BARBER<span className="text-indigo-500">SAAS</span>
                    </Link>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8 items-start">
                    {/* Role selector card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md order-1 lg:order-1"
                    >
                        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                            {t("choosePath")}
                        </h2>
                        <p className="text-gray-400 text-sm mb-8">
                            {t("choosePathDesc")}
                        </p>

                        <div className="space-y-4">
                            {/* Customer option */}
                            <button
                                type="button"
                                onClick={() => {
                                    setRole("CUSTOMER");
                                    setForm((prev) => ({ ...prev, businessSlug: "" }));
                                }}
                                className={`w-full p-5 rounded-xl border text-left transition-all duration-300 ${role === "CUSTOMER"
                                    ? "bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                                    : "bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/4"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${role === "CUSTOMER" ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-gray-400"}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-semibold mb-1 ${role === "CUSTOMER" ? "text-white" : "text-gray-300"}`}>{t("customerTitle")}</p>
                                        <p className="text-gray-500 text-xs leading-relaxed">{t("customerDesc")}</p>
                                    </div>
                                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${role === "CUSTOMER" ? "border-indigo-500" : "border-gray-600"}`}>
                                        {role === "CUSTOMER" && <motion.div layoutId="roleCheck" className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                                    </div>
                                </div>
                            </button>

                            {/* Barber option */}
                            <button
                                type="button"
                                onClick={() => setRole("BARBER")}
                                className={`w-full p-5 rounded-xl border text-left transition-all duration-300 ${role === "BARBER"
                                    ? "bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                                    : "bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/4"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${role === "BARBER" ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-gray-400"}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" x2="8.12" y1="4" y2="15.88" /><line x1="14.47" x2="20" y1="14.48" y2="20" /><line x1="8.12" x2="12" y1="8.12" y2="12" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-semibold mb-1 ${role === "BARBER" ? "text-white" : "text-gray-300"}`}>{t("barberTitle")}</p>
                                        <p className="text-gray-500 text-xs leading-relaxed">{t("barberDesc")}</p>
                                    </div>
                                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${role === "BARBER" ? "border-indigo-500" : "border-gray-600"}`}>
                                        {role === "BARBER" && <motion.div layoutId="roleCheck" className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                                    </div>
                                </div>
                            </button>
                        </div>
                    </motion.div>

                    {/* Form card */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-white/2 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm order-2 lg:order-2"
                    >
                        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                            {t("accountDetails")}
                        </h1>
                        <p className="text-gray-400 text-sm mb-8">
                            {t("accountDetailsDesc")}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Inputs Básicos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">{t("form.fullName")}</label>
                                    <input
                                        name="name"
                                        type="text"
                                        placeholder="John Doe"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-[#0f0f16] border border-white/10 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">{t("form.phone")}</label>
                                    <input
                                        name="phone"
                                        type="text"
                                        placeholder="+1 (555) 000-0000"
                                        value={form.phone}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-[#0f0f16] border border-white/10 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">{t("form.email")}</label>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-[#0f0f16] border border-white/10 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>

                            {role === "BARBER" && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4"
                                >
                                    <label className="text-xs font-semibold text-indigo-300 mb-2 block uppercase tracking-wider">
                                        Business slug or public link
                                    </label>

                                    <input
                                        name="businessSlug"
                                        type="text"
                                        placeholder="barberia-el-nuevo-rey"
                                        value={form.businessSlug}
                                        onChange={handleChange}
                                        required={role === "BARBER"}
                                        className="w-full bg-[#0f0f16] border border-white/10 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                    />

                                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                                        You can enter only the slug, like{" "}
                                        <span className="text-indigo-300 font-bold">
                                            barberia-el-nuevo-rey
                                        </span>
                                        , or paste the full public business link.
                                    </p>
                                </motion.div>
                            )}

                            {/* Contraseñas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
                                        {t("form.password")}
                                    </label>

                                    <div className="relative">
                                        <input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={form.password}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-[#0f0f16] border border-white/10 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">
                                        {t("form.confirmPassword")}
                                    </label>

                                    <input
                                        name="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className={`w-full bg-[#0f0f16] border text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${form.confirmPassword && form.password !== form.confirmPassword
                                            ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
                                            : "border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mt-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                    {error}
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !role}
                                className={`w-full font-bold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-6
                                    ${(!role || loading)
                                        ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] active:scale-[0.98]"
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t("buttons.creating")}
                                    </>
                                ) : !role ? (
                                    t("buttons.selectRole")
                                ) : (
                                    t("buttons.create")
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>

                {/* Login redirect */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-gray-500 text-sm mt-12"
                >
                    {t("login.question")}{" "}
                    <Link href="/login" className="text-white hover:text-indigo-300 font-bold transition-colors">
                        {t("login.action")}
                    </Link>
                </motion.p>
            </div>
        </main>
    );
}