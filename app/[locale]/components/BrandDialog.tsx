"use client";

import type { ReactNode } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X } from "lucide-react";
import { brandFontClasses } from "@/[locale]/brand";

type Props = {
    title: string;
    subtitle?: string;
    closeLabel: string;
    onClose: () => void;
    children: ReactNode;
};

export const brandInput =
    "mt-2 block min-h-12 w-full border border-[var(--brand-surface)] bg-[var(--brand-paper)] px-4 text-[var(--brand-ink)] outline-none transition-colors focus:border-[var(--brand-ink)]";

export const brandPrimaryButton =
    "inline-flex min-h-12 w-full items-center justify-center bg-[var(--brand-primary)] px-6 font-semibold text-[var(--brand-on-primary)] transition-[opacity,transform] duration-150 hover:opacity-90 active:translate-y-px disabled:opacity-50";

// Ventana con el estilo de la marca. La clase .brand va en el panel porque pinta su propio fondo.
export default function BrandDialog({ title, subtitle, closeLabel, onClose, children }: Props) {
    return (
        <Dialog open onClose={onClose} className="relative z-[9999]">
            <div className="fixed inset-0 bg-[rgba(15,39,51,0.55)]" aria-hidden="true" />

            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
                    <DialogPanel className={`brand ${brandFontClasses} w-full max-w-lg bg-[var(--brand-paper)] p-5 sm:p-8`}>
                        <div className="flex items-start justify-between gap-4">
                            <DialogTitle className="brand-display text-[length:var(--step-head)]">{title}</DialogTitle>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label={closeLabel}
                                className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--brand-muted)] transition-colors hover:text-[var(--brand-ink)]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {subtitle && <p className="mt-2 max-w-[46ch] text-[var(--brand-muted)]">{subtitle}</p>}

                        <div className="mt-6">{children}</div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}
