import { Star } from "lucide-react";

// Cinco estrellas de solo lectura; el número va en el texto para lectores de pantalla
export default function Stars({ value, size = 16, label }: { value: number; size?: number; label: string }) {
    return (
        <span role="img" aria-label={label} className="inline-flex shrink-0 items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    size={size}
                    aria-hidden="true"
                    className={n <= Math.round(value) ? "fill-[var(--brand-accent,#e8603a)] text-[var(--brand-accent,#e8603a)]" : "text-[#c9d2d4]"}
                />
            ))}
        </span>
    );
}
