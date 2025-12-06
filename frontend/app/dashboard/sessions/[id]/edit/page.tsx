"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { sessionService, TreatmentSession, UpdateSessionData } from "@/services/sessionService";
import { patientService } from "@/services/patientService";
import { therapistService } from "@/services/therapistService";
import { appointmentService } from "@/services/appointmentService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PatientSelector from "@/components/PatientSelector";
import TherapistSelector from "@/components/TherapistSelector";
import AppointmentSelector from "@/components/AppointmentSelector";
import moment from "moment";

export default function EditSessionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<TreatmentSession | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [formData, setFormData] = useState<UpdateSessionData>({
    patientId: "",
    therapistId: "",
    appointmentId: null,
    sessionDate: "",
    duration: 60,
    interventions: "",
    progress: "",
    painLevel: undefined,
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionData, patientsRes, therapistsRes, appointmentsRes] = await Promise.all([
        sessionService.getById(id),
        patientService.getAll({ limit: 1000 }),
        therapistService.getAll({ limit: 1000 }),
        appointmentService.getAll({ limit: 1000 }),
      ]);

      setSession(sessionData);
      setPatients(patientsRes.patients);
      setTherapists(therapistsRes.therapists);
      setAppointments(appointmentsRes.appointments);

      // Prellenar formulario con datos de la sesión
      setFormData({
        patientId: sessionData.patientId,
        therapistId: sessionData.therapistId,
        appointmentId: sessionData.appointmentId || null,
        sessionDate: moment(sessionData.sessionDate).format("YYYY-MM-DDTHH:mm"),
        duration: sessionData.duration,
        interventions: sessionData.interventions || "",
        progress: sessionData.progress || "",
        painLevel: sessionData.painLevel || undefined,
        notes: sessionData.notes || "",
      });
    } catch (error: any) {
      toast.error("Error al cargar datos");
      router.push("/dashboard/sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await sessionService.update(id, {
        ...formData,
        appointmentId: formData.appointmentId || null,
        painLevel: formData.painLevel || null,
        interventions: formData.interventions || null,
        progress: formData.progress || null,
        notes: formData.notes || null,
      });
      toast.success("Sesión actualizada exitosamente");
      router.push(`/dashboard/sessions/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar sesión");
    } finally {
      setSaving(false);
    }
  };

  const handleAppointmentSelect = (appointment: any | null) => {
    if (appointment) {
      setFormData({
        ...formData,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        therapistId: appointment.therapistId,
        sessionDate: moment(appointment.appointmentDate).format("YYYY-MM-DDTHH:mm"),
        duration: appointment.duration,
      });
    } else {
      setFormData({
        ...formData,
        appointmentId: null,
      });
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Sesiones", href: "/dashboard/sessions" },
          { label: "Editar Sesión" },
        ]}
      />

      <div className="mb-6">
        <Link
          href={`/dashboard/sessions/${id}`}
          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
        >
          ← Volver a Detalle de Sesión
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">
          Editar Sesión de Tratamiento
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cita relacionada (opcional) */}
          <AppointmentSelector
            appointments={appointments}
            value={formData.appointmentId || null}
            onChange={(appointmentId) => setFormData({ ...formData, appointmentId })}
            onSelect={handleAppointmentSelect}
          />

          {/* Paciente */}
          <PatientSelector
            patients={patients}
            value={formData.patientId || ""}
            onChange={(patientId) => setFormData({ ...formData, patientId })}
            required
          />

          {/* Terapeuta */}
          <TherapistSelector
            therapists={therapists}
            value={formData.therapistId || ""}
            onChange={(therapistId) => setFormData({ ...formData, therapistId })}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fecha y Hora */}
            <div>
              <label htmlFor="sessionDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha y Hora <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="sessionDate"
                required
                value={formData.sessionDate}
                onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Duración */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duración (minutos) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="duration"
                required
                min="15"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Nivel de Dolor */}
          <div>
            <label htmlFor="painLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nivel de Dolor (1-10)
            </label>
            <input
              type="number"
              id="painLevel"
              min="1"
              max="10"
              value={formData.painLevel || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  painLevel: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Intervenciones */}
          <div>
            <label htmlFor="interventions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Intervenciones Realizadas
            </label>
            <textarea
              id="interventions"
              rows={4}
              value={formData.interventions || ""}
              onChange={(e) => setFormData({ ...formData, interventions: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              placeholder="Describe las intervenciones realizadas durante la sesión..."
            />
          </div>

          {/* Progreso */}
          <div>
            <label htmlFor="progress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Progreso
            </label>
            <textarea
              id="progress"
              rows={4}
              value={formData.progress || ""}
              onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              placeholder="Notas sobre el progreso del paciente..."
            />
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notas Adicionales
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              placeholder="Notas adicionales sobre la sesión..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href={`/dashboard/sessions/${id}`}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

