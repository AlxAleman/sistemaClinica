"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { prescriptionService, Prescription, UpdatePrescriptionData, Medication } from "@/services/prescriptionService";
import { patientService } from "@/services/patientService";
import { therapistService } from "@/services/therapistService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PatientSelector from "@/components/PatientSelector";
import TherapistSelector from "@/components/TherapistSelector";
import { PlusIcon, TrashIcon } from "@/components/Icons";

export default function EditPrescriptionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [formData, setFormData] = useState<Omit<UpdatePrescriptionData, "medications">>({
    patientId: "",
    therapistId: null,
    prescriptionDate: "",
    diagnosis: "",
    instructions: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prescriptionData, patientsRes, therapistsRes] = await Promise.all([
        prescriptionService.getById(id),
        patientService.getAll({ limit: 1000 }),
        therapistService.getAll({ limit: 1000 }),
      ]);

      setPrescription(prescriptionData);
      setPatients(patientsRes.patients);
      setTherapists(therapistsRes.therapists);
      setMedications(prescriptionData.medications);

      // Formatear fecha para datetime-local (YYYY-MM-DDTHH:mm)
      const formatDateForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      const date = new Date(prescriptionData.prescriptionDate);
      const dateStr = formatDateForInput(date);

      setFormData({
        patientId: prescriptionData.patientId,
        therapistId: prescriptionData.therapistId || null,
        prescriptionDate: dateStr,
        diagnosis: prescriptionData.diagnosis || "",
        instructions: prescriptionData.instructions || "",
        notes: prescriptionData.notes || "",
      });
    } catch (error: any) {
      toast.error("Error al cargar datos");
      router.push("/dashboard/prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
    ]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const invalidMedications = medications.filter(
      (med) => !med.name || !med.dosage || !med.frequency || !med.duration
    );
    
    if (invalidMedications.length > 0) {
      toast.error("Por favor completa todos los campos requeridos de los medicamentos");
      return;
    }

    setSaving(true);

    try {
      // Convertir fecha de datetime-local a ISO string
      const prescriptionDateISO = formData.prescriptionDate
        ? new Date(formData.prescriptionDate).toISOString()
        : undefined;

      await prescriptionService.update(id, {
        ...formData,
        prescriptionDate: prescriptionDateISO,
        medications: medications.map((med) => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions || undefined,
        })),
        therapistId: formData.therapistId || null,
        diagnosis: formData.diagnosis || null,
        instructions: formData.instructions || null,
        notes: formData.notes || null,
      });
      toast.success("Receta actualizada exitosamente");
      router.push(`/dashboard/prescriptions/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al actualizar receta");
    } finally {
      setSaving(false);
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

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Recetas", href: "/dashboard/prescriptions" },
          { label: prescription?.patient?.name || "Receta", href: `/dashboard/prescriptions/${id}` },
          { label: "Editar" },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Editar Receta Médica
        </h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6 transition-colors">
          {/* Paciente */}
          <div>
            <PatientSelector
              patients={patients}
              value={formData.patientId || ""}
              onChange={(patientId) => setFormData({ ...formData, patientId })}
              required
              label="Paciente"
            />
          </div>

          {/* Terapeuta */}
          <div>
            <TherapistSelector
              therapists={therapists}
              value={formData.therapistId || ""}
              onChange={(therapistId) => setFormData({ ...formData, therapistId: therapistId || null })}
              required={false}
              label="Terapeuta/Médico"
            />
          </div>

          {/* Fecha de Receta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Receta <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.prescriptionDate}
              onChange={(e) => setFormData({ ...formData, prescriptionDate: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            />
          </div>

          {/* Diagnóstico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Diagnóstico
            </label>
            <input
              type="text"
              value={formData.diagnosis || ""}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              placeholder="Ej: Dolor lumbar crónico"
            />
          </div>

          {/* Medicamentos */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Medicamentos <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addMedication}
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Agregar Medicamento
              </button>
            </div>

            <div className="space-y-4">
              {medications.map((medication, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Medicamento {index + 1}
                    </h4>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre del Medicamento <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={medication.name}
                        onChange={(e) => updateMedication(index, "name", e.target.value)}
                        required
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                        placeholder="Ej: Ibuprofeno"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dosis <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                        required
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                        placeholder="Ej: 500mg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Frecuencia <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                        required
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                        placeholder="Ej: Cada 8 horas"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duración <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, "duration", e.target.value)}
                        required
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                        placeholder="Ej: 7 días"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Instrucciones Adicionales
                      </label>
                      <textarea
                        value={medication.instructions || ""}
                        onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                        rows={2}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                        placeholder="Ej: Tomar con alimentos"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instrucciones Generales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instrucciones Generales
            </label>
            <textarea
              value={formData.instructions || ""}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              placeholder="Instrucciones adicionales para el paciente"
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
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              placeholder="Notas internas sobre la receta"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href={`/dashboard/prescriptions/${id}`}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

