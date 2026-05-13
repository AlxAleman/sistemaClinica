"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { treatmentPlanService, CreateTreatmentPlanData, ProtocolItem } from "@/services/treatmentPlanService";
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

const SESSIONS_PER_WEEK: Record<string, number> = {
  "1 vez por semana": 1,
  "2 veces por semana": 2,
  "3 veces por semana": 3,
  "4 veces por semana": 4,
  "5 veces por semana (diario)": 5,
  "Cada 2 semanas": 0.5,
};

function calcEndDate(startDate: string, frequency: string, sessionsPlanned: number): string | null {
  const start = new Date(startDate + "T12:00:00");
  if (frequency === "1 vez al mes") {
    start.setMonth(start.getMonth() + sessionsPlanned);
  } else {
    const perWeek = SESSIONS_PER_WEEK[frequency];
    if (!perWeek) return null;
    const weeks = Math.ceil(sessionsPlanned / perWeek);
    start.setDate(start.getDate() + weeks * 7);
  }
  return start.toISOString().split("T")[0];
}

export default function NewTreatmentPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patientId");
  const diagnosisIdParam = searchParams.get("diagnosisId");

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [therapyTypes, setTherapyTypes] = useState<string[]>([]);
  const [customTherapyType, setCustomTherapyType] = useState("");
  const [showCustomTherapy, setShowCustomTherapy] = useState(false);
  const [protocol, setProtocol] = useState<ProtocolItem[]>([]);
  const [endDateIsAuto, setEndDateIsAuto] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<CreateTreatmentPlanData>({
    patientId: patientIdParam || "",
    diagnosisId: diagnosisIdParam || null,
    title: "",
    therapyType: null,
    description: null,
    goals: null,
    frequency: null,
    sessionDuration: null,
    sessionsPlanned: 10,
    totalCost: null,
    status: "DRAFT",
    startDate: today,
    endDate: null,
  });

  useEffect(() => {
    fetchPatients();
    fetchTherapyTypes();
  }, []);

  useEffect(() => {
    if (!formData.frequency || !formData.sessionsPlanned || !formData.startDate) return;
    const calculated = calcEndDate(formData.startDate, formData.frequency, formData.sessionsPlanned);
    if (calculated) {
      setFormData((prev) => ({ ...prev, endDate: calculated }));
      setEndDateIsAuto(true);
    }
  }, [formData.frequency, formData.sessionsPlanned, formData.startDate]);

  useEffect(() => {
    if (formData.patientId) {
      fetchDiagnoses(formData.patientId);
    } else {
      setDiagnoses([]);
    }
  }, [formData.patientId]);

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll({ limit: 1000 });
      setPatients(response.patients);
    } catch {
      toast.error("Error al cargar pacientes");
    }
  };

  const fetchDiagnoses = async (patientId: string) => {
    try {
      const data = await diagnosisService.getByPatient(patientId);
      setDiagnoses(data.filter((d) => d.status === "ACTIVE"));
    } catch {
      setDiagnoses([]);
    }
  };

  const fetchTherapyTypes = async () => {
    try {
      const types = await configService.getTherapyTypes();
      setTherapyTypes(types);
    } catch {
      setTherapyTypes([]);
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
    setLoading(true);

    try {
      const data: CreateTreatmentPlanData = {
        ...formData,
        therapyType: showCustomTherapy ? customTherapyType || null : formData.therapyType,
        diagnosisId: formData.diagnosisId || null,
        protocol: protocol.length > 0 ? protocol : null,
      };

      const plan = await treatmentPlanService.create(data);
      toast.success("Plan de tratamiento creado exitosamente");

      if (patientIdParam) {
        router.push(`/dashboard/patients/${patientIdParam}`);
      } else {
        router.push(`/dashboard/treatment-plans/${plan.id}`);
      }
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
          href={patientIdParam ? `/dashboard/patients/${patientIdParam}` : "/dashboard/patients"}
          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
        >
          ← Regresar
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
                  No hay diagnósticos activos para este paciente.{" "}
                  <Link
                    href={`/dashboard/diagnoses/new?patientId=${formData.patientId}`}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    Crear diagnóstico →
                  </Link>
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
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              placeholder="Ej: Plan de Rehabilitación Post-Operatoria"
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
              rows={3}
              value={formData.goals || ""}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value || null })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              placeholder="Objetivos que se esperan alcanzar..."
            />
          </div>

          {/* Frecuencia y Duración de Sesión */}
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
                Duración por Sesión (minutos)
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
                value={formData.sessionsPlanned}
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
              <div className="flex items-center justify-between">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha Estimada de Fin
                </label>
                {endDateIsAuto && (
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                    Auto-calculada
                  </span>
                )}
              </div>
              <input
                type="date"
                id="endDate"
                value={formData.endDate || ""}
                onChange={(e) => {
                  setFormData({ ...formData, endDate: e.target.value || null });
                  setEndDateIsAuto(false);
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              />
              {!formData.frequency && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Selecciona frecuencia y sesiones para calcular automáticamente.
                </p>
              )}
            </div>
          </div>

          {/* Protocolo terapéutico */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Protocolo de sesión
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Define los pasos terapéuticos que se realizarán en cada sesión. El terapeuta podrá
                ver este protocolo como guía al registrar cada sesión asistida.
              </p>
            </div>
            <ProtocolBuilder items={protocol} onChange={setProtocol} />
          </div>

          {/* Estado */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Estado Inicial
            </label>
            <select
              id="status"
              value={formData.status || "DRAFT"}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as CreateTreatmentPlanData["status"] })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="DRAFT">Borrador</option>
              <option value="ACTIVE">Activo</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href={patientIdParam ? `/dashboard/patients/${patientIdParam}` : "/dashboard/patients"}
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
