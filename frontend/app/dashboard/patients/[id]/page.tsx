"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { patientService, Patient } from "@/services/patientService";
import { sessionService, TreatmentSession, SessionProtocolItem } from "@/services/sessionService";
import { treatmentPlanService, TreatmentPlan } from "@/services/treatmentPlanService";
import { historiaClinicaService, HistoriaClinica } from "@/services/historiaClinicaService";
import { diagnosisService, Diagnosis } from "@/services/diagnosisService";
import { therapistService } from "@/services/therapistService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import "moment/locale/es";
moment.locale("es");
import Avatar from "@/components/Avatar";
import ImageModal from "@/components/ImageModal";
import DocumentUpload from "@/components/DocumentUpload";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProgressChart from "@/components/ProgressChart";
import { CalendarIcon, UsersIcon, PlusIcon } from "@/components/Icons";

type TabId = "general" | "expediente" | "tratamiento" | "historial";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "general",     label: "Información General",  icon: "👤" },
  { id: "expediente",  label: "Expediente Médico",    icon: "🩺" },
  { id: "tratamiento", label: "Tratamiento",           icon: "💊" },
  { id: "historial",   label: "Historial y Documentos", icon: "📋" },
];

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
  const [historia, setHistoria] = useState<HistoriaClinica | null>(null);
  const [loadingHistoria, setLoadingHistoria] = useState(true);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loadingDiagnoses, setLoadingDiagnoses] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("general");

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab && ["general","expediente","tratamiento","historial"].includes(tab)) {
      setActiveTab(tab as TabId);
    }
  }, []);

  // Diagnosis accordion + pagination + delete
  const [expandedDiagnoses, setExpandedDiagnoses] = useState<Set<string>>(new Set());
  const toggleDiagnosis = (diagId: string) =>
    setExpandedDiagnoses(prev => { const n = new Set(prev); n.has(diagId) ? n.delete(diagId) : n.add(diagId); return n; });
  const [diagnosesPage, setDiagnosesPage] = useState(1);
  const DIAGNOSES_PER_PAGE = 5;
  const [deleteDiagnosisId, setDeleteDiagnosisId] = useState<string | null>(null);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);

  const handleDeleteDocument = async () => {
    if (!deleteDocumentId) return;
    try {
      await api.delete(`/patients/${id}/documents/${deleteDocumentId}`);
      setPatient(prev => prev ? {
        ...prev,
        documents: prev.documents.filter((d: any) => d.id !== deleteDocumentId),
      } : prev);
      toast.success("Documento eliminado");
    } catch {
      toast.error("Error al eliminar el documento");
    } finally {
      setDeleteDocumentId(null);
    }
  };

  const handleDeleteDiagnosis = async () => {
    if (!deleteDiagnosisId) return;
    try {
      await diagnosisService.delete(deleteDiagnosisId);
      setDiagnoses(prev => prev.filter(d => d.id !== deleteDiagnosisId));
      setExpandedDiagnoses(prev => { const n = new Set(prev); n.delete(deleteDiagnosisId); return n; });
      toast.success("Diagnóstico eliminado");
    } catch {
      toast.error("Error al eliminar el diagnóstico");
    } finally {
      setDeleteDiagnosisId(null);
    }
  };

  // Treatment plan accordion & session management
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [planSessions, setPlanSessions] = useState<Record<string, TreatmentSession[]>>({});
  const [loadingPlanSessions, setLoadingPlanSessions] = useState<Record<string, boolean>>({});
  const [therapists, setTherapists] = useState<{ id: string; name: string; specialization?: string | null }[]>([]);
  const [addSessionModal, setAddSessionModal] = useState<{ planId: string; plan: TreatmentPlan; editingSessionId?: string } | null>(null);
  const [finalizePlanConfirm, setFinalizePlanConfirm] = useState<TreatmentPlan | null>(null);
  const [finalizingPlan, setFinalizingPlan] = useState(false);
  const [extendPlanModal, setExtendPlanModal] = useState<TreatmentPlan | null>(null);
  const [extendSessions, setExtendSessions] = useState(5);

  // Historial pagination
  const [completedPlansPage, setCompletedPlansPage] = useState(1);
  const [completedPlansPerPage, setCompletedPlansPerPage] = useState(5);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsPerPage, setSessionsPerPage] = useState(5);
  const [activeDocCategory, setActiveDocCategory] = useState<string>("todos");
  const [sessionForm, setSessionForm] = useState({
    sessionDate: "", therapistId: "", duration: 60,
    attendanceStatus: "ATTENDED" as "ATTENDED" | "NOT_ATTENDED" | "RESCHEDULED" | "PENDING",
    painLevel: 0, progress: "", notes: "",
  });
  const [sessionProtocol, setSessionProtocol] = useState<SessionProtocolItem[]>([]);
  const [savingSession, setSavingSession] = useState(false);

  useEffect(() => {
    fetchPatient();
    fetchSessions();
    fetchTreatmentPlans();
    fetchHistoria();
    fetchDiagnoses();
    therapistService.getAll({ limit: 100 }).then(r => setTherapists(r.therapists)).catch(() => {});
  }, [id]);

  const fetchDiagnoses = async () => {
    setLoadingDiagnoses(true);
    try {
      const res = await diagnosisService.getByPatient(id);
      setDiagnoses(res);
    } catch (err) {
      setDiagnoses([]);
    } finally {
      setLoadingDiagnoses(false);
    }
  };

  const togglePlan = async (planId: string) => {
    setExpandedPlans(prev => {
      const next = new Set(prev);
      if (next.has(planId)) { next.delete(planId); return next; }
      next.add(planId);
      return next;
    });
    if (!planSessions[planId] && !loadingPlanSessions[planId]) {
      setLoadingPlanSessions(prev => ({ ...prev, [planId]: true }));
      try {
        const res = await sessionService.getAll({ treatmentPlanId: planId, limit: 200 });
        setPlanSessions(prev => ({ ...prev, [planId]: res.sessions }));
      } finally {
        setLoadingPlanSessions(prev => ({ ...prev, [planId]: false }));
      }
    }
  };

  const openAddSession = (plan: TreatmentPlan) => {
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const localNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setSessionForm({
      sessionDate: localNow,
      therapistId: therapists[0]?.id ?? "",
      duration: plan.sessionDuration ?? 60,
      attendanceStatus: "ATTENDED",
      painLevel: 0,
      progress: "",
      notes: "",
    });
    // Inicializar protocolo desde el plan
    const proto = (plan.protocol as any[] | null | undefined) ?? [];
    setSessionProtocol(proto.map((item: any) => ({
      order: item.order,
      type: item.type,
      procedure: item.procedure,
      area: item.area,
      side: item.side,
      duration: item.duration,
      intensity: item.intensity,
      series: item.series,
      reps: item.reps,
      weight: item.weight,
      resistance: item.resistance,
      completed: true,
      notes: "",
    })));
    setAddSessionModal({ planId: plan.id, plan });
  };

  const openEditSession = (session: TreatmentSession, plan: TreatmentPlan) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const d = new Date(session.sessionDate);
    const localDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setSessionForm({
      sessionDate: localDate,
      therapistId: session.therapistId,
      duration: session.duration,
      attendanceStatus: (session.attendanceStatus ?? "PENDING") as "ATTENDED" | "NOT_ATTENDED" | "RESCHEDULED" | "PENDING",
      painLevel: session.painLevel ?? 0,
      progress: session.progress ?? "",
      notes: session.notes ?? "",
    });
    setSessionProtocol((session.sessionProtocol as SessionProtocolItem[] | null) ?? []);
    setAddSessionModal({ planId: plan.id, plan, editingSessionId: session.id });
  };

  const handleAddSession = async () => {
    if (!addSessionModal || !sessionForm.therapistId) {
      toast.error("Selecciona un terapeuta");
      return;
    }
    setSavingSession(true);
    try {
      const payload = {
        patientId: id,
        therapistId: sessionForm.therapistId,
        treatmentPlanId: addSessionModal.planId,
        sessionDate: sessionForm.sessionDate,
        duration: sessionForm.duration,
        attendanceStatus: sessionForm.attendanceStatus,
        painLevel: sessionForm.painLevel > 0 ? sessionForm.painLevel : null,
        progress: sessionForm.progress || null,
        notes: sessionForm.notes || null,
        sessionProtocol: sessionProtocol.length > 0 ? sessionProtocol : null,
      };
      if (addSessionModal.editingSessionId) {
        await sessionService.update(addSessionModal.editingSessionId, payload);
        toast.success("Sesión actualizada");
      } else {
        await sessionService.create(payload);
        toast.success("Sesión registrada");
      }
      const [sessRes, plansRes] = await Promise.all([
        sessionService.getAll({ treatmentPlanId: addSessionModal.planId, limit: 200 }),
        treatmentPlanService.getAll({ patientId: id, limit: 1000 }),
      ]);
      setPlanSessions(prev => ({ ...prev, [addSessionModal.planId]: sessRes.sessions }));
      setTreatmentPlans(plansRes.treatmentPlans);
      setAddSessionModal(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al guardar la sesión");
    } finally {
      setSavingSession(false);
    }
  };

  const handleFinalizePlan = async () => {
    if (!finalizePlanConfirm) return;
    setFinalizingPlan(true);
    try {
      const updated = await treatmentPlanService.update(finalizePlanConfirm.id, {
        status: 'COMPLETED',
        endDate: new Date().toISOString(),
      });
      setTreatmentPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
      setFinalizePlanConfirm(null);
      toast.success("Tratamiento finalizado y movido al historial");
    } catch {
      toast.error("Error al finalizar el tratamiento");
    } finally {
      setFinalizingPlan(false);
    }
  };

  const handleExtendPlan = async () => {
    if (!extendPlanModal) return;
    try {
      const updated = await treatmentPlanService.update(extendPlanModal.id, {
        sessionsPlanned: extendPlanModal.sessionsPlanned + extendSessions,
      });
      setTreatmentPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
      setExtendPlanModal(null);
      setExtendSessions(5);
      toast.success(`Se agregaron ${extendSessions} sesiones al tratamiento`);
    } catch {
      toast.error("Error al extender el tratamiento");
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("¿Eliminar este tratamiento y todas sus sesiones? Esta acción no se puede deshacer.")) return;
    try {
      await treatmentPlanService.delete(planId);
      setTreatmentPlans(prev => prev.filter(p => p.id !== planId));
      setPlanSessions(prev => { const next = { ...prev }; delete next[planId]; return next; });
      toast.success("Tratamiento eliminado");
    } catch {
      toast.error("Error al eliminar el tratamiento");
    }
  };

  const handleDeleteSession = async (sessionId: string, planId: string) => {
    if (!confirm("¿Eliminar esta sesión?")) return;
    try {
      await sessionService.delete(sessionId);
      setPlanSessions(prev => ({ ...prev, [planId]: (prev[planId] ?? []).filter(s => s.id !== sessionId) }));
      const plansRes = await treatmentPlanService.getAll({ patientId: id, limit: 1000 });
      setTreatmentPlans(plansRes.treatmentPlans);
      toast.success("Sesión eliminada");
    } catch {
      toast.error("Error al eliminar la sesión");
    }
  };

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
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
    } catch {
      toast.error("Error al cargar paciente");
      router.push("/dashboard/patients");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await sessionService.getAll({ patientId: id, limit: 1000 });
      setSessions(response.sessions);
    } catch {
      console.error("Error al cargar sesiones");
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchTreatmentPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await treatmentPlanService.getAll({ patientId: id, limit: 1000 });
      setTreatmentPlans(response.treatmentPlans);
    } catch {
      console.error("Error al cargar planes de tratamiento");
    } finally {
      setLoadingPlans(false);
    }
  };


  const fetchHistoria = async () => {
    try {
      setLoadingHistoria(true);
      const data = await historiaClinicaService.getByPatientId(id);
      setHistoria(data);
    } catch {
      setHistoria(null);
    } finally {
      setLoadingHistoria(false);
    }
  };


  const handleDeleteConfirm = async () => {
    if (!patient) return;
    try {
      await patientService.delete(id);
      toast.success("Paciente eliminado exitosamente");
      router.push("/dashboard/patients");
    } catch {
      toast.error("Error al eliminar paciente");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-500">Cargando expediente...</p>
        </div>
      </div>
    );
  }

  if (!patient) return null;

  const genderLabel =
    patient.gender === "MALE" ? "Masculino" :
    patient.gender === "FEMALE" ? "Femenino" : "Otro";

  const age = patient.birthDate
    ? moment().diff(moment(patient.birthDate), "years")
    : null;

  return (
    <div className="px-4 py-6 sm:px-0 max-w-6xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pacientes", href: "/dashboard/patients" },
          { label: patient.name },
        ]}
      />

      {/* Header card */}
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Color bar */}
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-blue-500 to-teal-400" />

        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Avatar + datos */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => patient.photoUrl && setIsImageModalOpen(true)}
              className={`flex-shrink-0 ${patient.photoUrl ? "cursor-pointer hover:opacity-80 transition-opacity" : "cursor-default"}`}
            >
              <Avatar photoUrl={patient.photoUrl} gender={patient.gender} name={patient.name} size="xl" />
            </button>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {patient.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                {patient.gender && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">{genderLabel}</span>
                )}
                {age !== null && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{age} años</span>
                  </>
                )}
                {patient.dui && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">DUI {patient.dui}</span>
                  </>
                )}
              </div>

              {/* Stats inline */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
                    {patient._count?.appointments || 0}
                  </span>
                  Citas
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-6 h-6 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-semibold text-xs">
                    {patient._count?.sessions || 0}
                  </span>
                  Sesiones
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs">
                    {patient._count?.evaluations || 0}
                  </span>
                  Evaluaciones
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 sm:flex-shrink-0">
            <Link
              href="/dashboard/patients"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ← Volver
            </Link>
            <Link
              href={`/dashboard/patients/${id}/edit`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Editar
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>

        {/* Tabs nav */}
        <div className="border-t border-gray-100 dark:border-gray-700 px-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-6">

        {/* ── TAB: Información General ── */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Personal */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-sm">👤</span>
                Datos Personales
              </h2>
              <dl className="space-y-4">
                <InfoRow label="Nombre completo" value={patient.name} />
                {patient.email && <InfoRow label="Correo electrónico" value={patient.email} />}
                <InfoRow label="Teléfono" value={patient.phone} />
                {patient.dui && <InfoRow label="DUI" value={patient.dui} />}
                {patient.gender && <InfoRow label="Género" value={genderLabel} />}
                {patient.birthDate && (
                  <InfoRow
                    label="Fecha de nacimiento"
                    value={`${new Date(patient.birthDate).toLocaleDateString("es-ES")}${age !== null ? ` (${age} años)` : ""}`}
                  />
                )}
                {patient.address && <InfoRow label="Dirección" value={patient.address} />}
              </dl>
            </div>

            {/* Contacto de Emergencia */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-sm">🚨</span>
                Contacto de Emergencia
              </h2>
              {patient.emergencyContact || patient.emergencyPhone ? (
                <dl className="space-y-4">
                  {patient.emergencyContact && <InfoRow label="Nombre" value={patient.emergencyContact} />}
                  {patient.emergencyPhone && <InfoRow label="Teléfono" value={patient.emergencyPhone} />}
                </dl>
              ) : (
                <EmptyState text="No se ha registrado un contacto de emergencia." />
              )}
            </div>

            {/* Registro */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:col-span-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-sm">📅</span>
                Registro en el sistema
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <StatCard
                  label="Citas totales"
                  value={patient._count?.appointments || 0}
                  color="indigo"
                />
                <StatCard
                  label="Sesiones"
                  value={patient._count?.sessions || 0}
                  color="teal"
                />
                <StatCard
                  label="Evaluaciones"
                  value={patient._count?.evaluations || 0}
                  color="blue"
                />
                <StatCard
                  label="Tratamientos Activos"
                  value={treatmentPlans.filter((p) => p.status === "ACTIVE").length}
                  color="violet"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Expediente Médico ── */}
        {activeTab === "expediente" && (
          <div className="space-y-6">
            {loadingHistoria ? (
              <LoadingSpinner />
            ) : historia ? (
              <>
                {/* Meta + acciones */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Evaluación: {historia.fechaEvaluacion ? moment(historia.fechaEvaluacion).format("DD/MM/YYYY") : "—"} · Actualizado {moment(historia.updatedAt).fromNow()}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/expedientes/${historia.id}/edit`}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Editar Expediente Médico →
                    </Link>
                    <Link
                      href={`/dashboard/diagnoses/new?patientId=${id}`}
                      className="inline-flex items-center gap-1 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg transition-colors"
                    >
                      Crear Diagnóstico
                    </Link>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Diagnósticos
                        {diagnoses.length > 0 && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium">{diagnoses.length}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Diagnósticos registrados para este paciente.</p>
                    </div>
                    {loadingDiagnoses && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Cargando...</span>
                    )}
                  </div>

                  {diagnoses.length > 0 ? (
                    <>
                      <div className="mt-4 space-y-3">
                        {diagnoses
                          .slice((diagnosesPage - 1) * DIAGNOSES_PER_PAGE, diagnosesPage * DIAGNOSES_PER_PAGE)
                          .map((diagnosis) => {
                            const isOpen = expandedDiagnoses.has(diagnosis.id);
                            const linkedPlan = treatmentPlans.find(p => p.diagnosisId === diagnosis.id) ?? null;
                            return (
                              <div key={diagnosis.id} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
                                {/* Header — clickeable para desplegar */}
                                <div className="p-4 flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => toggleDiagnosis(diagnosis.id)}
                                    className="flex-1 min-w-0 text-left flex items-center gap-3 hover:opacity-80 transition-opacity"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{diagnosis.clinicalDiagnosis}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{diagnosis.diagnosisDate ? moment(diagnosis.diagnosisDate).format("DD/MM/YYYY") : "—"}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide flex-shrink-0 ${
                                      diagnosis.status === "ACTIVE"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                        : diagnosis.status === "CHRONIC"
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                    }`}>
                                      {diagnosis.status === "ACTIVE" ? "Activo" : diagnosis.status === "CHRONIC" ? "Crónico" : "Resuelto"}
                                    </span>
                                    <span className={`text-gray-400 text-sm transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}>▾</span>
                                  </button>

                                  {/* Botones editar / eliminar */}
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Link
                                      href={`/dashboard/diagnoses/${diagnosis.id}`}
                                      onClick={e => e.stopPropagation()}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                      title="Editar diagnóstico"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={e => { e.stopPropagation(); setDeleteDiagnosisId(diagnosis.id); }}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                      title="Eliminar diagnóstico"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </div>
                                </div>

                                {/* Cuerpo desplegable */}
                                {isOpen && (
                                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 space-y-3 pt-3">
                                    {diagnosis.observations && (
                                      <p className="text-sm text-gray-600 dark:text-gray-300">{diagnosis.observations}</p>
                                    )}

                                    {linkedPlan ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveTab("tratamiento");
                                          setExpandedPlans(prev => new Set([...prev, linkedPlan.id]));
                                          window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        className="w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/40 transition-colors"
                                      >
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide mb-0.5">Tratamiento</p>
                                          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200 truncate">{linkedPlan.title}</p>
                                          <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-0.5">
                                            {linkedPlan.sessionsCompleted} de {linkedPlan.sessionsPlanned} sesiones
                                            {linkedPlan.therapyType && ` · ${linkedPlan.therapyType}`}
                                          </p>
                                        </div>
                                        <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      </button>
                                    ) : (
                                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">Sin tratamiento vinculado.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>

                      {/* Paginación */}
                      {diagnoses.length > DIAGNOSES_PER_PAGE && (
                        <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{Math.min((diagnosesPage - 1) * DIAGNOSES_PER_PAGE + 1, diagnoses.length)}–{Math.min(diagnosesPage * DIAGNOSES_PER_PAGE, diagnoses.length)} de {diagnoses.length}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setDiagnosesPage(p => Math.max(1, p - 1))}
                              disabled={diagnosesPage === 1}
                              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >‹</button>
                            <button
                              onClick={() => setDiagnosesPage(p => Math.min(Math.ceil(diagnoses.length / DIAGNOSES_PER_PAGE), p + 1))}
                              disabled={diagnosesPage >= Math.ceil(diagnoses.length / DIAGNOSES_PER_PAGE)}
                              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >›</button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-6 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">No hay diagnósticos asociados a este paciente.</p>
                      <Link
                        href={`/dashboard/diagnoses/new?patientId=${id}`}
                        className="inline-flex items-center gap-1 text-sm text-indigo-700 dark:text-indigo-300 hover:underline"
                      >
                        Crear diagnóstico ahora
                      </Link>
                    </div>
                  )}
                </div>

                {/* Exploración Física */}
                {(historia.peso != null || historia.talla != null || historia.imc != null || historia.etnia || historia.motivoConsulta || historia.tratamientosPrevios) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <HCSectionHeader icon="⚖️" title="Exploración Física" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      {historia.peso != null && <HCDataCard label="Peso" value={`${historia.peso} kg`} />}
                      {historia.talla != null && <HCDataCard label="Estatura" value={`${historia.talla} cm`} />}
                      {historia.imc != null && <HCDataCard label="IMC" value={historia.imc.toFixed(1)} />}
                    </div>
                    {historia.motivoConsulta && (
                      <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Motivo de Consulta</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{historia.motivoConsulta}</p>
                      </div>
                    )}
                    {historia.tratamientosPrevios && (
                      <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Tratamientos Previos</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{historia.tratamientosPrevios}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Signos Vitales */}
                {historia.signosVitales && (historia.signosVitales.ta || historia.signosVitales.temperatura || historia.signosVitales.pc || historia.signosVitales.pb) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <HCSectionHeader icon="❤️" title="Signos Vitales" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      {historia.signosVitales.ta && <HCDataCard label="T/A" value={historia.signosVitales.ta} />}
                      {historia.signosVitales.temperatura && <HCDataCard label="Temperatura" value={historia.signosVitales.temperatura} />}
                      {historia.signosVitales.pc && <HCDataCard label="Pulso" value={historia.signosVitales.pc} />}
                      {historia.signosVitales.pb && <HCDataCard label="Pulsioximetría" value={historia.signosVitales.pb} />}
                    </div>
                  </div>
                )}

                {/* Escala de Dolor */}
                {historia.escalaDolor != null && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <HCSectionHeader icon="🌡️" title="Escala de Dolor EVA" />
                    <div className="flex items-center gap-5 mt-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 ${
                        historia.escalaDolor <= 3 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : historia.escalaDolor <= 6 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {historia.escalaDolor}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {historia.escalaDolor}/10 — {historia.escalaDolor === 0 ? "Sin dolor" : historia.escalaDolor <= 3 ? "Dolor leve" : historia.escalaDolor <= 6 ? "Dolor moderado" : "Dolor intenso"}
                        </p>
                        <div className="h-2.5 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full relative">
                          <div
                            className="absolute w-4 h-4 bg-white dark:bg-gray-200 border-2 border-gray-600 rounded-full shadow-md"
                            style={{ left: `${historia.escalaDolor * 10}%`, top: "50%", transform: "translate(-50%, -50%)" }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                          <span>0 Sin dolor</span><span>10 Máximo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Antecedentes Patológicos */}
                {historia.antecedentes && Object.keys(historia.antecedentes).length > 0 && (() => {
                  const ANT_LABELS: Record<string, string> = {
                    diabetes: "Diabetes", alergia: "Alergia", hta: "HTA",
                    cancer: "Cáncer", transfusiones: "Transfusiones",
                    enfReumaticas: "Enf. Reumáticas", hospitalizacion: "Hospitalización",
                    encames: "Encames", accidentes: "Accidentes",
                    cardiopatias: "Cardiopatías", cirugias: "Cirugías", fracturas: "Fracturas",
                  };
                  const entries = Object.entries(historia.antecedentes as any);
                  const positives = entries.filter(([, v]: any) => v.tiene);
                  const negatives = entries.filter(([, v]: any) => !v.tiene);
                  return (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                      <HCSectionHeader icon="📋" title="Antecedentes Patológicos" />
                      <div className="mt-4 space-y-3">
                        {positives.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">Sin antecedentes patológicos reportados</p>
                        ) : (
                          <div className="space-y-2">
                            {positives.map(([key, val]: any) => (
                              <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center text-xs font-bold">!</span>
                                <div>
                                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">{ANT_LABELS[key] ?? key}</p>
                                  {val.especifique && <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">{val.especifique}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {negatives.length > 0 && (
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              <span className="font-medium text-gray-500 dark:text-gray-400">Negados:</span>{" "}
                              {negatives.map(([key]: any) => ANT_LABELS[key] ?? key).join(" · ")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Espasmos */}
                {historia.espasmos?.tiene && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <HCSectionHeader icon="⚡" title="Espasmos Musculares" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {historia.espasmos.sitio && <HCDataCard label="Sitio" value={historia.espasmos.sitio} />}
                      {historia.espasmos.caracteristicas && <HCDataCard label="Características" value={historia.espasmos.caracteristicas} />}
                    </div>
                  </div>
                )}

                {/* Hábitos de Salud */}
                {historia.habitosSalud && Object.keys(historia.habitosSalud).length > 0 && (() => {
                  const HABITO_LABELS: Record<string, string> = {
                    tabaquismo: "Tabaquismo", alcoholismo: "Alcoholismo", drogas: "Drogas",
                    actividadFisica: "Actividad Física", automedica: "Se Automedica", pasatiempo: "Pasatiempo",
                  };
                  const entries = Object.entries(historia.habitosSalud as any);
                  const activos = entries.filter(([, v]: any) => v.tiene);
                  const negados = entries.filter(([, v]: any) => !v.tiene);
                  return (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                      <HCSectionHeader icon="🏃" title="Hábitos de Salud" />
                      <div className="mt-4 space-y-3">
                        {activos.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">Sin hábitos de riesgo reportados</p>
                        ) : (
                          <div className="space-y-2">
                            {activos.map(([key, val]: any) => (
                              <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center text-xs font-bold">!</span>
                                <div>
                                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{HABITO_LABELS[key] ?? key}</p>
                                  {val.especifique && <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">{val.especifique}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {negados.length > 0 && (
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              <span className="font-medium text-gray-500 dark:text-gray-400">Negados:</span>{" "}
                              {negados.map(([key]: any) => HABITO_LABELS[key] ?? key).join(" · ")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Datos Ginecológicos */}
                {historia.datosGinecologicos && (historia.datosGinecologicos.embarazada != null || historia.datosGinecologicos.numHijos != null) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <HCSectionHeader icon="🤰" title="Datos Ginecológicos" />
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {historia.datosGinecologicos.embarazada != null && (
                        <HCDataCard label="Embarazada" value={historia.datosGinecologicos.embarazada ? "Sí" : "No"} />
                      )}
                      {historia.datosGinecologicos.numHijos != null && (
                        <HCDataCard label="Número de hijos" value={String(historia.datosGinecologicos.numHijos)} />
                      )}
                    </div>
                  </div>
                )}

                {/* Diagnóstico en Rehabilitación */}
                {historia.diagnosticoRehabilitacion && (historia.diagnosticoRehabilitacion.reflejos || historia.diagnosticoRehabilitacion.sensibilidad || historia.diagnosticoRehabilitacion.lenguajeOrientacion || historia.diagnosticoRehabilitacion.otros) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <HCSectionHeader icon="🧠" title="Diagnóstico en Rehabilitación" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {historia.diagnosticoRehabilitacion.reflejos && <HCDataCard label="Reflejos" value={historia.diagnosticoRehabilitacion.reflejos} />}
                      {historia.diagnosticoRehabilitacion.sensibilidad && <HCDataCard label="Sensibilidad" value={historia.diagnosticoRehabilitacion.sensibilidad} />}
                      {historia.diagnosticoRehabilitacion.lenguajeOrientacion && <HCDataCard label="Lenguaje y Orientación" value={historia.diagnosticoRehabilitacion.lenguajeOrientacion} />}
                      {historia.diagnosticoRehabilitacion.otros && <HCDataCard label="Otros" value={historia.diagnosticoRehabilitacion.otros} />}
                    </div>
                  </div>
                )}

                {/* Movilidad */}
                {(historia.cicatrizQuirurgica || historia.traslados || historia.marchaDeambulacion) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <HCSectionHeader icon="🚶" title="Movilidad y Deambulación" />
                    <div className="space-y-4 mt-4">
                      {historia.cicatrizQuirurgica && (
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Cicatriz Quirúrgica</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200">{historia.cicatrizQuirurgica}</p>
                        </div>
                      )}
                      {historia.traslados && (historia.traslados.velInicial || historia.traslados.velFinal || historia.traslados.observaciones) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {historia.traslados.velInicial && <HCDataCard label="Vel. Inicial" value={historia.traslados.velInicial} />}
                          {historia.traslados.velFinal && <HCDataCard label="Vel. Final" value={historia.traslados.velFinal} />}
                          {historia.traslados.observaciones && <HCDataCard label="Observaciones" value={historia.traslados.observaciones} />}
                        </div>
                      )}
                      {historia.marchaDeambulacion && (
                        <div>
                          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Tipo de Marcha</p>
                          <div className="flex flex-wrap gap-2">
                            {historia.marchaDeambulacion.libre && <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">Libre</span>}
                            {historia.marchaDeambulacion.claudicante && <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-medium">Claudicante</span>}
                            {historia.marchaDeambulacion.conAyuda && <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">Con Ayuda</span>}
                            {historia.marchaDeambulacion.espastica && <span className="px-2.5 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-xs font-medium">Espástica</span>}
                            {historia.marchaDeambulacion.ataxica && <span className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-xs font-medium">Atáxica</span>}
                            {historia.marchaDeambulacion.otros && <span className="px-2.5 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">Otros</span>}
                          </div>
                          {historia.marchaDeambulacion.observaciones && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{historia.marchaDeambulacion.observaciones}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fuerza Muscular */}
                {historia.fuerzaMuscular && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <HCSectionHeader icon="💪" title="Fuerza Muscular (Escala Daniels)" />
                    <div className="space-y-5 mt-4">
                      {historia.fuerzaMuscular.miembroSuperior && Object.keys(historia.fuerzaMuscular.miembroSuperior).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">Miembro Superior</p>
                          <HCMuscleTable data={historia.fuerzaMuscular.miembroSuperior} />
                        </div>
                      )}
                      {historia.fuerzaMuscular.miembroInferior && Object.keys(historia.fuerzaMuscular.miembroInferior).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-2">Miembro Inferior</p>
                          <HCMuscleTable data={historia.fuerzaMuscular.miembroInferior} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Goniometría Superior */}
                {historia.goniometriaSuper && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <HCSectionHeader icon="📐" title="Goniometría — Miembro Superior" />
                    <div className="space-y-4 mt-4">
                      {historia.goniometriaSuper.hombro && Object.keys(historia.goniometriaSuper.hombro).length > 0 && <HCGonioTable label="Hombro" data={historia.goniometriaSuper.hombro} />}
                      {historia.goniometriaSuper.codo && Object.keys(historia.goniometriaSuper.codo).length > 0 && <HCGonioTable label="Codo" data={historia.goniometriaSuper.codo} />}
                      {historia.goniometriaSuper.antebrazo && Object.keys(historia.goniometriaSuper.antebrazo).length > 0 && <HCGonioTable label="Antebrazo" data={historia.goniometriaSuper.antebrazo} />}
                      {historia.goniometriaSuper.muneca && Object.keys(historia.goniometriaSuper.muneca).length > 0 && <HCGonioTable label="Muñeca" data={historia.goniometriaSuper.muneca} />}
                    </div>
                  </div>
                )}

                {/* Goniometría Inferior */}
                {historia.goniometriaInfer && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <HCSectionHeader icon="📐" title="Goniometría — Miembro Inferior" />
                    <div className="space-y-4 mt-4">
                      {historia.goniometriaInfer.cadera && Object.keys(historia.goniometriaInfer.cadera).length > 0 && <HCGonioTable label="Cadera" data={historia.goniometriaInfer.cadera} />}
                      {historia.goniometriaInfer.rodilla && Object.keys(historia.goniometriaInfer.rodilla).length > 0 && <HCGonioTable label="Rodilla" data={historia.goniometriaInfer.rodilla} />}
                      {historia.goniometriaInfer.tobillo && Object.keys(historia.goniometriaInfer.tobillo).length > 0 && <HCGonioTable label="Tobillo / Pie" data={historia.goniometriaInfer.tobillo} />}
                    </div>
                  </div>
                )}

                {/* Valoración Postural */}
                {historia.valoracionPostural && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <HCSectionHeader icon="🧍" title="Valoración Postural" />
                    <div className="space-y-5 mt-4">
                      {historia.valoracionPostural.vistaAnterior && Object.keys(historia.valoracionPostural.vistaAnterior).length > 0 && (
                        <HCPosturalSection label="Vista Anterior" data={historia.valoracionPostural.vistaAnterior} />
                      )}
                      {historia.valoracionPostural.vistaLateral && Object.keys(historia.valoracionPostural.vistaLateral).length > 0 && (
                        <HCPosturalSection label="Vista Lateral" data={historia.valoracionPostural.vistaLateral} />
                      )}
                      {historia.valoracionPostural.vistaPosterior && Object.keys(historia.valoracionPostural.vistaPosterior).length > 0 && (
                        <HCPosturalSection label="Vista Posterior" data={historia.valoracionPostural.vistaPosterior} />
                      )}
                    </div>
                  </div>
                )}

                {/* Columna */}
                {historia.columna && (historia.columna.planoSagital || historia.columna.planoFrontal) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <HCSectionHeader icon="🦴" title="Columna Vertebral" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {historia.columna.planoSagital && <HCDataCard label="Plano Sagital" value={historia.columna.planoSagital} />}
                      {historia.columna.planoFrontal && <HCDataCard label="Plano Frontal" value={historia.columna.planoFrontal} />}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-4 text-3xl">🗂️</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Sin Expediente Médico</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Este paciente aún no tiene un expediente médico de fisioterapia registrado.
                </p>
                <Link
                  href="/dashboard/expedientes/nuevo"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Crear Expediente Médico
                </Link>
              </div>
            )}

          </div>
        )}

        {/* ── TAB: Tratamiento ── */}
        {activeTab === "tratamiento" && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-sm">💊</span>
                Planes de Tratamiento
              </h2>
              <Link
                href={`/dashboard/treatment-plans/new?patientId=${id}`}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Nuevo Tratamiento
              </Link>
            </div>

            {loadingPlans ? (
              <LoadingSpinner />
            ) : treatmentPlans.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <EmptyState text="No hay planes de tratamiento registrados." />
              </div>
            ) : treatmentPlans.filter(p => p.status !== 'COMPLETED').length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <EmptyState text="No hay planes de tratamiento activos. Los tratamientos completados están en la pestaña Historial." />
              </div>
            ) : (
              <div className="space-y-3">
                {treatmentPlans.filter(p => p.status !== 'COMPLETED').map((plan) => {
                  const pct = plan.sessionsPlanned > 0
                    ? Math.round((plan.sessionsCompleted / plan.sessionsPlanned) * 100)
                    : 0;
                  const isExpanded = expandedPlans.has(plan.id);
                  const sessionsForPlan = planSessions[plan.id] ?? [];
                  const isLoadingS = loadingPlanSessions[plan.id] ?? false;
                  const remaining = plan.sessionsPlanned - plan.sessionsCompleted;

                  return (
                    <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                      {/* Plan header */}
                      <div
                        className="p-5 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        onClick={() => togglePlan(plan.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{plan.title}</p>
                              <PlanStatusBadge status={plan.status} />
                            </div>
                            <div className="flex items-center gap-4 mt-1 flex-wrap">
                              {plan.therapyType && <span className="text-xs text-gray-500 dark:text-gray-400">{plan.therapyType}</span>}
                              {plan.sessionDuration && <span className="text-xs text-gray-400 dark:text-gray-500">⏱ {plan.sessionDuration} min/sesión</span>}
                              {plan.frequency && <span className="text-xs text-gray-400 dark:text-gray-500">📅 {plan.frequency}</span>}
                              {plan.totalCost != null && <span className="text-xs text-gray-400 dark:text-gray-500">💰 ${plan.totalCost.toFixed(2)}</span>}
                            </div>
                            {(plan.diagnosis || plan.description || plan.goals) && (
                              <div className="mt-2 space-y-0.5">
                                {plan.diagnosis && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                                    <span className="font-medium">Diagnóstico:</span> {plan.diagnosis.clinicalDiagnosis}
                                  </p>
                                )}
                                {plan.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{plan.description}</p>
                                )}
                                {plan.goals && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                    <span className="font-medium">Objetivo:</span> {plan.goals}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); openAddSession(plan); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-lg transition-colors"
                            >
                              <PlusIcon className="h-3 w-3" />
                              Sesión
                            </button>
                            {plan.sessionsCompleted >= plan.sessionsPlanned && plan.sessionsPlanned > 0 && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setExtendPlanModal(plan); setExtendSessions(5); }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-lg transition-colors"
                                  title="Agregar más sesiones"
                                >
                                  <PlusIcon className="h-3 w-3" />
                                  + Sesiones
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setFinalizePlanConfirm(plan); }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg transition-colors"
                                  title="Finalizar tratamiento"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  Finalizar
                                </button>
                              </>
                            )}
                            <Link
                              href={`/dashboard/treatment-plans/${plan.id}/edit`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                              title="Editar tratamiento"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </Link>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Eliminar tratamiento"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                            <span className={`text-gray-400 transition-transform duration-200 text-sm ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              {plan.sessionsCompleted} de {plan.sessionsPlanned} sesiones
                              {plan.status !== "COMPLETED" && remaining > 0 && (
                                <span className="ml-1 text-gray-400">· {remaining} restante{remaining !== 1 ? "s" : ""}</span>
                              )}
                            </span>
                            <span className={`font-semibold ${pct === 100 ? "text-green-600" : "text-indigo-600"}`}>{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-indigo-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sessions accordion */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-gray-700">
                          {/* Protocolo terapéutico */}
                          {plan.protocol && Array.isArray(plan.protocol) && (plan.protocol as any[]).length > 0 && (
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                Protocolo de sesión
                              </p>
                              <div className="space-y-2">
                                {(plan.protocol as any[]).map((step: any, si: number) => (
                                  <div key={si} className="flex items-start gap-2.5">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[10px] font-bold text-gray-500 flex items-center justify-center mt-0.5">
                                      {step.order}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                        {step.type}
                                        {step.procedure ? ` · ${step.procedure}` : ""}
                                      </span>
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        {step.area && <StepTag>{step.area}</StepTag>}
                                        {step.side && <StepTag>{step.side}</StepTag>}
                                        {step.duration && <StepTag>{step.duration} min</StepTag>}
                                        {step.intensity && <StepTag>{step.intensity}</StepTag>}
                                        {step.series && step.reps && <StepTag>{step.series}×{step.reps} rep</StepTag>}
                                        {step.weight && <StepTag>{step.weight}</StepTag>}
                                        {step.resistance && <StepTag>{step.resistance}</StepTag>}
                                      </div>
                                      {step.notes && (
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 italic">{step.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {isLoadingS ? (
                            <div className="py-8 flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                            </div>
                          ) : sessionsForPlan.length === 0 ? (
                            <div className="py-8 text-center">
                              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">Aún no hay sesiones registradas</p>
                              <button
                                onClick={() => openAddSession(plan)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                              >
                                <PlusIcon className="h-3 w-3" />
                                Registrar primera sesión
                              </button>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                              {[...sessionsForPlan].sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()).map((session) => (
                                <div key={session.id} className="px-5 py-4 flex gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors group">
                                  {/* Date box */}
                                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center">
                                    <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400 leading-none">
                                      {moment(session.sessionDate).format("DD")}
                                    </span>
                                    <span className="text-[9px] uppercase font-medium text-indigo-500 dark:text-indigo-500 leading-none mt-0.5">
                                      {moment(session.sessionDate).format("MMM")}
                                    </span>
                                  </div>

                                  {/* Session info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {moment(session.sessionDate).format("HH:mm")} h
                                      </span>
                                      {session.sessionNumber != null && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
                                          #{session.sessionNumber}
                                        </span>
                                      )}
                                      <AttendanceBadge status={session.attendanceStatus} />
                                      {session.painLevel != null && <PainBadge level={session.painLevel} />}
                                      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                          onClick={() => openEditSession(session, plan)}
                                          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                          title="Editar sesión"
                                        >
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSession(session.id, plan.id)}
                                          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                          title="Eliminar sesión"
                                        >
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                      <UsersIcon className="h-3 w-3" />
                                      {session.therapist?.name ?? "Terapeuta no asignado"}
                                      <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
                                      <CalendarIcon className="h-3 w-3" />
                                      {session.duration} min
                                    </p>
                                    {session.interventions && (
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2">
                                        <span className="font-medium">Intervenciones:</span> {session.interventions}
                                      </p>
                                    )}
                                    {session.progress && (
                                      <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                                        <span className="font-medium">Progreso:</span> {session.progress}
                                      </p>
                                    )}
                                    {session.notes && (
                                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">{session.notes}</p>
                                    )}
                                    {session.sessionProtocol && (session.sessionProtocol as SessionProtocolItem[]).length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {(session.sessionProtocol as SessionProtocolItem[]).map((item, idx) => (
                                          <div key={idx} className={`flex items-start gap-1.5 text-xs ${item.completed ? "text-green-700 dark:text-green-400" : "text-gray-400 dark:text-gray-500 line-through"}`}>
                                            <span className="mt-0.5 flex-shrink-0">{item.completed ? "✓" : "○"}</span>
                                            <span>{item.type}{item.procedure ? ` · ${item.procedure}` : ""}{item.notes ? ` — ${item.notes}` : ""}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Chart per plan */}
                          {sessionsForPlan.some(s => s.painLevel != null) && (
                            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
                              <ProgressChart sessions={sessionsForPlan} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Historial y Documentos ── */}
        {activeTab === "historial" && (() => {
          // ── helpers de paginación ──
          const completedPlans = treatmentPlans.filter(p => p.status === 'COMPLETED');
          const totalCompletedPages = Math.max(1, Math.ceil(completedPlans.length / completedPlansPerPage));
          const pagedCompletedPlans = completedPlans.slice((completedPlansPage - 1) * completedPlansPerPage, completedPlansPage * completedPlansPerPage);

          const sortedSessions = [...sessions].sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
          const totalSessionPages = Math.max(1, Math.ceil(sortedSessions.length / sessionsPerPage));
          const pagedSessions = sortedSessions.slice((sessionsPage - 1) * sessionsPerPage, sessionsPage * sessionsPerPage);

          const DOC_CATEGORIES = [
            { value: "todos",      label: "Todos",             icon: "🗂️" },
            { value: "receta",     label: "Recetas",           icon: "💊" },
            { value: "radiografia",label: "Radiografías",      icon: "🩻" },
            { value: "laboratorio",label: "Laboratorio",       icon: "🧪" },
            { value: "referencia", label: "Referencias",       icon: "📋" },
            { value: "informe",    label: "Informes",          icon: "📄" },
            { value: "otro",       label: "Otros",             icon: "📁" },
          ] as const;

          const allDocs = patient.documents ?? [];
          const filteredDocs = activeDocCategory === "todos" ? allDocs : allDocs.filter(d => (d as any).category === activeDocCategory);

          const CAT_UPLOAD_LABEL: Record<string, string> = {
            receta: "receta",  radiografia: "radiografía", laboratorio: "examen",
            referencia: "referencia", informe: "informe", otro: "documento",
          };

          const Paginator = ({ page, total, perPage, onPage, onPerPage, perPageOptions = [5, 10, 20] }: {
            page: number; total: number; perPage: number;
            onPage: (p: number) => void; onPerPage: (n: number) => void;
            perPageOptions?: number[];
          }) => (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Mostrar</span>
                <select
                  value={perPage}
                  onChange={e => { onPerPage(Number(e.target.value)); onPage(1); }}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {perPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>por página · {total} en total</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >‹</button>
                {Array.from({ length: Math.min(5, Math.max(1, Math.ceil(total / perPage))) }, (_, i) => {
                  const totalPgs = Math.max(1, Math.ceil(total / perPage));
                  let pg: number;
                  if (totalPgs <= 5) pg = i + 1;
                  else if (page <= 3) pg = i + 1;
                  else if (page >= totalPgs - 2) pg = totalPgs - 4 + i;
                  else pg = page - 2 + i;
                  return (
                    <button key={pg} onClick={() => onPage(pg)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${pg === page ? "bg-indigo-600 text-white" : "border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                    >{pg}</button>
                  );
                })}
                <button
                  onClick={() => onPage(Math.min(Math.max(1, Math.ceil(total / perPage)), page + 1))}
                  disabled={page >= Math.max(1, Math.ceil(total / perPage))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >›</button>
              </div>
            </div>
          );

          return (
          <div className="space-y-6">

            {/* ── SECCIÓN 1: Tratamientos completados ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-sm">✅</span>
                  Tratamientos Completados
                  {completedPlans.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">{completedPlans.length}</span>
                  )}
                </h2>
              </div>
              <div className="p-6">
                {loadingPlans ? (<LoadingSpinner />) : completedPlans.length === 0 ? (
                  <EmptyState text="No hay tratamientos completados aún." />
                ) : (
                  <>
                    <div className="space-y-3">
                      {pagedCompletedPlans.map((plan) => {
                        const pct = plan.sessionsPlanned > 0 ? Math.round((plan.sessionsCompleted / plan.sessionsPlanned) * 100) : 100;
                        const isExpanded = expandedPlans.has(plan.id);
                        const sessionsForPlan = planSessions[plan.id] ?? [];
                        const isLoadingS = loadingPlanSessions[plan.id] ?? false;
                        return (
                          <div key={plan.id} className="border border-green-100 dark:border-green-900/30 rounded-xl overflow-hidden">
                            <div className="p-4 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors" onClick={() => togglePlan(plan.id)}>
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{plan.title}</p>
                                    <PlanStatusBadge status={plan.status} />
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    {plan.therapyType && <span className="text-xs text-gray-500 dark:text-gray-400">{plan.therapyType}</span>}
                                    {plan.endDate && <span className="text-xs text-gray-400 dark:text-gray-500">Finalizado: {moment(plan.endDate).format("DD/MM/YYYY")}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                                  <span>{plan.sessionsCompleted}/{plan.sessionsPlanned} ses.</span>
                                  <span className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                                </div>
                              </div>
                              <div className="mt-2.5">
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                  <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="border-t border-gray-100 dark:border-gray-700">
                                {(plan.goals || plan.description) && (
                                  <div className="px-5 py-3 bg-indigo-50/60 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/20">
                                    {plan.goals && <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400">Objetivos: {plan.goals}</p>}
                                    {plan.description && <p className="text-xs text-indigo-600/80 dark:text-indigo-400/70 mt-0.5">{plan.description}</p>}
                                  </div>
                                )}
                                {isLoadingS ? (
                                  <div className="py-6 flex justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500" /></div>
                                ) : sessionsForPlan.length === 0 ? (
                                  <div className="py-6 text-center"><p className="text-xs text-gray-400 dark:text-gray-500">Sin sesiones registradas</p></div>
                                ) : (
                                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {[...sessionsForPlan].sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()).map((session) => (
                                      <div key={session.id} className="px-5 py-3 flex gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/20 flex flex-col items-center justify-center">
                                          <span className="text-xs font-bold text-green-700 dark:text-green-400 leading-none">{moment(session.sessionDate).format("DD")}</span>
                                          <span className="text-[8px] uppercase font-medium text-green-500 leading-none mt-0.5">{moment(session.sessionDate).format("MMM")}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{moment(session.sessionDate).format("HH:mm")} h</span>
                                            {session.sessionNumber != null && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">#{session.sessionNumber}</span>}
                                            <AttendanceBadge status={session.attendanceStatus} />
                                            {session.painLevel != null && <PainBadge level={session.painLevel} />}
                                          </div>
                                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                                            <UsersIcon className="h-3 w-3" />{session.therapist?.name ?? "Sin terapeuta"}
                                            <span className="mx-1">·</span><CalendarIcon className="h-3 w-3" />{session.duration} min
                                          </p>
                                          {session.progress && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 line-clamp-1">{session.progress}</p>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {sessionsForPlan.some(s => s.painLevel != null) && (
                                  <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30">
                                    <ProgressChart sessions={sessionsForPlan} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <Paginator page={completedPlansPage} total={completedPlans.length} perPage={completedPlansPerPage} onPage={setCompletedPlansPage} onPerPage={setCompletedPlansPerPage} />
                  </>
                )}
              </div>
            </div>

            {/* ── SECCIÓN 2: Historial de sesiones ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-sm">🗂️</span>
                  Historial de Sesiones
                  {sessions.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-medium">{sessions.length}</span>
                  )}
                </h2>
              </div>
              <div className="p-6">
                {loadingSessions ? (<LoadingSpinner />) : sessions.length === 0 ? (
                  <EmptyState text="No hay sesiones registradas para este paciente." />
                ) : (
                  <>
                    <div className="space-y-2">
                      {pagedSessions.map((session) => (
                        <div key={session.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all">
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 leading-none">{moment(session.sessionDate).format("DD")}</span>
                            <span className="text-[9px] uppercase font-medium text-indigo-500 leading-none mt-0.5">{moment(session.sessionDate).format("MMM")}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{moment(session.sessionDate).format("HH:mm")} h</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">{moment(session.sessionDate).format("dddd, DD MMMM YYYY")}</span>
                              <AttendanceBadge status={session.attendanceStatus} />
                              {session.painLevel != null && <PainBadge level={session.painLevel} />}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <UsersIcon className="h-3 w-3" />{session.therapist?.name || "Sin terapeuta"}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />{session.duration} min
                              </p>
                            </div>
                            {session.progress && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 line-clamp-1"><span className="font-medium">Progreso:</span> {session.progress}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Paginator page={sessionsPage} total={sortedSessions.length} perPage={sessionsPerPage} onPage={setSessionsPage} onPerPage={setSessionsPerPage} perPageOptions={[5, 10, 20, 50]} />
                  </>
                )}
              </div>
            </div>

            {/* ── SECCIÓN 3: Documentos médicos ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-sm">📁</span>
                  Documentos Médicos
                  {allDocs.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium">{allDocs.length}</span>
                  )}
                </h2>
                <DocumentUpload
                  patientId={id}
                  preselectedCategory={activeDocCategory === "todos" ? "otro" : activeDocCategory as any}
                  onUploadComplete={() => fetchPatient()}
                />
              </div>

              {/* Category tabs */}
              <div className="px-6 pt-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-none">
                  {DOC_CATEGORIES.map(cat => {
                    const count = cat.value === "todos" ? allDocs.length : allDocs.filter(d => (d as any).category === cat.value).length;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setActiveDocCategory(cat.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                          activeDocCategory === cat.value
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        {cat.label}
                        {count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${activeDocCategory === cat.value ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Documents list */}
                {filteredDocs.length === 0 ? (
                  <div className="py-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3 text-2xl">
                      {DOC_CATEGORIES.find(c => c.value === activeDocCategory)?.icon ?? "📁"}
                    </div>
                    <p className="text-sm text-gray-400 dark:text-gray-500">No hay documentos en esta categoría</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      {filteredDocs.length} documento{filteredDocs.length !== 1 ? "s" : ""}
                    </p>
                    <div className="space-y-2">
                      {filteredDocs.map((doc) => {
                        const isImage = doc.fileType.startsWith("image/");
                        const isPdf = doc.fileType === "application/pdf";
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-all group"
                          >
                            <div
                              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                              onClick={() => {
                                const a = window.document.createElement("a");
                                a.href = doc.fileUrl; a.target = "_blank";
                                window.document.body.appendChild(a); a.click(); window.document.body.removeChild(a);
                              }}
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                                {isImage ? (
                                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                ) : isPdf ? (
                                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                ) : (
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{doc.fileName}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                  {new Date(doc.uploadedAt).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}
                                  {doc.description && <span className="ml-2 text-gray-500 dark:text-gray-400">· {doc.description}</span>}
                                </p>
                              </div>
                              <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteDocumentId(doc.id); }}
                              className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                              title="Eliminar documento"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })()}
      </div>

      {/* Modals */}
      {patient.photoUrl && (
        <ImageModal
          imageUrl={patient.photoUrl}
          alt={`Foto de ${patient.name}`}
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}

      {/* ── Confirmar finalizar tratamiento ── */}
      <ConfirmDialog
        isOpen={!!finalizePlanConfirm}
        onClose={() => setFinalizePlanConfirm(null)}
        onConfirm={handleFinalizePlan}
        title="Finalizar tratamiento"
        message={`¿Confirmas que el tratamiento "${finalizePlanConfirm?.title}" está completado? Se moverá al historial del paciente.`}
        confirmText={finalizingPlan ? "Finalizando..." : "Finalizar"}
        cancelText="Cancelar"
        type="warning"
      />

      {/* ── Modal agregar sesiones ── */}
      {extendPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setExtendPlanModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Agregar sesiones</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{extendPlanModal.title}</p>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ¿Cuántas sesiones agregar?
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={extendSessions}
              onChange={(e) => setExtendSessions(Math.max(1, parseInt(e.target.value) || 1))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-1"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
              Total pasará de {extendPlanModal.sessionsPlanned} a {extendPlanModal.sessionsPlanned + extendSessions} sesiones
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setExtendPlanModal(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                Cancelar
              </button>
              <button onClick={handleExtendPlan} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                Agregar sesiones
              </button>
            </div>
          </div>
        </div>
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

      <ConfirmDialog
        isOpen={!!deleteDiagnosisId}
        onClose={() => setDeleteDiagnosisId(null)}
        onConfirm={handleDeleteDiagnosis}
        title="Eliminar Diagnóstico"
        message="¿Estás seguro de que deseas eliminar este diagnóstico? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      <ConfirmDialog
        isOpen={!!deleteDocumentId}
        onClose={() => setDeleteDocumentId(null)}
        onConfirm={handleDeleteDocument}
        title="Eliminar documento"
        message="¿Eliminar este documento? Se borrará también de Cloudflare R2 y no se podrá recuperar."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* ── Add Session Modal ── */}
      {addSessionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={() => setAddSessionModal(null)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{addSessionModal.editingSessionId ? "Editar Sesión" : "Registrar Sesión"}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{addSessionModal.plan.title}</p>
              </div>
              <button onClick={() => setAddSessionModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Form */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-700">

              {/* ── Sección 1: Datos generales ── */}
              <div className="px-6 py-4 space-y-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Datos de la sesión</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha y hora</label>
                    <input type="datetime-local" value={sessionForm.sessionDate}
                      onChange={(e) => setSessionForm((f) => ({ ...f, sessionDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Duración (min)</label>
                    <input type="number" min={5} step={5} value={sessionForm.duration}
                      onChange={(e) => setSessionForm((f) => ({ ...f, duration: parseInt(e.target.value) || 60 }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Terapeuta</label>
                  <select value={sessionForm.therapistId}
                    onChange={(e) => setSessionForm((f) => ({ ...f, therapistId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <option value="">-- Seleccionar terapeuta --</option>
                    {therapists.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}{t.specialization ? ` — ${t.specialization}` : ""}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Asistencia</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {([["ATTENDED","Asistió","green"],["NOT_ATTENDED","No asistió","red"],["RESCHEDULED","Reprogramada","yellow"],["PENDING","Pendiente","gray"]] as const).map(([val, lbl, color]) => {
                      const colors: Record<string,string> = {
                        green:  "border-green-400 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                        red:    "border-red-400 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                        yellow: "border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                        gray:   "border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
                      };
                      const isActive = sessionForm.attendanceStatus === val;
                      return (
                        <button key={val} type="button"
                          onClick={() => setSessionForm((f) => ({ ...f, attendanceStatus: val }))}
                          className={`px-2 py-1.5 text-xs font-medium rounded-lg border-2 transition-all ${isActive ? colors[color] : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300"}`}>
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
                  <input type="range" min={0} max={10} step={1} value={sessionForm.painLevel}
                    onChange={(e) => setSessionForm((f) => ({ ...f, painLevel: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-600" />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>Sin dolor</span><span>Insoportable</span>
                  </div>
                </div>
              </div>

              {/* ── Sección 2: Protocolo de la sesión ── */}
              {sessionProtocol.length > 0 && (
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Protocolo ejecutado</p>
                    <span className="text-xs text-gray-400">{sessionProtocol.filter(i => i.completed).length}/{sessionProtocol.length} completados</span>
                  </div>
                  <div className="space-y-2">
                    {sessionProtocol.map((item, idx) => (
                      <div key={idx} className={`rounded-xl border transition-colors ${item.completed ? "border-green-200 dark:border-green-800/40 bg-green-50/50 dark:bg-green-900/10" : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"}`}>
                        {/* Item header */}
                        <div className="flex items-center gap-3 px-4 py-2.5">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => setSessionProtocol(p => p.map((it, i) => i === idx ? { ...it, completed: !it.completed } : it))}
                            className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${item.completed ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-gray-600 hover:border-green-400"}`}
                          >
                            {item.completed && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            )}
                          </button>

                          {/* Step number + info */}
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

                        {/* Observaciones del ítem */}
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

              {/* ── Sección 3: Evolución general ── */}
              <div className="px-6 py-4 space-y-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Evolución y notas</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Progreso del paciente</label>
                  <textarea value={sessionForm.progress} rows={2}
                    onChange={(e) => setSessionForm((f) => ({ ...f, progress: e.target.value }))}
                    placeholder="Evolución observada, mejoras, limitaciones..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notas del terapeuta</label>
                  <textarea value={sessionForm.notes} rows={2}
                    onChange={(e) => setSessionForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Observaciones clínicas, incidencias, próximos pasos..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
              <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                {sessionProtocol.length > 0 && `${sessionProtocol.filter(i => i.completed).length} de ${sessionProtocol.length} pasos completados`}
              </span>
              <div className="flex gap-3 ml-auto">
              <button onClick={() => setAddSessionModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
              </button>
              <button onClick={handleAddSession} disabled={savingSession}
                className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {savingSession ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Guardando...</> : addSessionModal.editingSessionId ? "Guardar cambios" : "Registrar Sesión"}
              </button>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

/* ── Helpers de UI ── */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
      <dt className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide min-w-[140px]">
        {label}
      </dt>
      <dd className="text-sm text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}

function MedicalCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <span>{icon}</span>{label}
      </p>
      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "indigo" | "teal" | "blue" | "violet" }) {
  const colors = {
    indigo: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20",
    teal:   "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20",
    blue:   "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    violet: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20",
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-1 opacity-80">{label}</p>
    </div>
  );
}

function EvalTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    INITIAL:  { label: "Inicial",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    PROGRESS: { label: "Progreso", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
    FINAL:    { label: "Final",    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  };
  const { label, cls } = map[type] ?? { label: type, cls: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

function AttendanceBadge({ status }: { status?: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    ATTENDED:     { label: "Asistió",     cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    NOT_ATTENDED: { label: "No asistió",  cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
    RESCHEDULED:  { label: "Reprogramada",cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    PENDING:      { label: "Pendiente",   cls: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400" },
  };
  const { label, cls } = map[status ?? "PENDING"] ?? map.PENDING;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>{label}</span>;
}

function PlanStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT:     { label: "Borrador",   cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
    ACTIVE:    { label: "Activo",     cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    COMPLETED: { label: "Completado", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    CANCELLED: { label: "Cancelado",  cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${cls}`}>{label}</span>;
}

function PainBadge({ level }: { level: number }) {
  const color = level <= 3 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : level <= 6 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      Dolor {level}/10
    </span>
  );
}

function StepTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded">
      {children}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      <p className="text-sm text-gray-400">Cargando...</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-3 text-2xl">
        📭
      </div>
      <p className="text-sm text-gray-400 dark:text-gray-500">{text}</p>
    </div>
  );
}

/* ── Historia Clínica helpers ── */

function HCSectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
      <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-sm flex-shrink-0">
        {icon}
      </span>
      {title}
    </h3>
  );
}

function HCDataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function HCMuscleTable({ data }: { data: Record<string, { di: string; dd: string; fi: string; fd: string }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700">
            <th className="text-left py-2 pr-3 font-medium text-gray-400 dark:text-gray-500">Músculo</th>
            <th className="text-center py-2 px-2 font-medium text-gray-400 dark:text-gray-500">D Ini</th>
            <th className="text-center py-2 px-2 font-medium text-gray-400 dark:text-gray-500">D Fin</th>
            <th className="text-center py-2 px-2 font-medium text-gray-400 dark:text-gray-500">I Ini</th>
            <th className="text-center py-2 px-2 font-medium text-gray-400 dark:text-gray-500">I Fin</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {Object.entries(data).map(([muscle, vals]) => (
            <tr key={muscle} className="text-gray-700 dark:text-gray-300">
              <td className="py-2 pr-3 font-medium capitalize">{muscle.replace(/_/g, " ")}</td>
              <td className="text-center py-2 px-2">{vals.di || "—"}</td>
              <td className="text-center py-2 px-2">{vals.dd || "—"}</td>
              <td className="text-center py-2 px-2">{vals.fi || "—"}</td>
              <td className="text-center py-2 px-2">{vals.fd || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HCGonioTable({ label, data }: { label: string; data: Record<string, { inicial: string; final: string }> }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="text-left py-1.5 pr-3 font-medium text-gray-400 dark:text-gray-500">Movimiento</th>
              <th className="text-center py-1.5 px-2 font-medium text-gray-400 dark:text-gray-500">Inicial</th>
              <th className="text-center py-1.5 px-2 font-medium text-gray-400 dark:text-gray-500">Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {Object.entries(data).map(([mov, vals]) => (
              <tr key={mov} className="text-gray-700 dark:text-gray-300">
                <td className="py-1.5 pr-3 font-medium capitalize">{mov.replace(/_/g, " ")}</td>
                <td className="text-center py-1.5 px-2">{vals.inicial || "—"}</td>
                <td className="text-center py-1.5 px-2">{vals.final || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HCPosturalSection({ label, data }: { label: string; data: Record<string, Record<string, any>> }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <div className="space-y-2">
        {Object.entries(data).map(([category, items]) => (
          <div key={category} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 capitalize">{category.replace(/_/g, " ")}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
              {Object.entries(items).map(([item, val]) => (
                <div key={item} className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="capitalize">{item.replace(/_/g, " ")}: </span>
                  {typeof val === "object" && val !== null && "d" in val ? (
                    <span className="font-medium text-gray-800 dark:text-gray-200">D:{(val as any).d || "—"} I:{(val as any).i || "—"}</span>
                  ) : (
                    <span className="font-medium text-gray-800 dark:text-gray-200">{String(val) || "—"}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
