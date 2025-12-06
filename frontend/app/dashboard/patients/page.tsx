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
import { SearchIcon, EditIcon, TrashIcon, CalendarIcon, HospitalIcon, PhoneIcon, EmailIcon, IdCardIcon, PlusIcon, UsersIcon } from "@/components/Icons";
import { useTranslation } from "@/hooks/useTranslation";

export default function PatientsPage() {
  const router = useRouter();
  const { t } = useTranslation();
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
      toast.error(t("messages.errorLoadingPatients"));
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
      toast.success(t("messages.patientDeleted"));
      setDeleteConfirm({ isOpen: false, id: "", name: "" });
      fetchPatients();
    } catch (error: any) {
      toast.error(t("messages.errorDeleting") + " " + t("patients.title").toLowerCase());
    }
  };

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6">
      <Breadcrumbs
        items={[
          { label: t("common.dashboard"), href: "/dashboard" },
          { label: t("patients.title") },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t("patients.title")}</h1>
        <Link
          href="/dashboard/patients/new"
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto"
        >
          <PlusIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{t("patients.newPatient")}</span>
          <span className="sm:hidden">{t("common.create")}</span>
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder={t("patients.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="block w-full pl-9 sm:pl-10 pr-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Tabla de pacientes */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t("patients.loading")}</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <EmptyState
            title={search ? t("patients.noResults") : t("patients.noPatients")}
            message={
              search
                ? t("patients.noResultsMessage", { search })
                : t("patients.createFirst")
            }
            actionLabel={search ? undefined : t("patients.createFirstButton")}
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
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 px-3 sm:px-4 py-3 sm:py-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <Avatar
                          photoUrl={patient.photoUrl}
                          gender={patient.gender}
                          name={patient.name}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                            {patient.name}
                          </p>
                          <div className="mt-1.5 sm:mt-2 space-y-1 sm:space-y-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                                {patient.email && (
                                  <p className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                    <EmailIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                    <span className="truncate">{patient.email}</span>
                                  </p>
                                )}
                                <p className={`flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 ${patient.email ? 'sm:ml-4' : ''} truncate`}>
                                  <PhoneIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                  <span className="truncate">{patient.phone}</span>
                                </p>
                                {patient.dui && (
                                  <p className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 sm:ml-4 truncate">
                                    <IdCardIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                    <span className="truncate">{patient.dui}</span>
                                  </p>
                                )}
                            </div>
                              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                {patient._count && (
                                  <>
                                    <span className="flex items-center whitespace-nowrap">
                                      <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                      {patient._count.appointments} {t("patients.appointmentsCount")}
                                    </span>
                                    <span className="flex items-center whitespace-nowrap">
                                      <HospitalIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                      {patient._count.sessions} {t("patients.sessionsCount")}
                                    </span>
                                  </>
                                )}
                              </div>
                          </div>
                        </div>
                      </div>
                          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                router.push(`/dashboard/patients/${patient.id}/edit`);
                              }}
                              className="inline-flex items-center justify-center p-1.5 sm:p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                              title={t("patients.edit")}
                            >
                              <EditIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                              <span className="hidden sm:inline ml-1 text-xs sm:text-sm font-medium">{t("patients.edit")}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteClick(patient.id, patient.name);
                              }}
                              className="inline-flex items-center justify-center p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title={t("patients.delete")}
                            >
                              <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                              <span className="hidden sm:inline ml-1 text-xs sm:text-sm font-medium">{t("patients.delete")}</span>
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
                {t("patients.showing")} {((pagination.page - 1) * pagination.limit) + 1} {t("patients.to")}{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                {t("patients.of")} {pagination.total} {t("patients.title").toLowerCase()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("patients.previous")}
                </button>
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("patients.next")}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
