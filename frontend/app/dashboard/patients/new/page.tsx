"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { patientService, CreatePatientData } from "@/services/patientService";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePatientData>({
    name: "",
    phone: "",
    email: "",
    dui: "",
    gender: null,
    photoUrl: null,
    birthDate: "",
    address: "",
    residence: "",
    profession: "",
    workplace: "",
    insuranceCompany: "",
    affiliateNumber: "",
    isActive: true,
    emergencyContact: "",
    emergencyPhone: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newPatient = await patientService.create(formData);
      toast.success("Paciente creado exitosamente");
      router.push(`/dashboard/expediente/${newPatient.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al crear paciente");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400";

  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

  const sectionTitleClass =
    "col-span-1 md:col-span-2 text-base font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mt-4";

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          href="/dashboard/patients"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
        >
          ← Volver a Pacientes
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Nuevo Paciente
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Información Personal */}
          <div className={sectionTitleClass}>Información Personal</div>

          <div>
            <label className={labelClass}>Nombre Completo *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Teléfono *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value || null })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>DUI</label>
            <input
              type="text"
              value={formData.dui || ""}
              onChange={(e) =>
                setFormData({ ...formData, dui: e.target.value || null })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Género</label>
            <select
              value={formData.gender || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  gender: (e.target.value || null) as "MALE" | "FEMALE" | "OTHER" | null,
                })
              }
              className={inputClass}
            >
              <option value="">Seleccionar...</option>
              <option value="MALE">Masculino</option>
              <option value="FEMALE">Femenino</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Fecha de Nacimiento</label>
            <input
              type="date"
              value={formData.birthDate || ""}
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value || null })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Foto de Perfil (URL)</label>
            <input
              type="url"
              placeholder="https://ejemplo.com/foto.jpg"
              value={formData.photoUrl || ""}
              onChange={(e) => {
                const url = e.target.value || null;
                setFormData({ ...formData, photoUrl: url });
                setPhotoPreview(url);
              }}
              className={inputClass}
            />
            {photoPreview && (
              <div className="mt-2">
                <img
                  src={photoPreview}
                  alt="Vista previa"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                  onError={() => setPhotoPreview(null)}
                />
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Dirección</label>
            <input
              type="text"
              value={formData.address || ""}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value || null })
              }
              className={inputClass}
            />
          </div>

          {/* Información Laboral y de Seguro */}
          <div className={sectionTitleClass}>Información Laboral y de Seguro</div>

          <div>
            <label className={labelClass}>Residencia/Barrio</label>
            <input
              type="text"
              value={formData.residence || ""}
              onChange={(e) =>
                setFormData({ ...formData, residence: e.target.value || null })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Profesión</label>
            <input
              type="text"
              value={formData.profession || ""}
              onChange={(e) =>
                setFormData({ ...formData, profession: e.target.value || null })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Lugar de Trabajo</label>
            <input
              type="text"
              value={formData.workplace || ""}
              onChange={(e) =>
                setFormData({ ...formData, workplace: e.target.value || null })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Aseguradora</label>
            <input
              type="text"
              value={formData.insuranceCompany || ""}
              onChange={(e) =>
                setFormData({ ...formData, insuranceCompany: e.target.value || null })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Número de Afiliado</label>
            <input
              type="text"
              value={formData.affiliateNumber || ""}
              onChange={(e) =>
                setFormData({ ...formData, affiliateNumber: e.target.value || null })
              }
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={formData.isActive ?? true}
              onClick={() =>
                setFormData({ ...formData, isActive: !(formData.isActive ?? true) })
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                (formData.isActive ?? true)
                  ? "bg-indigo-600"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  (formData.isActive ?? true) ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Paciente Activo
            </span>
          </div>

          {/* Contacto de Emergencia */}
          <div className={sectionTitleClass}>Contacto de Emergencia</div>

          <div>
            <label className={labelClass}>Contacto de Emergencia</label>
            <input
              type="text"
              value={formData.emergencyContact || ""}
              onChange={(e) =>
                setFormData({ ...formData, emergencyContact: e.target.value || null })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Teléfono de Emergencia</label>
            <input
              type="tel"
              value={formData.emergencyPhone || ""}
              onChange={(e) =>
                setFormData({ ...formData, emergencyPhone: e.target.value || null })
              }
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <Link
            href="/dashboard/patients"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Guardando..." : "Guardar Paciente"}
          </button>
        </div>
      </form>
    </div>
  );
}
