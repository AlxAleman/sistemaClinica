"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { evaluationService, Evaluation } from "@/services/evaluationService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import { EditIcon, TrashIcon, CalendarIcon, UsersIcon, ArrowLeftIcon } from "@/components/Icons";

export default function EvaluationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: "",
  });

  useEffect(() => {
    fetchEvaluation();
  }, [id]);

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const data = await evaluationService.getById(id);
      setEvaluation(data);
    } catch (error: any) {
      toast.error("Error al cargar evaluación");
      router.push("/dashboard/evaluations");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (!evaluation) return;
    setDeleteConfirm({ isOpen: true, id: evaluation.id });
  };

  const handleDeleteConfirm = async () => {
    if (!evaluation) return;
    try {
      await evaluationService.delete(id);
      toast.success("Evaluación eliminada exitosamente");
      router.push("/dashboard/evaluations");
    } catch (error: any) {
      toast.error("Error al eliminar evaluación");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "INITIAL":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "PROGRESS":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "FINAL":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "INITIAL":
        return "Inicial";
      case "PROGRESS":
        return "Progreso";
      case "FINAL":
        return "Final";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando evaluación...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return null;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Evaluaciones", href: "/dashboard/evaluations" },
          { label: "Detalle de Evaluación" },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/evaluations"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver a Evaluaciones
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Evaluación de {evaluation.patient?.name || "Paciente"}
                </h1>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(
                      evaluation.evaluationType
                    )}`}
                  >
                    {getTypeText(evaluation.evaluationType)}
                  </span>
                  {evaluation.painLevel !== null && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      Dolor: {evaluation.painLevel}/10
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/evaluations/${id}/edit`}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <EditIcon className="h-4 w-4" />
                  Editar
                </Link>
                <button
                  onClick={handleDeleteClick}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Información General */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Paciente
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {evaluation.patient?.name || "N/A"}
                </p>
                {evaluation.patient?.phone && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {evaluation.patient.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Fecha de Evaluación
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {moment(evaluation.evaluationDate).format("DD/MM/YYYY HH:mm")}
                </p>
              </div>
            </div>

            {/* Nivel de Dolor */}
            {evaluation.painLevel !== null && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Nivel de Dolor
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full transition-all"
                      style={{ width: `${((evaluation.painLevel || 0) / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {evaluation.painLevel || 0}/10
                  </span>
                </div>
              </div>
            )}

            {/* Rango de Movimiento */}
            {evaluation.rangeOfMotion && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Rango de Movimiento
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {evaluation.rangeOfMotion}
                </p>
              </div>
            )}

            {/* Fuerza */}
            {evaluation.strength && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Fuerza
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {evaluation.strength}
                </p>
              </div>
            )}

            {/* Evaluación Funcional */}
            {evaluation.functionalAssessment && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Evaluación Funcional
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {evaluation.functionalAssessment}
                </p>
              </div>
            )}

            {/* Notas */}
            {evaluation.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Notas Adicionales
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {evaluation.notes}
                </p>
              </div>
            )}

            {/* Comparación */}
            {evaluation.evaluationType === "FINAL" && evaluation.patientId && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/dashboard/evaluations/comparison?patientId=${evaluation.patientId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Ver Comparación Inicial vs Final
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Evaluación"
        message="¿Estás seguro de que quieres eliminar esta evaluación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}

