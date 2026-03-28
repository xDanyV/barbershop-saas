"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0f]">

            {/* Grid background */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Glow top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

            {/* Glow bottom right */}
            <div className="absolute bottom-0 right-0 w-100 h-100 bg-indigo-900/30 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-medium px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    Barbershop management platform
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-6xl md:text-8xl font-black tracking-tight text-white leading-none mb-6"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                    <span className="block">YOUR CUTS.</span>
                    <span className="block text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-indigo-200">
                        YOUR SCHEDULE.
                    </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed"
                >
                    Book appointments, manage your barber's calendar, and stay on top of every cut — all in one place.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <Link
                        href="/register"
                        className="group relative px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 overflow-hidden"
                    >
                        <span className="relative z-10">Get started — it's free</span>
                        <div className="absolute inset-0 bg-linear-to-r from-indigo-500 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </Link>

                    <Link
                        href="/login"
                        className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-xl transition-all duration-200 backdrop-blur-sm"
                    >
                        Sign in
                    </Link>
                </motion.div>

            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#0a0a0f] to-transparent pointer-events-none" />

        </section>
    );
}