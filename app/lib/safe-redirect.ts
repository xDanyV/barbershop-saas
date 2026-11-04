// Solo rutas internas: un enlace de redirección nunca debe poder sacar a alguien del sitio
export function safeRedirectPath(value: string | null | undefined) {
    if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
        return null;
    }

    return value;
}
