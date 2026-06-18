import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { jwtVerify } from "jose";

const f = createUploadthing();

type JwtPayload = {
    userId?: string;
    role?: string;
    barberId?: string;
    businessId?: string;
};

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
    const token = getCookieValue(req.headers.get("cookie"), "token");

    if (!token) {
        throw new UploadThingError("Unauthorized");
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new UploadThingError("Server configuration error");
    }

    try {
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(token, secret);

        const userId = payload.userId as JwtPayload["userId"];
        const role = payload.role as JwtPayload["role"];
        const businessId = payload.businessId as JwtPayload["businessId"];

        if (!userId || !role) {
            throw new UploadThingError("Invalid session");
        }

        if (role !== "ADMIN" && role !== "OWNER") {
            throw new UploadThingError("Unauthorized");
        }

        return {
            userId,
            role,
            businessId,
        };
    } catch {
        throw new UploadThingError("Invalid or expired session");
    }
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
            const auth = await getAuthFromRequest(req);

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
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;