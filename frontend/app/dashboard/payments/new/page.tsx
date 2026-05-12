"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  paymentService,
  CreatePaymentData,
  PaymentMethod,
} from "@/services/paymentService";
import { patientService, Patient } from "@/services/patientService";
import PatientSelector from "@/components/PatientSelector";
import Breadcrumbs from "@/components/Breadcrumbs";

const todayISO = () => new Date().toISOString().split("T")[0];

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefilledPatientId = searchParams.get("patientId") ?? "";
  const prefilledTreatmentPlanId = searchParams.get("treatmentPlanId") ?? "";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreatePaymentData>({
    patientId: prefilledPatientId,
    sessionId: null,
    treatmentPlanId: prefilledTreatmentPlanId || null,
    amount: 0,
    paymentDate: todayISO(),
    method: "CASH",
    notes: null,
  });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await patientService.getAll({ limit: 1000 });
        setPatients(response.patients);
      } catch (error) {
        toast.error("Error al cargar los pacientes");
      } finally {
        setPatientsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId) {
      toast.error("Debes seleccionar un paciente");
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    setSubmitting(true);
    try {
      await paymentService.create(formData);
      toast.success("Pago registrado correctamente");
      router.push("/dashboard/payments");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Error al registrar el pago"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pagos", href: "/dashboard/payments" },
          { label: "Nuevo Pago" },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Registrar Pago
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Ingresa los datos del pago a registrar
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Paciente */}
          <div className="md:col-span-2">
            {patientsLoading ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Paciente <span className="text-red-500">*</span>
                </label>
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
              </div>
            ) : (
              <PatientSelector
                patients={patients}
                value={formData.patientId}
                onChange={(id) => setFormData({ ...formData, patientId: id })}
                required
                label="Paciente"
              />
            )}
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monto <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 text-sm">
                $
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={formData.amount === 0 ? "" : formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                className="block w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Método de pago
            </label>
            <select
              value={formData.method}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  method: e.target.value as PaymentMethod,
                })
              }
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="CASH">Efectivo</option>
              <option value="POS">POS</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>

          {/* Fecha de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de pago
            </label>
            <input
              type="date"
              value={formData.paymentDate ?? todayISO()}
              onChange={(e) =>
                setFormData({ ...formData, paymentDate: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>

          {/* Plan de tratamiento (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ID Plan de tratamiento{" "}
              <span className="text-gray-400 dark:text-gray-500 font-normal">
                (opcional)
              </span>
            </label>
            <input
              type="text"
              value={formData.treatmentPlanId ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  treatmentPlanId: e.target.value || null,
                })
              }
              placeholder="ID del plan de tratamiento"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>

          {/* Notas */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas{" "}
              <span className="text-gray-400 dark:text-gray-500 font-normal">
                (opcional)
              </span>
            </label>
            <textarea
              rows={3}
              value={formData.notes ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value || null })
              }
              placeholder="Observaciones adicionales sobre el pago..."
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
          <Link
            href="/dashboard/payments"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Guardando...
              </>
            ) : (
              "Registrar Pago"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
