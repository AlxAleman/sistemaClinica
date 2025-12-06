"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { patientService, Patient } from "@/services/patientService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { SearchIcon, EditIcon, TrashIcon, CalendarIcon, HospitalIcon, PhoneIcon, EmailIcon, IdCardIcon, PlusIcon } from "@/components/Icons";

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: "", name: "" });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientService.getAll({
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setPatients(response.patients);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error("Error al cargar pacientes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    try {
      await patientService.delete(deleteConfirm.id);
      toast.success("Paciente eliminado exitosamente");
      setDeleteConfirm({ isOpen: false, id: "", name: "" });
      fetchPatients();
    } catch (error: any) {
      toast.error("Error al eliminar paciente");
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pacientes" },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pacientes</h1>
        <Link
          href="/dashboard/patients/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo Paciente
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono o DUI..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Tabla de pacientes */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando pacientes...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <EmptyState
            title={search ? "No se encontraron pacientes" : "No hay pacientes registrados"}
            message={
              search
                ? `No se encontraron pacientes que coincidan con "${search}"`
                : "Comienza agregando tu primer paciente al sistema"
            }
            actionLabel={search ? undefined : "Crear primer paciente"}
            actionHref={search ? undefined : "/dashboard/patients/new"}
            icon={
              <UsersIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            }
          />
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {patients.map((patient) => (
                <li key={patient.id}>
                  <Link
                    href={`/dashboard/patients/${patient.id}`}
                    className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar
                          photoUrl={patient.photoUrl}
                          gender={patient.gender}
                          name={patient.name}
                          size="md"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {patient.name}
                          </p>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                                {patient.email && (
                                  <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <EmailIcon className="h-4 w-4 mr-1" />
                                    {patient.email}
                                  </p>
                                )}
                                <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                                  <PhoneIcon className="h-4 w-4 mr-1" />
                                  {patient.phone}
                                </p>
                                {patient.dui && (
                                  <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                                    <IdCardIcon className="h-4 w-4 mr-1" />
                                    {patient.dui}
                                  </p>
                                )}
                            </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                                {patient._count && (
                                  <>
                                    <span className="mr-4 flex items-center">
                                      <CalendarIcon className="h-4 w-4 mr-1" />
                                      {patient._count.appointments} citas
                                    </span>
                                    <span className="flex items-center">
                                      <HospitalIcon className="h-4 w-4 mr-1" />
                                      {patient._count.sessions} sesiones
                                    </span>
                                  </>
                                )}
                              </div>
                          </div>
                        </div>
                      </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                router.push(`/dashboard/patients/${patient.id}/edit`);
                              }}
                              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
                              title="Editar paciente"
                            >
                              <EditIcon className="h-4 w-4" />
                              Editar
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteClick(patient.id, patient.name);
                              }}
                              className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-sm font-medium transition-colors"
                              title="Eliminar paciente"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Eliminar
                            </button>
                          </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                de {pagination.total} pacientes
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
