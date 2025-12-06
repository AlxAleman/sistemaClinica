"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { treatmentPlanService, TreatmentPlan } from "@/services/treatmentPlanService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import { PlusIcon, FileTextIcon, CalendarIcon, EditIcon, TrashIcon, CheckIcon } from "@/components/Icons";
import { useTranslation } from "@/hooks/useTranslation";

export default function TreatmentPlansPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
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
    fetchPlans();
  }, [pagination.page]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await treatmentPlanService.getAll({
        page: pagination.page,
        limit: pagination.limit,
      });
      setPlans(response.treatmentPlans);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error(t("messages.errorLoadingPlans"));
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
      await treatmentPlanService.delete(deleteConfirm.id);
      toast.success(t("messages.planDeleted"));
      setDeleteConfirm({ isOpen: false, id: "" });
      fetchPlans();
    } catch (error: any) {
      toast.error(t("messages.errorDeleting") + " " + t("treatmentPlans.title").toLowerCase());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "DRAFT":
        return t("treatmentPlans.draft");
      case "PENDING_APPROVAL":
        return t("treatmentPlans.pendingApproval");
      case "APPROVED":
        return t("treatmentPlans.approved");
      case "IN_PROGRESS":
        return t("treatmentPlans.inProgress");
      case "COMPLETED":
        return t("treatmentPlans.completed");
      case "CANCELLED":
        return t("treatmentPlans.cancelled");
      default:
        return status;
    }
  };

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6">
      <Breadcrumbs
        items={[
          { label: t("common.dashboard"), href: "/dashboard" },
          { label: t("treatmentPlans.title") },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t("treatmentPlans.title")}</h1>
        <Link
          href="/dashboard/treatment-plans/new"
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto"
        >
          <PlusIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{t("treatmentPlans.newPlan")}</span>
          <span className="sm:hidden">{t("common.create")}</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t("treatmentPlans.loading")}</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <EmptyState
            title={t("treatmentPlans.noPlans")}
            message={t("treatmentPlans.createFirst")}
            actionLabel={t("treatmentPlans.createFirstButton")}
            actionHref="/dashboard/treatment-plans/new"
            icon={<FileTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />}
          />
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md transition-colors">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {plans.map((plan) => (
                <li key={plan.id}>
                  <Link
                    href={`/dashboard/treatment-plans/${plan.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 px-3 sm:px-4 py-3 sm:py-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <p className="text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                            {plan.title}
                          </p>
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full flex-shrink-0 ${getStatusColor(
                              plan.status
                            )}`}
                          >
                            {getStatusText(plan.status)}
                          </span>
                          {plan.approvedByPatient && (
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex-shrink-0">
                              ✓ Aprobado
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 sm:mt-2 space-y-1 sm:space-y-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-0">
                            <p className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                              <span className="truncate">{plan.patient?.name || t("treatmentPlans.unknownPatient")}</span>
                            </p>
                            <p className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 sm:ml-4 whitespace-nowrap">
                              <span className="mr-1">📋</span>
                              {plan.sessionsCompleted}/{plan.sessionsPlanned} {t("treatmentPlans.sessions")}
                            </p>
                            {plan.totalCost && (
                              <p className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 sm:ml-4 whitespace-nowrap">
                                <span className="mr-1">💰</span>
                                ${plan.totalCost.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                        {plan.description && (
                          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {plan.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/dashboard/treatment-plans/${plan.id}/edit`);
                          }}
                          className="inline-flex items-center justify-center p-1.5 sm:p-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                          title={t("common.edit")}
                        >
                          <EditIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteClick(plan.id);
                          }}
                          className="inline-flex items-center justify-center p-1.5 sm:p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title={t("common.delete")}
                        >
                          <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
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
        title={t("treatmentPlans.deleteTitle")}
        message={t("treatmentPlans.deleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        type="danger"
      />
    </div>
  );
}

