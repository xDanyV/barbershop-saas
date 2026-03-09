"use client";

import { useState } from "react";

type Service = {
    id: string;
    name: string;
    price: number;
    duration: number;
};

type Props = {
    service: Service;
    onCancel: () => void;
    onSuccess: () => void;
};

export default function EditServiceForm({ service, onCancel, onSuccess }: Props) {

    const [name, setName] = useState(service.name);
    const [price, setPrice] = useState(service.price);
    const [duration, setDuration] = useState(service.duration);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const res = await fetch(`/api/protected/catalog/${service.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "x-user-role": "BARBER",
            },
            body: JSON.stringify({
                name,
                price,
                duration,
            }),
        });

        if (res.ok) {
            onSuccess();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">

            <h2 className="text-lg font-semibold">Edit Service</h2>

            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Service name"
                className="border p-2 w-full"
            />

            <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="Price"
                className="border p-2 w-full"
            />

            <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                placeholder="Duration"
                className="border p-2 w-full"
            />

            <div className="flex gap-4">

                <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                    Update
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="border px-4 py-2 rounded"
                >
                    Cancel
                </button>

            </div>

        </form>
    );
}