"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { expedienteService, Expediente, MedicalProfile } from "@/services/expedienteService";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import { EditIcon, PlusIcon, CalendarIcon, UserIcon } from "@/components/Icons";

type Tab = "expediente" | "diagnosticos" | "sesiones" | "pagos" | "notas" | "documentos";

const TABS: { id: Tab; label: string }[] = [
  { id: "expediente", label: "Expediente" },
  { id: "diagnosticos", label: "Diagnósticos" },
  { id: "sesiones", label: "Sesiones" },
  { id: "pagos", label: "Pagos" },
  { id: "notas", label: "Notas" },
  { id: "documentos", label: "Documentos" },
];

export default function ExpedientePage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;

  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("expediente");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<MedicalProfile>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchExpediente();
  }, [patientId]);

  const fetchExpediente = async () => {
    try {
      setLoading(true);
      const data = await expedienteService.getByPatient(patientId);
      setExpediente(data);
      setProfileForm({
        previousCondition: data.medicalProfile?.previousCondition ?? "",
        currentCondition: data.medicalProfile?.currentCondition ?? "",
        generalObservations: data.medicalProfile?.generalObservations ?? "",
        allergies: data.medicalProfile?.allergies ?? "",
        currentMedications: data.medicalProfile?.currentMedications ?? "",
        medicalHistory: data.medicalProfile?.medicalHistory ?? "",
        notes: data.medicalProfile?.notes ?? "",
      });
    } catch (error: any) {
      toast.error("Error al cargar el expediente");
      router.push("/dashboard/patients");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!expediente) return;
    try {
      setSavingProfile(true);
      await expedienteService.updateMedicalProfile(patientId, profileForm);
      toast.success("Perfil médico actualizado exitosamente");
      setEditingProfile(false);
      fetchExpediente();
    } catch (error: any) {
      toast.error("Error al actualizar perfil médico");
    } finally {
      setSavingProfile(false);
    }
  };

  const getDiagnosisStatusColor = (status: string) => {
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

  const getDiagnosisStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE": return "Activo";
      case "RESOLVED": return "Resuelto";
      case "CHRONIC": return "Crónico";
      default: return status;
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case "ATTENDED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "NOT_ATTENDED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "RESCHEDULED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getAttendanceLabel = (status: string) => {
    switch (status) {
      case "ATTENDED": return "Asistió";
      case "NOT_ATTENDED": return "No asistió";
      case "PENDING": return "Pendiente";
      case "RESCHEDULED": return "Reprogramada";
      default: return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH": return "Efectivo";
      case "POS": return "POS";
      case "TRANSFER": return "Transferencia";
      default: return method;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "PAID": return "Pagado";
      case "PENDING": return "Pendiente";
      case "CANCELLED": return "Cancelado";
      default: return status;
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

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-SV", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando expediente...</p>
        </div>
      </div>
    );
  }

  if (!expediente) return null;

  const { patient, medicalProfile, diagnoses, therapistNotes, sessions, payments, documents, summary } = expediente;

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pacientes", href: "/dashboard/patients" },
          { label: patient.name, href: `/dashboard/patients/${patientId}` },
          { label: "Expediente" },
        ]}
      />

      {/* Encabezado del paciente */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{patient.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">{patient.phone}</span>
                {patient.status && (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      patient.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {patient.status === "ACTIVE" ? "Activo" : "Inactivo"}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/diagnoses/new?patientId=${patientId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar Diagnóstico
            </Link>
            <Link
              href={`/dashboard/patients/${patientId}`}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Ver Perfil
            </Link>
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total sesiones</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.totalSessions}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Realizadas</p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{summary.attendedSessions}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Pendientes</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.pendingSessions}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total pagado</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            ${summary.totalPaid.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex -mb-px min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">

          {/* Tab: Expediente */}
          {activeTab === "expediente" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Perfil Médico</h2>
                {!editingProfile && (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    <EditIcon className="h-4 w-4" />
                    Editar
                  </button>
                )}
              </div>

              {editingProfile ? (
                <div className="space-y-4">
                  {[
                    { key: "previousCondition", label: "Cuadro previo" },
                    { key: "currentCondition", label: "Cuadro actual" },
                    { key: "generalObservations", label: "Observaciones generales" },
                    { key: "allergies", label: "Alergias" },
                    { key: "currentMedications", label: "Medicamentos actuales" },
                    { key: "medicalHistory", label: "Historial médico" },
                    { key: "notes", label: "Notas" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {label}
                      </label>
                      <textarea
                        rows={3}
                        value={(profileForm as any)[key] || ""}
                        onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  ))}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setEditingProfile(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingProfile ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "previousCondition", label: "Cuadro previo" },
                    { key: "currentCondition", label: "Cuadro actual" },
                    { key: "generalObservations", label: "Observaciones generales" },
                    { key: "allergies", label: "Alergias" },
                    { key: "currentMedications", label: "Medicamentos actuales" },
                    { key: "medicalHistory", label: "Historial médico" },
                    { key: "notes", label: "Notas" },
                  ].map(({ key, label }) => (
                    <div key={key} className={key === "generalObservations" || key === "medicalHistory" ? "sm:col-span-2" : ""}>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {(medicalProfile as any)?.[key] || <span className="text-gray-400 dark:text-gray-500 italic">Sin información</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}

          {/* Tab: Diagnósticos */}
          {activeTab === "diagnosticos" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Diagnósticos</h2>
                <Link
                  href={`/dashboard/diagnoses/new?patientId=${patientId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  Agregar diagnóstico
                </Link>
              </div>
              {diagnoses.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay diagnósticos registrados.</p>
              ) : (
                <div className="space-y-3">
                  {diagnoses.map((diagnosis) => (
                    <div key={diagnosis.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/dashboard/diagnoses/${diagnosis.id}`}
                              className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 truncate"
                            >
                              {diagnosis.clinicalDiagnosis}
                            </Link>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getDiagnosisStatusColor(diagnosis.status)}`}>
                              {getDiagnosisStatusLabel(diagnosis.status)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Fecha: {formatDate(diagnosis.diagnosisDate)}
                          </p>
                          {diagnosis.observations && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{diagnosis.observations}</p>
                          )}
                          {diagnosis.treatmentPlans && diagnosis.treatmentPlans.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {diagnosis.treatmentPlans.length} plan(es) de tratamiento
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/dashboard/treatment-plans?diagnosisId=${diagnosis.id}`}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex-shrink-0"
                        >
                          Ver planes →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Sesiones */}
          {activeTab === "sesiones" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Sesiones</h2>
              {sessions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay sesiones registradas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Terapeuta</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {formatDate(session.sessionDate)}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {session.sessionNumber ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {session.therapist?.name ?? "—"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {session.attendanceStatus ? (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAttendanceColor(session.attendanceStatus)}`}>
                                {getAttendanceLabel(session.attendanceStatus)}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-[160px] truncate">
                            {session.treatmentPlan?.title ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Pagos */}
          {activeTab === "pagos" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Pagos</h2>
              {payments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay pagos registrados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Método</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="px-3 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            ${payment.amount.toFixed(2)}
                          </td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              {getPaymentMethodLabel(payment.method)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(payment.status)}`}>
                              {getPaymentStatusLabel(payment.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Notas */}
          {activeTab === "notas" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Notas del Terapeuta</h2>
              {therapistNotes.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay notas registradas.</p>
              ) : (
                <div className="space-y-4">
                  {therapistNotes.map((note) => (
                    <div key={note.id} className="relative pl-4 border-l-2 border-indigo-300 dark:border-indigo-700">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{note.content}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {note.therapist && <span>{note.therapist.name}</span>}
                          <span>{formatDateTime(note.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Documentos */}
          {activeTab === "documentos" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Documentos Médicos</h2>
              {documents.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay documentos registrados.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-start gap-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{doc.fileName}</p>
                        {doc.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{doc.description}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(doc.uploadedAt)}</p>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                      >
                        Descargar
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
