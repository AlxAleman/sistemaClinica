"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { treatmentPlanService, TreatmentPlan } from "@/services/treatmentPlanService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import { EditIcon, TrashIcon, CheckIcon, CalendarIcon, UsersIcon } from "@/components/Icons";

export default function TreatmentPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: "",
  });
  const [approveConfirm, setApproveConfirm] = useState({
    isOpen: false,
    id: "",
  });

  useEffect(() => {
    fetchPlan();
  }, [id]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const data = await treatmentPlanService.getById(id);
      setPlan(data);
    } catch (error: any) {
      toast.error("Error al cargar plan de tratamiento");
      router.push("/dashboard/treatment-plans");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (!plan) return;
    setDeleteConfirm({ isOpen: true, id: plan.id });
  };

  const handleDeleteConfirm = async () => {
    if (!plan) return;
    try {
      await treatmentPlanService.delete(id);
      toast.success("Plan de tratamiento eliminado exitosamente");
      router.push("/dashboard/treatment-plans");
    } catch (error: any) {
      toast.error("Error al eliminar plan de tratamiento");
    }
  };

  const handleApproveClick = () => {
    if (!plan) return;
    setApproveConfirm({ isOpen: true, id: plan.id });
  };

  const handleApproveConfirm = async () => {
    if (!plan) return;
    try {
      await treatmentPlanService.approve(id);
      toast.success("Plan de tratamiento aprobado exitosamente");
      fetchPlan();
      setApproveConfirm({ isOpen: false, id: "" });
    } catch (error: any) {
      toast.error("Error al aprobar plan de tratamiento");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Borrador";
      case "PENDING_APPROVAL":
        return "Pendiente de Aprobación";
      case "APPROVED":
        return "Aprobado";
      case "IN_PROGRESS":
        return "En Progreso";
      case "COMPLETED":
        return "Completado";
      case "CANCELLED":
        return "Cancelado";
      default:
        return status;
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

  if (!plan) {
    return null;
  }

  const progressPercentage = plan.sessionsPlanned > 0 
    ? Math.round((plan.sessionsCompleted / plan.sessionsPlanned) * 100)
    : 0;

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Planes de Tratamiento", href: "/dashboard/treatment-plans" },
          { label: plan.title },
        ]}
      />

      <div className="mb-6">
        <Link
          href="/dashboard/treatment-plans"
          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
        >
          ← Volver a Planes de Tratamiento
        </Link>
        <div className="mt-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{plan.title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                  plan.status
                )}`}
              >
                {getStatusText(plan.status)}
              </span>
              {plan.approvedByPatient && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  ✓ Aprobado por paciente
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {plan.status === "PENDING_APPROVAL" && !plan.approvedByPatient && (
              <button
                onClick={handleApproveClick}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                Aprobar Plan
              </button>
            )}
            <Link
              href={`/dashboard/treatment-plans/${id}/edit`}
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
            Información del Plan
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Paciente</dt>
              <dd className="mt-1 text-sm text-indigo-600 dark:text-indigo-400">
                <Link href={`/dashboard/patients/${plan.patientId}`}>
                  {plan.patient?.name || "Desconocido"}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    plan.status
                  )}`}
                >
                  {getStatusText(plan.status)}
                </span>
              </dd>
            </div>
            {plan.totalCost && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Costo Total</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  ${plan.totalCost.toFixed(2)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Progreso de Sesiones */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Progreso de Sesiones
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Sesiones completadas
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {plan.sessionsCompleted} / {plan.sessionsPlanned}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {progressPercentage}% completado
              </p>
            </div>
          </div>
        </div>

        {/* Diagnóstico */}
        {plan.diagnosis && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Diagnóstico
            </h2>
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {plan.diagnosis}
            </p>
          </div>
        )}

        {/* Descripción */}
        {plan.description && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Descripción
            </h2>
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {plan.description}
            </p>
          </div>
        )}

        {/* Objetivos */}
        {plan.goals && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:col-span-2 transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Objetivos del Tratamiento
            </h2>
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {plan.goals}
            </p>
          </div>
        )}

        {/* Información del Sistema */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:col-span-2 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Información del Sistema
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Creación</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {moment(plan.createdAt).format("DD/MM/YYYY HH:mm")}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Última Actualización</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {moment(plan.updatedAt).format("DD/MM/YYYY HH:mm")}
              </dd>
            </div>
            {plan.approvedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Aprobación</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {moment(plan.approvedAt).format("DD/MM/YYYY HH:mm")}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Plan de Tratamiento"
        message="¿Estás seguro de que quieres eliminar este plan de tratamiento? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      <ConfirmDialog
        isOpen={approveConfirm.isOpen}
        onClose={() => setApproveConfirm({ ...approveConfirm, isOpen: false })}
        onConfirm={handleApproveConfirm}
        title="Aprobar Plan de Tratamiento"
        message="¿Estás seguro de que quieres aprobar este plan de tratamiento? El estado cambiará a 'Aprobado' y se marcará como aprobado por el paciente."
        confirmText="Aprobar"
        cancelText="Cancelar"
        type="info"
      />
    </div>
  );
}

