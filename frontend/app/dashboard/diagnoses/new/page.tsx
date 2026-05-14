"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { diagnosisService, CreateDiagnosisData } from "@/services/diagnosisService";
import { evaluacionFisicaService, EvaluacionFisica } from "@/services/evaluacionFisicaService";
import Breadcrumbs from "@/components/Breadcrumbs";
import { patientService } from "@/services/patientService";
import moment from "moment";

export default function NewDiagnosisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patientId") ?? "";

  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState<string>("");
  const [evals, setEvals] = useState<EvaluacionFisica[]>([]);
  const [createPlan, setCreatePlan] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<CreateDiagnosisData>({
    patientId: patientIdParam,
    clinicalDiagnosis: "",
    diagnosisDate: today,
    observations: "",
    status: "ACTIVE",
    evaluacionFisicaId: null,
  });

  useEffect(() => {
    if (!patientIdParam) return;
    patientService.getById(patientIdParam)
      .then(p => setPatientName(p.name))
      .catch(() => {});
    evaluacionFisicaService.getByPatient(patientIdParam)
      .then(setEvals)
      .catch(() => setEvals([]));
  }, [patientIdParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      toast.error("Se requiere un paciente");
      return;
    }
    setLoading(true);
    try {
      const created = await diagnosisService.create({
        ...formData,
        observations: formData.observations || null,
        evaluacionFisicaId: formData.evaluacionFisicaId || null,
      });
      toast.success("Diagnóstico creado exitosamente");
      if (createPlan) {
        router.push(`/dashboard/treatment-plans/new?patientId=${formData.patientId}&diagnosisId=${created.id}`);
      } else {
        router.push(`/dashboard/patients/${formData.patientId}?tab=expediente`);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al crear el diagnóstico");
    } finally {
      setLoading(false);
    }
  };

  const evalLabel = (ev: EvaluacionFisica) => {
    const tipo = ev.tipo ?? "evaluación";
    const fecha = ev.fechaEvaluacion ? moment(ev.fechaEvaluacion).format("DD/MM/YYYY") : "";
    return `${tipo.charAt(0).toUpperCase() + tipo.slice(1)}${fecha ? ` — ${fecha}` : ""}`;
  };

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pacientes", href: "/dashboard/patients" },
          ...(patientIdParam
            ? [{ label: patientName || "Paciente", href: `/dashboard/patients/${patientIdParam}?tab=expediente` }]
            : []),
          { label: "Nuevo Diagnóstico" },
        ]}
      />

      <div className="mb-6">
        <Link
          href={patientIdParam ? `/dashboard/patients/${patientIdParam}?tab=expediente` : "/dashboard/patients"}
          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
        >
          ← Volver al expediente
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">
          Nuevo Diagnóstico
        </h1>
        {patientName && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Paciente: {patientName}</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Diagnóstico clínico */}
          <div>
            <label htmlFor="clinicalDiagnosis" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Diagnóstico clínico <span className="text-red-500">*</span>
            </label>
            <textarea
              id="clinicalDiagnosis"
              required
              rows={4}
              value={formData.clinicalDiagnosis}
              onChange={(e) => setFormData({ ...formData, clinicalDiagnosis: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              placeholder="Descripción del diagnóstico clínico del paciente..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Fecha */}
            <div>
              <label htmlFor="diagnosisDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de diagnóstico <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="diagnosisDate"
                required
                value={formData.diagnosisDate}
                onChange={(e) => setFormData({ ...formData, diagnosisDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Estado
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CreateDiagnosisData["status"] })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="ACTIVE">Activo</option>
                <option value="CHRONIC">Crónico</option>
                <option value="RESOLVED">Resuelto</option>
              </select>
            </div>
          </div>

          {/* Evaluación Física vinculada */}
          <div>
            <label htmlFor="evaluacionFisicaId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Evaluación física vinculada <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            {evals.length > 0 ? (
              <select
                id="evaluacionFisicaId"
                value={formData.evaluacionFisicaId ?? ""}
                onChange={(e) => setFormData({ ...formData, evaluacionFisicaId: e.target.value || null })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">— Sin vincular —</option>
                {evals.map((ev) => (
                  <option key={ev.id} value={ev.id}>{evalLabel(ev)}</option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Este paciente no tiene evaluaciones físicas registradas.
              </p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label htmlFor="observations" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              id="observations"
              rows={3}
              value={formData.observations || ""}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              placeholder="Observaciones adicionales sobre el diagnóstico..."
            />
          </div>

          {/* Continuar a plan de tratamiento */}
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-900/10 px-4 py-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={createPlan}
                onChange={(e) => setCreatePlan(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                  Continuar a crear un plan de tratamiento
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Al guardar el diagnóstico, abre el formulario de nuevo plan vinculado automáticamente.
                </p>
              </div>
            </label>
          </div>

          <input type="hidden" value={formData.patientId} />

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href={patientIdParam ? `/dashboard/patients/${patientIdParam}?tab=expediente` : "/dashboard/patients"}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Guardando..."
                : createPlan
                ? "Crear diagnóstico y continuar →"
                : "Crear diagnóstico"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
