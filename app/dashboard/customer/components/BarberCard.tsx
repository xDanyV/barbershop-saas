"use client";

type Barber = {
    id: string;
    user: {
        name: string | null;
        email: string;
        phone: string;
    };
};

type Props = {
    barber: Barber;
};

export default function BarberCard({ barber }: Props) {
    const initials = barber.user.name
        ? barber.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "B";

    return (
        <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">

            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 ring-2 ring-indigo-200">
                <span className="text-indigo-600 font-semibold text-lg">{initials}</span>
            </div>

            {/* Info */}
            <div>
                <p className="font-semibold text-gray-800 text-base">
                    {barber.user.name ?? "Barber"}
                </p>
                <p className="text-sm text-gray-400">{barber.user.phone}</p>
                <p className="text-sm text-gray-400">{barber.user.email}</p>
            </div>

        </div>
    );
}