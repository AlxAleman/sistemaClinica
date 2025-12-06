"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { patientService, Patient } from "@/services/patientService";
import { sessionService, TreatmentSession } from "@/services/sessionService";
import { treatmentPlanService, TreatmentPlan } from "@/services/treatmentPlanService";
import { evaluationService, Evaluation } from "@/services/evaluationService";
import { prescriptionService, Prescription } from "@/services/prescriptionService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import Avatar from "@/components/Avatar";
import ImageModal from "@/components/ImageModal";
import DocumentsList from "@/components/DocumentsList";
import DocumentUpload from "@/components/DocumentUpload";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProgressChart from "@/components/ProgressChart";
import { HospitalIcon, CalendarIcon, UsersIcon, FileTextIcon, PlusIcon } from "@/components/Icons";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<TreatmentSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchPatient();
    fetchSessions();
    fetchTreatmentPlans();
    fetchEvaluations();
    fetchPrescriptions();
  }, [id]);

  // Prevenir comportamiento por defecto del navegador al arrastrar archivos
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const data = await patientService.getById(id);
      setPatient(data);
    } catch (error: any) {
      toast.error("Error al cargar paciente");
      router.push("/dashboard/patients");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await sessionService.getAll({
        patientId: id,
        limit: 1000,
      });
      setSessions(response.sessions);
    } catch (error: any) {
      console.error("Error al cargar sesiones:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchTreatmentPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await treatmentPlanService.getAll({
        patientId: id,
        limit: 1000,
      });
      setTreatmentPlans(response.treatmentPlans);
    } catch (error: any) {
      console.error("Error al cargar planes de tratamiento:", error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchEvaluations = async () => {
    try {
      setLoadingEvaluations(true);
      const response = await evaluationService.getAll({
        patientId: id,
        limit: 1000,
      });
      setEvaluations(response.evaluations);
    } catch (error: any) {
      console.error("Error al cargar evaluaciones:", error);
    } finally {
      setLoadingEvaluations(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true);
      const response = await prescriptionService.getAll({
        patientId: id,
        limit: 1000,
      });
      setPrescriptions(response.prescriptions);
    } catch (error: any) {
      console.error("Error al cargar recetas:", error);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patient) return;

    try {
      await patientService.delete(id);
      toast.success("Paciente eliminado exitosamente");
      router.push("/dashboard/patients");
    } catch (error: any) {
      toast.error("Error al eliminar paciente");
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando paciente...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pacientes", href: "/dashboard/patients" },
          { label: patient.name },
        ]}
      />

      <div className="mb-6">
        <Link
          href="/dashboard/patients"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
        >
          ← Volver a Pacientes
        </Link>
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                if (patient.photoUrl) {
                  setIsImageModalOpen(true);
                }
              }}
              title={patient.photoUrl ? "Haz clic para ver la imagen completa" : ""}
            >
              <Avatar
                photoUrl={patient.photoUrl}
                gender={patient.gender}
                name={patient.name}
                size="xl"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{patient.name}</h1>
              {patient.gender && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {patient.gender === "MALE" ? "Masculino" : patient.gender === "FEMALE" ? "Femenino" : "Otro"}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/patients/${id}/edit`}
              className="bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Editar
            </Link>
                <button
                  onClick={handleDeleteClick}
                  className="bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Eliminar
                </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información Personal */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Información Personal
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{patient.name}</dd>
            </div>
            {patient.email && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{patient.email}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{patient.phone}</dd>
            </div>
            {patient.dui && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">DUI</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{patient.dui}</dd>
              </div>
            )}
            {patient.gender && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Género</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {patient.gender === "MALE" ? "Masculino" : patient.gender === "FEMALE" ? "Femenino" : "Otro"}
                </dd>
              </div>
            )}
            {patient.birthDate && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Fecha de Nacimiento
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(patient.birthDate).toLocaleDateString("es-ES")}
                </dd>
              </div>
            )}
            {patient.address && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Dirección</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{patient.address}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Contacto de Emergencia */}
        {(patient.emergencyContact || patient.emergencyPhone) && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Contacto de Emergencia
            </h2>
            <dl className="space-y-4">
              {patient.emergencyContact && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {patient.emergencyContact}
                  </dd>
                </div>
              )}
              {patient.emergencyPhone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {patient.emergencyPhone}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Perfil Médico */}
        {patient.medicalProfile && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:col-span-2 transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Perfil Médico
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patient.medicalProfile.allergies && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Alergias</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {patient.medicalProfile.allergies}
                  </dd>
                </div>
              )}
              {patient.medicalProfile.medicalHistory && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Historial Médico
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {patient.medicalProfile.medicalHistory}
                  </dd>
                </div>
              )}
              {patient.medicalProfile.currentMedications && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Medicamentos Actuales
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {patient.medicalProfile.currentMedications}
                  </dd>
                </div>
              )}
              {patient.medicalProfile.notes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notas</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {patient.medicalProfile.notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Estadísticas */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:col-span-2 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Estadísticas
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {patient._count?.appointments || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Citas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {patient._count?.sessions || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sesiones</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {patient._count?.evaluations || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Evaluaciones</p>
            </div>
          </div>
        </div>

        {/* Gráfico de Progreso */}
        {sessions.length > 0 && (
          <div className="md:col-span-2">
            <ProgressChart sessions={sessions} />
          </div>
        )}

        {/* Historial de Sesiones */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:col-span-2 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Historial de Sesiones
            </h2>
            <Link
              href={`/dashboard/sessions/new?patientId=${id}`}
              className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              + Nueva Sesión
            </Link>
          </div>
          {loadingSessions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando sesiones...</p>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No hay sesiones registradas para este paciente.
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <Link
                  key={session.id}
                  href={`/dashboard/sessions/${session.id}`}
                  className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {moment(session.sessionDate).format("DD/MM/YYYY HH:mm")}
                        </p>
                        {session.painLevel !== null && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            Dolor: {session.painLevel}/10
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          {session.therapist?.name || "Terapeuta desconocido"}
                        </span>
                        <span className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {session.duration} min
                        </span>
                      </div>
                      {session.progress && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {session.progress}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {sessions.length > 5 && (
                <Link
                  href={`/dashboard/sessions?patientId=${id}`}
                  className="block text-center text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors pt-2"
                >
                  Ver todas las sesiones ({sessions.length}) →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Evaluaciones */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:col-span-2 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Evaluaciones
            </h2>
            <Link
              href={`/dashboard/evaluations/new?patientId=${id}`}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Nueva Evaluación
            </Link>
          </div>
          {loadingEvaluations ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando evaluaciones...</p>
            </div>
          ) : evaluations.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No hay evaluaciones registradas para este paciente.
            </p>
          ) : (
            <div className="space-y-3">
              {evaluations.slice(0, 5).map((evaluation) => {
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

                return (
                  <Link
                    key={evaluation.id}
                    href={`/dashboard/evaluations/${evaluation.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                              evaluation.evaluationType
                            )}`}
                          >
                            {getTypeText(evaluation.evaluationType)}
                          </span>
                          {evaluation.painLevel !== null && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              Dolor: {evaluation.painLevel}/10
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {moment(evaluation.evaluationDate).format("DD/MM/YYYY")}
                          </span>
                        </div>
                        {evaluation.rangeOfMotion && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            📏 {evaluation.rangeOfMotion.substring(0, 60)}...
                          </p>
                        )}
                        {evaluation.strength && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            💪 {evaluation.strength.substring(0, 60)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
              {evaluations.length > 5 && (
                <Link
                  href={`/dashboard/evaluations?patientId=${id}`}
                  className="block text-center text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors pt-2"
                >
                  Ver todas las evaluaciones ({evaluations.length}) →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Planes de Tratamiento */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:col-span-2 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Planes de Tratamiento
            </h2>
            <Link
              href={`/dashboard/treatment-plans/new?patientId=${id}`}
              className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              + Nuevo Plan
            </Link>
          </div>
          {loadingPlans ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando planes...</p>
            </div>
          ) : treatmentPlans.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No hay planes de tratamiento registrados para este paciente.
            </p>
          ) : (
            <div className="space-y-3">
              {treatmentPlans.slice(0, 5).map((plan) => {
                const progressPercentage = plan.sessionsPlanned > 0 
                  ? Math.round((plan.sessionsCompleted / plan.sessionsPlanned) * 100)
                  : 0;
                
                return (
                  <Link
                    key={plan.id}
                    href={`/dashboard/treatment-plans/${plan.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {plan.title}
                          </p>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            plan.status === "APPROVED" || plan.status === "IN_PROGRESS"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : plan.status === "COMPLETED"
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}>
                            {plan.status === "DRAFT" ? "Borrador" : 
                             plan.status === "PENDING_APPROVAL" ? "Pendiente" :
                             plan.status === "APPROVED" ? "Aprobado" :
                             plan.status === "IN_PROGRESS" ? "En Progreso" :
                             plan.status === "COMPLETED" ? "Completado" : "Cancelado"}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>{plan.sessionsCompleted}/{plan.sessionsPlanned} sesiones</span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        {plan.totalCost && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Costo: ${plan.totalCost.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
              {treatmentPlans.length > 5 && (
                <Link
                  href={`/dashboard/treatment-plans?patientId=${id}`}
                  className="block text-center text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors pt-2"
                >
                  Ver todos los planes ({treatmentPlans.length}) →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Subir Documento */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:col-span-2 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Subir Nuevo Examen o Documento
          </h2>
          <DocumentUpload
            patientId={id}
            onUploadComplete={() => {
              setRefreshKey((prev) => prev + 1);
              fetchPatient();
            }}
          />
        </div>

        {/* Historial de Exámenes */}
        <DocumentsList
          key={refreshKey}
          documents={patient.documents || []}
          patientName={patient.name}
        />
      </div>

      {/* Modal de imagen */}
      {patient.photoUrl && (
        <ImageModal
          imageUrl={patient.photoUrl}
          alt={`Foto de ${patient.name}`}
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Paciente"
        message={`¿Estás seguro de que deseas eliminar a ${patient?.name}? Esta acción no se puede deshacer y se eliminarán todos los datos relacionados.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}

