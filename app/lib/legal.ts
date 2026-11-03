// Datos del responsable que aparecen en el Aviso de Privacidad y los Términos.
// La LFPDPPP exige identidad, domicilio y un medio de contacto. Completar antes del lanzamiento.
export const LEGAL_INFO: {
    name: string | null;
    address: string | null;
    email: string | null;
} = {
    name: null,
    address: null,
    email: null,
};

// Cambia cuando cambia el texto de los Términos o del Aviso; los usuarios deberán aceptarlo de nuevo
export const TERMS_VERSION = "2026-11-04";

export function isLegalInfoComplete() {
    return Boolean(LEGAL_INFO.name && LEGAL_INFO.address && LEGAL_INFO.email);
}
