"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { diagnosisService, CreateDiagnosisData } from "@/services/diagnosisService";
import Breadcrumbs from "@/components/Breadcrumbs";
import { patientService } from "@/services/patientService";

export default function NewDiagnosisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patientId") ?? "";

  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState<string>("");

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<CreateDiagnosisData>({
    patientId: patientIdParam,
    clinicalDiagnosis: "",
    diagnosisDate: today,
    observations: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    if (patientIdParam) {
      fetchPatientName(patientIdParam);
    }
  }, [patientIdParam]);

  const fetchPatientName = async (id: string) => {
    try {
      const patient = await patientService.getById(id);
      setPatientName(patient.name);
    } catch {
      // si no se puede obtener el nombre, continúa sin él
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      toast.error("Se requiere un paciente");
      return;
    }
    setLoading(true);
    try {
      await diagnosisService.create({
        ...formData,
        observations: formData.observations || null,
      });
      toast.success("Diagnóstico creado exitosamente");
      router.push(`/dashboard/patients/${formData.patientId}?tab=diagnosticos`);
    } catch (error: any) {
      toast.error(error.message || "Error al crear el diagnóstico");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pacientes", href: "/dashboard/patients" },
          ...(patientIdParam
            ? [
                { label: patientName || "Paciente", href: `/dashboard/patients/${patientIdParam}` },
              ]
            : []),
          { label: "Nuevo Diagnóstico" },
        ]}
      />

      <div className="mb-6">
        <Link
          href={patientIdParam ? `/dashboard/patients/${patientIdParam}` : "/dashboard/patients"}
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
            {/* Fecha de diagnóstico */}
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

          {/* patientId oculto */}
          <input type="hidden" value={formData.patientId} />

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href={patientIdParam ? `/dashboard/patients/${patientIdParam}` : "/dashboard/patients"}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : "Crear diagnóstico"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
