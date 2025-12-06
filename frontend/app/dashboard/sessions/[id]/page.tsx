"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { sessionService, TreatmentSession } from "@/services/sessionService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import { EditIcon, TrashIcon, CalendarIcon, UsersIcon, HospitalIcon } from "@/components/Icons";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [session, setSession] = useState<TreatmentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: "",
  });

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const data = await sessionService.getById(id);
      setSession(data);
    } catch (error: any) {
      toast.error("Error al cargar sesión");
      router.push("/dashboard/sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (!session) return;
    setDeleteConfirm({ isOpen: true, id: session.id });
  };

  const handleDeleteConfirm = async () => {
    if (!session) return;
    try {
      await sessionService.delete(id);
      toast.success("Sesión eliminada exitosamente");
      router.push("/dashboard/sessions");
    } catch (error: any) {
      toast.error("Error al eliminar sesión");
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Sesiones", href: "/dashboard/sessions" },
          { label: `Sesión del ${moment(session.sessionDate).format("DD/MM/YYYY")}` },
        ]}
      />

      <div className="mb-6">
        <Link
          href="/dashboard/sessions"
          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
        >
          ← Volver a Sesiones
        </Link>
        <div className="mt-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Detalles de la Sesión
          </h1>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/sessions/${id}/edit`}
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
        {/* Información Principal */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Información de la Sesión
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Paciente</dt>
              <dd className="mt-1 text-sm text-indigo-600 dark:text-indigo-400">
                <Link href={`/dashboard/patients/${session.patientId}`}>
                  {session.patient?.name || "Desconocido"}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Terapeuta</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {session.therapist?.name || "Desconocido"}
                {session.therapist?.specialization && (
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    - {session.therapist.specialization}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha y Hora</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {moment(session.sessionDate).format("DD/MM/YYYY HH:mm")}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Duración</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {session.duration} minutos
              </dd>
            </div>
            {session.appointmentId && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cita Relacionada</dt>
                <dd className="mt-1 text-sm text-indigo-600 dark:text-indigo-400">
                  <Link href={`/dashboard/appointments/${session.appointmentId}`}>
                    Ver cita relacionada
                  </Link>
                </dd>
              </div>
            )}
            {session.painLevel !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nivel de Dolor</dt>
                <dd className="mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {session.painLevel || 0}/10
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-600 dark:bg-red-500 h-2 rounded-full"
                        style={{ width: `${((session.painLevel || 0) / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Detalles Clínicos */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Detalles Clínicos
          </h2>
          <dl className="space-y-4">
            {session.interventions && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Intervenciones Realizadas
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {session.interventions}
                </dd>
              </div>
            )}
            {session.progress && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Progreso</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {session.progress}
                </dd>
              </div>
            )}
            {session.notes && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notas</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {session.notes}
                </dd>
              </div>
            )}
            {!session.interventions && !session.progress && !session.notes && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No hay detalles clínicos registrados para esta sesión.
              </p>
            )}
          </dl>
        </div>

        {/* Información del Sistema */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:col-span-2 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Información del Sistema
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Creación</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {moment(session.createdAt).format("DD/MM/YYYY HH:mm")}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Última Actualización</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {moment(session.updatedAt).format("DD/MM/YYYY HH:mm")}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Sesión"
        message="¿Estás seguro de que quieres eliminar esta sesión? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}

