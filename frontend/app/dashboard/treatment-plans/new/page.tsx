"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { treatmentPlanService, CreateTreatmentPlanData, ProtocolItem } from "@/services/treatmentPlanService";
import { sessionService } from "@/services/sessionService";
import { patientService } from "@/services/patientService";
import { diagnosisService, Diagnosis } from "@/services/diagnosisService";
import { therapistService, Therapist } from "@/services/therapistService";
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

  // Session scheduler
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<{ date: string; time: string }[]>([]);
  const [defaultSessionTime, setDefaultSessionTime] = useState("09:00");
  const [sessionTherapistId, setSessionTherapistId] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

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
    fetchTherapists();
  }, []);

  useEffect(() => {
    if (!formData.frequency || !formData.sessionsPlanned || !formData.startDate) return;
    const calculated = calcEndDate(formData.startDate, formData.frequency, formData.sessionsPlanned);
    if (calculated) {
      setFormData((prev) => ({ ...prev, endDate: calculated }));
      setEndDateIsAuto(true);
    }
  }, [formData.frequency, formData.sessionsPlanned, formData.startDate]);

  // Limpiar días y sesiones generadas al cambiar la frecuencia
  useEffect(() => {
    setSelectedDays([]);
    setScheduledSessions([]);
  }, [formData.frequency]);

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

  const fetchTherapists = async () => {
    try {
      const data = await therapistService.getAll({ limit: 200 });
      setTherapists(data.therapists);
    } catch {
      setTherapists([]);
    }
  };

  // Días requeridos según frecuencia (0=Dom,1=Lun,...,6=Sáb)
  const FREQ_DAYS_REQUIRED: Record<string, number> = {
    "1 vez por semana": 1,
    "2 veces por semana": 2,
    "3 veces por semana": 3,
    "4 veces por semana": 4,
    "5 veces por semana (diario)": 5,
    "Cada 2 semanas": 1,
    "1 vez al mes": 1,
  };

  const DAY_LABELS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
  const daysRequired = formData.frequency ? (FREQ_DAYS_REQUIRED[formData.frequency] ?? 0) : 0;
  const canGenerate = daysRequired === 0 || selectedDays.length === daysRequired;

  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) return prev.filter(d => d !== day);
      if (prev.length >= daysRequired) return prev; // ya tiene suficientes días
      return [...prev, day];
    });
    setScheduledSessions([]); // resetear si cambia selección
  };

  const generateSessionDates = () => {
    const { startDate, frequency, sessionsPlanned } = formData;
    if (!startDate || !frequency || !sessionsPlanned) return;

    const sessions: { date: string; time: string }[] = [];
    const current = new Date(startDate + "T12:00:00");
    const sorted = [...selectedDays].sort((a, b) => a - b);

    if (frequency === "1 vez al mes") {
      // Cada ~30 días en el día preferido (o sin día preferido, +30 días)
      if (sorted.length > 0) {
        // Avanzar hasta el primer día preferido a partir de startDate
        while (!sorted.includes(current.getDay())) {
          current.setDate(current.getDate() + 1);
        }
        for (let i = 0; i < sessionsPlanned; i++) {
          sessions.push({ date: current.toISOString().split("T")[0], time: defaultSessionTime });
          current.setDate(current.getDate() + 28); // ~4 semanas
          // Ajustar al día correcto de la semana
          while (!sorted.includes(current.getDay())) {
            current.setDate(current.getDate() + 1);
          }
        }
      } else {
        for (let i = 0; i < sessionsPlanned; i++) {
          sessions.push({ date: current.toISOString().split("T")[0], time: defaultSessionTime });
          current.setDate(current.getDate() + 30);
        }
      }
    } else if (frequency === "Cada 2 semanas") {
      // Cada 2 semanas en el día preferido
      if (sorted.length > 0) {
        while (!sorted.includes(current.getDay())) {
          current.setDate(current.getDate() + 1);
        }
        for (let i = 0; i < sessionsPlanned; i++) {
          sessions.push({ date: current.toISOString().split("T")[0], time: defaultSessionTime });
          current.setDate(current.getDate() + 14);
          while (!sorted.includes(current.getDay())) {
            current.setDate(current.getDate() + 1);
          }
        }
      } else {
        for (let i = 0; i < sessionsPlanned; i++) {
          sessions.push({ date: current.toISOString().split("T")[0], time: defaultSessionTime });
          current.setDate(current.getDate() + 14);
        }
      }
    } else {
      // N veces por semana — avanzar día a día seleccionando los días elegidos
      const limit = sessionsPlanned * 60; // días máximos a iterar
      for (let d = 0; d < limit && sessions.length < sessionsPlanned; d++) {
        if (sorted.length > 0) {
          if (sorted.includes(current.getDay())) {
            sessions.push({ date: current.toISOString().split("T")[0], time: defaultSessionTime });
          }
        } else {
          // Sin días seleccionados: fallback a distribuir uniformemente
          sessions.push({ date: current.toISOString().split("T")[0], time: defaultSessionTime });
          const perWeek = FREQ_DAYS_REQUIRED[frequency] ?? 1;
          const gap = Math.floor(7 / perWeek);
          current.setDate(current.getDate() + gap - 1);
        }
        current.setDate(current.getDate() + 1);
      }
    }

    setScheduledSessions(sessions);
  };

  const removeScheduledSession = (idx: number) => {
    setScheduledSessions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateScheduledSession = (idx: number, field: "date" | "time", value: string) => {
    setScheduledSessions((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
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

      if (scheduledSessions.length > 0) {
        const duration = formData.sessionDuration || 60;
        const results = await Promise.allSettled(
          scheduledSessions.map((sess, idx) => {
            const [h, m] = sess.time.split(":").map(Number);
            const d = new Date(sess.date + "T12:00:00");
            d.setHours(h, m, 0, 0);
            return sessionService.create({
              patientId: formData.patientId,
              therapistId: sessionTherapistId || null,
              treatmentPlanId: plan.id,
              sessionNumber: idx + 1,
              sessionDate: d.toISOString(),
              duration,
              attendanceStatus: "PENDING",
            });
          })
        );
        const ok = results.filter(r => r.status === "fulfilled").length;
        const fail = results.filter(r => r.status === "rejected").length;
        if (fail > 0 && ok === 0) {
          toast.error(`Plan creado, pero no se pudieron agendar las sesiones. Revisa la consola del servidor.`);
        } else if (fail > 0) {
          toast(`Plan creado. ${ok} sesiones agendadas, ${fail} fallaron.`, { icon: "⚠️" });
        } else {
          toast.success(`Plan creado y ${ok} sesiones agendadas.`);
        }
      } else {
        toast.success("Plan de tratamiento creado exitosamente");
      }

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

          {/* Agendar Sesiones */}
          {formData.frequency && formData.startDate && formData.sessionsPlanned > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Agendar sesiones en el calendario
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Selecciona los días preferidos del paciente y genera las fechas automáticamente. Puedes ajustar fecha y hora por sesión antes de guardar.
                </p>
              </div>

              {/* Configuración: días + hora + botón */}
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 mb-4 space-y-4">
                {/* Días de la semana */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Días preferidos
                    </span>
                    {daysRequired > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        selectedDays.length === daysRequired
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {selectedDays.length}/{daysRequired} seleccionados
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAY_LABELS.map((label, dayIdx) => {
                      const isSelected = selectedDays.includes(dayIdx);
                      const isDisabled = !isSelected && selectedDays.length >= daysRequired;
                      return (
                        <button
                          key={dayIdx}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => toggleDay(dayIdx)}
                          className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all border-2 ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : isDisabled
                              ? "border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                              : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hora y botón generar */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Hora por defecto:</label>
                    <input
                      type="time"
                      value={defaultSessionTime}
                      onChange={(e) => setDefaultSessionTime(e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateSessionDates}
                    disabled={!canGenerate}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {canGenerate ? "Generar fechas" : `Selecciona ${daysRequired - selectedDays.length} día${daysRequired - selectedDays.length !== 1 ? "s" : ""} más`}
                  </button>
                </div>
              </div>

              {scheduledSessions.length > 0 && (
                <div className="space-y-4">
                  {/* Therapist + duration summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Terapeuta asignado <span className="text-gray-400 text-xs">(opcional)</span>
                      </label>
                      <select
                        value={sessionTherapistId}
                        onChange={(e) => setSessionTherapistId(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="">— Sin asignar por ahora —</option>
                        {therapists.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm text-gray-600 dark:text-gray-400 w-full">
                        Duración por sesión:{" "}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formData.sessionDuration ?? 60} min
                        </span>
                        {!formData.sessionDuration && (
                          <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">(valor por defecto — ajusta en «Duración por Sesión» de arriba)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Editable sessions list */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {scheduledSessions.length} sesiones generadas:
                    </p>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {scheduledSessions.map((sess, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 w-7 shrink-0 text-right">
                            #{idx + 1}
                          </span>
                          <input
                            type="date"
                            value={sess.date}
                            onChange={(e) => updateScheduledSession(idx, "date", e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-100"
                          />
                          <input
                            type="time"
                            value={sess.time}
                            onChange={(e) => updateScheduledSession(idx, "time", e.target.value)}
                            className="w-28 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-100"
                          />
                          <button
                            type="button"
                            onClick={() => removeScheduledSession(idx)}
                            className="shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Eliminar sesión"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
