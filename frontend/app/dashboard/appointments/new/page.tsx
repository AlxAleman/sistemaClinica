"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { appointmentService, CreateAppointmentData } from "@/services/appointmentService";
import { sessionService, CreateSessionData } from "@/services/sessionService";
import { patientService } from "@/services/patientService";
import { therapistService } from "@/services/therapistService";
import { treatmentPlanService, TreatmentPlan } from "@/services/treatmentPlanService";
import { toast } from "react-hot-toast";
import Link from "next/link";

// Formato automático de teléfono "70543824" → "7054-3824"
const formatPhone = (raw: string): string => {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return d.length <= 4 ? d : `${d.slice(0, 4)}-${d.slice(4)}`;
};

type EventType = "evaluation" | "session" | "appointment" | "consultation";

const EVENT_TYPES: { value: EventType; label: string; description: string }[] = [
  { value: "evaluation",   label: "Evaluación",           description: "Evaluación inicial o de seguimiento" },
  { value: "session",      label: "Sesión de tratamiento", description: "Registro de sesión de tratamiento" },
  { value: "appointment",  label: "Cita",                  description: "Reserva para consulta o revisión" },
  { value: "consultation", label: "Consulta",              description: "Consulta puntual o interconsulta" },
];

const isSessionType = (t: EventType) => t === "session";

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnView = searchParams.get("returnView") ?? "month";
  const returnDate = searchParams.get("returnDate") ?? new Date().toISOString();
  const calendarBack = `/dashboard/appointments?view=${returnView}&date=${encodeURIComponent(returnDate)}`;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [patients, setPatients] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [activePlans, setActivePlans] = useState<TreatmentPlan[]>([]);

  const [type, setType] = useState<EventType>("evaluation");

  // Modo paciente: "existing" | "new"
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [appointmentData, setAppointmentData] = useState<CreateAppointmentData>({
    patientId: "",
    therapistId: null,
    appointmentDate: "",
    duration: 60,
    notes: null,
  });

  const [sessionData, setSessionData] = useState<CreateSessionData>({
    patientId: "",
    therapistId: null,
    sessionDate: "",
    duration: 60,
    attendanceStatus: "PENDING",
  });

  // Planes activos al cambiar paciente en modo sesión
  useEffect(() => {
    const patientId = sessionData.patientId;
    if (!patientId || !isSessionType(type)) { setActivePlans([]); return; }
    treatmentPlanService.getAll({ patientId, status: "ACTIVE", limit: 100 })
      .then(res => setActivePlans(res.treatmentPlans))
      .catch(() => setActivePlans([]));
  }, [sessionData.patientId, type]);

  useEffect(() => {
    fetchData();
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const formatted = new Date(
        new Date(dateParam).getTime() - new Date(dateParam).getTimezoneOffset() * 60000
      ).toISOString().slice(0, 16);
      setAppointmentData(p => ({ ...p, appointmentDate: formatted }));
      setSessionData(p => ({ ...p, sessionDate: formatted }));
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [patientsRes, therapistsRes] = await Promise.all([
        patientService.getAll({ limit: 1000 }),
        therapistService.getAll({ limit: 1000 }),
      ]);
      setPatients(patientsRes.patients);
      setTherapists(therapistsRes.therapists);
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoadingData(false);
    }
  };

  // Cambiar modo: limpiar selección al alternar
  const switchPatientMode = (mode: "existing" | "new") => {
    setPatientMode(mode);
    setAppointmentData(p => ({ ...p, patientId: "" }));
    setSessionData(p => ({ ...p, patientId: "" }));
    setNewFirstName("");
    setNewLastName("");
    setNewPhone("");
  };

  const setPatientId = (id: string) => {
    setAppointmentData(p => ({ ...p, patientId: id }));
    setSessionData(p => ({ ...p, patientId: id }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let patientId: string;

      // Crear paciente nuevo si es necesario
      if (patientMode === "new") {
        if (!newFirstName.trim() || !newLastName.trim() || !newPhone.trim()) {
          toast.error("Completa nombre, apellidos y teléfono del nuevo paciente");
          setLoading(false);
          return;
        }
        const created = await patientService.create({
          name: `${newFirstName.trim()} ${newLastName.trim()}`,
          phone: newPhone,
        });
        patientId = created.id;
        toast.success("Paciente registrado");
      } else {
        patientId = isSessionType(type) ? sessionData.patientId : appointmentData.patientId;
        if (!patientId) {
          toast.error("Selecciona un paciente");
          setLoading(false);
          return;
        }
      }

      const typeLabel = EVENT_TYPES.find(t => t.value === type)?.label ?? "";

      if (isSessionType(type)) {
        await sessionService.create({
          ...sessionData,
          patientId,
          sessionDate: new Date(sessionData.sessionDate).toISOString(),
        });
        toast.success("Sesión creada exitosamente");
      } else {
        await appointmentService.create({
          ...appointmentData,
          patientId,
          appointmentDate: new Date(appointmentData.appointmentDate).toISOString(),
          notes: appointmentData.notes
            ? `[${typeLabel}] ${appointmentData.notes}`
            : `[${typeLabel}]`,
        });
        toast.success(`${typeLabel} creada exitosamente`);
      }

      router.push(calendarBack);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

  if (loadingData) {
    return (
      <div className="px-4 py-6 sm:px-0 text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando datos...</p>
      </div>
    );
  }

  const isSession = isSessionType(type);
  const currentLabel = EVENT_TYPES.find(t => t.value === type)?.label ?? "";

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href={calendarBack} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 text-sm font-medium">
          ← Volver al Calendario
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Nueva {currentLabel}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">

        {/* Tipo de evento */}
        <div>
          <label className={labelClass}>Tipo de evento *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EVENT_TYPES.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`px-3 py-3 rounded-xl border-2 text-left transition-colors ${
                  type === opt.value
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <span className={`block text-sm font-semibold ${type === opt.value ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"}`}>
                  {opt.label}
                </span>
                <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {opt.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Paciente */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Paciente *</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 text-xs font-medium">
              <button
                type="button"
                onClick={() => switchPatientMode("existing")}
                className={`px-3 py-1.5 transition-colors ${
                  patientMode === "existing"
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                Paciente registrado
              </button>
              <button
                type="button"
                onClick={() => switchPatientMode("new")}
                className={`px-3 py-1.5 transition-colors ${
                  patientMode === "new"
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                + Nuevo paciente
              </button>
            </div>
          </div>

          {patientMode === "existing" ? (
            <select
              required
              value={isSession ? sessionData.patientId : appointmentData.patientId}
              onChange={e => setPatientId(e.target.value)}
              className={inputClass}
            >
              <option value="">Seleccionar paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800">
              <div>
                <label className={labelClass}>Nombres *</label>
                <input
                  type="text"
                  placeholder="Ej. María José"
                  value={newFirstName}
                  onChange={e => setNewFirstName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Apellidos *</label>
                <input
                  type="text"
                  placeholder="Ej. García López"
                  value={newLastName}
                  onChange={e => setNewLastName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Teléfono *</label>
                <input
                  type="tel"
                  placeholder="7054-3824"
                  value={newPhone}
                  onChange={e => setNewPhone(formatPhone(e.target.value))}
                  className={inputClass}
                />
              </div>
              <p className="sm:col-span-3 text-xs text-indigo-600 dark:text-indigo-400">
                Se creará un perfil básico. Puedes completar el expediente desde la ficha del paciente después.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Terapeuta */}
          <div>
            <label className={labelClass}>
              Terapeuta <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <select
              value={isSession ? (sessionData.therapistId ?? "") : (appointmentData.therapistId ?? "")}
              onChange={e => {
                const val = e.target.value || null;
                isSession
                  ? setSessionData(p => ({ ...p, therapistId: val }))
                  : setAppointmentData(p => ({ ...p, therapistId: val }));
              }}
              className={inputClass}
            >
              <option value="">Sin asignar</option>
              {therapists.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.specialization ? ` — ${t.specialization}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha y Hora */}
          <div>
            <label className={labelClass}>Fecha y Hora *</label>
            <input
              type="datetime-local"
              required
              value={isSession ? sessionData.sessionDate : appointmentData.appointmentDate}
              onChange={e => isSession
                ? setSessionData(p => ({ ...p, sessionDate: e.target.value }))
                : setAppointmentData(p => ({ ...p, appointmentDate: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          {/* Duración */}
          <div>
            <label className={labelClass}>Duración *</label>
            <select
              required
              value={isSession ? sessionData.duration : appointmentData.duration}
              onChange={e => {
                const val = parseInt(e.target.value);
                isSession
                  ? setSessionData(p => ({ ...p, duration: val }))
                  : setAppointmentData(p => ({ ...p, duration: val }));
              }}
              className={inputClass}
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">60 minutos</option>
              <option value="90">90 minutos</option>
              <option value="120">120 minutos</option>
            </select>
          </div>

          {/* Notas — no sesiones */}
          {!isSession && (
            <div className="md:col-span-2">
              <label className={labelClass}>Notas</label>
              <textarea
                rows={3}
                value={appointmentData.notes ?? ""}
                onChange={e => setAppointmentData(p => ({ ...p, notes: e.target.value || null }))}
                placeholder="Motivo, observaciones previas..."
                className={inputClass}
              />
            </div>
          )}

          {/* Extra para sesiones */}
          {isSession && (
            <>
              <div>
                <label className={labelClass}>Plan de tratamiento (opcional)</label>
                <select
                  value={sessionData.treatmentPlanId ?? ""}
                  onChange={e => setSessionData(p => ({ ...p, treatmentPlanId: e.target.value || null }))}
                  className={inputClass}
                  disabled={patientMode === "new" || !sessionData.patientId}
                >
                  <option value="">
                    {patientMode === "new"
                      ? "Disponible tras registrar paciente"
                      : sessionData.patientId
                        ? activePlans.length === 0 ? "Sin planes activos" : "— Sin vincular —"
                        : "Selecciona un paciente primero"}
                  </option>
                  {activePlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.title} ({plan.sessionsCompleted}/{plan.sessionsPlanned} sesiones)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Nivel de Dolor (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={sessionData.painLevel ?? ""}
                  onChange={e => setSessionData(p => ({ ...p, painLevel: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="Escala del 1 al 10"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Notas</label>
                <textarea
                  rows={3}
                  value={sessionData.notes ?? ""}
                  onChange={e => setSessionData(p => ({ ...p, notes: e.target.value || null }))}
                  className={inputClass}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-2">
          <Link
            href={calendarBack}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? "Guardando..." : `Guardar ${currentLabel}`}
          </button>
        </div>
      </form>
    </div>
  );
}
