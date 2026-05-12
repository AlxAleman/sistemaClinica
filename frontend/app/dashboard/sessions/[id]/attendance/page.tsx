"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { sessionService, TreatmentSession } from "@/services/sessionService";
import { toast } from "react-hot-toast";
import Link from "next/link";

type AttendanceStatus = "ATTENDED" | "NOT_ATTENDED" | "RESCHEDULED";

const statusConfig: Record<
  AttendanceStatus,
  { label: string; description: string; colorClass: string; activeClass: string; icon: string }
> = {
  ATTENDED: {
    label: "Asistió",
    description: "El paciente estuvo presente en la sesión",
    colorClass:
      "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40",
    activeClass:
      "border-green-500 dark:border-green-400 bg-green-100 dark:bg-green-900/50 ring-2 ring-green-500 dark:ring-green-400",
    icon: "✅",
  },
  NOT_ATTENDED: {
    label: "No Asistió",
    description: "El paciente no se presentó a la sesión",
    colorClass:
      "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40",
    activeClass:
      "border-red-500 dark:border-red-400 bg-red-100 dark:bg-red-900/50 ring-2 ring-red-500 dark:ring-red-400",
    icon: "❌",
  },
  RESCHEDULED: {
    label: "Reprogramar",
    description: "La sesión será reprogramada para otra fecha",
    colorClass:
      "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40",
    activeClass:
      "border-orange-500 dark:border-orange-400 bg-orange-100 dark:bg-orange-900/50 ring-2 ring-orange-500 dark:ring-orange-400",
    icon: "🔄",
  },
};

const currentStatusLabels: Record<string, string> = {
  ATTENDED: "Asistió",
  NOT_ATTENDED: "No Asistió",
  RESCHEDULED: "Reprogramada",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-SV", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AttendancePage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<TreatmentSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await sessionService.getById(sessionId);
        setSession(data);
        if (data.attendanceStatus) {
          setSelectedStatus(data.attendanceStatus as AttendanceStatus);
        }
        if (data.notes) {
          setNotes(data.notes);
        }
      } catch {
        toast.error("Error al cargar la sesión");
      } finally {
        setLoadingSession(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast.error("Selecciona un estado de asistencia");
      return;
    }

    setSubmitting(true);
    try {
      await sessionService.confirmAttendance(sessionId, {
        attendanceStatus: selectedStatus,
        notes: notes.trim() || undefined,
      });
      toast.success("Asistencia confirmada exitosamente");
      router.push(`/dashboard/sessions/${sessionId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al confirmar asistencia");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-4 py-6 sm:px-0 text-center">
        <p className="text-gray-500 dark:text-gray-400">Sesión no encontrada.</p>
        <Link
          href="/dashboard/sessions"
          className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
        >
          Volver a Sesiones
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/sessions/${sessionId}`}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
        >
          ← Volver a la Sesión
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Confirmar Asistencia
        </h1>
      </div>

      {/* Información de la sesión */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Detalles de la Sesión
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {session.patient && (
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Paciente
              </dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {session.patient.name}
              </dd>
            </div>
          )}

          {session.therapist && (
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Terapeuta
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {session.therapist.name}
                {session.therapist.specialization && (
                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                    ({session.therapist.specialization})
                  </span>
                )}
              </dd>
            </div>
          )}

          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Fecha y Hora
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {formatDate(session.sessionDate)}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Duración
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {session.duration} minutos
            </dd>
          </div>

          {session.sessionNumber && (
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Número de Sesión
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                #{session.sessionNumber}
              </dd>
            </div>
          )}

          {session.attendanceStatus && (
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Estado Actual
              </dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    session.attendanceStatus === "ATTENDED"
                      ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                      : session.attendanceStatus === "NOT_ATTENDED"
                      ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                      : "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300"
                  }`}
                >
                  {currentStatusLabels[session.attendanceStatus] ?? session.attendanceStatus}
                </span>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Selección de estado */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Seleccionar Estado de Asistencia
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
            const config = statusConfig[status];
            const isSelected = selectedStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`flex items-center gap-4 w-full p-4 rounded-xl border-2 transition-all duration-150 text-left ${
                  isSelected ? config.activeClass : config.colorClass
                }`}
              >
                <span className="text-3xl leading-none flex-shrink-0">{config.icon}</span>
                <div>
                  <div className="text-base font-semibold">{config.label}</div>
                  <div className="text-sm opacity-80 mt-0.5">{config.description}</div>
                </div>
                {isSelected && (
                  <div className="ml-auto flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-current flex items-center justify-center opacity-80">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notas opcionales */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <label
          htmlFor="attendance-notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Notas (opcional)
        </label>
        <textarea
          id="attendance-notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones sobre la asistencia, motivo de inasistencia, instrucciones para reprogramación..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none"
        />
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <Link
          href={`/dashboard/sessions/${sessionId}`}
          className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-center"
        >
          Cancelar
        </Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !selectedStatus}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Guardando..." : "Confirmar Asistencia"}
        </button>
      </div>
    </div>
  );
}
