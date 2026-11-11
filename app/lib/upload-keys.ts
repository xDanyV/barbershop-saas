// Las fotos se guardan como URL de UploadThing: https://<app>.ufs.sh/f/<key> (o el dominio anterior utfs.io).
// Para borrar el archivo hace falta su key; una URL de otro sitio no se toca.
const UPLOAD_HOST = /(^|\.)ufs\.sh$|^utfs\.io$/;

export function fileKeyFromUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    try {
        const { protocol, hostname, pathname } = new URL(url);
        if (protocol !== "https:" || !UPLOAD_HOST.test(hostname)) return null;

        const match = pathname.match(/^\/f\/([^/]+)$/);
        return match ? decodeURIComponent(match[1]) : null;
    } catch {
        return null;
    }
}

// URLs que dejaron de usarse al cambiar un valor: la anterior, si había y era distinta
export function replacedUrls(pairs: Array<[before: string | null | undefined, after: string | null | undefined]>) {
    return pairs.filter(([before, after]) => after !== undefined && before && before !== after).map(([before]) => before as string);
}
