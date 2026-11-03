import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Errores de negocio cuyo mensaje es seguro mostrar al cliente
export class AppError extends Error {
    constructor(message: string, public status = 400) {
        super(message);
        this.name = "AppError";
    }
}

// Devuelve el mensaje solo si es un AppError; cualquier otro error se registra y se oculta
export function errorResponse(error: unknown, context: string) {
    if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // Violación de restricción única (p. ej. servicio con el mismo nombre)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "Resource already exists" }, { status: 409 });
    }

    console.error(`${context}:`, error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
