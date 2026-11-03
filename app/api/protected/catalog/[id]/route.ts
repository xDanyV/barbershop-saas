import { NextRequest, NextResponse } from "next/server";
import { updateCatalogService, deleteCatalogService } from "@/lib/services/catalog.service";
import { errorResponse } from "@/lib/errors";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const role = request.headers.get("x-user-role");
    const barberId = request.headers.get("x-barber-id");

    if (!role || !barberId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const updated = await updateCatalogService(
      id,
      {
        name: body.name,
        price: body.price !== undefined ? Number(body.price) : undefined,
        duration: body.duration !== undefined ? Number(body.duration) : undefined,
        active: body.active,
      },
      role,
      barberId
    );

    return NextResponse.json(updated);

  } catch (error) {
    return errorResponse(error, "Catalog PATCH error");
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const role = request.headers.get("x-user-role");
    const barberId = request.headers.get("x-barber-id");

    if (!role || !barberId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const deleted = await deleteCatalogService(id, role, barberId);

    return NextResponse.json(deleted);

  } catch (error) {
    return errorResponse(error, "Catalog DELETE error");
  }
}