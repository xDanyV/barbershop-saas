// Teléfonos de México: se guardan como los 10 dígitos nacionales (ej. 6641234567).
// Acepta espacios, guiones, paréntesis y los prefijos +52 o 52 (y el antiguo 521 de celulares).
export function normalizeMxPhone(value: string): string | null {
    let digits = value.replace(/\D/g, "");

    if (digits.length === 13 && digits.startsWith("521")) digits = digits.slice(3);
    else if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2);

    return /^\d{10}$/.test(digits) ? digits : null;
}
