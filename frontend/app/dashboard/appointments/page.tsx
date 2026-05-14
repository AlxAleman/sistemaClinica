"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { appointmentService, Appointment } from "@/services/appointmentService";
import { sessionService, TreatmentSession } from "@/services/sessionService";
import { therapistService, Therapist } from "@/services/therapistService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import AppointmentCalendar, { UnifiedCalendarEvent } from "@/components/AppointmentCalendar";
import { View } from "react-big-calendar";
import moment from "moment";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import { PlusIcon, CalendarIcon, TrashIcon } from "@/components/Icons";
import { useTranslation } from "@/hooks/useTranslation";

// ── Status helpers ─────────────────────────────────────────────────────────────

const APPT_STATUS: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Programada",   color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  CONFIRMED: { label: "Confirmada",   color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  COMPLETED: { label: "Completada",   color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  CANCELLED: { label: "Cancelada",    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  NO_SHOW:   { label: "No asistió",   color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
};

const SESSION_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:      { label: "Pendiente",    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300" },
  ATTENDED:     { label: "Realizada",    color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300" },
  NOT_ATTENDED: { label: "No asistió",   color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  RESCHEDULED:  { label: "Reagendada",   color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300" },
};

// ── Side panel ────────────────────────────────────────────────────────────────

function EventPanel({
  event,
  onClose,
  onAppointmentUpdated,
  therapists,
}: {
  event: UnifiedCalendarEvent;
  onClose: () => void;
  onAppointmentUpdated: () => void;
  therapists: Therapist[];
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [assigningTherapist, setAssigningTherapist] = useState(false);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>("");

  const isAppt = event.eventType === "appointment";
  const appt   = isAppt ? (event.resource as Appointment) : null;
  const sess   = !isAppt ? (event.resource as TreatmentSession) : null;
  const plan   = (sess as any)?.treatmentPlan;

  const date    = isAppt ? new Date(appt!.appointmentDate) : new Date(sess!.sessionDate);
  const dur     = isAppt ? appt!.duration : sess!.duration;
  const patient = isAppt ? appt!.patient : sess!.patient;
  const therapist = isAppt ? appt!.therapist : sess!.therapist;

  // Inicializar el selector con el terapeuta actual de la sesión
  useEffect(() => {
    setSelectedTherapistId(sess?.therapistId ?? "");
    setAssigningTherapist(false);
  }, [event.resource]);

  const handleAssignTherapist = async () => {
    if (!sess) return;
    setUpdating(true);
    try {
      await sessionService.update(sess.id, { therapistId: selectedTherapistId || null });
      toast.success(selectedTherapistId ? "Terapeuta asignado" : "Terapeuta removido");
      onAppointmentUpdated();
      setAssigningTherapist(false);
    } catch {
      toast.error("Error al asignar terapeuta");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirm = async () => {
    if (!appt) return;
    setUpdating(true);
    try {
      await appointmentService.update(appt.id, { status: "CONFIRMED" });
      toast.success("Cita confirmada");
      onAppointmentUpdated();
      onClose();
    } catch {
      toast.error("Error al confirmar");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!appt) return;
    setUpdating(true);
    try {
      await appointmentService.update(appt.id, { status: "CANCELLED" });
      toast.success("Cita cancelada");
      onAppointmentUpdated();
      onClose();
    } catch {
      toast.error("Error al cancelar");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 ${isAppt ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-teal-50 dark:bg-teal-900/20"}`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isAppt ? "bg-indigo-600 text-white" : "bg-teal-600 text-white"}`}>
              {isAppt ? "Cita" : "Sesión"}
            </span>
            {isAppt && appt && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${APPT_STATUS[appt.status]?.color}`}>
                {APPT_STATUS[appt.status]?.label ?? appt.status}
              </span>
            )}
            {!isAppt && sess && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SESSION_STATUS[sess.attendanceStatus ?? "PENDING"]?.color}`}>
                {SESSION_STATUS[sess.attendanceStatus ?? "PENDING"]?.label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Patient */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Paciente</p>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{patient?.name ?? "—"}</p>
            {patient?.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{patient.phone}</p>}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Fecha</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{moment(date).format("ddd D MMM YYYY")}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Hora</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{moment(date).format("HH:mm")} · {dur} min</p>
            </div>
          </div>

          {/* Therapist */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Terapeuta</p>
              {!isAppt && !assigningTherapist && (
                <button
                  onClick={() => { setAssigningTherapist(true); setSelectedTherapistId(sess?.therapistId ?? ""); }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  {therapist ? "Cambiar" : "Asignar"}
                </button>
              )}
            </div>

            {/* Modo visualización */}
            {!assigningTherapist && (
              therapist ? (
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{therapist.name}</p>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Sin asignar</span>
              )
            )}

            {/* Modo edición (solo sesiones) */}
            {!isAppt && assigningTherapist && (
              <div className="space-y-2">
                <select
                  value={selectedTherapistId}
                  onChange={e => setSelectedTherapistId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— Sin asignar —</option>
                  {therapists.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAssignTherapist}
                    disabled={updating}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {updating ? "Guardando…" : "Guardar"}
                  </button>
                  <button
                    onClick={() => setAssigningTherapist(false)}
                    disabled={updating}
                    className="flex-1 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Session-only: plan info */}
          {!isAppt && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Plan de tratamiento</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{plan?.title ?? "—"}</p>
              {sess?.sessionNumber && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Sesión {sess.sessionNumber}{plan?.sessionsPlanned ? ` de ${plan.sessionsPlanned}` : ""}
                </p>
              )}
            </div>
          )}

          {/* Appointment-only: notes */}
          {isAppt && appt?.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Notas</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{appt.notes}</p>
            </div>
          )}

          {/* Session-only: quick notes */}
          {!isAppt && sess?.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Notas</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{sess.notes}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800 space-y-2">
          {isAppt && appt && (
            <>
              {appt.status === "SCHEDULED" && (
                <button
                  onClick={handleConfirm}
                  disabled={updating}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Confirmar cita
                </button>
              )}
              {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED") && (
                <button
                  onClick={handleCancel}
                  disabled={updating}
                  className="w-full py-2.5 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancelar cita
                </button>
              )}
              <Link
                href={`/dashboard/appointments/${appt.id}?returnView=${encodeURIComponent("month")}&returnDate=${encodeURIComponent(new Date().toISOString())}`}
                className="block w-full py-2.5 text-center border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium rounded-xl transition-colors"
                onClick={onClose}
              >
                Ver detalle completo
              </Link>
            </>
          )}

          {!isAppt && sess && sess.patient && (
            <>
              <Link
                href={`/dashboard/patients/${sess.patientId}?tab=tratamiento${sess.treatmentPlanId ? `&planId=${sess.treatmentPlanId}` : ""}&sessionId=${sess.id}`}
                className="block w-full py-2.5 text-center bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors"
                onClick={onClose}
              >
                Completar sesión
              </Link>
              <Link
                href={`/dashboard/patients/${sess.patientId}`}
                className="block w-full py-2.5 text-center border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium rounded-xl transition-colors"
                onClick={onClose}
              >
                Ver expediente del paciente
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sessions, setSessions] = useState<TreatmentSession[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [calendarView, setCalendarView] = useState<View>("month");
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<UnifiedCalendarEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: "" });

  useEffect(() => {
    fetchAll();

    const viewParam = searchParams.get("view");
    const dateParam = searchParams.get("date");
    if (viewParam && ["month","week","day","agenda"].includes(viewParam)) setCalendarView(viewParam as View);
    if (dateParam) { const d = new Date(dateParam); if (!isNaN(d.getTime())) setCalendarDate(d); }
  }, [searchParams]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [apptRes, sessRes, therapistRes] = await Promise.all([
        appointmentService.getAll({ limit: 1000 }),
        sessionService.getAll({ limit: 1000 }),
        therapistService.getAll({ limit: 200 }),
      ]);
      setAppointments(apptRes.appointments);
      setSessions(sessRes.sessions);
      setTherapists(therapistRes.therapists);
    } catch {
      toast.error("Error al cargar el calendario");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    router.push(`/dashboard/appointments/new?date=${encodeURIComponent(slotInfo.start.toISOString())}`);
  };

  const handleCalendarViewChange = (v: View) => {
    setCalendarView(v);
    const p = new URLSearchParams(searchParams.toString());
    p.set("view", v);
    router.push(`/dashboard/appointments?${p.toString()}`, { scroll: false });
  };

  const handleCalendarDateChange = (date: Date) => {
    setCalendarDate(date);
    const p = new URLSearchParams(searchParams.toString());
    p.set("date", date.toISOString());
    router.push(`/dashboard/appointments?${p.toString()}`, { scroll: false });
  };

  const handleDeleteConfirm = async () => {
    try {
      await appointmentService.delete(deleteConfirm.id);
      toast.success(t("messages.appointmentDeleted"));
      setDeleteConfirm({ isOpen: false, id: "" });
      fetchAll();
    } catch {
      toast.error(t("messages.errorDeleting"));
    }
  };

  const getStatusColor = (status: string) => APPT_STATUS[status]?.color ?? "bg-blue-100 text-blue-800";
  const getStatusText = (status: string) => APPT_STATUS[status]?.label ?? status;

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">{t("appointments.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6">
      <Breadcrumbs items={[{ label: t("common.dashboard"), href: "/dashboard" }, { label: t("appointments.title") }]} />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-2 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t("appointments.title")}</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setView(view === "calendar" ? "list" : "calendar")}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {view === "calendar" ? t("appointments.viewList") : t("appointments.viewCalendar")}
          </button>
          <Link
            href="/dashboard/appointments/new"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none"
          >
            <PlusIcon className="h-4 w-4" />
            <span>{t("appointments.newAppointment")}</span>
          </Link>
        </div>
      </div>

      {view === "calendar" ? (
        <AppointmentCalendar
          appointments={appointments}
          sessions={sessions}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={setSelectedEvent}
          defaultView={calendarView}
          defaultDate={calendarDate}
          onViewChange={handleCalendarViewChange}
          onNavigate={handleCalendarDateChange}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md transition-colors">
          {appointments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <EmptyState
                title={t("appointments.noAppointments")}
                message={t("appointments.createFirst")}
                actionLabel={t("appointments.createFirstButton")}
                actionHref="/dashboard/appointments/new"
                icon={<CalendarIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />}
              />
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {appointments.map((appointment) => (
                <li key={appointment.id} className="px-3 sm:px-4 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <p className="text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                          {appointment.patient?.name || t("appointments.unknownPatient")}
                        </p>
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full flex-shrink-0 ${getStatusColor(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                      <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-2">
                        {appointment.therapistId ? (
                          <p className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                            <span className="mr-1">👨‍⚕️</span>
                            <span className="truncate">{appointment.therapist?.name}</span>
                          </p>
                        ) : (
                          <span className="px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Sin terapeuta</span>
                        )}
                        <p className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          <span className="mr-1">📅</span>
                          {new Date(appointment.appointmentDate).toLocaleString("es-ES", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                        </p>
                        <p className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          <span className="mr-1">⏱️</span>
                          {appointment.duration} min
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => router.push(`/dashboard/appointments/${appointment.id}?returnView=${calendarView}&returnDate=${encodeURIComponent(calendarDate.toISOString())}`)}
                        className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors font-medium"
                      >
                        {t("appointments.view")}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, id: appointment.id })}
                        className="p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Side panel */}
      {selectedEvent && (
        <EventPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onAppointmentUpdated={fetchAll}
          therapists={therapists}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: "" })}
        onConfirm={handleDeleteConfirm}
        title={t("appointments.deleteTitle")}
        message={t("appointments.deleteMessage")}
        confirmText={t("appointments.delete")}
        cancelText={t("common.cancel")}
        type="danger"
      />
    </div>
  );
}
