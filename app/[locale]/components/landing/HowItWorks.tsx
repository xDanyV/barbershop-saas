"use client";

import { useTranslations } from "next-intl";
import { DemoStep, type DemoMode } from "./DemoState";
import Reveal from "./Reveal";

const STEPS: { key: "setup" | "share" | "book"; mode: DemoMode }[] = [
    { key: "setup", mode: "setup" },
    { key: "share", mode: "book" },
    { key: "book", mode: "confirmed" },
];

// Tres afirmaciones; la que cruza el centro de la pantalla cambia el ejemplo fijo de la izquierda
export default function HowItWorks() {
    const t = useTranslations("Landing.how");

    return (
        <section id="como-funciona" aria-labelledby="how-title" className="scroll-mt-8">
            <Reveal as="h2" className="text-[length:var(--step-head)] leading-tight tracking-tight">
                <span id="how-title">{t("title")}</span>
            </Reveal>

            <ol className="mt-10 lg:mt-4">
                {STEPS.map((step) => (
                    <li key={step.key}>
                        <DemoStep mode={step.mode} className="flex flex-col justify-center py-8 lg:min-h-[62vh] lg:py-0">
                            {(active) => (
                                <Reveal>
                                    <p
                                        className={`max-w-[22ch] text-[clamp(1.5rem,1.2rem+1.1vw,2rem)] leading-tight tracking-tight transition-colors duration-300 ${active ? "text-[var(--brand-ink)]" : "lg:text-[var(--brand-muted)]"
                                            }`}
                                    >
                                        {t(`steps.${step.key}.title`)}
                                    </p>
                                    <p className="mt-3 max-w-[42ch] text-[var(--brand-muted)]">{t(`steps.${step.key}.text`)}</p>
                                </Reveal>
                            )}
                        </DemoStep>
                    </li>
                ))}
            </ol>
        </section>
    );
}
