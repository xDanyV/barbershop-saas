// Crea otro administrador de la plataforma, o convierte en administrador a un cliente que ya existe.
//
//   npm run admin:create -- --email correo@ejemplo.com --name "Nombre" --phone 6641234567
//
// Usa el DATABASE_URL del entorno y, si no hay, el de .env. Producción tiene su propia base:
// para usarla, define DATABASE_URL con la URL de producción antes de correr el comando.
// Si crea la cuenta, muestra una vez una contraseña temporal que se cambia en "Mi cuenta".
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const { values } = parseArgs({
    options: {
        email: { type: "string" },
        name: { type: "string" },
        phone: { type: "string" },
    },
});

const email = values.email?.trim().toLowerCase();

if (!email || !email.includes("@")) {
    console.error('Usage: npm run admin:create -- --email correo@ejemplo.com --name "Nombre" --phone 6641234567');
    process.exit(1);
}

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined");
    process.exit(1);
}

console.log(`Database host: ${new URL(process.env.DATABASE_URL).hostname}`);

const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

// Sin autor: lo hizo quien tiene acceso a la base, no alguien con sesión
function recordCreated(userId) {
    return prisma.auditLog.create({ data: { action: "admin_created", targetType: "user", targetId: userId } });
}

function fail(message) {
    console.error(message);
    process.exitCode = 1;
}

try {
    const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, deletedAt: true },
    });

    if (existing?.deletedAt) {
        fail("That account was deleted and cannot become an administrator.");
    } else if (existing?.role === "ADMIN") {
        console.log("That account is already an administrator. Nothing changed.");
    } else if (existing && existing.role !== "CUSTOMER") {
        // Un dueño o barbero perdería acceso a su negocio al cambiar de rol
        fail(`That account is ${existing.role} and has a business. Use a different email.`);
    } else if (existing) {
        await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
        await recordCreated(existing.id);
        console.log(`${email} is now an administrator. Their password did not change.`);
    } else {
        const digits = values.phone?.replace(/\D/g, "") ?? "";
        const name = values.name?.trim();

        if (!name || digits.length !== 10) {
            fail("New accounts need --name and a 10-digit --phone.");
        } else {
            const password = randomBytes(12).toString("base64url");

            // Sin aceptar términos: se le piden en su primer inicio de sesión
            const created = await prisma.user.create({
                data: { email, name, phone: digits, role: "ADMIN", password: await bcrypt.hash(password, 10) },
                select: { id: true },
            });
            await recordCreated(created.id);

            console.log(`Administrator created: ${email}`);
            console.log(`Temporary password (shown only once): ${password}`);
        }
    }
} catch (error) {
    fail(error.code === "P2002" ? "That phone number is already registered." : `Could not create the administrator: ${error.message}`);
} finally {
    await prisma.$disconnect();
}
