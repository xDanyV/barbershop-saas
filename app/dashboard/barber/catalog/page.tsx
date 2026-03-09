"use client";

import { useState } from "react";
import ServiceList from "./components/ServiceList";
import CreateServiceForm from "./components/CreateServiceForm";
import { Service } from "@prisma/client";
import EditServiceForm from "./components/EditServiceForm";

export default function CatalogPage() {

  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <h1 className="text-2xl font-semibold">
          Services Catalog
        </h1>

        {view === "list" && (
          <button
            onClick={() => setView("create")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Create Service
          </button>
        )}

        {view === "create" && (
          <button
            onClick={() => setView("list")}
            className="bg-gray-200 px-4 py-2 rounded-lg"
          >
            Back
          </button>
        )}

      </div>

      {view === "list" && (
        <ServiceList
          onEdit={(service) => {
            setSelectedService(service);
            setView("edit");
          }}
        />
      )}

      {view === "create" && <CreateServiceForm setView={setView} />}

      {view === "edit" && selectedService && (
        <EditServiceForm
          service={selectedService}
          onCancel={() => setView("list")}
          onSuccess={() => setView("list")}
        />
      )}


    </div>
  );
}