"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { patientService, Patient } from "@/services/patientService";
import { sessionService, TreatmentSession, SessionProtocolItem } from "@/services/sessionService";
import { treatmentPlanService, TreatmentPlan } from "@/services/treatmentPlanService";
import { historiaClinicaService, HistoriaClinica, AntecedentItem } from "@/services/historiaClinicaService";
import { evaluacionFisicaService, EvaluacionFisica } from "@/services/evaluacionFisicaService";
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

type TabId = "resumen" | "general" | "expediente" | "tratamiento" | "historial";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "resumen",     label: "Resumen",               icon: "🏠" },
  { id: "general",     label: "Información General",   icon: "👤" },
  { id: "expediente",  label: "Expediente Médico",     icon: "🩺" },
  { id: "tratamiento", label: "Tratamiento",            icon: "💪" },
  { id: "historial",   label: "Historial y Documentos", icon: "📋" },
];

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const autoOpenedPlanRef = useRef(false);

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
  const [activeTab, setActiveTab] = useState<TabId>("resumen");

  // Leer ?tab= al montar
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["resumen","general","expediente","tratamiento","historial"].includes(tab)) {
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
      await patientService.deleteDocument(id as string, deleteDocumentId);
      setPatient(prev => prev ? {
        ...prev,
        documents: (prev.documents ?? []).filter((d: any) => d.id !== deleteDocumentId),
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

  // Auto-expandir plan y abrir modal de sesión si viene ?planId= desde el calendario
  useEffect(() => {
    if (loadingPlans || autoOpenedPlanRef.current) return;
    const planId = searchParams.get("planId");
    if (!planId) return;
    const plan = treatmentPlans.find(p => p.id === planId);
    if (!plan) return;
    autoOpenedPlanRef.current = true;
    setExpandedPlans(prev => new Set([...prev, planId]));

    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      // "Completar sesión" desde el calendario → abrir modal de edición para la sesión existente
      (async () => {
        let sessions = planSessions[planId] ?? [];
        if (sessions.length === 0) {
          try {
            const res = await sessionService.getAll({ treatmentPlanId: planId, limit: 200 });
            sessions = res.sessions;
            setPlanSessions(prev => ({ ...prev, [planId]: res.sessions }));
          } catch { sessions = []; }
        }
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          openCompleteSession(session, plan);
        } else {
          openAddSession(plan);
        }
      })();
    } else {
      if (!planSessions[planId]) {
        sessionService.getAll({ treatmentPlanId: planId, limit: 200 })
          .then(res => setPlanSessions(prev => ({ ...prev, [planId]: res.sessions })))
          .catch(() => {});
      }
      openAddSession(plan);
    }
  }, [loadingPlans, treatmentPlans]);

  const buildProtocolFromPlan = (plan: TreatmentPlan, completed: boolean) => {
    const proto = (plan.protocol as any[] | null | undefined) ?? [];
    return proto.map((item: any) => ({
      order: item.order, type: item.type, procedure: item.procedure,
      area: item.area, side: item.side, duration: item.duration,
      intensity: item.intensity, series: item.series, reps: item.reps,
      weight: item.weight, resistance: item.resistance,
      completed, notes: "",
    }));
  };

  const openEditSession = (session: TreatmentSession, plan: TreatmentPlan) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const d = new Date(session.sessionDate);
    const localDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setSessionForm({
      sessionDate: localDate,
      therapistId: session.therapistId ?? "",
      duration: session.duration,
      attendanceStatus: (session.attendanceStatus ?? "PENDING") as "ATTENDED" | "NOT_ATTENDED" | "RESCHEDULED" | "PENDING",
      painLevel: session.painLevel ?? 0,
      progress: session.progress ?? "",
      notes: session.notes ?? "",
    });
    const existing = (session.sessionProtocol as SessionProtocolItem[] | null) ?? [];
    setSessionProtocol(existing.length > 0 ? existing : buildProtocolFromPlan(plan, false));
    setAddSessionModal({ planId: plan.id, plan, editingSessionId: session.id });
  };

  const openCompleteSession = (session: TreatmentSession, plan: TreatmentPlan) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const d = new Date(session.sessionDate);
    const localDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setSessionForm({
      sessionDate: localDate,
      therapistId: session.therapistId ?? (therapists[0]?.id ?? ""),
      duration: session.duration,
      attendanceStatus: "ATTENDED",
      painLevel: session.painLevel ?? 0,
      progress: session.progress ?? "",
      notes: session.notes ?? "",
    });
    const existing = (session.sessionProtocol as SessionProtocolItem[] | null) ?? [];
    setSessionProtocol(existing.length > 0 ? existing : buildProtocolFromPlan(plan, true));
    setAddSessionModal({ planId: plan.id, plan, editingSessionId: session.id });
  };

  const handleAddSession = async () => {
    if (!addSessionModal) return;
    setSavingSession(true);
    try {
      const payload = {
        patientId: id,
        therapistId: sessionForm.therapistId || null,
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

        {/* ── TAB: Resumen ── */}
        {activeTab === "resumen" && (() => {
          const activePlans = treatmentPlans.filter(p => p.status === "ACTIVE");
          const finishedPlans = treatmentPlans
            .filter(p => p.status === "COMPLETED" || p.status === "CANCELLED")
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          const allPlansSorted = [
            ...activePlans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            ...finishedPlans,
          ];
          const attendedSessions = sessions.filter(s => s.attendanceStatus === "ATTENDED");
          const lastSession = [...sessions].sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())[0] ?? null;
          const activeDiagnoses = diagnoses.filter(d => d.status === "ACTIVE");
          const allergies = patient.medicalProfile?.allergies;
          const currentMeds = patient.medicalProfile?.currentMedications;

          // Antecedentes con tiene=true desde historia
          const activeAntecedentes = historia?.antecedentes
            ? Object.entries(historia.antecedentes).filter(([, v]) => v.tiene)
            : [];
          const activeHabitos = historia?.habitosSalud
            ? Object.entries(historia.habitosSalud).filter(([, v]) => v.tiene)
            : [];

          return (
            <div className="space-y-5">
              {/* Alergias — siempre visible */}
              {allergies ? (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-5 py-4">
                  <span className="text-lg flex-shrink-0">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Alergias registradas</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">{allergies}</p>
                  </div>
                </div>
              ) : allergies === null || allergies === undefined ? (
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5">
                  <span className="text-base flex-shrink-0">❓</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Alergias: <span className="font-medium text-gray-700 dark:text-gray-300">No registradas</span></p>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl px-5 py-3.5">
                  <span className="text-base flex-shrink-0">✅</span>
                  <p className="text-sm text-green-800 dark:text-green-300">Sin alergias conocidas</p>
                </div>
              )}

              {/* Métricas rápidas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 text-center">
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{attendedSessions.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sesiones realizadas</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 text-center">
                  <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">{activePlans.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tratamientos activos</p>
                </div>
              </div>

              {/* Planes + Última sesión */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Planes de tratamiento */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-xs">💪</span>
                    Planes de tratamiento
                  </h3>
                  {allPlansSorted.length > 0 ? (
                    <div className="space-y-3">
                      {allPlansSorted.map(plan => {
                        const pct = Math.min(100, Math.round(((plan.sessionsCompleted ?? 0) / (plan.sessionsPlanned || 1)) * 100));
                        const isActive = plan.status === "ACTIVE";
                        return (
                          <div key={plan.id} className={`rounded-xl border p-4 ${isActive ? "border-indigo-200 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-900/10" : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30"}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{plan.title}</p>
                                {plan.diagnosis?.clinicalDiagnosis && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{plan.diagnosis.clinicalDiagnosis}</p>
                                )}
                              </div>
                              <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                                isActive ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" :
                                plan.status === "COMPLETED" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                                "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                              }`}>
                                {isActive ? "Activo" : plan.status === "COMPLETED" ? "Finalizado" : "Cancelado"}
                              </span>
                            </div>
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
                                <span>{plan.sessionsCompleted ?? 0} / {plan.sessionsPlanned} sesiones</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${isActive ? "bg-indigo-500" : "bg-gray-400 dark:bg-gray-500"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <button
                        onClick={() => setActiveTab("tratamiento")}
                        className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        Ver detalle de tratamientos →
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-24 text-center">
                      <p className="text-sm text-gray-400 dark:text-gray-500">Sin planes de tratamiento</p>
                      <Link
                        href={`/dashboard/treatment-plans/new?patientId=${id}`}
                        className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Crear plan de tratamiento
                      </Link>
                    </div>
                  )}
                </div>

                {/* Última sesión */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-xs">📋</span>
                    Última sesión
                  </h3>
                  {lastSession ? (
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{moment(lastSession.sessionDate).format("dddd D [de] MMMM, YYYY")}</p>
                      {lastSession.attendanceStatus === "NOT_ATTENDED" && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">No asistió</span>
                      )}
                      {lastSession.progress && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Progreso</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{lastSession.progress}</p>
                        </div>
                      )}
                      {lastSession.notes && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Notas</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{lastSession.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-24">
                      <p className="text-sm text-gray-400 dark:text-gray-500">Sin sesiones registradas</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnósticos activos */}
              {activeDiagnoses.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xs">🩺</span>
                    Diagnósticos activos
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium">{activeDiagnoses.length}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {activeDiagnoses.map(d => (
                      <span key={d.id} className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-800">
                        {d.clinicalDiagnosis}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Antecedentes + Hábitos + Medicamentos */}
              {(activeAntecedentes.length > 0 || activeHabitos.length > 0 || currentMeds) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {activeAntecedentes.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-xs">📂</span>
                        Antecedentes patológicos
                      </h3>
                      <ul className="space-y-2">
                        {activeAntecedentes.map(([key, val]) => (
                          <li key={key} className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium capitalize">{key.replace(/_/g, " ")}</span>
                            {val.especifique && <span className="text-gray-500 dark:text-gray-400"> — {val.especifique}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(activeHabitos.length > 0 || currentMeds) && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-4">
                      {activeHabitos.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-xs">🌿</span>
                            Hábitos de salud
                          </h3>
                          <ul className="space-y-2">
                            {activeHabitos.map(([key, val]) => (
                              <li key={key} className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium capitalize">{key.replace(/_/g, " ")}</span>
                                {val.especifique && <span className="text-gray-500 dark:text-gray-400"> — {val.especifique}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {currentMeds && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-xs">💊</span>
                            Medicamentos / tratamientos actuales
                          </h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{currentMeds}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Acciones rápidas */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Acciones rápidas</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab("tratamiento")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Registrar sesión
                  </button>
                  <Link
                    href={`/dashboard/appointments/new?patientId=${id}&type=evaluation`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Nueva evaluación
                  </Link>
                  <Link
                    href={`/dashboard/appointments?patientId=${id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl transition-colors"
                  >
                    <UsersIcon className="w-4 h-4" />
                    Ver en calendario
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

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
              <ExpedienteView
                historia={historia}
                patientId={id}
                diagnoses={diagnoses}
                loadingDiagnoses={loadingDiagnoses}
                diagnosesPage={diagnosesPage}
                setDiagnosesPage={setDiagnosesPage}
                DIAGNOSES_PER_PAGE={DIAGNOSES_PER_PAGE}
                expandedDiagnoses={expandedDiagnoses}
                toggleDiagnosis={toggleDiagnosis}
                treatmentPlans={treatmentPlans}
                setActiveTab={setActiveTab}
                setExpandedPlans={setExpandedPlans}
                setDeleteDiagnosisId={setDeleteDiagnosisId}
              />
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
                          onClick={() => {
                            setSessionForm((f) => ({ ...f, attendanceStatus: val }));
                            if (val === "ATTENDED") {
                              setSessionProtocol(prev => prev.map(item => ({ ...item, completed: true })));
                            } else if (val === "NOT_ATTENDED" || val === "PENDING") {
                              setSessionProtocol(prev => prev.map(item => ({ ...item, completed: false })));
                            }
                          }}
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

// ─── ExpedienteView ───────────────────────────────────────────────────────────
function ExpedienteView({
  historia, patientId, diagnoses, loadingDiagnoses,
  diagnosesPage, setDiagnosesPage, DIAGNOSES_PER_PAGE,
  expandedDiagnoses, toggleDiagnosis, treatmentPlans,
  setActiveTab, setExpandedPlans, setDeleteDiagnosisId,
}: {
  historia: HistoriaClinica;
  patientId: string;
  diagnoses: Diagnosis[];
  loadingDiagnoses: boolean;
  diagnosesPage: number;
  setDiagnosesPage: React.Dispatch<React.SetStateAction<number>>;
  DIAGNOSES_PER_PAGE: number;
  expandedDiagnoses: Set<string>;
  toggleDiagnosis: (id: string) => void;
  treatmentPlans: TreatmentPlan[];
  setActiveTab: (tab: any) => void;
  setExpandedPlans: React.Dispatch<React.SetStateAction<Set<string>>>;
  setDeleteDiagnosisId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const ANTECEDENTES_LABELS: Record<string, string> = {
    diabetes: "Diabetes", alergia: "Alergia", hta: "HTA",
    cancer: "Cáncer", transfusiones: "Transfusiones", enfReumaticas: "Enf. Reumáticas",
    hospitalizacion: "Hospitalización", encames: "Encames", accidentes: "Accidentes",
    cardiopatias: "Cardiopatías", cirugias: "Cirugías", fracturas: "Fracturas",
  };
  const HABITOS_LABELS: Record<string, string> = {
    tabaquismo: "Tabaquismo", alcoholismo: "Alcoholismo", drogas: "Drogas",
    actividadFisica: "Act. Física", automedica: "Automedicación", pasatiempo: "Pasatiempo",
  };

  const activeAnt = historia.antecedentes
    ? Object.entries(historia.antecedentes).filter(([, v]) => v.tiene)
    : [];
  const activeHabitos = historia.habitosSalud
    ? Object.entries(historia.habitosSalud).filter(([, v]) => v.tiene)
    : [];

  const [evals, setEvals] = useState<EvaluacionFisica[]>([]);
  const [loadingEvals, setLoadingEvals] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    evaluacionFisicaService.getByHistoria(historia.id)
      .then(data => setEvals([...data].sort((a, b) =>
        new Date(a.fechaEvaluacion).getTime() - new Date(b.fechaEvaluacion).getTime()
      )))
      .catch(() => {})
      .finally(() => setLoadingEvals(false));
  }, [historia.id]);

  const toggleSelect = (id: string) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) :
      prev.length >= 2   ? prev :
      [...prev, id]
    );

  const [diagnosisFilter, setDiagnosisFilter] = useState<"all" | "ACTIVE" | "CHRONIC" | "RESOLVED">("all");
  const [diagnosesPerPage, setDiagnosesPerPage] = useState(5);
  const filteredDiagnoses = diagnosisFilter === "all"
    ? diagnoses
    : diagnoses.filter(d => d.status === diagnosisFilter);
  const totalDiagPages = Math.max(1, Math.ceil(filteredDiagnoses.length / diagnosesPerPage));

  useEffect(() => { setDiagnosesPage(1); }, [diagnosisFilter, diagnosesPerPage]);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Actualizado {moment(historia.updatedAt).fromNow()}
      </p>

      {/* Expediente Base + Diagnósticos en grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* Datos base */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <HCSectionHeader icon="📋" title="Expediente Base" />
            <Link
              href={`/dashboard/expedientes/${historia.id}/edit`}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Editar →
            </Link>
          </div>
          <div className="space-y-3">
            {historia.referidoPor && (
              <div className="flex gap-3">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-28 pt-0.5 flex-shrink-0">Referido por</span>
                <span className="text-sm text-gray-800 dark:text-gray-200">{historia.referidoPor}</span>
              </div>
            )}
            {(historia.peso != null || historia.talla != null || historia.imc != null) && (
              <div className="flex flex-wrap gap-3">
                {historia.peso != null && <HCDataCard label="Peso" value={`${historia.peso} kg`} />}
                {historia.talla != null && <HCDataCard label="Talla" value={`${historia.talla} m`} />}
                {historia.imc != null && <HCDataCard label="IMC" value={`${historia.imc}`} />}
              </div>
            )}
            {historia.motivoConsulta && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Motivo de consulta</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{historia.motivoConsulta}</p>
              </div>
            )}
            {historia.tratamientosPrevios && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Tratamientos previos</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{historia.tratamientosPrevios}</p>
              </div>
            )}
            {!historia.referidoPor && historia.peso == null && historia.talla == null && !historia.motivoConsulta && !historia.tratamientosPrevios && (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">Sin datos registrados.</p>
            )}
          </div>
        </div>

        {/* Diagnósticos */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <HCSectionHeader icon="🏥" title={`Diagnósticos${diagnoses.length > 0 ? ` (${diagnoses.length})` : ""}`} />
            <div className="flex items-center gap-2">
              {loadingDiagnoses && <span className="text-xs text-gray-400">Cargando...</span>}
              <Link
                href={`/dashboard/diagnoses/new?patientId=${patientId}`}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium whitespace-nowrap"
              >
                + Nuevo
              </Link>
            </div>
          </div>

          {/* Filtros de estado */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {([
              { key: "all",      label: "Todos",    count: diagnoses.length },
              { key: "ACTIVE",   label: "Activos",  count: diagnoses.filter(d => d.status === "ACTIVE").length },
              { key: "CHRONIC",  label: "Crónicos", count: diagnoses.filter(d => d.status === "CHRONIC").length },
              { key: "RESOLVED", label: "Resueltos",count: diagnoses.filter(d => d.status === "RESOLVED").length },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setDiagnosisFilter(f.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  diagnosisFilter === f.key
                    ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {f.label}
                {f.count > 0 && <span className="ml-1 opacity-60">{f.count}</span>}
              </button>
            ))}
          </div>

          {diagnoses.length > 0 ? (
            <>
              <div className="space-y-2">
                {filteredDiagnoses
                  .slice((diagnosesPage - 1) * diagnosesPerPage, diagnosesPage * diagnosesPerPage)
                  .map((diagnosis) => {
                    const isOpen = expandedDiagnoses.has(diagnosis.id);
                    const linkedPlan = treatmentPlans.find(p => p.diagnosisId === diagnosis.id) ?? null;
                    return (
                      <div key={diagnosis.id} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
                        <div className="p-3 flex items-center gap-2">
                          <button type="button" onClick={() => toggleDiagnosis(diagnosis.id)}
                            className="flex-1 min-w-0 text-left flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{diagnosis.clinicalDiagnosis}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{diagnosis.diagnosisDate ? moment(diagnosis.diagnosisDate).format("DD/MM/YYYY") : "—"}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 ${
                              diagnosis.status === "ACTIVE"   ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" :
                              diagnosis.status === "CHRONIC"  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                              "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            }`}>
                              {diagnosis.status === "ACTIVE" ? "Activo" : diagnosis.status === "CHRONIC" ? "Crónico" : "Resuelto"}
                            </span>
                            <span className={`text-gray-400 text-xs transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}>▾</span>
                          </button>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <Link href={`/dashboard/diagnoses/${diagnosis.id}`} onClick={e => e.stopPropagation()}
                              className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Editar">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </Link>
                            <button type="button" onClick={e => { e.stopPropagation(); setDeleteDiagnosisId(diagnosis.id); }}
                              className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                        {isOpen && (
                          <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 space-y-2 pt-2">
                            {diagnosis.observations && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">{diagnosis.observations}</p>
                            )}
                            {linkedPlan ? (
                              <button type="button"
                                onClick={() => { setActiveTab("tratamiento"); setExpandedPlans(prev => new Set([...prev, linkedPlan.id])); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/40 transition-colors">
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-0.5">Tratamiento</p>
                                  <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200 truncate">{linkedPlan.title}</p>
                                </div>
                                <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              </button>
                            ) : (
                              <p className="text-xs text-gray-400 italic">Sin tratamiento vinculado.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 mt-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Mostrar</span>
                  <select
                    value={diagnosesPerPage}
                    onChange={e => setDiagnosesPerPage(Number(e.target.value))}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span>por página · {filteredDiagnoses.length} en total</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setDiagnosesPage(p => Math.max(1, p - 1))} disabled={diagnosesPage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">‹</button>
                  {Array.from({ length: totalDiagPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setDiagnosesPage(p)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        p === diagnosesPage
                          ? "bg-indigo-600 text-white"
                          : "border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setDiagnosesPage(p => Math.min(totalDiagPages, p + 1))} disabled={diagnosesPage >= totalDiagPages}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">›</button>
                </div>
              </div>
            </>
          ) : diagnosisFilter !== "all" && filteredDiagnoses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-5 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">Sin diagnósticos con ese estado.</p>
              <button onClick={() => setDiagnosisFilter("all")} className="mt-1 text-xs text-indigo-500 hover:underline">Ver todos</button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-5 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Sin diagnósticos registrados.</p>
              <Link href={`/dashboard/diagnoses/new?patientId=${patientId}`}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Crear diagnóstico
              </Link>
            </div>
          )}
        </div>
      </div>{/* fin grid Expediente Base + Diagnósticos */}

      {/* Antecedentes + Hábitos */}
      {(activeAnt.length > 0 || activeHabitos.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeAnt.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <HCSectionHeader icon="📂" title="Antecedentes Patológicos" />
              <ul className="mt-4 space-y-2">
                {activeAnt.map(([key, val]) => (
                  <li key={key} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{ANTECEDENTES_LABELS[key] ?? key}</span>
                      {val.especifique && <span className="text-gray-500 dark:text-gray-400"> — {val.especifique}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {activeHabitos.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <HCSectionHeader icon="🌿" title="Hábitos de Salud" />
              <ul className="mt-4 space-y-2">
                {activeHabitos.map(([key, val]) => (
                  <li key={key} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{HABITOS_LABELS[key] ?? key}</span>
                      {val.especifique && <span className="text-gray-500 dark:text-gray-400"> — {val.especifique}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Evaluaciones Físicas */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <HCSectionHeader icon="🩺" title="Evaluaciones Físicas" />
          <Link
            href={`/dashboard/expedientes/${historia.id}/evaluaciones/nueva?patientId=${patientId}`}
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            + Nueva
          </Link>
        </div>

        {loadingEvals ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500" />
          </div>
        ) : evals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Sin evaluaciones físicas registradas</p>
            <Link
              href={`/dashboard/expedientes/${historia.id}/evaluaciones/nueva?patientId=${patientId}`}
              className="text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium"
            >
              Registrar primera evaluación →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {evals.length >= 2 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 pb-1">
                Selecciona 2 evaluaciones para compararlas.
                {selected.length === 2 && (
                  <button onClick={() => setSelected([])} className="ml-2 text-indigo-500 hover:underline">
                    Limpiar selección
                  </button>
                )}
              </p>
            )}

            {selected.length === 2 && (() => {
              const evA = evals.find(e => e.id === selected[0])!;
              const evB = evals.find(e => e.id === selected[1])!;
              return <ComparisonPanel evA={evA} evB={evB} />;
            })()}

            {evals.map(ev => {
              const isSelected = selected.includes(ev.id);
              const isExpanded = expanded === ev.id;
              const canSelect = isSelected || selected.length < 2;
              return (
                <div key={ev.id} className={`rounded-xl border transition-colors ${
                  isSelected
                    ? "border-indigo-300 dark:border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/10"
                    : "border-gray-100 dark:border-gray-700"
                }`}>
                  <div className="flex items-center gap-3 p-3">
                    {evals.length >= 2 && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!canSelect}
                        onChange={() => toggleSelect(ev.id)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0 disabled:opacity-30 cursor-pointer"
                      />
                    )}
                    <button
                      onClick={() => setExpanded(prev => prev === ev.id ? null : ev.id)}
                      className="flex-1 flex items-center gap-3 text-left min-w-0"
                    >
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        ev.tipo === "inicial"    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" :
                        ev.tipo === "final"      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
                        ev.tipo === "progreso"   ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300" :
                        ev.tipo === "seguimiento"? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" :
                        "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}>
                        {ev.tipo ?? "evaluación"}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                        {moment(ev.fechaEvaluacion).format("DD/MM/YYYY")}
                      </span>
                      {ev.escalaDolor != null && (
                        <span className={`text-xs font-medium flex-shrink-0 ${
                          ev.escalaDolor <= 3 ? "text-green-600 dark:text-green-400" :
                          ev.escalaDolor <= 6 ? "text-yellow-600 dark:text-yellow-400" :
                          "text-red-600 dark:text-red-400"
                        }`}>
                          Dolor {ev.escalaDolor}/10
                        </span>
                      )}
                      <span className={`text-gray-400 text-xs transition-transform duration-200 flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                    </button>
                    <Link
                      href={`/dashboard/expedientes/${historia.id}/evaluaciones/${ev.id}/edit?patientId=${patientId}`}
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-gray-400 hover:text-indigo-500 transition-colors flex-shrink-0"
                    >
                      Editar
                    </Link>
                  </div>
                  {isExpanded && <EvalDetail ev={ev} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// ─── EvalDetail ──────────────────────────────────────────────────────────────
function EvalDetail({ ev }: { ev: EvaluacionFisica }) {
  const sv = ev.signosVitales;
  const fm = ev.fuerzaMuscular;
  const gs = ev.goniometriaSuper;
  const gi = ev.goniometriaInfer;
  const vp = ev.valoracionPostural;

  const hasData = sv || ev.escalaDolor != null || ev.espasmos || ev.cicatrizQuirurgica ||
    ev.marchaDeambulacion || ev.diagnosticoRehabilitacion || ev.traslados ||
    fm || gs || gi || vp || ev.columna;

  if (!hasData) {
    return (
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-400 italic">Sin datos registrados en esta evaluación.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-4">
      {/* Signos vitales + dolor */}
      {(sv || ev.escalaDolor != null) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ev.escalaDolor != null && (
            <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-center">
              <p className="text-xs text-gray-400 mb-1">Escala de Dolor</p>
              <p className={`text-2xl font-bold ${
                ev.escalaDolor <= 3 ? "text-green-600 dark:text-green-400" :
                ev.escalaDolor <= 6 ? "text-yellow-600 dark:text-yellow-400" :
                "text-red-600 dark:text-red-400"
              }`}>{ev.escalaDolor}<span className="text-sm font-normal text-gray-400">/10</span></p>
            </div>
          )}
          {sv?.ta && <EvalDataChip label="T.A." value={sv.ta} />}
          {sv?.temperatura && <EvalDataChip label="Temperatura" value={sv.temperatura} />}
          {sv?.pc && <EvalDataChip label="P.C." value={sv.pc} />}
          {sv?.pb && <EvalDataChip label="P.B." value={sv.pb} />}
        </div>
      )}

      {/* Espasmos */}
      {ev.espasmos?.tiene && (
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
          <p className="text-xs font-medium text-gray-400 mb-1">Espasmos</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {ev.espasmos.sitio && <span className="font-medium">{ev.espasmos.sitio}</span>}
            {ev.espasmos.caracteristicas && <span className="text-gray-500 dark:text-gray-400"> — {ev.espasmos.caracteristicas}</span>}
          </p>
        </div>
      )}

      {/* Cicatriz quirúrgica */}
      {ev.cicatrizQuirurgica && (
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
          <p className="text-xs font-medium text-gray-400 mb-1">Cicatriz Quirúrgica</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{ev.cicatrizQuirurgica}</p>
        </div>
      )}

      {/* Marcha */}
      {ev.marchaDeambulacion && (() => {
        const m = ev.marchaDeambulacion!;
        const tipos = [
          m.libre && "Libre", m.claudicante && "Claudicante", m.conAyuda && "Con ayuda",
          m.espastica && "Espástica", m.ataxica && "Atáxica", m.otros && "Otros",
        ].filter(Boolean);
        return tipos.length > 0 || m.observaciones ? (
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <p className="text-xs font-medium text-gray-400 mb-2">Marcha / Deambulación</p>
            <div className="flex flex-wrap gap-1.5">
              {tipos.map(t => (
                <span key={String(t)} className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">{t}</span>
              ))}
            </div>
            {m.observaciones && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{m.observaciones}</p>}
          </div>
        ) : null;
      })()}

      {/* Traslados */}
      {ev.traslados && (ev.traslados.velInicial || ev.traslados.velFinal) && (
        <div className="grid grid-cols-2 gap-3">
          {ev.traslados.velInicial && <EvalDataChip label="Vel. inicial" value={ev.traslados.velInicial} />}
          {ev.traslados.velFinal && <EvalDataChip label="Vel. final" value={ev.traslados.velFinal} />}
          {ev.traslados.observaciones && (
            <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">{ev.traslados.observaciones}</div>
          )}
        </div>
      )}

      {/* Diagnóstico de rehabilitación */}
      {ev.diagnosticoRehabilitacion && (() => {
        const d = ev.diagnosticoRehabilitacion!;
        const fields = [
          { label: "Reflejos", val: d.reflejos },
          { label: "Sensibilidad", val: d.sensibilidad },
          { label: "Lenguaje / Orientación", val: d.lenguajeOrientacion },
          { label: "Otros", val: d.otros },
        ].filter(f => f.val);
        return fields.length > 0 ? (
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 space-y-1.5">
            <p className="text-xs font-medium text-gray-400 mb-2">Diagnóstico de Rehabilitación</p>
            {fields.map(f => (
              <p key={f.label} className="text-xs text-gray-700 dark:text-gray-300">
                <span className="font-medium text-gray-500 dark:text-gray-400">{f.label}:</span> {f.val}
              </p>
            ))}
          </div>
        ) : null;
      })()}

      {/* Columna */}
      {ev.columna && (ev.columna.planoSagital || ev.columna.planoFrontal) && (
        <div className="grid grid-cols-2 gap-3">
          {ev.columna.planoSagital && <EvalDataChip label="Columna sagital" value={ev.columna.planoSagital} />}
          {ev.columna.planoFrontal && <EvalDataChip label="Columna frontal" value={ev.columna.planoFrontal} />}
        </div>
      )}

      {/* Fuerza muscular */}
      {fm && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Fuerza Muscular</p>
          <div className="space-y-3">
            {fm.miembroSuperior && Object.keys(fm.miembroSuperior).length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Miembro Superior</p>
                <HCMuscleTable data={fm.miembroSuperior} />
              </div>
            )}
            {fm.miembroInferior && Object.keys(fm.miembroInferior).length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Miembro Inferior</p>
                <HCMuscleTable data={fm.miembroInferior} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goniometría superior */}
      {gs && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Goniometría Superior</p>
          <div className="space-y-3">
            {gs.hombro    && Object.keys(gs.hombro).length    > 0 && <HCGonioTable label="Hombro"     data={gs.hombro} />}
            {gs.codo      && Object.keys(gs.codo).length      > 0 && <HCGonioTable label="Codo"       data={gs.codo} />}
            {gs.antebrazo && Object.keys(gs.antebrazo).length > 0 && <HCGonioTable label="Antebrazo"  data={gs.antebrazo} />}
            {gs.muneca    && Object.keys(gs.muneca).length    > 0 && <HCGonioTable label="Muñeca"     data={gs.muneca} />}
          </div>
        </div>
      )}

      {/* Goniometría inferior */}
      {gi && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Goniometría Inferior</p>
          <div className="space-y-3">
            {gi.cadera  && Object.keys(gi.cadera).length  > 0 && <HCGonioTable label="Cadera"  data={gi.cadera} />}
            {gi.rodilla && Object.keys(gi.rodilla).length > 0 && <HCGonioTable label="Rodilla" data={gi.rodilla} />}
            {gi.tobillo && Object.keys(gi.tobillo).length > 0 && <HCGonioTable label="Tobillo" data={gi.tobillo} />}
          </div>
        </div>
      )}

      {/* Valoración postural */}
      {vp && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Valoración Postural</p>
          <div className="space-y-3">
            {vp.vistaAnterior  && Object.keys(vp.vistaAnterior).length  > 0 && <HCPosturalSection label="Vista Anterior"  data={vp.vistaAnterior} />}
            {vp.vistaLateral   && Object.keys(vp.vistaLateral).length   > 0 && <HCPosturalSection label="Vista Lateral"   data={vp.vistaLateral} />}
            {vp.vistaPosterior && Object.keys(vp.vistaPosterior).length > 0 && <HCPosturalSection label="Vista Posterior" data={vp.vistaPosterior} />}
          </div>
        </div>
      )}
    </div>
  );
}

function EvalDataChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-center">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  );
}

// ─── ComparisonPanel ─────────────────────────────────────────────────────────
function ComparisonPanel({ evA, evB }: { evA: EvaluacionFisica; evB: EvaluacionFisica }) {
  const pn = (v: string | number | null | undefined): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
    return isNaN(n) ? null : n;
  };

  const Delta = ({ a, b, lowerBetter = false }: { a: string | number | null | undefined; b: string | number | null | undefined; lowerBetter?: boolean }) => {
    const na = pn(a); const nb = pn(b);
    if (na === null || nb === null) return <span className="text-gray-300 dark:text-gray-600">—</span>;
    const diff = nb - na;
    if (diff === 0) return <span className="text-gray-400 text-xs">=</span>;
    const improved = lowerBetter ? diff < 0 : diff > 0;
    const cls = improved ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-500 dark:text-red-400 font-semibold";
    const abs = Math.abs(diff);
    return <span className={`text-xs ${cls}`}>{diff > 0 ? "▲" : "▼"} {abs % 1 === 0 ? abs : abs.toFixed(1)}</span>;
  };

  const CmpRow = ({ label, a, b, lowerBetter }: { label: string; a: React.ReactNode; b: React.ReactNode; lowerBetter?: boolean }) => (
    <tr className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <td className="py-2 pr-3 text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</td>
      <td className="py-2 px-3 text-xs text-gray-800 dark:text-gray-200">{a ?? <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
      <td className="py-2 px-3 text-xs text-gray-800 dark:text-gray-200">{b ?? <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
      {lowerBetter !== undefined
        ? <td className="py-2 pl-2"><Delta a={String(a ?? "")} b={String(b ?? "")} lowerBetter={lowerBetter} /></td>
        : <td />
      }
    </tr>
  );

  const labelA = `${evA.tipo ?? "eval"} · ${moment(evA.fechaEvaluacion).format("DD/MM/YY")}`;
  const labelB = `${evB.tipo ?? "eval"} · ${moment(evB.fechaEvaluacion).format("DD/MM/YY")}`;

  const hasFuerza = evA.fuerzaMuscular || evB.fuerzaMuscular;
  const hasGonio  = evA.goniometriaSuper || evB.goniometriaSuper || evA.goniometriaInfer || evB.goniometriaInfer;

  const allMuscleKeys = Array.from(new Set([
    ...Object.keys(evA.fuerzaMuscular?.miembroSuperior ?? {}),
    ...Object.keys(evA.fuerzaMuscular?.miembroInferior ?? {}),
    ...Object.keys(evB.fuerzaMuscular?.miembroSuperior ?? {}),
    ...Object.keys(evB.fuerzaMuscular?.miembroInferior ?? {}),
  ]));

  const allGonioGroups: { label: string; keysA: Record<string, { inicial: string; final: string }>; keysB: Record<string, { inicial: string; final: string }> }[] = [
    { label: "Hombro",    keysA: evA.goniometriaSuper?.hombro    ?? {}, keysB: evB.goniometriaSuper?.hombro    ?? {} },
    { label: "Codo",      keysA: evA.goniometriaSuper?.codo      ?? {}, keysB: evB.goniometriaSuper?.codo      ?? {} },
    { label: "Antebrazo", keysA: evA.goniometriaSuper?.antebrazo ?? {}, keysB: evB.goniometriaSuper?.antebrazo ?? {} },
    { label: "Muñeca",    keysA: evA.goniometriaSuper?.muneca    ?? {}, keysB: evB.goniometriaSuper?.muneca    ?? {} },
    { label: "Cadera",    keysA: evA.goniometriaInfer?.cadera    ?? {}, keysB: evB.goniometriaInfer?.cadera    ?? {} },
    { label: "Rodilla",   keysA: evA.goniometriaInfer?.rodilla   ?? {}, keysB: evB.goniometriaInfer?.rodilla   ?? {} },
    { label: "Tobillo",   keysA: evA.goniometriaInfer?.tobillo   ?? {}, keysB: evB.goniometriaInfer?.tobillo   ?? {} },
  ].filter(g => Object.keys(g.keysA).length > 0 || Object.keys(g.keysB).length > 0);

  return (
    <div className="mb-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Comparación</span>
        <span className="flex-1 h-px bg-indigo-200 dark:bg-indigo-700" />
        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{labelA}</span>
        <span className="text-xs text-gray-400">vs</span>
        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{labelB}</span>
      </div>

      {/* Métricas generales */}
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/40 border-b border-gray-100 dark:border-gray-700">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-400 dark:text-gray-500 w-32">Métrica</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-indigo-600 dark:text-indigo-400">{labelA}</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-indigo-600 dark:text-indigo-400">{labelB}</th>
              <th className="py-2 px-2 text-xs font-medium text-gray-400 text-right">Δ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            <CmpRow label="Dolor"
              a={evA.escalaDolor != null ? `${evA.escalaDolor}/10` : null}
              b={evB.escalaDolor != null ? `${evB.escalaDolor}/10` : null}
              lowerBetter
            />
            {(evA.signosVitales?.ta || evB.signosVitales?.ta) &&
              <CmpRow label="T.A." a={evA.signosVitales?.ta} b={evB.signosVitales?.ta} />}
            {(evA.signosVitales?.temperatura || evB.signosVitales?.temperatura) &&
              <CmpRow label="Temperatura" a={evA.signosVitales?.temperatura} b={evB.signosVitales?.temperatura} />}
            {(evA.traslados?.velInicial || evB.traslados?.velInicial) &&
              <CmpRow label="Vel. inicial" a={evA.traslados?.velInicial} b={evB.traslados?.velInicial} lowerBetter={false} />}
            {(evA.traslados?.velFinal || evB.traslados?.velFinal) &&
              <CmpRow label="Vel. final" a={evA.traslados?.velFinal} b={evB.traslados?.velFinal} lowerBetter={false} />}
            {(evA.columna?.planoSagital || evB.columna?.planoSagital) &&
              <CmpRow label="Col. sagital" a={evA.columna?.planoSagital} b={evB.columna?.planoSagital} />}
            {(evA.columna?.planoFrontal || evB.columna?.planoFrontal) &&
              <CmpRow label="Col. frontal" a={evA.columna?.planoFrontal} b={evB.columna?.planoFrontal} />}
          </tbody>
        </table>
      </div>

      {/* Fuerza muscular */}
      {hasFuerza && allMuscleKeys.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 pt-3 pb-1 uppercase tracking-wide">Fuerza Muscular</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/40 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-medium text-gray-400">Músculo</th>
                  {["D Ini","D Fin","I Ini","I Fin"].map(h => (
                    <th key={h} colSpan={3} className="text-center py-2 px-1 font-medium text-gray-400">{h}</th>
                  ))}
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                  <th />
                  {["D Ini","D Fin","I Ini","I Fin"].map(h => (
                    <React.Fragment key={h}>
                      <th className="text-center py-1 px-1 text-[10px] text-indigo-500">A</th>
                      <th className="text-center py-1 px-1 text-[10px] text-indigo-500">B</th>
                      <th className="text-center py-1 px-1 text-[10px] text-gray-400">Δ</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {allMuscleKeys.map(muscle => {
                  const isSup = muscle in (evA.fuerzaMuscular?.miembroSuperior ?? {}) || muscle in (evB.fuerzaMuscular?.miembroSuperior ?? {});
                  const va = isSup ? evA.fuerzaMuscular?.miembroSuperior?.[muscle] : evA.fuerzaMuscular?.miembroInferior?.[muscle];
                  const vb = isSup ? evB.fuerzaMuscular?.miembroSuperior?.[muscle] : evB.fuerzaMuscular?.miembroInferior?.[muscle];
                  return (
                    <tr key={muscle} className="text-gray-700 dark:text-gray-300">
                      <td className="py-2 px-3 font-medium capitalize">{muscle.replace(/_/g, " ")}</td>
                      {(["di","dd","fi","fd"] as const).map(k => (
                        <React.Fragment key={k}>
                          <td className="text-center py-2 px-1">{va?.[k] || "—"}</td>
                          <td className="text-center py-2 px-1">{vb?.[k] || "—"}</td>
                          <td className="text-center py-2 px-1"><Delta a={va?.[k]} b={vb?.[k]} /></td>
                        </React.Fragment>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Goniometría */}
      {hasGonio && allGonioGroups.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 pt-3 pb-1 uppercase tracking-wide">Goniometría</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/40 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-medium text-gray-400">Movimiento</th>
                  <th colSpan={3} className="text-center py-2 px-1 font-medium text-gray-400">Inicial</th>
                  <th colSpan={3} className="text-center py-2 px-1 font-medium text-gray-400">Final</th>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                  <th />
                  {["Inicial","Final"].map(h => (
                    <React.Fragment key={h}>
                      <th className="text-center py-1 px-1 text-[10px] text-indigo-500">A</th>
                      <th className="text-center py-1 px-1 text-[10px] text-indigo-500">B</th>
                      <th className="text-center py-1 px-1 text-[10px] text-gray-400">Δ</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {allGonioGroups.map(({ label, keysA, keysB }) => {
                  const movs = Array.from(new Set([...Object.keys(keysA), ...Object.keys(keysB)]));
                  return movs.map((mov, i) => (
                    <tr key={`${label}-${mov}`} className="text-gray-700 dark:text-gray-300">
                      <td className="py-2 px-3 font-medium capitalize">
                        {i === 0 && <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-wide block leading-none mb-0.5">{label}</span>}
                        {mov.replace(/_/g, " ")}
                      </td>
                      <td className="text-center py-2 px-1">{keysA[mov]?.inicial || "—"}</td>
                      <td className="text-center py-2 px-1">{keysB[mov]?.inicial || "—"}</td>
                      <td className="text-center py-2 px-1"><Delta a={keysA[mov]?.inicial} b={keysB[mov]?.inicial} /></td>
                      <td className="text-center py-2 px-1">{keysA[mov]?.final || "—"}</td>
                      <td className="text-center py-2 px-1">{keysB[mov]?.final || "—"}</td>
                      <td className="text-center py-2 px-1"><Delta a={keysA[mov]?.final} b={keysB[mov]?.final} /></td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
