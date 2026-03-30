"use client";

import { useState } from "react";
import ServiceList from "./components/ServiceList";
import CreateServiceForm from "./components/CreateServiceForm";
import { Service } from "@prisma/client";
import EditServiceForm from "./components/EditServiceForm";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link"; // Importamos Link para la navegación

export default function CatalogPage() {
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Botón de retorno al Dashboard Principal */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-4"
      >
        <Link
          href="/dashboard/barber"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors group"
        >
          <LayoutDashboard size={16} className="group-hover:-translate-y-0.5 transition-transform" />
          Back to Dashboard
        </Link>
      </motion.div>

      <header className="flex justify-between items-end mb-8 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Services Catalog
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your barber shop services and pricing.</p>
        </div>

        <AnimatePresence mode="wait">
          {view === "list" ? (
            <motion.button
              key="create-btn"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setView("create")}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              <Plus size={18} />
              Create Service
            </motion.button>
          ) : (
            <motion.button
              key="back-btn"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => setView("list")}
              className="flex items-center gap-2 text-gray-600 bg-white border border-gray-200 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all active:scale-95"
            >
              <ArrowLeft size={18} />
              Back to List
            </motion.button>
          )}
        </AnimatePresence>
      </header>

      <main>
        <AnimatePresence mode="wait">
          {view === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ServiceList
                onEdit={(service) => {
                  setSelectedService(service);
                  setView("edit");
                }}
              />
            </motion.div>
          )}

          {view === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex justify-center"
            >
              <CreateServiceForm setView={setView} />
            </motion.div>
          )}

          {view === "edit" && selectedService && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex justify-center"
            >
              <EditServiceForm
                service={selectedService}
                onCancel={() => setView("list")}
                onSuccess={() => setView("list")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}