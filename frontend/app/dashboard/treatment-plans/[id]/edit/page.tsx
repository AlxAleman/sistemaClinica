"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { treatmentPlanService, TreatmentPlan, UpdateTreatmentPlanData, ProtocolItem } from "@/services/treatmentPlanService";
import { sessionService, TreatmentSession } from "@/services/sessionService";
import { patientService } from "@/services/patientService";
import { diagnosisService, Diagnosis } from "@/services/diagnosisService";
import { therapistService, Therapist } from "@/services/therapistService";
import { appointmentService, Appointment } from "@/services/appointmentService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PatientSelector from "@/components/PatientSelector";
import ProtocolBuilder from "@/components/ProtocolBuilder";
import AppointmentCalendar, { ProposedEvent } from "@/components/AppointmentCalendar";

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

export default function EditTreatmentPlanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [protocol, setProtocol] = useState<ProtocolItem[]>([]);
  const [endDateIsAuto, setEndDateIsAuto] = useState(false);

  const computedDuration = protocol.reduce((sum, item) => sum + (item.duration ?? 0), 0);

  // Session scheduler
  const [scheduledSessions, setScheduledSessions] = useState<{ date: string; time: string }[]>([]);
  const [dayTimes, setDayTimes] = useState<Record<number, string>>({});
  const [sessionTherapistId, setSessionTherapistId] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // Availability calendar modal
  const [showAvailability, setShowAvailability] = useState(false);
  const [availAppts, setAvailAppts] = useState<Appointment[]>([]);
  const [availSessions, setAvailSessions] = useState<TreatmentSession[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);

  const applyEndDateCalc = (
    current: UpdateTreatmentPlanData,
    overrides: Partial<UpdateTreatmentPlanData>
  ): UpdateTreatmentPlanData => {
    const merged = { ...current, ...overrides };
    if (merged.startDate && merged.frequency && merged.sessionsPlanned) {
      const calculated = calcEndDate(merged.startDate, merged.frequency, merged.sessionsPlanned);
      if (calculated) {
        setEndDateIsAuto(true);
        return { ...merged, endDate: calculated };
      }
    }
    return merged;
  };

  const [formData, setFormData] = useState<UpdateTreatmentPlanData>({
    patientId: "",
    diagnosisId: null,
    title: "",
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
    therapistService.getAll({ limit: 200 }).then(r => setTherapists(r.therapists)).catch(() => setTherapists([]));
  }, [id]);

  // Limpiar días y sesiones generadas al cambiar la frecuencia
  useEffect(() => {
    setSelectedDays([]);
    setScheduledSessions([]);
  }, [formData.frequency]);

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

  // ── Session scheduler helpers ─────────────────────────────────────────────
  const FREQ_DAYS_REQUIRED: Record<string, number> = {
    "1 vez por semana": 1, "2 veces por semana": 2, "3 veces por semana": 3,
    "4 veces por semana": 4, "5 veces por semana (diario)": 5,
    "Cada 2 semanas": 1, "1 vez al mes": 1,
  };
  const DAY_LABELS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
  const daysRequired = formData.frequency ? (FREQ_DAYS_REQUIRED[formData.frequency] ?? 0) : 0;
  const canGenerate = daysRequired === 0 || selectedDays.length === daysRequired;

  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        setDayTimes(t => { const n = { ...t }; delete n[day]; return n; });
        setScheduledSessions([]);
        return prev.filter(d => d !== day);
      }
      if (prev.length >= daysRequired) return prev;
      setDayTimes(t => ({ ...t, [day]: t[day] ?? "09:00" }));
      setScheduledSessions([]);
      return [...prev, day];
    });
  };

  const generateSessionDates = () => {
    const { startDate, frequency, sessionsPlanned } = formData;
    if (!startDate || !frequency || !sessionsPlanned) return;
    const sessions: { date: string; time: string }[] = [];
    const current = new Date(startDate + "T12:00:00");
    const sorted = [...selectedDays].sort((a, b) => a - b);

    const timeFor = (d: number) => dayTimes[d] ?? "09:00";

    if (frequency === "1 vez al mes") {
      if (sorted.length > 0) {
        while (!sorted.includes(current.getDay())) current.setDate(current.getDate() + 1);
        for (let i = 0; i < sessionsPlanned; i++) {
          sessions.push({ date: current.toISOString().split("T")[0], time: timeFor(current.getDay()) });
          current.setDate(current.getDate() + 28);
          while (!sorted.includes(current.getDay())) current.setDate(current.getDate() + 1);
        }
      } else {
        for (let i = 0; i < sessionsPlanned; i++) {
          sessions.push({ date: current.toISOString().split("T")[0], time: "09:00" });
          current.setDate(current.getDate() + 30);
        }
      }
    } else if (frequency === "Cada 2 semanas") {
      if (sorted.length > 0) {
        while (!sorted.includes(current.getDay())) current.setDate(current.getDate() + 1);
        for (let i = 0; i < sessionsPlanned; i++) {
          sessions.push({ date: current.toISOString().split("T")[0], time: timeFor(current.getDay()) });
          current.setDate(current.getDate() + 14);
          while (!sorted.includes(current.getDay())) current.setDate(current.getDate() + 1);
        }
      } else {
        for (let i = 0; i < sessionsPlanned; i++) {
          sessions.push({ date: current.toISOString().split("T")[0], time: "09:00" });
          current.setDate(current.getDate() + 14);
        }
      }
    } else {
      const limit = sessionsPlanned * 60;
      for (let d = 0; d < limit && sessions.length < sessionsPlanned; d++) {
        if (sorted.length > 0) {
          if (sorted.includes(current.getDay()))
            sessions.push({ date: current.toISOString().split("T")[0], time: timeFor(current.getDay()) });
        } else {
          sessions.push({ date: current.toISOString().split("T")[0], time: "09:00" });
          const perWeek = FREQ_DAYS_REQUIRED[frequency] ?? 1;
          current.setDate(current.getDate() + Math.floor(7 / perWeek) - 1);
        }
        current.setDate(current.getDate() + 1);
      }
    }
    setScheduledSessions(sessions);
  };

  const removeScheduledSession = (idx: number) =>
    setScheduledSessions(prev => prev.filter((_, i) => i !== idx));

  const updateScheduledSession = (idx: number, field: "date" | "time", value: string) =>
    setScheduledSessions(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const proposedCalendarEvents: ProposedEvent[] = scheduledSessions.map((sess, idx) => {
    const [h, m] = sess.time.split(":").map(Number);
    const d = new Date(sess.date + "T12:00:00");
    d.setHours(h, m, 0, 0);
    const end = new Date(d.getTime() + (computedDuration > 0 ? computedDuration : (formData.sessionDuration ?? 60)) * 60000);
    return { start: d, end, label: `Sesión #${idx + 1}` };
  });

  const openAvailability = async () => {
    setLoadingAvail(true);
    setShowAvailability(true);
    try {
      const [apptRes, sessRes] = await Promise.all([
        appointmentService.getAll({ limit: 500 }),
        sessionService.getAll({ limit: 500 }),
      ]);
      setAvailAppts(apptRes.appointments);
      setAvailSessions(sessRes.sessions);
    } catch {
      toast.error("Error al cargar el calendario");
    } finally {
      setLoadingAvail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await treatmentPlanService.update(id, {
        ...formData,
        sessionDuration: computedDuration > 0 ? computedDuration : (formData.sessionDuration || 60),
        protocol: protocol.length > 0 ? protocol : null,
      });

      if (scheduledSessions.length > 0) {
        const duration = computedDuration > 0 ? computedDuration : (formData.sessionDuration || 60);
        const results = await Promise.allSettled(
          scheduledSessions.map((sess, idx) => {
            const [h, m] = sess.time.split(":").map(Number);
            const d = new Date(sess.date + "T12:00:00");
            d.setHours(h, m, 0, 0);
            return sessionService.create({
              patientId: formData.patientId!,
              therapistId: sessionTherapistId || null,
              treatmentPlanId: id,
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
          toast.error("Plan actualizado, pero no se pudieron agendar las sesiones.");
        } else if (fail > 0) {
          toast(`Plan actualizado. ${ok} sesiones agendadas, ${fail} fallaron.`, { icon: "⚠️" });
        } else {
          toast.success(`Plan actualizado y ${ok} sesiones agendadas.`);
        }
      } else {
        toast.success("Plan de tratamiento actualizado exitosamente");
      }

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
                onChange={(e) => setFormData(applyEndDateCalc(formData, { frequency: e.target.value || null }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">— Seleccionar frecuencia —</option>
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duración por Sesión
              </label>
              <div className="mt-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span className="font-semibold">{computedDuration > 0 ? computedDuration : (formData.sessionDuration ?? "—")} min</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {computedDuration > 0 ? "calculado desde bloques del protocolo" : "agrega bloques terapéuticos para calcular"}
                </span>
              </div>
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
                onChange={(e) => setFormData(applyEndDateCalc(formData, { sessionsPlanned: parseInt(e.target.value) }))}
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
                onChange={(e) => setFormData(applyEndDateCalc(formData, { startDate: e.target.value || null }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha Fin Estimada
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
                  Cambia la frecuencia o sesiones para recalcular automáticamente.
                </p>
              )}
            </div>
          </div>

          {/* Agendar Sesiones */}
          {formData.frequency && formData.startDate && (formData.sessionsPlanned ?? 0) > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Agendar sesiones en el calendario
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Selecciona los días preferidos y genera las fechas. Las sesiones se crearán al guardar.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 mb-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Días preferidos</span>
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
                        <button key={dayIdx} type="button" disabled={isDisabled} onClick={() => toggleDay(dayIdx)}
                          className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all border-2 ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : isDisabled
                              ? "border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                              : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600"
                          }`}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {selectedDays.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hora por día</span>
                    <div className="flex flex-wrap gap-3">
                      {[...selectedDays].sort((a, b) => a - b).map(day => (
                        <div key={day} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6 text-center">{DAY_LABELS[day]}</span>
                          <input type="time" value={dayTimes[day] ?? "09:00"}
                            onChange={(e) => setDayTimes(t => ({ ...t, [day]: e.target.value }))}
                            className="px-1.5 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-100" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="button" onClick={generateSessionDates} disabled={!canGenerate}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors">
                    {canGenerate
                      ? "Generar fechas"
                      : `Selecciona ${daysRequired - selectedDays.length} día${daysRequired - selectedDays.length !== 1 ? "s" : ""} más`}
                  </button>
                  <button
                    type="button"
                    onClick={openAvailability}
                    className="px-4 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Ver disponibilidad
                  </button>
                </div>
              </div>

              {scheduledSessions.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Terapeuta asignado <span className="text-gray-400 text-xs">(opcional)</span>
                      </label>
                      <select value={sessionTherapistId} onChange={(e) => setSessionTherapistId(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100">
                        <option value="">— Sin asignar por ahora —</option>
                        {therapists.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm text-gray-600 dark:text-gray-400 w-full">
                        Duración por sesión:{" "}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{computedDuration > 0 ? computedDuration : (formData.sessionDuration ?? 60)} min</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {scheduledSessions.length} sesiones generadas:
                    </p>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {scheduledSessions.map((sess, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <span className="text-xs font-semibold text-gray-400 w-7 shrink-0 text-right">#{idx + 1}</span>
                          <input type="date" value={sess.date}
                            onChange={(e) => updateScheduledSession(idx, "date", e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-100" />
                          <input type="time" value={sess.time}
                            onChange={(e) => updateScheduledSession(idx, "time", e.target.value)}
                            className="w-28 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-100" />
                          <button type="button" onClick={() => removeScheduledSession(idx)}
                            className="shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors">
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

      {/* Availability calendar modal */}
      {showAvailability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Disponibilidad del calendario</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Las sesiones propuestas aparecen en naranja.
                </p>
              </div>
              <button
                onClick={() => setShowAvailability(false)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {loadingAvail ? (
                <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400 text-sm">
                  Cargando calendario...
                </div>
              ) : (
                <AppointmentCalendar
                  appointments={availAppts}
                  sessions={availSessions}
                  proposedEvents={proposedCalendarEvents}
                  defaultView="month"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
