"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { patientService, Patient } from "@/services/patientService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { SearchIcon, EditIcon, TrashIcon, HospitalIcon, ClipboardIcon, PhoneIcon, EmailIcon, IdCardIcon, PlusIcon, UsersIcon } from "@/components/Icons";
import { useTranslation } from "@/hooks/useTranslation";

type SortOption = "apellido-asc" | "apellido-desc" | "nombre-asc" | "nombre-desc" | "reciente" | "antiguo";
type GenderFilter = "" | "MALE" | "FEMALE";
type StatusFilter = "" | "true" | "false";

const SORT_LABELS: Record<SortOption, string> = {
  "apellido-asc":  "Apellido A → Z",
  "apellido-desc": "Apellido Z → A",
  "nombre-asc":    "Nombre A → Z",
  "nombre-desc":   "Nombre Z → A",
  "reciente":      "Más recientes",
  "antiguo":       "Más antiguos",
};

const GENDER_LABELS: { value: GenderFilter; label: string }[] = [
  { value: "",       label: "Todos" },
  { value: "MALE",   label: "Masculino" },
  { value: "FEMALE", label: "Femenino" },
];

const STATUS_LABELS: { value: StatusFilter; label: string }[] = [
  { value: "",      label: "Todos" },
  { value: "true",  label: "Activos" },
  { value: "false", label: "Inactivos" },
];

function getLastName(fullName: string): string {
  return fullName.trim().split(/\s+/).pop()?.toLowerCase() ?? "";
}

function sortByLastName(patients: Patient[], order: "asc" | "desc"): Patient[] {
  return [...patients].sort((a, b) => {
    const cmp = getLastName(a.name).localeCompare(getLastName(b.name), "es");
    return order === "asc" ? cmp : -cmp;
  });
}

export default function PatientsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState<SortOption>("apellido-asc");
  const [gender, setGender] = useState<GenderFilter>("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
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
  }, [pagination.page, search, sort, gender, status]);

  const fetchPatients = async () => {
    try {
      setLoading(true);

      const isDateSort = sort === "reciente" || sort === "antiguo";
      const backendSortBy: "name" | "createdAt" = isDateSort ? "createdAt" : "name";
      const backendSortOrder: "asc" | "desc" = sort === "antiguo" ? "asc" : "desc";

      const response = await patientService.getAll({
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
        gender: gender || undefined,
        isActive: status === "" ? undefined : status === "true",
        sortBy: backendSortBy,
        sortOrder: isDateSort ? backendSortOrder : "asc",
      });

      let sorted = response.patients;
      if (sort === "apellido-asc" || sort === "apellido-desc") {
        sorted = sortByLastName(response.patients, sort === "apellido-asc" ? "asc" : "desc");
      } else if (sort === "nombre-asc" || sort === "nombre-desc") {
        sorted = [...response.patients].sort((a, b) => {
          const cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase(), "es");
          return sort === "nombre-asc" ? cmp : -cmp;
        });
      }

      setPatients(sorted);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error(t("messages.errorLoadingPatients"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setGender("");
    setStatus("");
    setSort("apellido-asc");
    setSearchInput("");
  };

  const hasActiveFilters = gender !== "" || status !== "" || sort !== "apellido-asc" || search !== "";

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
          <span>{t("patients.newPatient")}</span>
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="mb-3 sm:mb-4">
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

      {/* Filtros */}
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Ordenar */}
        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setShowSortMenu((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            {SORT_LABELS[sort]}
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showSortMenu && (
            <div className="absolute z-20 mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg">
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setSort(opt); setShowSortMenu(false); setPagination((p) => ({ ...p, page: 1 })); }}
                  className={`w-full text-left px-3 py-2 text-xs sm:text-sm transition-colors ${
                    sort === opt
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {SORT_LABELS[opt]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Género */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/60 rounded-md p-0.5">
          {GENDER_LABELS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setGender(value); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                gender === value
                  ? "bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Estado */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/60 rounded-md p-0.5">
          {STATUS_LABELS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setStatus(value); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                status === value
                  ? "bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar
          </button>
        )}

        {/* Contador */}
        {!loading && (
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {pagination.total} paciente{pagination.total !== 1 ? "s" : ""}
          </span>
        )}
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
                                      <HospitalIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                      {patient._count.sessions} {t("patients.sessionsCount")}
                                    </span>
                                    <span className="flex items-center whitespace-nowrap">
                                      <ClipboardIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                      {patient._count.evaluations ?? 0} evaluaciones
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
