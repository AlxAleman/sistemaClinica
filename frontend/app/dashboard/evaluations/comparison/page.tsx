"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { evaluationService, EvaluationComparison } from "@/services/evaluationService";
import { patientService } from "@/services/patientService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ArrowLeftIcon, UsersIcon } from "@/components/Icons";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useTranslation } from "@/hooks/useTranslation";

export default function EvaluationComparisonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const patientIdParam = searchParams.get("patientId");
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<EvaluationComparison | null>(null);
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    if (patientIdParam) {
      fetchData();
    } else {
      toast.error(t("messages.patientRequired"));
      router.push("/dashboard/evaluations");
    }
  }, [patientIdParam]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [comparisonData, patientData] = await Promise.all([
        evaluationService.getComparison(patientIdParam!),
        patientService.getById(patientIdParam!),
      ]);
      setComparison(comparisonData);
      setPatient(patientData);
    } catch (error: any) {
      toast.error(t("messages.errorLoadingComparison"));
      router.push("/dashboard/evaluations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t("evaluations.comparison")}...</p>
        </div>
      </div>
    );
  }

  if (!comparison || (!comparison.initial && !comparison.final)) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <Breadcrumbs
          items={[
            { label: t("common.dashboard"), href: "/dashboard" },
            { label: t("evaluations.title"), href: "/dashboard/evaluations" },
            { label: t("evaluations.comparison") },
          ]}
        />
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center transition-colors">
          <p className="text-gray-600 dark:text-gray-400">
            {t("evaluations.noComparison") || "No hay evaluaciones inicial y final para comparar."}
          </p>
          <Link
            href="/dashboard/evaluations"
            className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
          >
            {t("messages.backToEvaluations")}
          </Link>
        </div>
      </div>
    );
  }

  // Preparar datos para gráficos
  const painData = [];
  if (comparison.initial) {
    painData.push({
      name: "Inicial",
      dolor: comparison.initial.painLevel || 0,
      fecha: moment(comparison.initial.evaluationDate).format("DD/MM/YYYY"),
    });
  }
  if (comparison.progress && comparison.progress.length > 0) {
    comparison.progress.forEach((evaluation, index) => {
      painData.push({
        name: `Progreso ${index + 1}`,
        dolor: evaluation.painLevel || 0,
        fecha: moment(evaluation.evaluationDate).format("DD/MM/YYYY"),
      });
    });
  }
  if (comparison.final) {
    painData.push({
      name: "Final",
      dolor: comparison.final.painLevel || 0,
      fecha: moment(comparison.final.evaluationDate).format("DD/MM/YYYY"),
    });
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Evaluaciones", href: "/dashboard/evaluations" },
          { label: "Comparación" },
        ]}
      />

      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/evaluations"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver a Evaluaciones
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Comparación de Evaluaciones - {patient?.name || "Paciente"}
        </h1>

        {/* Resumen de Mejoras */}
        {comparison.improvements && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6 transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Resumen de Mejoras
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comparison.improvements.painLevel !== undefined && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reducción de Dolor
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {comparison.improvements.painLevel > 0
                      ? `-${comparison.improvements.painLevel}`
                      : comparison.improvements.painLevel}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {comparison.initial?.painLevel || 0}/10 → {comparison.final?.painLevel || 0}/10
                  </p>
                </div>
              )}
              {comparison.improvements.rangeOfMotion && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rango de Movimiento
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {comparison.improvements.rangeOfMotion}
                  </p>
                </div>
              )}
              {comparison.improvements.strength && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Fuerza</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {comparison.improvements.strength}
                  </p>
                </div>
              )}
              {comparison.improvements.functionalAssessment && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Evaluación Funcional
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {comparison.improvements.functionalAssessment}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gráfico de Evolución del Dolor */}
        {painData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6 transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Evolución del Nivel de Dolor
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={painData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis domain={[0, 10]} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="dolor"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Nivel de Dolor"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Comparación Detallada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Evaluación Inicial */}
          {comparison.initial && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Evaluación Inicial
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {moment(comparison.initial.evaluationDate).format("DD/MM/YYYY HH:mm")}
                  </p>
                </div>
                {comparison.initial.painLevel !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Nivel de Dolor
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${((comparison.initial.painLevel || 0) / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {comparison.initial.painLevel || 0}/10
                      </span>
                    </div>
                  </div>
                )}
                {comparison.initial.rangeOfMotion && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Rango de Movimiento
                    </p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {comparison.initial.rangeOfMotion}
                    </p>
                  </div>
                )}
                {comparison.initial.strength && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fuerza</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {comparison.initial.strength}
                    </p>
                  </div>
                )}
                {comparison.initial.functionalAssessment && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Evaluación Funcional
                    </p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {comparison.initial.functionalAssessment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evaluación Final */}
          {comparison.final && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Evaluación Final
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {moment(comparison.final.evaluationDate).format("DD/MM/YYYY HH:mm")}
                  </p>
                </div>
                {comparison.final.painLevel !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Nivel de Dolor
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${((comparison.final.painLevel || 0) / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {comparison.final.painLevel || 0}/10
                      </span>
                    </div>
                  </div>
                )}
                {comparison.final.rangeOfMotion && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Rango de Movimiento
                    </p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {comparison.final.rangeOfMotion}
                    </p>
                  </div>
                )}
                {comparison.final.strength && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fuerza</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {comparison.final.strength}
                    </p>
                  </div>
                )}
                {comparison.final.functionalAssessment && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Evaluación Funcional
                    </p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {comparison.final.functionalAssessment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

