"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  patientService,
  UpdatePatientData,
  Patient,
} from "@/services/patientService";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function EditPatientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [formData, setFormData] = useState<UpdatePatientData>({
    name: "",
    phone: "",
    email: "",
    dui: "",
    gender: null,
    photoUrl: null,
    birthDate: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoadingPatient(true);
      const patient = await patientService.getById(id);
      setFormData({
        name: patient.name,
        phone: patient.phone,
        email: patient.email || "",
        dui: patient.dui || "",
        gender: patient.gender || null,
        photoUrl: patient.photoUrl || null,
        birthDate: patient.birthDate
          ? new Date(patient.birthDate).toISOString().split("T")[0]
          : "",
        address: patient.address || "",
        emergencyContact: patient.emergencyContact || "",
        emergencyPhone: patient.emergencyPhone || "",
      });
      setPhotoPreview(patient.photoUrl || null);
    } catch (error: any) {
      toast.error("Error al cargar paciente");
      router.push("/dashboard/patients");
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await patientService.update(id, formData);
      toast.success("Paciente actualizado exitosamente");
      router.push(`/dashboard/patients/${id}`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Error al actualizar paciente"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingPatient) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando paciente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          href={`/dashboard/patients/${id}`}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          ← Volver a Detalle
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Editar Paciente
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value || null })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DUI
            </label>
            <input
              type="text"
              value={formData.dui || ""}
              onChange={(e) =>
                setFormData({ ...formData, dui: e.target.value || null })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Género
            </label>
            <select
              value={formData.gender || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  gender: (e.target.value || null) as "MALE" | "FEMALE" | "OTHER" | null,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seleccionar...</option>
              <option value="MALE">Masculino</option>
              <option value="FEMALE">Femenino</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto de Perfil (URL)
            </label>
            <input
              type="url"
              placeholder="https://ejemplo.com/foto.jpg"
              value={formData.photoUrl || ""}
              onChange={(e) => {
                const url = e.target.value || null;
                setFormData({ ...formData, photoUrl: url });
                setPhotoPreview(url);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {photoPreview && (
              <div className="mt-2">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                  onError={() => setPhotoPreview(null)}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              value={formData.birthDate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  birthDate: e.target.value || null,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={formData.address || ""}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value || null })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contacto de Emergencia
            </label>
            <input
              type="text"
              value={formData.emergencyContact || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  emergencyContact: e.target.value || null,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono de Emergencia
            </label>
            <input
              type="tel"
              value={formData.emergencyPhone || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  emergencyPhone: e.target.value || null,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Link
            href={`/dashboard/patients/${id}`}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

