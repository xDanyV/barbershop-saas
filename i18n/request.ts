import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

type Messages = { [key: string]: string | Messages };

// Copia profunda de base con los valores de override encima
function mergeMessages(base: Messages, override: Messages): Messages {
    const result: Messages = { ...base };

    for (const [key, value] of Object.entries(override)) {
        const baseValue = result[key];
        result[key] =
            typeof value === 'object' && typeof baseValue === 'object'
                ? mergeMessages(baseValue, value)
                : value;
    }

    return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    const requested = await requestLocale;
    const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

    const defaultMessages = (await import(`../messages/${routing.defaultLocale}.json`)).default as Messages;

    if (locale === routing.defaultLocale) {
        return { locale, messages: defaultMessages };
    }

    // Las pantallas aún sin traducir (paneles de owner/admin) muestran el texto en español
    // en lugar de la clave cruda
    const localeMessages = (await import(`../messages/${locale}.json`)).default as Messages;

    return {
        locale,
        messages: mergeMessages(defaultMessages, localeMessages),
    };
});
