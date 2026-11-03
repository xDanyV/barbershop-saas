import "dotenv/config";
import { defineConfig } from "prisma/config";

// Neon suspende la base tras unos minutos sin uso y tarda unos segundos en despertar.
// La CLI (migrate, studio) espera 5 s por defecto; con más margen evita errores P1001.
function withConnectTimeout(url: string | undefined, seconds = 30) {
  if (!url || url.includes("connect_timeout=")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}connect_timeout=${seconds}`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: withConnectTimeout(process.env.DATABASE_URL)!,
  },
});
