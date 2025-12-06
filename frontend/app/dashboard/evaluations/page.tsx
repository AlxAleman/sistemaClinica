"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { evaluationService, Evaluation } from "@/services/evaluationService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import { PlusIcon, ClipboardIcon, CalendarIcon, EditIcon, TrashIcon, UsersIcon } from "@/components/Icons";
import { useTranslation } from "@/hooks/useTranslation";

export default function EvaluationsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: "",
  });

  useEffect(() => {
    fetchEvaluations();
  }, [pagination.page]);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const response = await evaluationService.getAll({
        page: pagination.page,
        limit: pagination.limit,
      });
      setEvaluations(response.evaluations);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error("Error al cargar evaluaciones");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const handleDeleteConfirm = async () => {
    try {
      await evaluationService.delete(deleteConfirm.id);
      toast.success("Evaluación eliminada exitosamente");
      setDeleteConfirm({ isOpen: false, id: "" });
      fetchEvaluations();
    } catch (error: any) {
      toast.error("Error al eliminar evaluación");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "INITIAL":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "PROGRESS":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "FINAL":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "INITIAL":
        return t("evaluations.initial");
      case "PROGRESS":
        return t("evaluations.progress");
      case "FINAL":
        return t("evaluations.final");
      default:
        return type;
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: t("common.dashboard"), href: "/dashboard" },
          { label: t("evaluations.title") },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("evaluations.title")}</h1>
        <Link
          href="/dashboard/evaluations/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          {t("evaluations.newEvaluation")}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t("evaluations.loading")}</p>
        </div>
      ) : evaluations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <EmptyState
            title={t("evaluations.noEvaluations")}
            message={t("evaluations.createFirst")}
            actionLabel={t("evaluations.createFirstButton")}
            actionHref="/dashboard/evaluations/new"
            icon={<ClipboardIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />}
          />
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md transition-colors">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {evaluations.map((evaluation) => (
                <li key={evaluation.id}>
                  <Link
                    href={`/dashboard/evaluations/${evaluation.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 px-4 py-4 sm:px-6 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {evaluation.patient?.name || t("evaluations.unknownPatient")}
                          </p>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                              evaluation.evaluationType
                            )}`}
                          >
                            {getTypeText(evaluation.evaluationType)}
                          </span>
                          {evaluation.painLevel !== null && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              {t("evaluations.pain")}: {evaluation.painLevel}/10
                            </span>
                          )}
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <CalendarIcon className="h-4 w-4 mr-1" />{" "}
                              {moment(evaluation.evaluationDate).format("DD/MM/YYYY")}
                            </p>
                            {evaluation.rangeOfMotion && (
                              <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                                📏 Rango: {evaluation.rangeOfMotion}
                              </p>
                            )}
                            {evaluation.strength && (
                              <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                                💪 Fuerza: {evaluation.strength}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/dashboard/evaluations/${evaluation.id}/edit`);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteClick(evaluation.id);
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
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
            <div className="flex justify-center mt-6">
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: i + 1 }))
                    }
                    className={`${
                      pagination.page === i + 1
                        ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    } relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={handleDeleteConfirm}
        title={t("evaluations.deleteTitle")}
        message={t("evaluations.deleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        type="danger"
      />
    </div>
  );
}

