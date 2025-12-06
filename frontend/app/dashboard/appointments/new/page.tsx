"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { appointmentService, CreateAppointmentData } from "@/services/appointmentService";
import { sessionService, CreateSessionData } from "@/services/sessionService";
import { patientService } from "@/services/patientService";
import { therapistService } from "@/services/therapistService";
import { toast } from "react-hot-toast";
import Link from "next/link";

type AppointmentType = "appointment" | "session";

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [type, setType] = useState<AppointmentType>("appointment");
  const [formData, setFormData] = useState<CreateAppointmentData | CreateSessionData>({
    patientId: "",
    therapistId: "",
    appointmentDate: "",
    duration: 60,
  });

  useEffect(() => {
    fetchData();
    // Si hay una fecha en los query params, usarla
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const date = new Date(dateParam);
      // Formatear para el input datetime-local
      const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setFormData((prev) => ({ ...prev, appointmentDate: formattedDate }));
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [patientsRes, therapistsRes, appointmentsRes] = await Promise.all([
        patientService.getAll({ limit: 1000 }),
        therapistService.getAll({ limit: 1000 }),
        appointmentService.getAll({ limit: 1000 }),
      ]);
      setPatients(patientsRes.patients);
      setTherapists(therapistsRes.therapists);
      setAppointments(appointmentsRes.appointments);
    } catch (error: any) {
      toast.error("Error al cargar datos");
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convertir fecha local a ISO string
      const date = new Date(formData.appointmentDate);
      const isoDate = date.toISOString();

      if (type === "appointment") {
        await appointmentService.create({
          ...(formData as CreateAppointmentData),
          appointmentDate: isoDate,
        });
        toast.success("Cita creada exitosamente");
      } else {
        await sessionService.create({
          ...(formData as CreateSessionData),
          sessionDate: isoDate,
        });
        toast.success("Sesión creada exitosamente");
      }
      router.push("/dashboard/appointments");
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Error al crear ${type === "appointment" ? "cita" : "sesión"}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          href="/dashboard/appointments"
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          ← Volver a Citas
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {type === "appointment" ? "Nueva Cita" : "Nueva Sesión"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        {/* Selector de tipo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="appointment"
                checked={type === "appointment"}
                onChange={(e) => setType(e.target.value as AppointmentType)}
                className="mr-2"
              />
              <span className="text-gray-700">Cita</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="session"
                checked={type === "session"}
                onChange={(e) => setType(e.target.value as AppointmentType)}
                className="mr-2"
              />
              <span className="text-gray-700">Sesión de Tratamiento</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {type === "appointment"
              ? "Una cita es una reserva de horario para una consulta futura"
              : "Una sesión es el registro de una sesión de tratamiento ya realizada"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paciente *
            </label>
            <select
              required
              value={formData.patientId}
              onChange={(e) =>
                setFormData({ ...formData, patientId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seleccionar paciente</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Terapeuta *
            </label>
            <select
              required
              value={formData.therapistId}
              onChange={(e) =>
                setFormData({ ...formData, therapistId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seleccionar terapeuta</option>
              {therapists.map((therapist) => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.name}
                  {therapist.specialization && ` - ${therapist.specialization}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha y Hora *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.appointmentDate}
              onChange={(e) =>
                setFormData({ ...formData, appointmentDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración (minutos) *
            </label>
            <select
              required
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">60 minutos</option>
              <option value="90">90 minutos</option>
              <option value="120">120 minutos</option>
            </select>
          </div>

          {/* Campos adicionales para sesiones */}
          {type === "session" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cita Relacionada (Opcional)
                </label>
                <select
                  value={(formData as CreateSessionData).appointmentId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appointmentId: e.target.value || null,
                    } as CreateSessionData)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Ninguna (sesión independiente)</option>
                  {appointments
                    .filter((apt) => apt.patientId === formData.patientId)
                    .map((appointment) => (
                      <option key={appointment.id} value={appointment.id}>
                        {new Date(appointment.appointmentDate).toLocaleString("es-ES")} - {appointment.therapist?.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de Dolor (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={(formData as CreateSessionData).painLevel || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      painLevel: e.target.value ? parseInt(e.target.value) : null,
                    } as CreateSessionData)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Escala del 1 al 10"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intervenciones Realizadas
                </label>
                <textarea
                  value={(formData as CreateSessionData).interventions || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      interventions: e.target.value || null,
                    } as CreateSessionData)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Describe las intervenciones realizadas en esta sesión..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progreso
                </label>
                <textarea
                  value={(formData as CreateSessionData).progress || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      progress: e.target.value || null,
                    } as CreateSessionData)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Notas sobre el progreso del paciente..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  value={(formData as CreateSessionData).notes || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notes: e.target.value || null,
                    } as CreateSessionData)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Otras observaciones o notas..."
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Link
            href="/dashboard/appointments"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Guardando..."
              : type === "appointment"
              ? "Guardar Cita"
              : "Guardar Sesión"}
          </button>
        </div>
      </form>
    </div>
  );
}

