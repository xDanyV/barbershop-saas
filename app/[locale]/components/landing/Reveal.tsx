"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type Props = {
    children: ReactNode;
    as?: ElementType;
    className?: string;
    // Retraso escalonado (ms) para que título, texto e imagen entren uno tras otro
    delay?: number;
};

// Entrada suave al aparecer en pantalla. Lo que ya está visible al cargar nunca se oculta,
// y sin JavaScript el contenido se ve normal.
export default function Reveal({ children, as: Tag = "div", className = "", delay = 0 }: Props) {
    const ref = useRef<HTMLElement>(null);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element || typeof IntersectionObserver === "undefined") return;

        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHidden(false);
                    observer.disconnect();
                }
            },
            { rootMargin: "0px 0px -10% 0px" }
        );

        // Solo se oculta lo que está debajo del primer pantallazo
        requestAnimationFrame(() => setHidden(true));
        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    return (
        <Tag
            ref={ref}
            className={`reveal ${className}`}
            data-hidden={hidden ? "true" : "false"}
            style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
        >
            {children}
        </Tag>
    );
}
