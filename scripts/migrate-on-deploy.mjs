// Aplica las migraciones pendientes al desplegar a producción en Vercel. Corre antes de `next build`.
// En local, CI y vistas previas no hace nada. Si falla, el build falla y sigue activo el despliegue anterior.
import { execSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
    console.log("migrate-on-deploy: not a production deploy, skipping");
    process.exit(0);
}

const pooled = process.env.DATABASE_URL;

if (!pooled) {
    console.error("migrate-on-deploy: DATABASE_URL is not defined");
    process.exit(1);
}

// Las migraciones necesitan conexión directa: el pooler de Neon no admite los bloqueos que usa Prisma
const direct = process.env.DATABASE_URL_UNPOOLED || pooled.replace("-pooler.", ".");

execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: direct },
});
