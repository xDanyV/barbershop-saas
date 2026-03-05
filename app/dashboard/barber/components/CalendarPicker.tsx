"use client";

type Props = {
    selectedDate: string;
    onChange: (date: string) => void;
};

export default function CalendarPicker({ selectedDate, onChange }: Props) {
    return (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-2">
                Select Day
            </label>

            <input
                type="date"
                value={selectedDate}
                onChange={(e) => onChange(e.target.value)}
                className="border rounded-lg px-3 py-2 w-full"
            />
        </div>
    );
}