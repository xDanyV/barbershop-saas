import type { ReactNode } from "react";

// Encabezado común de las pantallas del panel: título, una línea de contexto y acciones a la derecha
export default function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
    return (
        <header className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <h1 className="break-words text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
                {subtitle && <p className="mt-1 text-gray-500">{subtitle}</p>}
            </div>
            {actions}
        </header>
    );
}
