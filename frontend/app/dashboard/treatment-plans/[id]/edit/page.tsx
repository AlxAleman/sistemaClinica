"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { treatmentPlanService, TreatmentPlan, UpdateTreatmentPlanData, ProtocolItem } from "@/services/treatmentPlanService";
import { patientService } from "@/services/patientService";
import { diagnosisService, Diagnosis } from "@/services/diagnosisService";
import { configService } from "@/services/configService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PatientSelector from "@/components/PatientSelector";
import ProtocolBuilder from "@/components/ProtocolBuilder";

const FREQUENCY_OPTIONS = [
  "1 vez por semana",
  "2 veces por semana",
  "3 veces por semana",
  "4 veces por semana",
  "5 veces por semana (diario)",
  "Cada 2 semanas",
  "1 vez al mes",
];

export default function EditTreatmentPlanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [therapyTypes, setTherapyTypes] = useState<string[]>([]);
  const [customTherapyType, setCustomTherapyType] = useState("");
  const [showCustomTherapy, setShowCustomTherapy] = useState(false);
  const [protocol, setProtocol] = useState<ProtocolItem[]>([]);

  const [formData, setFormData] = useState<UpdateTreatmentPlanData>({
    patientId: "",
    diagnosisId: null,
    title: "",
    therapyType: null,
    description: null,
    goals: null,
    frequency: null,
    sessionDuration: null,
    sessionsPlanned: 10,
    totalCost: null,
    status: "DRAFT",
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    fetchData();
    configService.getTherapyTypes().then(setTherapyTypes).catch(() => setTherapyTypes([]));
  }, [id]);

  useEffect(() => {
    if (formData.patientId) {
      diagnosisService.getByPatient(formData.patientId)
        .then((data) => setDiagnoses(data.filter((d) => d.status === "ACTIVE")))
        .catch(() => setDiagnoses([]));
    }
  }, [formData.patientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [planData, patientsRes] = await Promise.all([
        treatmentPlanService.getById(id),
        patientService.getAll({ limit: 1000 }),
      ]);

      setPatients(patientsRes.patients);

      const isKnownTherapyType = planData.therapyType && ![""].includes(planData.therapyType);

      setFormData({
        patientId: planData.patientId,
        diagnosisId: planData.diagnosisId ?? null,
        title: planData.title,
        therapyType: planData.therapyType ?? null,
        description: planData.description ?? null,
        goals: planData.goals ?? null,
        frequency: planData.frequency ?? null,
        sessionDuration: planData.sessionDuration ?? null,
        sessionsPlanned: planData.sessionsPlanned,
        totalCost: planData.totalCost ?? null,
        status: planData.status,
        startDate: planData.startDate ? planData.startDate.split("T")[0] : null,
        endDate: planData.endDate ? planData.endDate.split("T")[0] : null,
      });
      if (planData.protocol) setProtocol(planData.protocol as ProtocolItem[]);
    } catch {
      toast.error("Error al cargar datos");
      router.push("/dashboard/treatment-plans");
    } finally {
      setLoading(false);
    }
  };

  const handleTherapyTypeChange = (value: string) => {
    if (value === "__custom__") {
      setShowCustomTherapy(true);
      setFormData({ ...formData, therapyType: "" });
    } else {
      setShowCustomTherapy(false);
      setFormData({ ...formData, therapyType: value || null });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await treatmentPlanService.update(id, {
        ...formData,
        therapyType: showCustomTherapy ? customTherapyType || null : formData.therapyType,
        protocol: protocol.length > 0 ? protocol : null,
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
            onChange={(patientId) => setFormData({ ...formData, patientId, diagnosisId: null })}
            required
          />

          {/* Diagnóstico */}
          {formData.patientId && (
            <div>
              <label htmlFor="diagnosisId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Diagnóstico Asociado
              </label>
              {diagnoses.length > 0 ? (
                <select
                  id="diagnosisId"
                  value={formData.diagnosisId || ""}
                  onChange={(e) => setFormData({ ...formData, diagnosisId: e.target.value || null })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">— Sin diagnóstico vinculado —</option>
                  {diagnoses.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.clinicalDiagnosis}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No hay diagnósticos activos para este paciente.
                </p>
              )}
            </div>
          )}

          {/* Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Título del Plan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Tipo de Terapia */}
          <div>
            <label htmlFor="therapyType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de Terapia
            </label>
            <select
              id="therapyType"
              value={showCustomTherapy ? "__custom__" : (formData.therapyType || "")}
              onChange={(e) => handleTherapyTypeChange(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">— Seleccionar tipo —</option>
              {therapyTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="__custom__">Otro (especificar)...</option>
            </select>
            {showCustomTherapy && (
              <input
                type="text"
                value={customTherapyType}
                onChange={(e) => setCustomTherapyType(e.target.value)}
                className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                placeholder="Especificar tipo de terapia..."
              />
            )}
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción del Plan
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
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
              rows={3}
              value={formData.goals || ""}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value || null })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Frecuencia y Duración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Frecuencia
              </label>
              <select
                id="frequency"
                value={formData.frequency || ""}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value || null })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">— Seleccionar frecuencia —</option>
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sessionDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duración por Sesión (min)
              </label>
              <input
                type="number"
                id="sessionDuration"
                min="15"
                step="15"
                value={formData.sessionDuration || ""}
                onChange={(e) =>
                  setFormData({ ...formData, sessionDuration: e.target.value ? parseInt(e.target.value) : null })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                placeholder="60"
              />
            </div>
          </div>

          {/* Sesiones y Costo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="sessionsPlanned" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sesiones Planificadas <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="sessionsPlanned"
                required
                min="1"
                value={formData.sessionsPlanned || ""}
                onChange={(e) => setFormData({ ...formData, sessionsPlanned: parseInt(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="totalCost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Costo Total
              </label>
              <input
                type="number"
                id="totalCost"
                min="0"
                step="0.01"
                value={formData.totalCost || ""}
                onChange={(e) =>
                  setFormData({ ...formData, totalCost: e.target.value ? parseFloat(e.target.value) : null })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de Inicio
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate || ""}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value || null })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha Fin Estimada
              </label>
              <input
                type="date"
                id="endDate"
                value={formData.endDate || ""}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Protocolo terapéutico */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Protocolo de sesión
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Define los pasos terapéuticos que se realizarán en cada sesión.
              </p>
            </div>
            <ProtocolBuilder items={protocol} onChange={setProtocol} />
          </div>

          {/* Estado */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Estado
            </label>
            <select
              id="status"
              value={formData.status || "DRAFT"}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as UpdateTreatmentPlanData["status"] })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="DRAFT">Borrador</option>
              <option value="ACTIVE">Activo</option>
              <option value="COMPLETED">Completado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

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
