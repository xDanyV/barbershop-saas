import { NextRequest, NextResponse } from "next/server";
import { updateAppointmentStatus } from "@/lib/services/appointment.service";
import { errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { updateAppointmentStatusSchema } from "@/lib/validations/schemas";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    const { status } = await parseJsonBody(request, updateAppointmentStatusSchema);
    const { id } = await context.params;

    const updated = await updateAppointmentStatus(id, status, auth.userId, auth.role, {
      barberId: auth.barberId,
      businessId: auth.businessId,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error, "Update appointment status error");
  }
}
