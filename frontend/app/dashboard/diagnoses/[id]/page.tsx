"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { diagnosisService, Diagnosis, CreateDiagnosisData } from "@/services/diagnosisService";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import { EditIcon, TrashIcon } from "@/components/Icons";

export default function DiagnosisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<Partial<CreateDiagnosisData>>({});

  useEffect(() => {
    fetchDiagnosis();
  }, [id]);

  const fetchDiagnosis = async () => {
    try {
      setLoading(true);
      const data = await diagnosisService.getById(id);
      setDiagnosis(data);
      setFormData({
        clinicalDiagnosis: data.clinicalDiagnosis,
        diagnosisDate: data.diagnosisDate.split("T")[0],
        observations: data.observations ?? "",
        status: data.status,
      });
    } catch (error: any) {
      toast.error("Error al cargar el diagnóstico");
      router.push("/dashboard/patients");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!diagnosis) return;
    setSaving(true);
    try {
      await diagnosisService.update(id, {
        ...formData,
        observations: formData.observations || null,
      });
      toast.success("Diagnóstico actualizado exitosamente");
      setEditing(false);
      fetchDiagnosis();
    } catch (error: any) {
      toast.error("Error al actualizar el diagnóstico");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!diagnosis) return;
    try {
      await diagnosisService.delete(id);
      toast.success("Diagnóstico eliminado exitosamente");
      router.push(`/dashboard/patients/${diagnosis.patientId}`);
    } catch (error: any) {
      toast.error("Error al eliminar el diagnóstico");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "RESOLVED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "CHRONIC":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE": return "Activo";
      case "RESOLVED": return "Resuelto";
      case "CHRONIC": return "Crónico";
      default: return status;
    }
  };

  const getTreatmentPlanStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT": return "Borrador";
      case "PENDING_APPROVAL": return "Pendiente de aprobación";
      case "APPROVED": return "Aprobado";
      case "IN_PROGRESS": return "En progreso";
      case "COMPLETED": return "Completado";
      case "CANCELLED": return "Cancelado";
      default: return status;
    }
  };

  const getTreatmentPlanStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "IN_PROGRESS":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-SV", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando diagnóstico...</p>
        </div>
      </div>
    );
  }

  if (!diagnosis) return null;

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pacientes", href: "/dashboard/patients" },
          { label: "Expediente", href: `/dashboard/patients/${diagnosis.patientId}` },
          { label: "Diagnóstico" },
        ]}
      />

      <div className="mb-6">
        <Link
          href={`/dashboard/patients/${diagnosis.patientId}`}
          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
        >
          ← Volver al expediente
        </Link>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Detalle del Diagnóstico</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(diagnosis.status)}`}>
                {getStatusLabel(diagnosis.status)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(diagnosis.diagnosisDate)}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <EditIcon className="h-4 w-4" />
                Editar
              </button>
            )}
            <button
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
            >
              <TrashIcon className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* Datos del diagnóstico */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Información del diagnóstico</h2>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Diagnóstico clínico <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.clinicalDiagnosis || ""}
                  onChange={(e) => setFormData({ ...formData, clinicalDiagnosis: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de diagnóstico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.diagnosisDate || ""}
                    onChange={(e) => setFormData({ ...formData, diagnosisDate: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                  <select
                    value={formData.status || "ACTIVE"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Diagnosis["status"] })}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="CHRONIC">Crónico</option>
                    <option value="RESOLVED">Resuelto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.observations || ""}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      clinicalDiagnosis: diagnosis.clinicalDiagnosis,
                      diagnosisDate: diagnosis.diagnosisDate.split("T")[0],
                      observations: diagnosis.observations ?? "",
                      status: diagnosis.status,
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          ) : (
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Diagnóstico clínico</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{diagnosis.clinicalDiagnosis}</dd>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de diagnóstico</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatDate(diagnosis.diagnosisDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</dt>
                  <dd className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(diagnosis.status)}`}>
                      {getStatusLabel(diagnosis.status)}
                    </span>
                  </dd>
                </div>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Observaciones</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {diagnosis.observations || <span className="text-gray-400 dark:text-gray-500 italic">Sin observaciones</span>}
                </dd>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de creación</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatDate(diagnosis.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Última actualización</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatDate(diagnosis.updatedAt)}</dd>
                </div>
              </div>
            </dl>
          )}
        </div>

        {/* Planes de tratamiento vinculados */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Planes de tratamiento</h2>
            <Link
              href={`/dashboard/treatment-plans/new?patientId=${diagnosis.patientId}`}
              className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
            >
              + Agregar plan
            </Link>
          </div>
          {!diagnosis.treatmentPlans || diagnosis.treatmentPlans.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
              No hay planes de tratamiento vinculados a este diagnóstico.
            </p>
          ) : (
            <div className="space-y-3">
              {diagnosis.treatmentPlans.map((plan) => (
                <div key={plan.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/treatment-plans/${plan.id}`}
                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                      >
                        {plan.title}
                      </Link>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getTreatmentPlanStatusColor(plan.status)}`}>
                        {getTreatmentPlanStatusLabel(plan.status)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {plan.sessionsCompleted} / {plan.sessionsPlanned} sesiones
                    </span>
                  </div>
                  {plan.sessionsPlanned > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((plan.sessionsCompleted / plan.sessionsPlanned) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar diagnóstico"
        message="¿Estás seguro de que deseas eliminar este diagnóstico? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
