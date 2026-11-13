import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import {
    ACTIVE_BUSINESS_COOKIE,
    SESSION_COOKIE,
    getSessionFromToken,
} from "@/lib/auth/session";

const f = createUploadthing();

function getCookieValue(cookieHeader: string | null, name: string) {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

    const targetCookie = cookies.find((cookie) =>
        cookie.startsWith(`${name}=`)
    );

    if (!targetCookie) return null;

    return decodeURIComponent(targetCookie.split("=")[1] ?? "");
}

async function getAuthFromRequest(req: Request) {
    const cookieHeader = req.headers.get("cookie");

    const session = await getSessionFromToken(
        getCookieValue(cookieHeader, SESSION_COOKIE) ?? undefined,
        getCookieValue(cookieHeader, ACTIVE_BUSINESS_COOKIE)
    ).catch(() => null);

    if (!session) {
        throw new UploadThingError("Invalid or expired session");
    }

    if (session.role !== "ADMIN" && session.role !== "OWNER") {
        throw new UploadThingError("Unauthorized");
    }

    return {
        userId: session.userId,
        role: session.role,
        businessId: session.businessId ?? undefined,
    };
}

// La foto de perfil la sube el propio barbero (o el dueño, que también atiende), sin importar a quién gestione
async function getOwnBarberAuth(req: Request) {
    const session = await getSessionFromToken(getCookieValue(req.headers.get("cookie"), SESSION_COOKIE) ?? undefined).catch(() => null);

    if (!session) throw new UploadThingError("Invalid or expired session");
    if (!session.barberId || (session.role !== "BARBER" && session.role !== "OWNER")) {
        throw new UploadThingError("Only barbers can upload a profile photo");
    }

    return { userId: session.userId, role: session.role, businessId: session.businessId ?? undefined };
}

function assertOwner(role: string) {
    if (role !== "OWNER") {
        throw new UploadThingError("Only business owners can upload this image");
    }
}

export const ourFileRouter = {
    barberProfileImage: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 1,
        },
    })
        .middleware(async ({ req }) => {
            const auth = await getOwnBarberAuth(req);

            return {
                userId: auth.userId,
                role: auth.role,
                businessId: auth.businessId,
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return {
                uploadedBy: metadata.userId,
                url: file.ufsUrl,
            };
        }),

    businessLogoImage: f({
        image: {
            maxFileSize: "2MB",
            maxFileCount: 1,
        },
    })
        .middleware(async ({ req }) => {
            const auth = await getAuthFromRequest(req);

            assertOwner(auth.role);

            return {
                userId: auth.userId,
                role: auth.role,
                businessId: auth.businessId,
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return {
                uploadedBy: metadata.userId,
                url: file.ufsUrl,
            };
        }),

    businessCoverImage: f({
        image: {
            maxFileSize: "8MB",
            maxFileCount: 1,
        },
    })
        .middleware(async ({ req }) => {
            const auth = await getAuthFromRequest(req);

            assertOwner(auth.role);

            return {
                userId: auth.userId,
                role: auth.role,
                businessId: auth.businessId,
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return {
                uploadedBy: metadata.userId,
                url: file.ufsUrl,
            };
        }),
    businessGalleryImage: f({
        image: {
            maxFileSize: "8MB",
            maxFileCount: 1,
        },
    })
        .middleware(async ({ req }) => {
            const auth = await getAuthFromRequest(req);

            assertOwner(auth.role);

            return {
                userId: auth.userId,
                role: auth.role,
                businessId: auth.businessId,
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return {
                uploadedBy: metadata.userId,
                url: file.ufsUrl,
            };
        }),
    businessPostImage: f({
        image: {
            maxFileSize: "8MB",
            maxFileCount: 1,
        },
    })
        .middleware(async ({ req }) => {
            const auth = await getAuthFromRequest(req);

            assertOwner(auth.role);

            return {
                userId: auth.userId,
                role: auth.role,
                businessId: auth.businessId,
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return {
                uploadedBy: metadata.userId,
                url: file.ufsUrl,
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;