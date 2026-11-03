import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "app"),
        },
    },
    test: {
        include: ["tests/**/*.test.ts"],
        environment: "node",
        env: {
            // Las pruebas son de lógica pura: el cliente de Prisma se crea pero nunca se conecta
            DATABASE_URL: "postgresql://test:test@localhost:5432/test",
            JWT_SECRET: "test-secret",
        },
    },
});
