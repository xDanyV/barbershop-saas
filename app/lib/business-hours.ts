import { timeToMinutes } from "@/lib/time/zoned";

export type HoursRow = {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
};

export type DayHours = {
    dayOfWeek: number;
    open: string | null;
    close: string | null;
};

// Lunes primero, como se lee un horario en México (0 = domingo)
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

// El horario del negocio es la unión de los horarios de sus barberos: abre con el primero y cierra con el último
export function computeBusinessHours(rows: HoursRow[]): DayHours[] {
    return WEEK_ORDER.map((dayOfWeek) => {
        const day = rows.filter((row) => row.dayOfWeek === dayOfWeek);

        if (day.length === 0) return { dayOfWeek, open: null, close: null };

        const open = day.reduce(
            (min, row) => (timeToMinutes(row.startTime) < timeToMinutes(min) ? row.startTime : min),
            day[0].startTime
        );
        const close = day.reduce(
            (max, row) => (timeToMinutes(row.endTime) > timeToMinutes(max) ? row.endTime : max),
            day[0].endTime
        );

        return { dayOfWeek, open, close };
    });
}
