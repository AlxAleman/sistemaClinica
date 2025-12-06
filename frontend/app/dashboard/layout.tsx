"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTranslation } from "@/hooks/useTranslation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { t } = useTranslation();

  // Determinar qué enlace está activo
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(path);
  };

  useEffect(() => {
    // Esperar un momento para que el store se cargue desde localStorage
    const checkAuth = setTimeout(() => {
      if (!isAuthenticated) {
        router.push("/login");
      }
    }, 100);

    return () => clearTimeout(checkAuth);
  }, [isAuthenticated, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  Clínica Gestor
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-2 lg:space-x-4">
                <Link
                  href="/dashboard"
                  className={`${
                    isActive("/dashboard")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
                >
                  {t("common.dashboard")}
                </Link>
                <Link
                  href="/dashboard/patients"
                  className={`${
                    isActive("/dashboard/patients")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
                >
                  {t("common.patients")}
                </Link>
                <Link
                  href="/dashboard/appointments"
                  className={`${
                    isActive("/dashboard/appointments")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
                >
                  {t("common.appointments")}
                </Link>
                <Link
                  href="/dashboard/sessions"
                  className={`${
                    isActive("/dashboard/sessions")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
                >
                  {t("common.sessions")}
                </Link>
                <Link
                  href="/dashboard/treatment-plans"
                  className={`${
                    isActive("/dashboard/treatment-plans")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
                >
                  {t("common.treatmentPlans")}
                </Link>
                <Link
                  href="/dashboard/evaluations"
                  className={`${
                    isActive("/dashboard/evaluations")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
                >
                  {t("common.evaluations")}
                </Link>
                <Link
                  href="/dashboard/reports"
                  className={`${
                    isActive("/dashboard/reports")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
                >
                  {t("common.reports")}
                </Link>
                <Link
                  href="/dashboard/prescriptions"
                  className={`${
                    isActive("/dashboard/prescriptions")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 pt-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
                >
                  {t("common.prescriptions")}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
              <LanguageToggle />
              <ThemeToggle />
              <span className="hidden md:inline text-xs lg:text-sm text-gray-700 dark:text-gray-300 mr-2 lg:mr-4">
                {user?.name} ({user?.role})
              </span>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t("common.logout")}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}

