"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

// Qué muestra el ejemplo de la izquierda: la configuración del negocio, la página de reservas
// o la cita ya confirmada. Lo cambian los pasos de "Cómo funciona" al hacer scroll y el visitante al reservar.
export type DemoMode = "setup" | "book" | "confirmed";

type DemoStateValue = {
    mode: DemoMode;
    setMode: (mode: DemoMode) => void;
};

const DemoStateContext = createContext<DemoStateValue | null>(null);

export function DemoStateProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<DemoMode>("book");

    return <DemoStateContext.Provider value={{ mode, setMode }}>{children}</DemoStateContext.Provider>;
}

export function useDemoState() {
    const value = useContext(DemoStateContext);
    if (!value) throw new Error("useDemoState must be used inside DemoStateProvider");
    return value;
}

type StepProps = {
    mode: DemoMode;
    children: (active: boolean) => ReactNode;
    className?: string;
};

// Un paso de "Cómo funciona": cuando cruza el centro de la pantalla, el ejemplo cambia a su estado
export function DemoStep({ mode, children, className = "" }: StepProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { mode: current, setMode } = useDemoState();

    useEffect(() => {
        const element = ref.current;
        if (!element || typeof IntersectionObserver === "undefined") return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setMode(mode);
            },
            { rootMargin: "-45% 0px -45% 0px" }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [mode, setMode]);

    return (
        <div ref={ref} className={className}>
            {children(current === mode)}
        </div>
    );
}
