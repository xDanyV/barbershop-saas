import { z } from "zod";
import { AppError } from "@/lib/errors";

// Lee y valida el cuerpo JSON; cualquier error de formato responde 400 con un mensaje claro
export async function parseJsonBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        throw new AppError("Invalid JSON body");
    }

    const result = schema.safeParse(body);

    if (!result.success) {
        const issue = result.error.issues[0];
        const path = issue.path.join(".");
        throw new AppError(path ? `${path}: ${issue.message}` : issue.message, 400, path === "phone" ? "INVALID_PHONE" : "VALIDATION");
    }

    return result.data;
}
