"use client";

import { useState, useEffect } from "react";
import { sessionService, TreatmentSession, SessionProtocolItem } from "@/services/sessionService";
import { therapistService } from "@/services/therapistService";
import { treatmentPlanService } from "@/services/treatmentPlanService";
import { toast } from "react-hot-toast";

type AttendanceStatus = "ATTENDED" | "NOT_ATTENDED" | "RESCHEDULED" | "PENDING";

interface SessionModalProps {
  session: TreatmentSession;
  onClose: () => void;
  onSaved: () => void;
}

export default function SessionModal({ session, onClose, onSaved }: SessionModalProps) {
  const [loading, setLoading] = useState(true);
  const [therapists, setTherapists] = useState<{ id: string; name: string; specialization?: string | null }[]>([]);
  const [planTitle, setPlanTitle] = useState<string>((session as any)?.treatmentPlan?.title ?? "");
  const [sessionForm, setSessionForm] = useState({
    sessionDate: "",
    therapistId: session.therapistId ?? "",
    duration: session.duration,
    attendanceStatus: (session.attendanceStatus ?? "PENDING") as AttendanceStatus,
    painLevel: session.painLevel ?? 0,
    progress: session.progress ?? "",
    notes: session.notes ?? "",
  });
  const [sessionProtocol, setSessionProtocol] = useState<SessionProtocolItem[]>(session.sessionProtocol ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");

    const init = async () => {
      let fullSession = session;
      try { fullSession = await sessionService.getById(session.id); } catch {}

      const d = new Date(fullSession.sessionDate);
      const localDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setSessionForm({
        sessionDate: localDate,
        therapistId: fullSession.therapistId ?? "",
        duration: fullSession.duration,
        attendanceStatus: (fullSession.attendanceStatus ?? "PENDING") as AttendanceStatus,
        painLevel: fullSession.painLevel ?? 0,
        progress: fullSession.progress ?? "",
        notes: fullSession.notes ?? "",
      });

      // Protocol: use session's saved protocol, or fall back to plan template
      let protocol: SessionProtocolItem[] = fullSession.sessionProtocol ?? [];
      if (protocol.length === 0 && fullSession.treatmentPlanId) {
        try {
          const plan = await treatmentPlanService.getById(fullSession.treatmentPlanId);
          setPlanTitle(plan.title);
          const proto = (plan.protocol as any[] | null | undefined) ?? [];
          protocol = proto.map((item: any) => ({
            order: item.order, type: item.type, procedure: item.procedure,
            area: item.area, side: item.side, duration: item.duration,
            intensity: item.intensity, series: item.series, reps: item.reps,
            weight: item.weight, resistance: item.resistance,
            completed: false, notes: "",
          }));
        } catch {}
      } else if (!planTitle && fullSession.treatmentPlanId) {
        try {
          const plan = await treatmentPlanService.getById(fullSession.treatmentPlanId);
          setPlanTitle(plan.title);
        } catch {}
      }
      setSessionProtocol(protocol);

      try {
        const res = await therapistService.getAll({ limit: 100 });
        setTherapists(res.therapists);
      } catch {}

      setLoading(false);
    };

    init();
  }, [session.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await sessionService.update(session.id, {
        sessionDate: new Date(sessionForm.sessionDate).toISOString(),
        therapistId: sessionForm.therapistId || null,
        duration: sessionForm.duration,
        attendanceStatus: sessionForm.attendanceStatus,
        painLevel: sessionForm.painLevel > 0 ? sessionForm.painLevel : null,
        progress: sessionForm.progress || null,
        notes: sessionForm.notes || null,
        sessionProtocol: sessionProtocol.length > 0 ? sessionProtocol : null,
      });
      toast.success("Sesión actualizada");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al guardar la sesión");
    } finally {
      setSaving(false);
    }
  };

  const completedCount = sessionProtocol.filter(i => i.completed).length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Editar Sesión</h3>
            {planTitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{planTitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <>
            {/* Form */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-700">

              {/* Sección 1: Datos generales */}
              <div className="px-6 py-4 space-y-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Datos de la sesión</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha y hora</label>
                    <input
                      type="datetime-local"
                      value={sessionForm.sessionDate}
                      onChange={(e) => setSessionForm((f) => ({ ...f, sessionDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Duración (min)</label>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={sessionForm.duration}
                      onChange={(e) => setSessionForm((f) => ({ ...f, duration: parseInt(e.target.value) || 60 }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Terapeuta</label>
                  <select
                    value={sessionForm.therapistId}
                    onChange={(e) => setSessionForm((f) => ({ ...f, therapistId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">-- Seleccionar terapeuta --</option>
                    {therapists.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}{t.specialization ? ` — ${t.specialization}` : ""}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Asistencia</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([["ATTENDED", "Asistió", "green"], ["NOT_ATTENDED", "No asistió", "red"]] as const).map(([val, lbl, color]) => {
                      const colors: Record<string, string> = {
                        green: "border-green-400 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                        red:   "border-red-400 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                      };
                      const isActive = sessionForm.attendanceStatus === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setSessionForm((f) => ({ ...f, attendanceStatus: val }));
                            if (val === "ATTENDED") {
                              setSessionProtocol(prev => prev.map(item => ({ ...item, completed: true })));
                            } else if (val === "NOT_ATTENDED" || val === "PENDING") {
                              setSessionProtocol(prev => prev.map(item => ({ ...item, completed: false })));
                            }
                          }}
                          className={`px-2 py-1.5 text-xs font-medium rounded-lg border-2 transition-all ${isActive ? colors[color] : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300"}`}
                        >
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Escala de dolor (EVA) —{" "}
                    <span className={`font-bold ${sessionForm.painLevel <= 3 ? "text-green-600" : sessionForm.painLevel <= 6 ? "text-yellow-600" : "text-red-600"}`}>
                      {sessionForm.painLevel}/10
                    </span>
                  </label>
                  <input
                    type="range" min={0} max={10} step={1}
                    value={sessionForm.painLevel}
                    onChange={(e) => setSessionForm((f) => ({ ...f, painLevel: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>Sin dolor</span><span>Insoportable</span>
                  </div>
                </div>
              </div>

              {/* Sección 2: Protocolo ejecutado */}
              {sessionProtocol.length > 0 && (
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Protocolo ejecutado</p>
                    <span className="text-xs text-gray-400">{completedCount}/{sessionProtocol.length} completados</span>
                  </div>
                  <div className="space-y-2">
                    {sessionProtocol.map((item, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border transition-colors ${item.completed ? "border-green-200 dark:border-green-800/40 bg-green-50/50 dark:bg-green-900/10" : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"}`}
                      >
                        <div className="flex items-center gap-3 px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => setSessionProtocol(p => p.map((it, i) => i === idx ? { ...it, completed: !it.completed } : it))}
                            className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${item.completed ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-gray-600 hover:border-green-400"}`}
                          >
                            {item.completed && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{item.order}</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.type}</span>
                              {item.procedure && <span className="text-xs text-gray-500 dark:text-gray-400">· {item.procedure}</span>}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.area && <span className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 rounded">{item.area}</span>}
                              {item.side && <span className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 rounded">{item.side}</span>}
                              {item.duration && <span className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 rounded">{item.duration} min</span>}
                              {item.intensity && <span className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 rounded">{item.intensity}</span>}
                              {item.series && item.reps && <span className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 rounded">{item.series}×{item.reps} rep</span>}
                              {item.weight && <span className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 rounded">{item.weight}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="px-4 pb-3">
                          <textarea
                            rows={1}
                            value={item.notes}
                            onChange={(e) => setSessionProtocol(p => p.map((it, i) => i === idx ? { ...it, notes: e.target.value } : it))}
                            placeholder="Observaciones de este paso (opcional)..."
                            className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sección 3: Evolución y notas */}
              <div className="px-6 py-4 space-y-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Evolución y notas</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Progreso del paciente</label>
                  <textarea
                    value={sessionForm.progress}
                    rows={2}
                    onChange={(e) => setSessionForm((f) => ({ ...f, progress: e.target.value }))}
                    placeholder="Evolución observada, mejoras, limitaciones..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notas del terapeuta</label>
                  <textarea
                    value={sessionForm.notes}
                    rows={2}
                    onChange={(e) => setSessionForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Observaciones clínicas, incidencias, próximos pasos..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
              <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                {sessionProtocol.length > 0 && `${completedCount} de ${sessionProtocol.length} pasos completados`}
              </span>
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving
                    ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Guardando...</>
                    : "Guardar cambios"
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
