"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const featureKeys = [
    { key: "scheduling", icon: "📅" },
    { key: "catalog", icon: "✂️" },
    { key: "confirmations", icon: "🔔" },
    { key: "exceptions", icon: "🚫" },
    { key: "history", icon: "📊" },
    { key: "security", icon: "🔒" },
] as const;

export default function FeaturesSection() {
    const t = useTranslations("Home.features");

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
                        {t("eyebrow")}
                    </p>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        {t("headlinePrimary")}<br />
                        <span className="text-gray-500">{t("headlineSecondary")}</span>
                    </h2>
                </motion.div>

                {/* Features grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featureKeys.map(({ key, icon }, i) => (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            className="group bg-white/3 hover:bg-white/6 border border-white/6 hover:border-indigo-700/40 rounded-2xl p-6 transition-all duration-300"
                        >
                            <div className="text-2xl mb-4">{icon}</div>
                            <h3 className="text-white font-semibold text-base mb-2">
                                {t(`items.${key}.title`)}
                            </h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                {t(`items.${key}.description`)}
                            </p>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}