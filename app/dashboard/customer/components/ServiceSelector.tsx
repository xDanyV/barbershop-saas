"use client";

type Props = {
  selectedService: string | null;
  setSelectedService: (service: string) => void;
};

const services = [
  "Haircut",
  "Beard Trim",
  "Haircut + Beard",
];

export default function ServiceSelector({
  selectedService,
  setSelectedService,
}: Props) {

  return (
    <div className="bg-white p-6 rounded-xl shadow">

      <h3 className="font-semibold mb-4">
        Select Service
      </h3>

      <div className="flex gap-4 flex-wrap">

        {services.map((service) => (
          <button
            key={service}
            onClick={() => setSelectedService(service)}
            className={`px-4 py-2 rounded-lg border transition
            ${
              selectedService === service
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
            }`}
          >
            {service}
          </button>
        ))}

      </div>
    </div>
  );
}