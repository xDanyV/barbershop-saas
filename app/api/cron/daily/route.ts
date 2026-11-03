import { NextResponse } from "next/server";
import {
    completePastAppointments,
    expireUnconfirmedAppointments,
    updateExpiredSubscriptions,
} from "@/lib/cron/tasks";

const TASKS = {
    appointments: completePastAppointments,
    unconfirmed: expireUnconfirmedAppointments,
    billing: updateExpiredSubscriptions,
};

// Único cron diario (Vercel): ejecuta todas las tareas; un fallo en una no detiene las demás
export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const entries = Object.entries(TASKS);
    const results = await Promise.allSettled(entries.map(([, task]) => task(now)));

    const report: Record<string, unknown> = {};
    let failed = false;

    results.forEach((result, index) => {
        const name = entries[index][0];

        if (result.status === "fulfilled") {
            report[name] = result.value;
        } else {
            failed = true;
            console.error(`Cron task "${name}" failed:`, result.reason);
            report[name] = { error: "failed" };
        }
    });

    return NextResponse.json(report, { status: failed ? 500 : 200 });
}
