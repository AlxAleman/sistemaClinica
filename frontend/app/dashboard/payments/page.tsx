"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  paymentService,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentSummary,
} from "@/services/paymentService";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  POS: "POS",
  TRANSFER: "Transferencia",
};

const METHOD_COLORS: Record<PaymentMethod, string> = {
  CASH: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  POS: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
  TRANSFER: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  COMPLETED: "Completado",
  PENDING: "Pendiente",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<PaymentStatus, string> = {
  COMPLETED: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
  CANCELLED: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
};

export default function PaymentsPage() {
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | "">("");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 0,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    amount: number;
  }>({ isOpen: false, id: "", amount: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, search, filterMethod, filterStatus, startDate, endDate]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getAll({
        search: search || undefined,
        method: filterMethod || undefined,
        status: filterStatus || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setPayments(response.payments);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error("Error al cargar los pagos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];
      const data = await paymentService.getSummary({
        startDate: firstDay,
        endDate: lastDay,
      });
      setSummary(data);
    } catch (error: any) {
      console.error("Error al cargar resumen:", error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleDeleteClick = (id: string, amount: number) => {
    setDeleteConfirm({ isOpen: true, id, amount });
  };

  const handleDeleteConfirm = async () => {
    try {
      await paymentService.delete(deleteConfirm.id);
      toast.success("Pago eliminado correctamente");
      setDeleteConfirm({ isOpen: false, id: "", amount: 0 });
      fetchPayments();
      fetchSummary();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al eliminar el pago");
    }
  };

  const formatCurrency = (amount: number) =>
    `$${amount.toFixed(2)}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-SV", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pagos" },
        ]}
      />

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Pagos
        </h1>
        <Link
          href="/dashboard/payments/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors w-full sm:w-auto"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Registrar Pago
        </Link>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Total ingresos del mes
          </p>
          {summaryLoading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(summary?.totalAmount ?? 0)}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {summary?.totalCount ?? 0} pagos registrados
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Por método de pago
          </p>
          {summaryLoading ? (
            <div className="space-y-1 mt-1">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ) : (
            <div className="space-y-1 mt-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium text-green-600 dark:text-green-400">Efectivo:</span>{" "}
                {formatCurrency(summary?.byMethod.CASH ?? 0)}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium text-blue-600 dark:text-blue-400">POS:</span>{" "}
                {formatCurrency(summary?.byMethod.POS ?? 0)}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium text-purple-600 dark:text-purple-400">Transferencia:</span>{" "}
                {formatCurrency(summary?.byMethod.TRANSFER ?? 0)}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Pagos pendientes
          </p>
          {summaryLoading ? (
            <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {summary?.pendingCount ?? 0}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            En espera de confirmación
          </p>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar paciente
            </label>
            <input
              type="text"
              placeholder="Nombre del paciente..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Método de pago
            </label>
            <select
              value={filterMethod}
              onChange={(e) => {
                setFilterMethod(e.target.value as PaymentMethod | "");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="">Todos</option>
              <option value="CASH">Efectivo</option>
              <option value="POS">POS</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as PaymentStatus | "");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="">Todos</option>
              <option value="COMPLETED">Completado</option>
              <option value="PENDING">Pendiente</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de pagos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando pagos...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
          <svg
            className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            No hay pagos registrados
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Registra el primer pago haciendo clic en &quot;Registrar Pago&quot;
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        <div className="font-medium truncate max-w-[180px]">
                          {payment.patient?.name ?? "—"}
                        </div>
                        {payment.treatmentPlan && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                            {payment.treatmentPlan.title}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${METHOD_COLORS[payment.method]}`}
                        >
                          {METHOD_LABELS[payment.method]}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[payment.status]}`}
                        >
                          {STATUS_LABELS[payment.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/payments/${payment.id}/edit`
                              )
                            }
                            className="inline-flex items-center p-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                            title="Editar"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteClick(payment.id, payment.amount)
                            }
                            className="inline-flex items-center p-1.5 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Eliminar"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando{" "}
                {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{" "}
                de {pagination.total} pagos
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: "", amount: 0 })}
        onConfirm={handleDeleteConfirm}
        title="Eliminar pago"
        message={`¿Estás seguro que deseas eliminar el pago de $${deleteConfirm.amount.toFixed(2)}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
