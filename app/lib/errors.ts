import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { API_ERROR_CODES } from "@/lib/api-errors";

// Errores de negocio cuyo mensaje es seguro mostrar al cliente
export class AppError extends Error {
    // code: para que la pantalla muestre su propio texto traducido
    constructor(message: string, public status = 400, public code?: string) {
        super(message);
        this.name = "AppError";
    }
}

// Devuelve el mensaje solo si es un AppError; cualquier otro error se registra y se oculta
export function errorResponse(error: unknown, context: string) {
    if (error instanceof AppError) {
        const retryAfter = "retryAfter" in error && typeof error.retryAfter === "number" ? error.retryAfter : null;
        return NextResponse.json(
            { error: error.message, code: error.code ?? API_ERROR_CODES[error.message] },
            { status: error.status, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
        );
    }

    // Violación de restricción única (p. ej. servicio con el mismo nombre)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "Resource already exists", code: "ALREADY_EXISTS" }, { status: 409 });
    }

    console.error(`${context}:`, error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
