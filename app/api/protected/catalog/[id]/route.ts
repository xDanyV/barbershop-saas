import { NextRequest, NextResponse } from "next/server";
import { updateCatalogService, deleteCatalogService } from "@/lib/services/catalog.service";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const role = request.headers.get("x-user-role");

        if (!role) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();

        const updated = await updateCatalogService(
            params.id,
            {
                name: body.name,
                price: body.price !== undefined ? Number(body.price) : undefined,
                duration:
                    body.duration !== undefined ? Number(body.duration) : undefined,
                active: body.active,
            },
            role
        );

        return NextResponse.json(updated);

    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Internal server error";

        return NextResponse.json(
            { error: message },
            { status: 400 }
        );
    }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get("x-user-role");

    if (!role) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const deleted = await deleteCatalogService(
      params.id,
      role
    );

    return NextResponse.json(deleted);

  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}