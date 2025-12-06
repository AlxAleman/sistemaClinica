"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { treatmentPlanService, CreateTreatmentPlanData } from "@/services/treatmentPlanService";
import { patientService } from "@/services/patientService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PatientSelector from "@/components/PatientSelector";
import StatusSelector from "@/components/StatusSelector";

export default function NewTreatmentPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patientId");
  
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [formData, setFormData] = useState<CreateTreatmentPlanData>({
    patientId: patientIdParam || "",
    title: "",
    description: "",
    diagnosis: "",
    goals: "",
    sessionsPlanned: 10,
    totalCost: undefined,
    status: "DRAFT",
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll({ limit: 1000 });
      setPatients(response.patients);
    } catch (error) {
      toast.error("Error al cargar pacientes");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await treatmentPlanService.create({
        ...formData,
        description: formData.description || null,
        diagnosis: formData.diagnosis || null,
        goals: formData.goals || null,
        totalCost: formData.totalCost || null,
      });
      toast.success("Plan de tratamiento creado exitosamente");
      router.push("/dashboard/treatment-plans");
    } catch (error: any) {
      toast.error(error.message || "Error al crear plan de tratamiento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Planes de Tratamiento", href: "/dashboard/treatment-plans" },
          { label: "Nuevo Plan" },
        ]}
      />

      <div className="mb-6">
        <Link
          href="/dashboard/treatment-plans"
          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
        >
          ← Volver a Planes de Tratamiento
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">
          Nuevo Plan de Tratamiento
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paciente */}
          <PatientSelector
            patients={patients}
            value={formData.patientId}
            onChange={(patientId) => setFormData({ ...formData, patientId })}
            required
          />

          {/* Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Título del Plan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              placeholder="Ej: Plan de Rehabilitación Post-Operatoria"
            />
          </div>

          {/* Diagnóstico */}
          <div>
            <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Diagnóstico
            </label>
            <textarea
              id="diagnosis"
              rows={3}
              value={formData.diagnosis || ""}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              placeholder="Diagnóstico del paciente..."
            />
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción del Plan
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              placeholder="Descripción detallada del plan de tratamiento..."
            />
          </div>

          {/* Objetivos */}
          <div>
            <label htmlFor="goals" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Objetivos del Tratamiento
            </label>
            <textarea
              id="goals"
              rows={4}
              value={formData.goals || ""}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              placeholder="Objetivos que se esperan alcanzar con este tratamiento..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sesiones Planificadas */}
            <div>
              <label htmlFor="sessionsPlanned" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sesiones Planificadas <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="sessionsPlanned"
                required
                min="1"
                value={formData.sessionsPlanned}
                onChange={(e) => setFormData({ ...formData, sessionsPlanned: parseInt(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Costo Total */}
            <div>
              <label htmlFor="totalCost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Costo Total (Opcional)
              </label>
              <input
                type="number"
                id="totalCost"
                min="0"
                step="0.01"
                value={formData.totalCost || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalCost: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Estado */}
          <StatusSelector
            value={formData.status || "DRAFT"}
            onChange={(status) =>
              setFormData({
                ...formData,
                status: status as CreateTreatmentPlanData["status"],
              })
            }
            label="Estado Inicial"
            options={[
              { value: "DRAFT", label: "Borrador" },
              { value: "PENDING_APPROVAL", label: "Pendiente de Aprobación" },
              { value: "APPROVED", label: "Aprobado" },
            ]}
          />

          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard/treatment-plans"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Guardando..." : "Crear Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

