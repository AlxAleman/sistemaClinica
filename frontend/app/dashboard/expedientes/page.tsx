"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import moment from "moment";
import { historiaClinicaService, HistoriaClinica } from "@/services/historiaClinicaService";
import { patientService, Patient } from "@/services/patientService";
import Avatar from "@/components/Avatar";
import { toast } from "react-hot-toast";

export default function ExpedientesPage() {
  const router = useRouter();
  const [historias, setHistorias] = useState<HistoriaClinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Para el modal de asociar
  const [showAsociar, setShowAsociar] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    fetchHistorias();
  }, [search]);

  const fetchHistorias = async () => {
    try {
      setLoading(true);
      const data = await historiaClinicaService.getAll(search || undefined);
      setHistorias(data);
    } catch {
      toast.error("Error al cargar expedientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showAsociar) return;
    const timer = setTimeout(async () => {
      setLoadingPatients(true);
      try {
        const res = await patientService.getAll({ search: patientSearch, limit: 20 });
        setPatients(res.patients);
      } catch {
        toast.error("Error al cargar pacientes");
      } finally {
        setLoadingPatients(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, showAsociar]);

  const age = (birthDate?: string) => {
    if (!birthDate) return null;
    return moment().diff(moment(birthDate), "years");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Expedientes Médicos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Historias clínicas de fisioterapia de los pacientes
          </p>
        </div>
        <Link
          href="/dashboard/expedientes/nuevo"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Expediente
        </Link>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nombre de paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
          <p className="text-sm text-gray-400">Cargando expedientes...</p>
        </div>
      ) : historias.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 text-3xl">
            🗂️
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {search ? "No se encontraron expedientes con ese nombre" : "No hay expedientes registrados"}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Crea el primer expediente clínico
          </p>
          <Link
            href="/dashboard/expedientes/nuevo"
            className="inline-flex items-center gap-2 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Crear Expediente
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {historias.map((h) => (
            <Link
              key={h.id}
              href={`/dashboard/patients/${h.patientId}`}
              className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-sm transition-all group"
            >
              <Avatar
                photoUrl={h.patient?.photoUrl}
                gender={h.patient?.gender as "MALE" | "FEMALE" | "OTHER" | null | undefined}
                name={h.patient?.name || ""}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {h.patient?.name}
                  </p>
                  {age(h.patient?.birthDate) !== null && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {age(h.patient?.birthDate)} años
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {h.motivoConsulta && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {h.motivoConsulta}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {h.escalaDolor != null && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                      h.escalaDolor <= 3 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : h.escalaDolor <= 6 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      Dolor {h.escalaDolor}/10
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {moment(h.updatedAt).format("DD/MM/YYYY")}
                </p>
              </div>
              <span className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
