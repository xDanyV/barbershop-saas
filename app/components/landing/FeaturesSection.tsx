"use client";

import { motion } from "framer-motion";

const features = [
    {
        icon: "📅",
        title: "Smart Scheduling",
        description: "Customers book directly from your live calendar. No back-and-forth, no phone calls.",
    },
    {
        icon: "✂️",
        title: "Service Catalog",
        description: "Create and manage your services with custom prices and durations.",
    },
    {
        icon: "🔔",
        title: "Instant Confirmations",
        description: "Confirm or cancel appointments in one tap. Customers are always in the loop.",
    },
    {
        icon: "🚫",
        title: "Exception Blocks",
        description: "Block out vacations or emergencies. Affected appointments are cancelled automatically.",
    },
    {
        icon: "📊",
        title: "Appointment History",
        description: "Full history of past and upcoming bookings for both barbers and customers.",
    },
    {
        icon: "🔒",
        title: "Secure by Default",
        description: "JWT authentication with role-based access. Barbers and customers each see only what they need.",
    },
];

export default function FeaturesSection() {
    return (
        <section className="bg-[#0a0a0f] py-24 px-6">

            <div className="max-w-5xl mx-auto">

                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">
                        Everything you need
                    </p>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        Built for barbers.<br />
                        <span className="text-gray-500">Loved by clients.</span>
                    </h2>
                </motion.div>

                {/* Features grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            className="group bg-white/3 hover:bg-white/6 border border-white/6 hover:border-indigo-700/40 rounded-2xl p-6 transition-all duration-300"
                        >
                            <div className="text-2xl mb-4">{feature.icon}</div>
                            <h3 className="text-white font-semibold text-base mb-2">{feature.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}