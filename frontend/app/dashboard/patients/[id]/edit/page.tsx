"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { patientService } from "@/services/patientService";
import { toast } from "react-hot-toast";
import Link from "next/link";

const formatPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return digits.length <= 4 ? digits : `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

const formatDUI = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  return digits.length <= 8 ? digits : `${digits.slice(0, 8)}-${digits.slice(8)}`;
};

const nullable = (v: string): string | null => v.trim() || null;

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: full.trim(), lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export default function EditPatientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [dui, setDui] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | "">("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [profession, setProfession] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [affiliateNumber, setAffiliateNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoadingPatient(true);
      const patient = await patientService.getById(id);
      const { firstName: fn, lastName: ln } = splitName(patient.name);
      setFirstName(fn);
      setLastName(ln);
      setPhone(patient.phone ?? "");
      setEmail(patient.email ?? "");
      setDui(patient.dui ?? "");
      setGender((patient.gender ?? "") as "MALE" | "FEMALE" | "OTHER" | "");
      setBirthDate(
        patient.birthDate
          ? new Date(patient.birthDate).toISOString().split("T")[0]
          : ""
      );
      setAddress(patient.address ?? "");
      setProfession(patient.profession ?? "");
      setWorkplace(patient.workplace ?? "");
      setInsuranceCompany(patient.insuranceCompany ?? "");
      setAffiliateNumber(patient.affiliateNumber ?? "");
      setEmergencyContact(patient.emergencyContact ?? "");
      setEmergencyPhone(patient.emergencyPhone ?? "");
      setIsActive(patient.isActive ?? true);
      setPhotoUrl(patient.photoUrl ?? "");
    } catch {
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
      await patientService.update(id, {
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone,
        dui: nullable(dui),
        email: nullable(email),
        gender: (gender || null) as "MALE" | "FEMALE" | "OTHER" | null,
        photoUrl: nullable(photoUrl),
        birthDate: nullable(birthDate),
        address: nullable(address),
        profession: nullable(profession),
        workplace: nullable(workplace),
        insuranceCompany: nullable(insuranceCompany),
        affiliateNumber: nullable(affiliateNumber),
        isActive,
        emergencyContact: nullable(emergencyContact),
        emergencyPhone: nullable(emergencyPhone),
      });
      toast.success("Paciente actualizado exitosamente");
      router.push(`/dashboard/patients/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al actualizar paciente");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";
  const sectionTitleClass =
    "col-span-1 md:col-span-2 text-base font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mt-4";

  if (loadingPatient) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando paciente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          href={`/dashboard/patients/${id}`}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
        >
          ← Volver a Detalle
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Editar Paciente
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Información Personal */}
          <div className={sectionTitleClass}>Información Personal</div>

          <div>
            <label className={labelClass}>Nombres *</label>
            <input
              type="text"
              required
              placeholder="Ej. María José"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Apellidos *</label>
            <input
              type="text"
              required
              placeholder="Ej. García López"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Teléfono *</label>
            <input
              type="tel"
              required
              placeholder="7054-3824"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>DUI</label>
            <input
              type="text"
              placeholder="02802778-3"
              value={dui}
              onChange={(e) => setDui(formatDUI(e.target.value))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Género</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE" | "OTHER" | "")}
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
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Dirección</label>
            <input
              type="text"
              placeholder="Calle, colonia, municipio..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Información Laboral y de Seguro */}
          <div className={sectionTitleClass}>Información Laboral y de Seguro</div>

          <div>
            <label className={labelClass}>Profesión</label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Lugar de Trabajo</label>
            <input
              type="text"
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Aseguradora</label>
            <input
              type="text"
              value={insuranceCompany}
              onChange={(e) => setInsuranceCompany(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Número de Afiliado</label>
            <input
              type="text"
              value={affiliateNumber}
              onChange={(e) => setAffiliateNumber(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Foto de Perfil (URL)</label>
            <input
              type="text"
              placeholder="https://ejemplo.com/foto.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Estado */}
          <div className="flex items-center gap-3 self-end pb-1">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                isActive ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
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
            <label className={labelClass}>Nombre del Contacto</label>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Teléfono de Emergencia</label>
            <input
              type="tel"
              placeholder="7054-3824"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(formatPhone(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <Link
            href={`/dashboard/patients/${id}`}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
