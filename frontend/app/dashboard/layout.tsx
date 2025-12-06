"use client";

import { useEffect, useState } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <div className="flex items-center flex-1">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  Clínica Gestor
                </h1>
              </div>
              {/* Menú desktop */}
              <div className="hidden md:ml-4 lg:ml-6 md:flex md:space-x-1 lg:space-x-2 xl:space-x-3 overflow-x-auto flex-nowrap">
                <Link
                  href="/dashboard"
                  className={`${
                    isActive("/dashboard")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 xl:px-3 pt-1 border-b-2 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0`}
                >
                  {t("common.dashboard")}
                </Link>
                <Link
                  href="/dashboard/patients"
                  className={`${
                    isActive("/dashboard/patients")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 xl:px-3 pt-1 border-b-2 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0`}
                >
                  {t("common.patients")}
                </Link>
                <Link
                  href="/dashboard/appointments"
                  className={`${
                    isActive("/dashboard/appointments")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 xl:px-3 pt-1 border-b-2 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0`}
                >
                  {t("common.appointments")}
                </Link>
                <Link
                  href="/dashboard/sessions"
                  className={`${
                    isActive("/dashboard/sessions")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 xl:px-3 pt-1 border-b-2 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0`}
                >
                  {t("common.sessions")}
                </Link>
                <Link
                  href="/dashboard/treatment-plans"
                  className={`${
                    isActive("/dashboard/treatment-plans")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 xl:px-3 pt-1 border-b-2 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0`}
                >
                  <span className="hidden lg:inline">{t("common.treatmentPlans")}</span>
                  <span className="lg:hidden">Planes</span>
                </Link>
                <Link
                  href="/dashboard/evaluations"
                  className={`${
                    isActive("/dashboard/evaluations")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 xl:px-3 pt-1 border-b-2 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0`}
                >
                  {t("common.evaluations")}
                </Link>
                <Link
                  href="/dashboard/reports"
                  className={`${
                    isActive("/dashboard/reports")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 xl:px-3 pt-1 border-b-2 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0`}
                >
                  {t("common.reports")}
                </Link>
                <Link
                  href="/dashboard/prescriptions"
                  className={`${
                    isActive("/dashboard/prescriptions")
                      ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 lg:px-2 xl:px-3 pt-1 border-b-2 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0`}
                >
                  {t("common.prescriptions")}
                </Link>
              </div>
            </div>
            {/* Controles derecho - Desktop */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 xl:gap-4">
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              <span className="hidden lg:inline text-xs xl:text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px] xl:max-w-none">
                {user?.name} ({user?.role})
              </span>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white px-3 xl:px-4 py-2 rounded-md text-xs xl:text-sm font-medium transition-colors whitespace-nowrap"
              >
                {t("common.logout")}
              </button>
            </div>
            {/* Controles derecho - Mobile */}
            <div className="flex md:hidden items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                aria-expanded="false"
              >
                <span className="sr-only">Abrir menú principal</span>
                {mobileMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Menú móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`${
                  isActive("/dashboard")
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                } block px-3 py-2 rounded-md text-base font-medium`}
              >
                {t("common.dashboard")}
              </Link>
              <Link
                href="/dashboard/patients"
                onClick={() => setMobileMenuOpen(false)}
                className={`${
                  isActive("/dashboard/patients")
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                } block px-3 py-2 rounded-md text-base font-medium`}
              >
                {t("common.patients")}
              </Link>
              <Link
                href="/dashboard/appointments"
                onClick={() => setMobileMenuOpen(false)}
                className={`${
                  isActive("/dashboard/appointments")
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                } block px-3 py-2 rounded-md text-base font-medium`}
              >
                {t("common.appointments")}
              </Link>
              <Link
                href="/dashboard/sessions"
                onClick={() => setMobileMenuOpen(false)}
                className={`${
                  isActive("/dashboard/sessions")
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                } block px-3 py-2 rounded-md text-base font-medium`}
              >
                {t("common.sessions")}
              </Link>
              <Link
                href="/dashboard/treatment-plans"
                onClick={() => setMobileMenuOpen(false)}
                className={`${
                  isActive("/dashboard/treatment-plans")
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                } block px-3 py-2 rounded-md text-base font-medium`}
              >
                {t("common.treatmentPlans")}
              </Link>
              <Link
                href="/dashboard/evaluations"
                onClick={() => setMobileMenuOpen(false)}
                className={`${
                  isActive("/dashboard/evaluations")
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                } block px-3 py-2 rounded-md text-base font-medium`}
              >
                {t("common.evaluations")}
              </Link>
              <Link
                href="/dashboard/reports"
                onClick={() => setMobileMenuOpen(false)}
                className={`${
                  isActive("/dashboard/reports")
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                } block px-3 py-2 rounded-md text-base font-medium`}
              >
                {t("common.reports")}
              </Link>
              <Link
                href="/dashboard/prescriptions"
                onClick={() => setMobileMenuOpen(false)}
                className={`${
                  isActive("/dashboard/prescriptions")
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                } block px-3 py-2 rounded-md text-base font-medium`}
              >
                {t("common.prescriptions")}
              </Link>
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                <div className="px-3 mb-3">
                  <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                    {user?.name}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {user?.role}
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {t("common.logout")}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}

