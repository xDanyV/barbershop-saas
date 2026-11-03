import { Scissors } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";

type Props = {
    // Clases del recuadro del ícono (tamaño, color, fondo, esquinas)
    iconClassName?: string;
    iconSize?: number;
    // Clases del nombre, que solo aparece cuando BRAND_NAME está definido
    nameClassName?: string;
    className?: string;
};

// Marca de la app: ícono de tijeras y, cuando exista, el nombre comercial
export default function BrandMark({
    iconClassName = "h-8 w-8 rounded-lg bg-indigo-500 text-white",
    iconSize = 16,
    nameClassName = "font-black tracking-tight",
    className = "",
}: Props) {
    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <span className={`inline-flex shrink-0 items-center justify-center ${iconClassName}`}>
                <Scissors size={iconSize} aria-hidden="true" />
            </span>
            {BRAND_NAME ? (
                <span className={nameClassName}>{BRAND_NAME}</span>
            ) : (
                <span className="sr-only">Inicio</span>
            )}
        </span>
    );
}
