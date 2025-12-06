"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { prescriptionService, Prescription } from "@/services/prescriptionService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import { EditIcon, TrashIcon, PrinterIcon, ArrowLeftIcon } from "@/components/Icons";

export default function PrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: "",
  });

  useEffect(() => {
    fetchPrescription();
  }, [id]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const data = await prescriptionService.getById(id);
      setPrescription(data);
    } catch (error: any) {
      toast.error("Error al cargar receta");
      router.push("/dashboard/prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (!prescription) return;
    setDeleteConfirm({ isOpen: true, id: prescription.id });
  };

  const handleDeleteConfirm = async () => {
    if (!prescription) return;
    try {
      await prescriptionService.delete(id);
      toast.success("Receta eliminada exitosamente");
      router.push("/dashboard/prescriptions");
    } catch (error: any) {
      toast.error("Error al eliminar receta");
    }
  };

  const handlePrint = async () => {
    if (!prescription) return;
    
    try {
      // Marcar como impresa si no lo está
      if (!prescription.printed) {
        await prescriptionService.markAsPrinted(id);
        await fetchPrescription();
      }
      
      // Imprimir
      window.print();
    } catch (error: any) {
      toast.error("Error al marcar receta como impresa");
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando receta...</p>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return null;
  }

  return (
    <>
      {/* Vista Normal */}
      <div className="px-4 py-6 sm:px-0 no-print">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Recetas", href: "/dashboard/prescriptions" },
            { label: "Detalle de Receta" },
          ]}
        />

        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/dashboard/prescriptions"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver a Recetas
            </Link>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Receta Médica
            </h1>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <PrinterIcon className="h-4 w-4" />
                Imprimir
              </button>
              <Link
                href={`/dashboard/prescriptions/${id}/edit`}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <EditIcon className="h-4 w-4" />
                Editar
              </Link>
              <button
                onClick={handleDeleteClick}
                className="inline-flex items-center gap-2 px-3 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vista Imprimible */}
      <div className="max-w-4xl mx-auto bg-white p-8 print:shadow-none print:border-none">
        <div className="border-2 border-gray-300 p-8 print:border-gray-800">
          {/* Encabezado */}
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-4 print:border-gray-800">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RECETA MÉDICA</h1>
            <p className="text-sm text-gray-600">Sistema de Gestión Clínica</p>
          </div>

          {/* Información del Paciente */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Datos del Paciente
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Nombre:</span>{" "}
                <span className="text-gray-900">{prescription.patient?.name}</span>
              </div>
              {prescription.patient?.dui && (
                <div>
                  <span className="font-medium text-gray-700">DUI:</span>{" "}
                  <span className="text-gray-900">{prescription.patient.dui}</span>
                </div>
              )}
              {prescription.patient?.birthDate && (
                <div>
                  <span className="font-medium text-gray-700">Fecha de Nacimiento:</span>{" "}
                  <span className="text-gray-900">
                    {moment(prescription.patient.birthDate).format("DD/MM/YYYY")}
                  </span>
                </div>
              )}
              {prescription.patient?.address && (
                <div>
                  <span className="font-medium text-gray-700">Dirección:</span>{" "}
                  <span className="text-gray-900">{prescription.patient.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Información de la Receta */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Información de la Receta
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Fecha:</span>{" "}
                <span className="text-gray-900">
                  {moment(prescription.prescriptionDate).format("DD/MM/YYYY HH:mm")}
                </span>
              </div>
              {prescription.therapist && (
                <div>
                  <span className="font-medium text-gray-700">Prescrito por:</span>{" "}
                  <span className="text-gray-900">
                    {prescription.therapist.name}
                    {prescription.therapist.specialization && ` - ${prescription.therapist.specialization}`}
                  </span>
                </div>
              )}
              {prescription.diagnosis && (
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Diagnóstico:</span>{" "}
                  <span className="text-gray-900">{prescription.diagnosis}</span>
                </div>
              )}
            </div>
          </div>

          {/* Medicamentos */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Medicamentos Prescritos
            </h2>
            <div className="space-y-4">
              {prescription.medications.map((medication, index) => (
                <div key={index} className="border border-gray-200 p-4 rounded print:border-gray-400">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Medicamento:</span>{" "}
                      <span className="text-gray-900 font-semibold">{medication.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Dosis:</span>{" "}
                      <span className="text-gray-900">{medication.dosage}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Frecuencia:</span>{" "}
                      <span className="text-gray-900">{medication.frequency}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Duración:</span>{" "}
                      <span className="text-gray-900">{medication.duration}</span>
                    </div>
                    {medication.instructions && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Instrucciones:</span>{" "}
                        <span className="text-gray-900">{medication.instructions}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instrucciones Generales */}
          {prescription.instructions && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                Instrucciones Generales
              </h2>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {prescription.instructions}
              </p>
            </div>
          )}

          {/* Pie de Página */}
          <div className="mt-8 pt-4 border-t-2 border-gray-300 print:border-gray-800">
            <div className="flex justify-between items-end">
              <div className="text-sm text-gray-600">
                <p>Fecha de impresión: {moment().format("DD/MM/YYYY HH:mm")}</p>
                {prescription.printed && prescription.printedAt && (
                  <p>Impreso anteriormente: {moment(prescription.printedAt).format("DD/MM/YYYY HH:mm")}</p>
                )}
              </div>
              <div className="text-right">
                {prescription.therapist && (
                  <>
                    <div className="border-t-2 border-gray-800 mt-16 pt-2 w-48">
                      <p className="text-sm font-semibold text-gray-900">
                        {prescription.therapist.name}
                      </p>
                      {prescription.therapist.specialization && (
                        <p className="text-xs text-gray-600">
                          {prescription.therapist.specialization}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Firma y Sello</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos para Impresión */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print\\:border-gray-800 {
            border-color: #1f2937 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
        }
      `}</style>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Receta"
        message="¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </>
  );
}

