"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { appointmentService, Appointment } from "@/services/appointmentService";
import { sessionService, TreatmentSession } from "@/services/sessionService";
import { therapistService, Therapist } from "@/services/therapistService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Programada",  color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  CONFIRMED: { label: "Confirmada",  color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  COMPLETED: { label: "Completada",  color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  CANCELLED: { label: "Cancelada",   color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  NO_SHOW:   { label: "No asistió",  color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
};

const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AppointmentDetailPage() {
  const params       = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const id           = params.id as string;

  const [appointment, setAppointment]     = useState<Appointment | null>(null);
  const [relatedSession, setRelatedSession] = useState<TreatmentSession | null>(null);
  const [therapists, setTherapists]       = useState<Therapist[]>([]);
  const [loading, setLoading]             = useState(true);
  const [editing, setEditing]             = useState(false);
  const [saving, setSaving]               = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Edit form state
  const [form, setForm] = useState({
    appointmentDate: "",
    duration: 60,
    therapistId: "",
    status: "SCHEDULED",
    notes: "",
  });

  const returnUrl = (() => {
    const v = searchParams.get("returnView");
    const d = searchParams.get("returnDate");
    let url = "/dashboard/appointments";
    if (v && d) url += `?view=${v}&date=${encodeURIComponent(d)}`;
    else if (v)  url += `?view=${v}`;
    else if (d)  url += `?date=${encodeURIComponent(d)}`;
    return url;
  })();

  useEffect(() => {
    Promise.all([fetchAppointment(), fetchSession(), fetchTherapists()]);
  }, [id]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getById(id);
      setAppointment(data);
      setForm({
        appointmentDate: moment(data.appointmentDate).format("YYYY-MM-DDTHH:mm"),
        duration: data.duration,
        therapistId: data.therapistId ?? "",
        status: data.status,
        notes: data.notes ?? "",
      });
    } catch {
      toast.error("Error al cargar cita");
      router.push("/dashboard/appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await sessionService.getAll({ appointmentId: id, limit: 1 });
      setRelatedSession(res.sessions[0] ?? null);
    } catch { /* silent */ }
  };

  const fetchTherapists = async () => {
    try {
      const res = await therapistService.getAll({ limit: 100 });
      setTherapists(res.therapists.filter(t => t.isActive !== false));
    } catch { /* silent */ }
  };

  const handleSave = async () => {
    if (!appointment) return;
    setSaving(true);
    try {
      const updated = await appointmentService.update(id, {
        appointmentDate: new Date(form.appointmentDate).toISOString(),
        duration: Number(form.duration),
        therapistId: form.therapistId || null,
        status: form.status as Appointment["status"],
        notes: form.notes || null,
      });
      setAppointment(updated);
      setEditing(false);
      toast.success("Cita actualizada");
    } catch {
      toast.error("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const updated = await appointmentService.update(id, { status: "CONFIRMED" });
      setAppointment(updated);
      setForm(f => ({ ...f, status: "CONFIRMED" }));
      toast.success("Cita confirmada");
    } catch {
      toast.error("Error al confirmar cita");
    }
  };

  const handleDelete = async () => {
    try {
      await appointmentService.delete(id);
      toast.success("Cita eliminada");
      router.push(returnUrl);
    } catch {
      toast.error("Error al eliminar cita");
    }
  };

  const cancelEdit = () => {
    if (!appointment) return;
    setForm({
      appointmentDate: moment(appointment.appointmentDate).format("YYYY-MM-DDTHH:mm"),
      duration: appointment.duration,
      therapistId: appointment.therapistId ?? "",
      status: appointment.status,
      notes: appointment.notes ?? "",
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!appointment) return null;

  const statusInfo = STATUS_MAP[appointment.status] ?? { label: appointment.status, color: "bg-gray-100 text-gray-700" };
  const plan = (relatedSession as any)?.treatmentPlan as { id: string; title: string } | undefined;

  return (
    <div className="px-4 py-6 sm:px-0 max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { label: "Dashboard",   href: "/dashboard" },
        { label: "Calendario",  href: "/dashboard/appointments" },
        { label: "Detalle de Cita" },
      ]} />

      {/* Back */}
      <button onClick={() => router.push(returnUrl)} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
        ← Volver al Calendario
      </button>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Detalle de Cita</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
            {!appointment.therapistId && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Sin terapeuta</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!editing && appointment.status === "SCHEDULED" && (
            <button onClick={handleConfirm} className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Confirmar
            </button>
          )}
          {!editing ? (
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Editar
            </button>
          ) : (
            <>
              <button onClick={cancelEdit} className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {saving ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : "Guardar cambios"}
              </button>
            </>
          )}
          <button onClick={() => setDeleteConfirm(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Eliminar
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── Información de la cita ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Información de la Cita</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Fecha y Hora</label>
              {editing ? (
                <input type="datetime-local" value={form.appointmentDate} onChange={e => setForm(f => ({ ...f, appointmentDate: e.target.value }))} className={inputCls} />
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">{moment(appointment.appointmentDate).format("dddd D [de] MMMM YYYY, HH:mm")}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Duración</label>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input type="number" min={5} step={5} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} className={`${inputCls} w-24`} />
                  <span className="text-sm text-gray-500">minutos</span>
                </div>
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">{appointment.duration} minutos</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Estado</label>
              {editing ? (
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                  <option value="SCHEDULED">Programada</option>
                  <option value="CONFIRMED">Confirmada</option>
                  <option value="COMPLETED">Completada</option>
                  <option value="CANCELLED">Cancelada</option>
                  <option value="NO_SHOW">No asistió</option>
                </select>
              ) : (
                <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Notas</label>
              {editing ? (
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Notas adicionales..." className={`${inputCls} resize-none`} />
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{appointment.notes || <span className="text-gray-400 italic">Sin notas</span>}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Paciente ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Paciente</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nombre</p>
              <Link href={`/dashboard/patients/${appointment.patientId}`} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                {appointment.patient?.name ?? "—"}
              </Link>
            </div>
            {appointment.patient?.phone && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Teléfono</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{appointment.patient.phone}</p>
              </div>
            )}
            {appointment.patient?.email && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{appointment.patient.email}</p>
              </div>
            )}
            <div className="pt-1">
              <Link href={`/dashboard/patients/${appointment.patientId}`} className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                Ver expediente completo →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Terapeuta ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Terapeuta</h2>
          {editing ? (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Asignar terapeuta</label>
              <select value={form.therapistId} onChange={e => setForm(f => ({ ...f, therapistId: e.target.value }))} className={inputCls}>
                <option value="">— Sin asignar —</option>
                {therapists.map(t => (
                  <option key={t.id} value={t.id}>{t.name}{t.specialization ? ` · ${t.specialization}` : ""}</option>
                ))}
              </select>
            </div>
          ) : appointment.therapist ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nombre</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{appointment.therapist.name}</p>
              </div>
              {appointment.therapist.specialization && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Especialización</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{appointment.therapist.specialization}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Sin terapeuta asignado</p>
                <button onClick={() => setEditing(true)} className="mt-1.5 text-xs text-amber-700 dark:text-amber-400 underline">Asignar terapeuta →</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sesión vinculada ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 md:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Sesión de Tratamiento</h2>

          {relatedSession ? (
            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Sesión registrada
                    {relatedSession.sessionNumber && <span className="font-normal text-teal-600 dark:text-teal-400">· Sesión #{relatedSession.sessionNumber}</span>}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>{moment(relatedSession.sessionDate).format("DD/MM/YYYY HH:mm")}</span>
                    {relatedSession.duration && <span>{relatedSession.duration} min</span>}
                    {relatedSession.therapist && <span>· {relatedSession.therapist.name}</span>}
                    {relatedSession.painLevel != null && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${relatedSession.painLevel <= 3 ? "bg-green-100 text-green-700" : relatedSession.painLevel <= 6 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        Dolor: {relatedSession.painLevel}/10
                      </span>
                    )}
                  </div>
                  {relatedSession.progress && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{relatedSession.progress}</p>
                  )}
                  {/* Plan de tratamiento vinculado */}
                  {plan && (
                    <div className="flex items-center gap-2 pt-1">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      <Link
                        href={`/dashboard/patients/${appointment.patientId}?tab=tratamiento${plan?.id ? `&planId=${plan.id}` : ""}`}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        Plan: {plan.title} →
                      </Link>
                    </div>
                  )}
                </div>
                <Link
                  href={`/dashboard/patients/${appointment.patientId}?tab=tratamiento${plan?.id ? `&planId=${plan.id}` : ""}`}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Completar / Ver sesión →
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay sesión registrada para esta cita.</p>
              {(appointment.status === "CONFIRMED" || appointment.status === "SCHEDULED") && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  La sesión se registra desde el expediente del paciente en la pestaña Tratamiento.
                </p>
              )}
              <Link
                href={`/dashboard/patients/${appointment.patientId}?tab=tratamiento${plan?.id ? `&planId=${plan.id}` : ""}`}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-sm font-medium rounded-lg transition-colors"
              >
                Ir al expediente del paciente →
              </Link>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar Cita"
        message="¿Eliminar esta cita? La acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
