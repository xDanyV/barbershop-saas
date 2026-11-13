import { notFound } from "next/navigation";

// Cualquier ruta que no existe dentro de /es o /en muestra la página "no encontrada" en su idioma
export default function CatchAllPage() {
    notFound();
}
