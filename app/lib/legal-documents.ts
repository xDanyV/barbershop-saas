// Borrador del Aviso de Privacidad y de los Términos y Condiciones (es/en).
// Es una base técnica, no asesoría legal: revisar con un abogado antes del lanzamiento.
// {name}, {address} y {email} se sustituyen con LEGAL_INFO (app/lib/legal.ts).

export type LegalSection = { id: string; heading: string; paragraphs: string[] };
export type LegalDocument = { title: string; intro: string; sections: LegalSection[] };
export type LegalKind = "privacy" | "terms";

const es: Record<LegalKind, LegalDocument> = {
    privacy: {
        title: "Aviso de Privacidad",
        intro: "Este aviso explica qué datos personales tratamos, para qué y cómo puedes ejercer tus derechos, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.",
        sections: [
            {
                id: "responsable",
                heading: "Quién es responsable de tus datos",
                paragraphs: [
                    "{name}, con domicilio en {address}, es responsable del tratamiento de tus datos personales. Puedes contactarnos en {email}.",
                ],
            },
            {
                id: "datos",
                heading: "Qué datos tratamos",
                paragraphs: [
                    "Datos de identificación y contacto: nombre, correo electrónico y número de teléfono.",
                    "Si la barbería registra tu cita sin que tengas cuenta: el nombre, el teléfono (opcional) y el servicio que te agende.",
                    "Datos de tu cuenta: contraseña (guardada cifrada, nunca en texto), tipo de cuenta y la fecha en que aceptaste este aviso.",
                    "Datos de tus citas: barbería, barbero, servicio, fecha, hora y estado de la cita, incluidas cancelaciones e inasistencias.",
                    "Si administras una barbería: nombre comercial, dirección, teléfono, horarios, servicios, precios, imágenes y publicaciones que subas.",
                    "No tratamos datos personales sensibles ni datos de tarjetas o cuentas bancarias.",
                ],
            },
            {
                id: "finalidades",
                heading: "Para qué los usamos",
                paragraphs: [
                    "Crear y administrar tu cuenta; agendar, confirmar y cancelar tus citas; permitir que la barbería donde reservas vea tu cita y pueda contactarte; mantener la seguridad de la plataforma, como el registro de inasistencias y el bloqueo de cuentas que hagan mal uso; y administrar la membresía de las barberías.",
                    "Estas finalidades son necesarias para prestar el servicio. No usamos tus datos con fines publicitarios ni los vendemos.",
                ],
            },
            {
                id: "transferencias",
                heading: "Con quién los compartimos",
                paragraphs: [
                    "Con la barbería en la que reservas, únicamente los datos necesarios para atender tu cita (nombre, teléfono, correo y detalles de la cita).",
                    "Con proveedores que nos prestan servicios de alojamiento, base de datos y almacenamiento de imágenes, que tratan los datos por nuestra cuenta y no pueden usarlos para fines propios.",
                    "Fuera de esos casos, solo compartiremos datos cuando una autoridad competente lo requiera conforme a la ley.",
                ],
            },
            {
                id: "derechos",
                heading: "Tus derechos ARCO",
                paragraphs: [
                    "Puedes acceder a tus datos, rectificarlos, cancelarlos u oponerte a su tratamiento, así como revocar tu consentimiento o limitar su uso.",
                    "Desde \"Mi cuenta\" puedes corregir tu nombre y teléfono, y eliminar tu cuenta. Para cualquier otra solicitud escríbenos a {email} con tu nombre, el correo de tu cuenta y una descripción clara de lo que pides. Responderemos en un máximo de 20 días hábiles.",
                ],
            },
            {
                id: "conservacion",
                heading: "Cuánto tiempo los conservamos",
                paragraphs: [
                    "Mientras tu cuenta esté activa. Si la eliminas, tus datos de identificación y contacto se borran de inmediato; el historial de citas de la barbería se conserva sin datos que te identifiquen.",
                ],
            },
            {
                id: "cookies",
                heading: "Cookies",
                paragraphs: [
                    "Usamos únicamente cookies necesarias para que el sitio funcione: mantener tu sesión, recordar el idioma y el negocio que administras. No usamos cookies de publicidad ni de rastreo.",
                ],
            },
            {
                id: "cambios",
                heading: "Cambios a este aviso",
                paragraphs: [
                    "Publicaremos cualquier cambio en esta página con su fecha de actualización y te pediremos aceptarlo de nuevo al entrar a tu cuenta.",
                ],
            },
        ],
    },
    terms: {
        title: "Términos y Condiciones",
        intro: "Estos términos regulan el uso de la plataforma de citas en línea para barberías. Al crear una cuenta aceptas cumplirlos.",
        sections: [
            {
                id: "servicio",
                heading: "El servicio",
                paragraphs: [
                    "{name} ofrece una plataforma para que las barberías publiquen sus servicios y horarios, y para que sus clientes reserven citas. Cada barbería es independiente y responsable del servicio que presta, sus precios y su atención.",
                ],
            },
            {
                id: "cuentas",
                heading: "Tu cuenta",
                paragraphs: [
                    "Debes proporcionar datos verdaderos y mantener tu contraseña en secreto. Eres responsable de lo que se haga con tu cuenta. Si eres menor de edad necesitas permiso de tu madre, padre o tutor.",
                ],
            },
            {
                id: "clientes",
                heading: "Reservas",
                paragraphs: [
                    "Puedes tener hasta dos citas activas a la vez. Puedes cancelar una cita hasta dos horas antes de su hora. Si no te presentas, la barbería puede registrarlo como inasistencia y, si se repite, bloquear tus reservas en su negocio.",
                    "La barbería puede cancelar o reprogramar citas, por ejemplo por un día libre. En ese caso la cita aparecerá como cancelada en tu cuenta.",
                ],
            },
            {
                id: "barberias",
                heading: "Barberías",
                paragraphs: [
                    "La barbería es responsable de la información que publica (servicios, precios, horarios, imágenes y publicaciones) y de tratar los datos de sus clientes solo para atender sus citas.",
                    "Las imágenes y textos que subes deben ser tuyos o contar con permiso para usarlos. Nos das permiso de mostrarlos en la plataforma mientras tu cuenta esté activa.",
                ],
            },
            {
                id: "membresia",
                heading: "Membresía de las barberías",
                paragraphs: [
                    "Cada barbería nueva tiene 30 días de prueba sin costo. Después, el uso de la plataforma requiere una membresía mensual con el precio publicado en el sitio al momento de contratar. El pago es por adelantado.",
                    "Si un pago no se recibe a tiempo, la membresía queda con pago atrasado y, después de siete días, se suspende: la página pública deja de mostrarse y no se reciben nuevas reservas hasta regularizar el pago.",
                    "Puedes dejar de usar el servicio cuando quieras. Los periodos ya pagados no son reembolsables.",
                ],
            },
            {
                id: "uso",
                heading: "Uso no permitido",
                paragraphs: [
                    "No está permitido crear reservas falsas, suplantar a otra persona, publicar contenido ilegal u ofensivo, intentar acceder a cuentas o datos de otros, ni interferir con el funcionamiento de la plataforma.",
                ],
            },
            {
                id: "responsabilidad",
                heading: "Disponibilidad y responsabilidad",
                paragraphs: [
                    "Trabajamos para que la plataforma esté disponible y funcione bien, pero puede haber interrupciones por mantenimiento o causas fuera de nuestro control. No somos responsables del servicio que presta cada barbería ni de acuerdos entre la barbería y sus clientes.",
                ],
            },
            {
                id: "terminacion",
                heading: "Suspensión de cuentas",
                paragraphs: [
                    "Podemos suspender o cancelar cuentas que incumplan estos términos. Puedes eliminar tu cuenta en cualquier momento desde \"Mi cuenta\".",
                ],
            },
            {
                id: "cambios",
                heading: "Cambios y ley aplicable",
                paragraphs: [
                    "Publicaremos cualquier cambio en esta página y te pediremos aceptarlo de nuevo. Estos términos se rigen por las leyes de México; cualquier controversia se atenderá ante los tribunales de Tijuana, Baja California.",
                    "Contacto: {email}.",
                ],
            },
        ],
    },
};

