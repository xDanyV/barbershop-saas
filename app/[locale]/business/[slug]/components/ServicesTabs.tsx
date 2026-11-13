"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type ServiceRow = {
    key: string;
    name: string;
    meta: string;
    price: string;
    href: string | null;
    ariaLabel: string;
};

export type ServiceTab = {
    id: string;
    label: string;
    rows: ServiceRow[];
};

// Con varios barberos, cada uno tiene su pestaña con sus servicios y precios exactos;
// "Todos" junta los servicios iguales y muestra el precio desde el más barato
export default function ServicesTabs({ tabs, label }: { tabs: ServiceTab[]; label: string }) {
    const [active, setActive] = useState(tabs[0]?.id);
    const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

    if (!current) return null;

    return (
        <div>
            {tabs.length > 1 && (
                <div role="tablist" aria-label={label} className="scroll-strip -mx-4 mb-2 flex gap-1 overflow-x-auto border-b border-[var(--brand-surface)] px-4 md:mx-0 md:px-0">
                    {tabs.map((tab) => {
                        const selected = tab.id === current.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                id={`services-tab-${tab.id}`}
                                aria-selected={selected}
                                aria-controls="services-panel"
                                onClick={() => setActive(tab.id)}
                                className={`relative min-h-11 shrink-0 whitespace-nowrap px-3 font-semibold transition-colors md:px-4 ${selected ? "text-[var(--brand-ink)]" : "text-[var(--brand-muted)] hover:text-[var(--brand-ink)]"}`}
                            >
                                {tab.label}
                                {selected && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--brand-accent)]" />}
                            </button>
                        );
                    })}
                </div>
            )}

            <ul
                id="services-panel"
                role={tabs.length > 1 ? "tabpanel" : undefined}
                aria-labelledby={tabs.length > 1 ? `services-tab-${current.id}` : undefined}
                className="divide-y divide-[var(--brand-surface)] border-y border-[var(--brand-surface)]"
            >
                {current.rows.map((row) => {
                    const content = (
                        <>
                            <span className="min-w-0 flex-1">
                                <span className="block font-semibold">{row.name}</span>
                                <span className="mt-1 block text-[length:var(--step-small)] text-[var(--brand-muted)]">{row.meta}</span>
                            </span>
                            <span className="tabular shrink-0 text-right font-semibold">{row.price}</span>
                        </>
                    );

                    return (
                        <li key={row.key}>
                            {row.href ? (
                                <Link
                                    href={row.href}
                                    aria-label={row.ariaLabel}
                                    className="group flex min-h-16 items-center gap-4 py-4 transition-colors hover:bg-[var(--brand-bg)] md:px-3"
                                >
                                    {content}
                                    <ArrowRight
                                        size={18}
                                        className="shrink-0 text-[var(--brand-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--brand-ink)]"
                                        aria-hidden="true"
                                    />
                                </Link>
                            ) : (
                                <div className="flex min-h-16 items-center gap-4 py-4 md:px-3">{content}</div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
