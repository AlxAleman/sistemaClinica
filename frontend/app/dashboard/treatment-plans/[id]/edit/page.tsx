"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { treatmentPlanService, TreatmentPlan, UpdateTreatmentPlanData } from "@/services/treatmentPlanService";
import { patientService } from "@/services/patientService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PatientSelector from "@/components/PatientSelector";
import StatusSelector from "@/components/StatusSelector";

export default function EditTreatmentPlanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [formData, setFormData] = useState<UpdateTreatmentPlanData>({
    patientId: "",
    title: "",
    description: "",
    diagnosis: "",
    goals: "",
    sessionsPlanned: 10,
    totalCost: undefined,
    status: "DRAFT",
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [planData, patientsRes] = await Promise.all([
        treatmentPlanService.getById(id),
        patientService.getAll({ limit: 1000 }),
      ]);

      setPlan(planData);
      setPatients(patientsRes.patients);

      // Prellenar formulario con datos del plan
      setFormData({
        patientId: planData.patientId,
        title: planData.title,
        description: planData.description || "",
        diagnosis: planData.diagnosis || "",
        goals: planData.goals || "",
        sessionsPlanned: planData.sessionsPlanned,
        totalCost: planData.totalCost || undefined,
        status: planData.status,
      });
    } catch (error: any) {
      toast.error("Error al cargar datos");
      router.push("/dashboard/treatment-plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await treatmentPlanService.update(id, {
        ...formData,
        description: formData.description || null,
        diagnosis: formData.diagnosis || null,
        goals: formData.goals || null,
        totalCost: formData.totalCost || null,
      });
      toast.success("Plan de tratamiento actualizado exitosamente");
      router.push(`/dashboard/treatment-plans/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar plan de tratamiento");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando plan de tratamiento...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Planes de Tratamiento", href: "/dashboard/treatment-plans" },
          { label: "Editar Plan" },
        ]}
      />

      <div className="mb-6">
        <Link
          href={`/dashboard/treatment-plans/${id}`}
          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
        >
          ← Volver a Detalle del Plan
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">
          Editar Plan de Tratamiento
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paciente */}
          <PatientSelector
            patients={patients}
            value={formData.patientId || ""}
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
              />
            </div>
          </div>

          {/* Estado */}
          <StatusSelector
            value={formData.status || "DRAFT"}
            onChange={(status) =>
              setFormData({
                ...formData,
                status: status as UpdateTreatmentPlanData["status"],
              })
            }
            label="Estado"
            options={[
              { value: "DRAFT", label: "Borrador" },
              { value: "PENDING_APPROVAL", label: "Pendiente de Aprobación" },
              { value: "APPROVED", label: "Aprobado" },
              { value: "IN_PROGRESS", label: "En Progreso" },
              { value: "COMPLETED", label: "Completado" },
              { value: "CANCELLED", label: "Cancelado" },
            ]}
          />

          <div className="flex justify-end gap-3">
            <Link
              href={`/dashboard/treatment-plans/${id}`}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