const en: Record<LegalKind, LegalDocument> = {
    privacy: {
        title: "Privacy Notice",
        intro: "This notice explains which personal data we process, why, and how you can exercise your rights, under Mexico's Federal Law on the Protection of Personal Data Held by Private Parties.",
        sections: [
            { id: "responsable", heading: "Who is responsible for your data", paragraphs: ["{name}, located at {address}, is responsible for processing your personal data. You can contact us at {email}."] },
            {
                id: "datos",
                heading: "What data we process",
                paragraphs: [
                    "Identification and contact data: name, email address and phone number.",
                    "If a barbershop records your appointment and you have no account: the name, the phone number (optional) and the service it books for you.",
                    "Account data: password (stored encrypted, never in plain text), account type and the date you accepted this notice.",
                    "Booking data: barbershop, barber, service, date, time and status, including cancellations and no-shows.",
                    "If you run a barbershop: business name, address, phone, opening hours, services, prices, and the images and posts you upload.",
                    "We do not process sensitive personal data or card or bank account details.",
                ],
            },
            {
                id: "finalidades",
                heading: "What we use it for",
                paragraphs: [
                    "To create and manage your account; to book, confirm and cancel appointments; to let the barbershop where you book see your appointment and contact you; to keep the platform safe, such as recording no-shows and blocking accounts that misuse it; and to manage barbershop memberships.",
                    "These purposes are required to provide the service. We do not use your data for advertising and we do not sell it.",
                ],
            },
            {
                id: "transferencias",
                heading: "Who we share it with",
                paragraphs: [
                    "With the barbershop where you book, only the data needed to serve your appointment (name, phone, email and booking details).",
                    "With providers of hosting, database and image storage services, who process data on our behalf and cannot use it for their own purposes.",
                    "Other than that, we only share data when a competent authority requires it under the law.",
                ],
            },
            {
                id: "derechos",
                heading: "Your ARCO rights",
                paragraphs: [
                    "You can access, rectify or cancel your data, object to its processing, revoke your consent or limit its use.",
                    "From \"My account\" you can correct your name and phone and delete your account. For any other request, write to {email} with your name, your account email and a clear description of your request. We will answer within 20 business days.",
                ],
            },
            { id: "conservacion", heading: "How long we keep it", paragraphs: ["While your account is active. If you delete it, your identification and contact data are erased immediately; the barbershop's booking history is kept without data that identifies you."] },
            { id: "cookies", heading: "Cookies", paragraphs: ["We only use cookies the site needs to work: keeping you signed in, remembering your language and the business you manage. We do not use advertising or tracking cookies."] },
            { id: "cambios", heading: "Changes to this notice", paragraphs: ["We will publish any change on this page with its update date and ask you to accept it again when you sign in."] },
        ],
    },
    terms: {
        title: "Terms and Conditions",
        intro: "These terms govern the use of the online booking platform for barbershops. By creating an account you agree to them.",
        sections: [
            { id: "servicio", heading: "The service", paragraphs: ["{name} provides a platform where barbershops publish their services and hours and their clients book appointments. Each barbershop is independent and responsible for the service it provides, its prices and its customer care."] },
            { id: "cuentas", heading: "Your account", paragraphs: ["You must provide accurate information and keep your password secret. You are responsible for what is done with your account. If you are under 18 you need permission from a parent or guardian."] },
            {
                id: "clientes",
                heading: "Bookings",
                paragraphs: [
                    "You can have up to two active appointments at a time. You can cancel an appointment up to two hours before it starts. If you do not show up, the barbershop may record a no-show and, if it keeps happening, block your bookings at that business.",
                    "The barbershop may cancel or reschedule appointments, for example on a day off. In that case the appointment will show as cancelled in your account.",
                ],
            },
            {
                id: "barberias",
                heading: "Barbershops",
                paragraphs: [
                    "The barbershop is responsible for the information it publishes (services, prices, hours, images and posts) and for using its clients' data only to serve their appointments.",
                    "Images and text you upload must be yours or used with permission. You allow us to display them on the platform while your account is active.",
                ],
            },
            {
                id: "membresia",
                heading: "Barbershop membership",
                paragraphs: [
                    "Each new barbershop gets a free 30-day trial. After that, using the platform requires a monthly membership at the price published on the site when it signs up. Payment is made in advance.",
                    "If a payment is not received on time, the membership becomes past due and, after seven days, it is suspended: the public page is hidden and no new bookings are accepted until payment is made.",
                    "You can stop using the service at any time. Periods already paid are not refundable.",
                ],
            },
            { id: "uso", heading: "Prohibited use", paragraphs: ["You may not create fake bookings, impersonate someone else, publish illegal or offensive content, try to access other people's accounts or data, or interfere with the platform."] },
            { id: "responsabilidad", heading: "Availability and liability", paragraphs: ["We work to keep the platform available and working well, but there may be interruptions for maintenance or causes beyond our control. We are not responsible for the service each barbershop provides or for agreements between a barbershop and its clients."] },
            { id: "terminacion", heading: "Account suspension", paragraphs: ["We may suspend or close accounts that break these terms. You can delete your account at any time from \"My account\"."] },
            {
                id: "cambios",
                heading: "Changes and governing law",
                paragraphs: [
                    "We will publish any change on this page and ask you to accept it again. These terms are governed by the laws of Mexico; any dispute will be heard by the courts of Tijuana, Baja California.",
                    "Contact: {email}.",
                ],
            },
        ],
    },
};

const documents = { es, en };

export function getLegalDocument(kind: LegalKind, locale: string): LegalDocument {
    return (locale === "en" ? documents.en : documents.es)[kind];
}
