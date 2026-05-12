"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { configService, SystemConfig } from "@/services/configService";
import Breadcrumbs from "@/components/Breadcrumbs";
import ConfirmDialog from "@/components/ConfirmDialog";

interface ScheduleFields {
  morning_shift_start: string;
  morning_shift_end: string;
  afternoon_shift_start: string;
  afternoon_shift_end: string;
  morning_therapists_count: string;
  afternoon_therapists_count: string;
}

interface SessionFields {
  default_session_duration: string;
}

export default function ConfigPage() {
  const [loading, setLoading] = useState(true);

  // Tipos de terapia
  const [therapyTypes, setTherapyTypes] = useState<string[]>([]);
  const [editingTherapy, setEditingTherapy] = useState(false);
  const [therapyDraft, setTherapyDraft] = useState("");
  const [savingTherapy, setSavingTherapy] = useState(false);

  // Horarios
  const [scheduleFields, setScheduleFields] = useState<ScheduleFields>({
    morning_shift_start: "",
    morning_shift_end: "",
    afternoon_shift_start: "",
    afternoon_shift_end: "",
    morning_therapists_count: "",
    afternoon_therapists_count: "",
  });
  const [savingSchedules, setSavingSchedules] = useState(false);

  // Sesiones
  const [sessionFields, setSessionFields] = useState<SessionFields>({
    default_session_duration: "",
  });
  const [savingSessions, setSavingSessions] = useState(false);

  // Restaurar defaults
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [restoringDefaults, setRestoringDefaults] = useState(false);

  useEffect(() => {
    fetchAllConfigs();
  }, []);

  const fetchAllConfigs = async () => {
    try {
      setLoading(true);
      const allConfigs = await configService.getAll();
      applyConfigs(allConfigs);
    } catch (error: any) {
      toast.error("Error al cargar la configuración");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyConfigs = (configs: SystemConfig[]) => {
    const findValue = (key: string, fallback = "") => {
      const cfg = configs.find((c) => c.key === key);
      return cfg ? cfg.value : fallback;
    };

    // Tipos de terapia
    const rawTherapy = findValue("therapy_types", "[]");
    try {
      const parsed = JSON.parse(rawTherapy);
      if (Array.isArray(parsed)) {
        setTherapyTypes(parsed as string[]);
        setTherapyDraft(parsed.join(", "));
      }
    } catch {
      setTherapyTypes([]);
      setTherapyDraft("");
    }

    // Horarios
    setScheduleFields({
      morning_shift_start: findValue("morning_shift_start", "08:00"),
      morning_shift_end: findValue("morning_shift_end", "12:00"),
      afternoon_shift_start: findValue("afternoon_shift_start", "13:00"),
      afternoon_shift_end: findValue("afternoon_shift_end", "17:00"),
      morning_therapists_count: findValue("morning_therapists_count", "3"),
      afternoon_therapists_count: findValue("afternoon_therapists_count", "3"),
    });

    // Sesiones
    setSessionFields({
      default_session_duration: findValue("default_session_duration", "60"),
    });
  };

  const handleSaveTherapyTypes = async () => {
    const types = therapyDraft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setSavingTherapy(true);
    try {
      await configService.upsert("therapy_types", {
        value: JSON.stringify(types),
        description: "Lista de tipos de terapia disponibles",
        category: "therapy_types",
      });
      setTherapyTypes(types);
      setEditingTherapy(false);
      toast.success("Tipos de terapia actualizados");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Error al guardar tipos de terapia"
      );
    } finally {
      setSavingTherapy(false);
    }
  };

  const handleSaveSchedules = async () => {
    setSavingSchedules(true);
    try {
      await Promise.all([
        configService.upsert("morning_shift_start", {
          value: scheduleFields.morning_shift_start,
          description: "Inicio del turno de mañana",
          category: "schedules",
        }),
        configService.upsert("morning_shift_end", {
          value: scheduleFields.morning_shift_end,
          description: "Fin del turno de mañana",
          category: "schedules",
        }),
        configService.upsert("afternoon_shift_start", {
          value: scheduleFields.afternoon_shift_start,
          description: "Inicio del turno de tarde",
          category: "schedules",
        }),
        configService.upsert("afternoon_shift_end", {
          value: scheduleFields.afternoon_shift_end,
          description: "Fin del turno de tarde",
          category: "schedules",
        }),
        configService.upsert("morning_therapists_count", {
          value: scheduleFields.morning_therapists_count,
          description: "Cantidad de terapeutas en turno de mañana",
          category: "schedules",
        }),
        configService.upsert("afternoon_therapists_count", {
          value: scheduleFields.afternoon_therapists_count,
          description: "Cantidad de terapeutas en turno de tarde",
          category: "schedules",
        }),
      ]);
      toast.success("Horarios guardados correctamente");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Error al guardar horarios"
      );
    } finally {
      setSavingSchedules(false);
    }
  };

  const handleSaveSessions = async () => {
    const duration = parseInt(sessionFields.default_session_duration, 10);
    if (isNaN(duration) || duration <= 0) {
      toast.error("La duración debe ser un número positivo");
      return;
    }

    setSavingSessions(true);
    try {
      await configService.upsert("default_session_duration", {
        value: String(duration),
        description: "Duración predeterminada de sesión en minutos",
        category: "session_durations",
      });
      toast.success("Configuración de sesiones guardada");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Error al guardar configuración de sesiones"
      );
    } finally {
      setSavingSessions(false);
    }
  };

  const handleRestoreDefaults = async () => {
    setRestoringDefaults(true);
    try {
      await configService.initDefaults();
      await fetchAllConfigs();
      toast.success("Valores predeterminados restaurados");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Error al restaurar valores predeterminados"
      );
    } finally {
      setRestoringDefaults(false);
      setRestoreDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Configuración" },
          ]}
        />
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando configuración...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Configuración" },
        ]}
      />

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Configuración del Sistema
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Administra los parámetros globales de la clínica
          </p>
        </div>
        <button
          onClick={() => setRestoreDialog(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors w-full sm:w-auto"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Restaurar valores predeterminados
        </button>
      </div>

      <div className="space-y-6">
        {/* Sección: Tipos de Terapia */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Tipos de Terapia
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Lista de tipos de terapia disponibles en el sistema
              </p>
            </div>
            {!editingTherapy && (
              <button
                onClick={() => {
                  setTherapyDraft(therapyTypes.join(", "));
                  setEditingTherapy(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Editar lista
              </button>
            )}
          </div>

          {!editingTherapy ? (
            <div>
              {therapyTypes.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No hay tipos de terapia configurados
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {therapyTypes.map((type, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipos de terapia (separados por coma)
              </label>
              <textarea
                rows={4}
                value={therapyDraft}
                onChange={(e) => setTherapyDraft(e.target.value)}
                placeholder="Fisioterapia, Hidroterapia, Terapia Ocupacional, ..."
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Ingresa cada tipo de terapia separado por coma. Ej:{" "}
                <span className="font-mono">
                  Fisioterapia, Hidroterapia, Electroterapia
                </span>
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleSaveTherapyTypes}
                  disabled={savingTherapy}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingTherapy ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={() => {
                    setEditingTherapy(false);
                    setTherapyDraft(therapyTypes.join(", "));
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sección: Horarios */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Horarios
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Configura los turnos y la disponibilidad de terapeutas
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Turno mañana */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Turno Mañana
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  value={scheduleFields.morning_shift_start}
                  onChange={(e) =>
                    setScheduleFields({
                      ...scheduleFields,
                      morning_shift_start: e.target.value,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hora de fin
                </label>
                <input
                  type="time"
                  value={scheduleFields.morning_shift_end}
                  onChange={(e) =>
                    setScheduleFields({
                      ...scheduleFields,
                      morning_shift_end: e.target.value,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad de terapeutas
                </label>
                <input
                  type="number"
                  min="1"
                  value={scheduleFields.morning_therapists_count}
                  onChange={(e) =>
                    setScheduleFields({
                      ...scheduleFields,
                      morning_therapists_count: e.target.value,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
            </div>

            {/* Turno tarde */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Turno Tarde
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  value={scheduleFields.afternoon_shift_start}
                  onChange={(e) =>
                    setScheduleFields({
                      ...scheduleFields,
                      afternoon_shift_start: e.target.value,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hora de fin
                </label>
                <input
                  type="time"
                  value={scheduleFields.afternoon_shift_end}
                  onChange={(e) =>
                    setScheduleFields({
                      ...scheduleFields,
                      afternoon_shift_end: e.target.value,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad de terapeutas
                </label>
                <input
                  type="number"
                  min="1"
                  value={scheduleFields.afternoon_therapists_count}
                  onChange={(e) =>
                    setScheduleFields({
                      ...scheduleFields,
                      afternoon_therapists_count: e.target.value,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={handleSaveSchedules}
              disabled={savingSchedules}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingSchedules ? "Guardando..." : "Guardar horarios"}
            </button>
          </div>
        </div>

        {/* Sección: Sesiones */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Sesiones
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Parámetros predeterminados para las sesiones de terapia
            </p>
          </div>

          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duración predeterminada (minutos)
            </label>
            <input
              type="number"
              min="1"
              value={sessionFields.default_session_duration}
              onChange={(e) =>
                setSessionFields({
                  ...sessionFields,
                  default_session_duration: e.target.value,
                })
              }
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Duración en minutos que se asigna por defecto a nuevas sesiones
            </p>
          </div>

          <div className="mt-5">
            <button
              onClick={handleSaveSessions}
              disabled={savingSessions}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingSessions ? "Guardando..." : "Guardar configuración"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={restoreDialog}
        onClose={() => setRestoreDialog(false)}
        onConfirm={handleRestoreDefaults}
        title="Restaurar valores predeterminados"
        message="¿Estás seguro que deseas restaurar todos los valores de configuración a sus valores predeterminados? Esta acción sobreescribirá la configuración actual."
        confirmText={restoringDefaults ? "Restaurando..." : "Restaurar"}
        cancelText="Cancelar"
        type="warning"
      />
    </div>
  );
}
