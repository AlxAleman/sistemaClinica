"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTranslation } from "@/hooks/useTranslation";
import { configService } from "@/services/configService";

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
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [clinicName, setClinicName] = useState("Clínica Gestor");
  const [clinicLogo, setClinicLogo] = useState("");

  useEffect(() => {
    configService.getAll("clinic").then(configs => {
      const v = (key: string) => configs.find(c => c.key === key)?.value ?? "";
      const name = v("clinic_name");
      const logo = v("clinic_logo_url");
      if (name) setClinicName(name);
      if (logo) setClinicLogo(logo);
    }).catch(() => {});
  }, []);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (settingsMenuOpen && !target.closest('.settings-menu-container')) {
        setSettingsMenuOpen(false);
      }
      if (moreMenuOpen && !target.closest('.more-menu-container')) {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsMenuOpen, moreMenuOpen]);

  // Determinar qué enlace está activo
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(path);
  };

  useEffect(() => {
    const checkAuth = setTimeout(() => {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.mustChangePassword) {
        router.replace("/cambiar-password");
      }
    }, 100);

    return () => clearTimeout(checkAuth);
  }, [isAuthenticated, user, router]);

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
      <nav className="bg-white dark:bg-gray-800 shadow-sm transition-colors sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  {clinicLogo
                    ? <Image src={clinicLogo} alt="Logo" width={32} height={32} className="h-8 w-8 object-contain rounded-md" unoptimized />
                    : <span className="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg">🏥</span>
                  }
                  <span className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[140px] sm:max-w-[200px]">
                    {clinicName}
                  </span>
                </Link>
              </div>
              {/* Menú desktop */}
              <div className="hidden md:ml-4 lg:ml-6 md:flex md:items-center md:space-x-1 lg:space-x-2">
                {/* Ítems principales */}
                {[
                  { href: "/dashboard", label: t("common.dashboard") },
                  { href: "/dashboard/patients", label: t("common.patients") },
                  { href: "/dashboard/expedientes", label: "Expedientes" },
                  { href: "/dashboard/appointments", label: t("common.appointments") },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${
                      isActive(item.href)
                        ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                    } inline-flex items-center px-2 xl:px-3 pt-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap`}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Dropdown "Más" */}
                <div className="relative more-menu-container h-full flex items-center">
                  <button
                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    className={`${
                      ["/dashboard/reports", "/dashboard/payments", "/dashboard/prescriptions", "/dashboard/personal"].some(p => pathname.startsWith(p))
                        ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                    } inline-flex items-center gap-1 px-2 xl:px-3 pt-1 pb-0 border-b-2 text-sm font-medium transition-colors whitespace-nowrap h-full`}
                  >
                    Más
                    <svg className={`h-4 w-4 transition-transform ${moreMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {moreMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-52 rounded-xl shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 z-50 py-1">
                      {[
                        { href: "/dashboard/personal", label: "Personal" },
                        { href: "/dashboard/reports", label: t("common.reports") || "Reportes" },
                        { href: "/dashboard/payments", label: "Pagos" },
                        { href: "/dashboard/prescriptions", label: t("common.prescriptions") || "Recetas" },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreMenuOpen(false)}
                          className={`${
                            pathname.startsWith(item.href)
                              ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          } block px-4 py-2 text-sm transition-colors`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Controles derecho - Desktop */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 xl:gap-4">
              <span className="hidden lg:inline text-xs xl:text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px] xl:max-w-none">
                {user?.name} ({user?.role})
              </span>
              {/* Menú de opciones */}
              <div className="relative settings-menu-container">
                <button
                  onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
                  aria-expanded="false"
                  aria-label="Opciones"
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
                {settingsMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t("common.settings")}
                        </p>
                      </div>
                      <div className="px-4 py-3 space-y-3 border-b border-gray-200 dark:border-gray-700">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("common.language") || "Idioma"}
                          </label>
                          <LanguageToggle />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("common.theme") || "Tema"}
                          </label>
                          <ThemeToggle />
                        </div>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/dashboard/config"
                          onClick={() => setSettingsMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          role="menuitem"
                        >
                          Configuración
                        </Link>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSettingsMenuOpen(false);
                            logout();
                            router.push("/login");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          role="menuitem"
                        >
                          {t("common.logout")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Controles derecho - Mobile */}
            <div className="flex md:hidden items-center gap-2">
              {/* Menú de opciones móvil */}
              <div className="relative settings-menu-container">
                <button
                  onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
                  aria-expanded="false"
                  aria-label="Opciones"
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
                {settingsMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t("common.settings")}
                        </p>
                      </div>
                      <div className="px-4 py-3 space-y-3 border-b border-gray-200 dark:border-gray-700">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("common.language") || "Idioma"}
                          </label>
                          <LanguageToggle />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("common.theme") || "Tema"}
                          </label>
                          <ThemeToggle />
                        </div>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/dashboard/config"
                          onClick={() => setSettingsMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          role="menuitem"
                        >
                          Configuración
                        </Link>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSettingsMenuOpen(false);
                            logout();
                            router.push("/login");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          role="menuitem"
                        >
                          {t("common.logout")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
              {[
                { href: "/dashboard", label: t("common.dashboard") },
                { href: "/dashboard/patients", label: t("common.patients") },
                { href: "/dashboard/expedientes", label: "Expedientes" },
                { href: "/dashboard/appointments", label: t("common.appointments") },
                { href: "/dashboard/reports", label: t("common.reports") || "Reportes" },
                { href: "/dashboard/payments", label: "Pagos" },
                { href: "/dashboard/prescriptions", label: t("common.prescriptions") || "Recetas" },
                { href: "/dashboard/config", label: "Configuración" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${
                    isActive(item.href)
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  } block px-3 py-2 rounded-md text-base font-medium`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                <div className="px-3">
                  <div className="text-base font-medium text-gray-800 dark:text-gray-200">{user?.name}</div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{user?.role}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}

