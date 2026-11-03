# BarberSaaS

Sistema de citas para barberías pequeñas de Tijuana y Baja California. Cada barbería tiene su página pública (con QR), sus barberos, servicios y horarios, y sus clientes reservan en línea.

## Roles

| Rol | Qué puede hacer |
| --- | --- |
| **CUSTOMER** | Explorar barberías, reservar y cancelar citas (hasta 2 activas). |
| **BARBER** | Se registra con el enlace o slug de una barbería y espera aprobación. Gestiona su agenda, servicios, días libres y citas. |
| **OWNER** | Crea su negocio (un cliente que crea un negocio pasa a OWNER). Edita el perfil público, galería y publicaciones, aprueba barberos, gestiona la agenda de cualquier barbero de su equipo y bloquea clientes en su negocio. |
| **ADMIN** | Administrador de la plataforma: suscripciones de los negocios, mantenimiento global y bloqueo global de cuentas. Se crea registrándose con `ADMIN_BOOTSTRAP_EMAIL`. |

## Stack

- Next.js 16 (App Router) + React 19, Tailwind CSS 4
- Prisma 7 con Postgres en Neon (`@prisma/adapter-neon`)
- Sesión con JWT en cookie (`jose`); el proxy recarga rol, ban y negocio desde la base en cada petición
- next-intl (español por defecto, inglés en las pantallas del cliente)
- zod para validar las APIs, UploadThing para imágenes
- Vitest para pruebas

## Desarrollo local

```bash
npm install
cp .env.example .env   # completa los valores
npx prisma migrate deploy
npm run dev
```

La app queda en http://localhost:3000 (redirige a `/es`).

### Scripts

| Script | Uso |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin emitir |
| `npm test` | Pruebas (Vitest) |

## Conceptos clave

- **Zona horaria:** cada negocio tiene `timezone` (por defecto `America/Tijuana`). Los horarios del barbero (`HH:mm`) son hora local del negocio y las citas se guardan en UTC. Ver `app/lib/time/zoned.ts`.
- **Reservas:** `app/lib/services/booking.service.ts` calcula los huecos libres (horario, descanso, citas existentes con su duración y días libres). Crear una cita vuelve a validar el hueco dentro de una transacción con un bloqueo de Postgres por barbero y por cliente, así que no puede haber dobles reservas.
- **Precios:** en centavos enteros (`priceCents`, `monthlyPriceCents`), MXN.
- **Suscripciones:** `BusinessSubscription` es la única fuente de verdad del plan y el estado. Los negocios suspendidos o cancelados no aparecen en la parte pública.
- **Caché:** la página pública y la de reserva de cada negocio se cachean 5 minutos; las rutas que editan esos datos llaman a `revalidateBusinessPages`.
- **APIs:** cada ruta valida su cuerpo con los schemas de `app/lib/validations/schemas.ts` y lee la sesión con `requireAuth` / `requireBarberAuth` / `requireOwnerAuth` (`app/lib/api/auth.ts`). Los errores de negocio usan `AppError`; el resto responde 500 sin detalles.

## Cron diario

`vercel.json` programa `/api/cron/daily` a las 08:00 UTC (medianoche en Tijuana). Ejecuta:

- Citas confirmadas que ya pasaron → `COMPLETED`
- Citas pendientes cuya hora pasó sin confirmar → `CANCELLED`
- Suscripciones manuales vencidas → `PAST_DUE`, y a los 7 días → `SUSPENDED`

Requiere `CRON_SECRET`.

## Despliegue (Vercel)

1. Configura las variables de `.env.example` en Vercel.
2. Fusiona a la rama de producción y espera el despliegue.
3. Si el cambio trae migraciones, aplícalas con `npx prisma migrate deploy`. Las notas de cada PR indican si la migración es compatible con el código anterior o si hay que aplicarla justo después del despliegue.

Neon suspende la base tras unos minutos sin uso; `prisma.config.ts` da 30 s a la CLI para que la base despierte.
