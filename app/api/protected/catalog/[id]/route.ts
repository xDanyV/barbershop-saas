import { NextRequest, NextResponse } from "next/server";
import { updateCatalogService, deleteCatalogService } from "@/lib/services/catalog.service";
import { errorResponse } from "@/lib/errors";
import { requireBarberAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { toCents, updateServiceSchema } from "@/lib/validations/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { barberId } = requireBarberAuth(request);
    const { id } = await context.params;
    const { price, ...data } = await parseJsonBody(request, updateServiceSchema);

    const updated = await updateCatalogService(
      id,
      {
        ...data,
        ...(price !== undefined ? { priceCents: toCents(price) } : {}),
      },
      barberId
    );

    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error, "Catalog PATCH error");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { barberId } = requireBarberAuth(request);
    const { id } = await context.params;

    return NextResponse.json(await deleteCatalogService(id, barberId));
  } catch (error) {
    return errorResponse(error, "Catalog DELETE error");
  }
}
