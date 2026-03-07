"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    setView: (view: "list") => void;
};

export default function CreateServiceForm({ setView }: Props) {
    const router = useRouter();

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [duration, setDuration] = useState("");

    async function handleSubmit(e: any) {
        e.preventDefault();

        const res = await fetch("/api/catalog", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                price,
                duration,
            }),
        });

        if (res.ok) {
            setView("list");//Go back to list view after successful creation
        }
    }

    return (

        <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4 max-w-md"
        >

            <h2 className="text-lg font-semibold">
                Create Service
            </h2>

            <input
                placeholder="Service name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
            />

            <input
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
            />

            <input
                placeholder="Duration (minutes)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
            />

            <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
                Create
            </button>

        </form>

    );
}