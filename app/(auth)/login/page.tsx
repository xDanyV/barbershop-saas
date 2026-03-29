"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid credentials");
        return;
      }

      if (data.user.role === "BARBER") {
        window.location.href = "/dashboard/barber";
      } else {
        window.location.href = "/dashboard/customer/home";
      }

    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 relative overflow-hidden">

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

      <div className="relative z-10 w-full max-w-sm">

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

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/4 border border-white/8 rounded-2xl p-8 backdrop-blur-sm"
        >
          <h1 className="text-2xl font-black text-white mb-1 tracking-tight">
            Welcome back
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-white/5 border border-white/8 text-white placeholder:text-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full bg-white/5 border border-white/8 text-white placeholder:text-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
              />
            </div>

            {/* Error message */}
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>

          </form>

        </motion.div>

        {/* Register redirect */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-gray-600 text-sm mt-6"
        >
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Create one
          </Link>
        </motion.p>

      </div>
    </main>
  );
}