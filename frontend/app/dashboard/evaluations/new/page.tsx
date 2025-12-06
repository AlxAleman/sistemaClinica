"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { evaluationService, CreateEvaluationData } from "@/services/evaluationService";
import { patientService } from "@/services/patientService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PatientSelector from "@/components/PatientSelector";

export default function NewEvaluationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patientId");

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [formData, setFormData] = useState<CreateEvaluationData>({
    patientId: patientIdParam || "",
    evaluationType: "INITIAL",
    evaluationDate: new Date().toISOString().split("T")[0] + "T" + new Date().toTimeString().split(" ")[0],
    rangeOfMotion: "",
    strength: "",
    painLevel: undefined,
    functionalAssessment: "",
    notes: "",
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll({ limit: 1000 });
      setPatients(response.patients);
    } catch (error) {
      toast.error("Error al cargar pacientes");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await evaluationService.create({
        ...formData,
        rangeOfMotion: formData.rangeOfMotion || null,
        strength: formData.strength || null,
        painLevel: formData.painLevel || null,
        functionalAssessment: formData.functionalAssessment || null,
        notes: formData.notes || null,
      });
      toast.success("Evaluación creada exitosamente");
      router.push("/dashboard/evaluations");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al crear evaluación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Evaluaciones", href: "/dashboard/evaluations" },
          { label: "Nueva Evaluación" },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Nueva Evaluación
        </h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6 transition-colors">
          {/* Paciente */}
          <div>
            <PatientSelector
              patients={patients}
              value={formData.patientId}
              onChange={(patientId) => setFormData({ ...formData, patientId })}
              required
              label="Paciente"
            />
          </div>

          {/* Tipo de Evaluación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Evaluación <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.evaluationType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  evaluationType: e.target.value as "INITIAL" | "PROGRESS" | "FINAL",
                })
              }
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            >
              <option value="INITIAL">Inicial</option>
              <option value="PROGRESS">Progreso</option>
              <option value="FINAL">Final</option>
            </select>
          </div>

          {/* Fecha de Evaluación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Evaluación <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.evaluationDate}
              onChange={(e) => setFormData({ ...formData, evaluationDate: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            />
          </div>

          {/* Nivel de Dolor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nivel de Dolor (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.painLevel || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  painLevel: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            />
            {formData.painLevel && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${(formData.painLevel / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.painLevel}/10
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Rango de Movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rango de Movimiento
            </label>
            <textarea
              value={formData.rangeOfMotion || ""}
              onChange={(e) => setFormData({ ...formData, rangeOfMotion: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              placeholder="Ej: Flexión 90°, Extensión 0°, Rotación interna 45°"
            />
          </div>

          {/* Fuerza */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fuerza
            </label>
            <textarea
              value={formData.strength || ""}
              onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              placeholder="Ej: Fuerza muscular 4/5, Resistencia normal"
            />
          </div>

          {/* Evaluación Funcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Evaluación Funcional
            </label>
            <textarea
              value={formData.functionalAssessment || ""}
              onChange={(e) =>
                setFormData({ ...formData, functionalAssessment: e.target.value })
              }
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              placeholder="Descripción de la capacidad funcional del paciente"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas Adicionales
            </label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              placeholder="Observaciones adicionales sobre la evaluación"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/dashboard/evaluations"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Guardando..." : "Crear Evaluación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

