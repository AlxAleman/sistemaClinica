"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { appointmentService, Appointment } from "@/services/appointmentService";
import { sessionService, TreatmentSession } from "@/services/sessionService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import { HospitalIcon, EditIcon, TrashIcon, CheckIcon, CalendarIcon, UsersIcon } from "@/components/Icons";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [relatedSession, setRelatedSession] = useState<TreatmentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSession, setLoadingSession] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  // Obtener parámetros de retorno
  const returnView = searchParams.get("returnView");
  const returnDate = searchParams.get("returnDate");

  useEffect(() => {
    fetchAppointment();
    fetchRelatedSession();
  }, [id]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getById(id);
      setAppointment(data);
    } catch (error: any) {
      toast.error("Error al cargar cita");
      router.push("/dashboard/appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedSession = async () => {
    try {
      setLoadingSession(true);
      const response = await sessionService.getAll({
        appointmentId: id,
        limit: 1,
      });
      if (response.sessions.length > 0) {
        setRelatedSession(response.sessions[0]);
      } else {
        setRelatedSession(null);
      }
    } catch (error: any) {
      console.error("Error al cargar sesión relacionada:", error);
      setRelatedSession(null);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!appointment) return;

    try {
      await appointmentService.delete(id);
      toast.success("Cita eliminada exitosamente");
      // Regresar a la vista anterior
      let returnUrl = "/dashboard/appointments";
      if (returnView && returnDate) {
        returnUrl += `?view=${returnView}&date=${encodeURIComponent(returnDate)}`;
      } else if (returnView) {
        returnUrl += `?view=${returnView}`;
      } else if (returnDate) {
        returnUrl += `?date=${encodeURIComponent(returnDate)}`;
      }
      router.push(returnUrl);
    } catch (error: any) {
      toast.error("Error al eliminar cita");
    }
  };

  const handleConfirm = async () => {
    if (!appointment) return;

    try {
      await appointmentService.confirm(id);
      toast.success("Cita confirmada exitosamente");
      fetchAppointment();
    } catch (error: any) {
      toast.error("Error al confirmar cita");
    }
  };


  const getStatusText = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "Programada";
      case "CONFIRMED":
        return "Confirmada";
      case "COMPLETED":
        return "Completada";
      case "CANCELLED":
        return "Cancelada";
      case "NO_SHOW":
        return "No asistió";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando cita...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Citas", href: "/dashboard/appointments" },
          { label: "Detalle de Cita" },
        ]}
      />

      <div className="mb-6">
        <button
          onClick={() => {
            // Construir URL de retorno con los parámetros guardados
            let returnUrl = "/dashboard/appointments";
            if (returnView && returnDate) {
              returnUrl += `?view=${returnView}&date=${encodeURIComponent(returnDate)}`;
            } else if (returnView) {
              returnUrl += `?view=${returnView}`;
            } else if (returnDate) {
              returnUrl += `?date=${encodeURIComponent(returnDate)}`;
            }
            router.push(returnUrl);
          }}
          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
        >
          ← Volver a Citas
        </button>
        <div className="mt-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Detalle de Cita</h1>
            <span
              className={`mt-2 inline-block px-3 py-1 text-sm font-medium rounded-full ${
                appointment.status === "CONFIRMED"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : appointment.status === "COMPLETED"
                  ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  : appointment.status === "CANCELLED"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  : appointment.status === "NO_SHOW"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
              }`}
            >
              {getStatusText(appointment.status)}
            </span>
          </div>
          <div className="flex gap-2">
            {appointment.status === "SCHEDULED" && (
              <button
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                Confirmar Cita
              </button>
            )}
            {!relatedSession && (appointment.status === "CONFIRMED" || appointment.status === "COMPLETED") && (
              <Link
                href={`/dashboard/sessions/new?appointmentId=${id}&patientId=${appointment.patientId}&therapistId=${appointment.therapistId}&date=${moment(appointment.appointmentDate).format("YYYY-MM-DDTHH:mm")}&duration=${appointment.duration}`}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <HospitalIcon className="h-4 w-4" />
                Registrar Sesión
              </Link>
            )}
            {relatedSession && (
              <Link
                href={`/dashboard/sessions/${relatedSession.id}`}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <HospitalIcon className="h-4 w-4" />
                Ver Sesión Registrada
              </Link>
            )}
            <Link
              href={`/dashboard/appointments/${id}/edit`}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <EditIcon className="h-4 w-4" />
              Editar
            </Link>
            <button
              onClick={handleDeleteClick}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información de la Cita */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Información de la Cita
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha y Hora</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {moment(appointment.appointmentDate).format("DD/MM/YYYY HH:mm")}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Duración</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{appointment.duration} minutos</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</dt>
              <dd className="mt-1">
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    appointment.status === "CONFIRMED"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : appointment.status === "COMPLETED"
                      ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      : appointment.status === "CANCELLED"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      : appointment.status === "NO_SHOW"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  }`}
                >
                  {getStatusText(appointment.status)}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Información del Paciente */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Paciente</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</dt>
              <dd className="mt-1 text-sm text-indigo-600 dark:text-indigo-400">
                <Link href={`/dashboard/patients/${appointment.patientId}`}>
                  {appointment.patient?.name || "N/A"}
                </Link>
              </dd>
            </div>
            {appointment.patient?.phone && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {appointment.patient.phone}
                </dd>
              </div>
            )}
            {appointment.patient?.email && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {appointment.patient.email}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Información del Terapeuta */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Terapeuta</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {appointment.therapist?.name || "N/A"}
              </dd>
            </div>
            {appointment.therapist?.specialization && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Especialización</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {appointment.therapist.specialization}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Sesión Relacionada */}
        {!loadingSession && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:col-span-2 transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Sesión de Tratamiento
            </h2>
            {relatedSession ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        ✓ Sesión registrada
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {moment(relatedSession.sessionDate).format("DD/MM/YYYY HH:mm")}
                        </span>
                        <span className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          {relatedSession.therapist?.name}
                        </span>
                        {relatedSession.painLevel !== null && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            Dolor: {relatedSession.painLevel}/10
                          </span>
                        )}
                      </div>
                      {relatedSession.progress && (
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {relatedSession.progress}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/sessions/${relatedSession.id}`}
                      className="ml-4 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
                    >
                      Ver detalles →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  No se ha registrado una sesión de tratamiento para esta cita.
                </p>
                {(appointment.status === "CONFIRMED" || appointment.status === "COMPLETED") && (
                  <Link
                    href={`/dashboard/sessions/new?appointmentId=${id}&patientId=${appointment.patientId}&therapistId=${appointment.therapistId}&date=${moment(appointment.appointmentDate).format("YYYY-MM-DDTHH:mm")}&duration=${appointment.duration}`}
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <HospitalIcon className="h-4 w-4" />
                    Registrar Sesión
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Cita"
        message="¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}

