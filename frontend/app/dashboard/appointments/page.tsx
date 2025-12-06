"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { appointmentService, Appointment } from "@/services/appointmentService";
import { toast } from "react-hot-toast";
import Link from "next/link";
import AppointmentCalendar from "@/components/AppointmentCalendar";
import { View } from "react-big-calendar";
import moment from "moment";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import { PlusIcon, CalendarIcon, HospitalIcon, EditIcon, TrashIcon } from "@/components/Icons";
import { useTranslation } from "@/hooks/useTranslation";

export default function AppointmentsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
  }>({ isOpen: false, id: "" });
  
  // Estado del calendario para restaurar vista
  const [calendarView, setCalendarView] = useState<View>("month");
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchAppointments();
    
    // Restaurar vista del calendario desde query params
    const viewParam = searchParams.get("view");
    const dateParam = searchParams.get("date");
    
    if (viewParam && (viewParam === "month" || viewParam === "week" || viewParam === "day" || viewParam === "agenda")) {
      setCalendarView(viewParam as View);
    }
    
    if (dateParam) {
      const date = new Date(dateParam);
      if (!isNaN(date.getTime())) {
        setCalendarDate(date);
      }
    }
  }, [searchParams]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAll({
        limit: 1000, // Obtener todas las citas para el calendario
      });
      setAppointments(response.appointments);
    } catch (error: any) {
      toast.error("Error al cargar citas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    // Redirigir a crear nueva cita con la fecha seleccionada
    const dateStr = slotInfo.start.toISOString();
    router.push(`/dashboard/appointments/new?date=${encodeURIComponent(dateStr)}`);
  };

  const handleSelectEvent = (appointment: Appointment) => {
    // Guardar el estado actual del calendario en la URL
    const currentView = calendarView;
    const currentDate = calendarDate.toISOString();
    router.push(`/dashboard/appointments/${appointment.id}?returnView=${currentView}&returnDate=${encodeURIComponent(currentDate)}`);
  };
  
  const handleCalendarViewChange = (view: View) => {
    setCalendarView(view);
    // Actualizar URL sin recargar
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`/dashboard/appointments?${params.toString()}`, { scroll: false });
  };
  
  const handleCalendarDateChange = (date: Date) => {
    setCalendarDate(date);
    // Actualizar URL sin recargar
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", date.toISOString());
    router.push(`/dashboard/appointments?${params.toString()}`, { scroll: false });
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const handleDeleteConfirm = async () => {
    try {
      await appointmentService.delete(deleteConfirm.id);
      toast.success("Cita eliminada exitosamente");
      setDeleteConfirm({ isOpen: false, id: "" });
      fetchAppointments();
    } catch (error: any) {
      toast.error("Error al eliminar cita");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "NO_SHOW":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return t("appointments.scheduled");
      case "CONFIRMED":
        return t("appointments.confirmed");
      case "COMPLETED":
        return t("appointments.completed");
      case "CANCELLED":
        return t("appointments.cancelled");
      case "NO_SHOW":
        return t("appointments.noShowText");
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("appointments.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Breadcrumbs
        items={[
          { label: t("common.dashboard"), href: "/dashboard" },
          { label: t("appointments.title") },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("appointments.title")}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView(view === "calendar" ? "list" : "calendar")}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {view === "calendar" ? t("appointments.viewList") : t("appointments.viewCalendar")}
          </button>
          <Link
            href="/dashboard/appointments/new"
            className="inline-flex items-center gap-2 bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            {t("appointments.newAppointment")}
          </Link>
        </div>
      </div>

      {view === "calendar" ? (
        <AppointmentCalendar
          appointments={appointments}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          defaultView={calendarView}
          defaultDate={calendarDate}
          onViewChange={handleCalendarViewChange}
          onNavigate={handleCalendarDateChange}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md transition-colors">
          {appointments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <EmptyState
                title={t("appointments.noAppointments")}
                message={t("appointments.createFirst")}
                actionLabel={t("appointments.createFirstButton")}
                actionHref="/dashboard/appointments/new"
                icon={<CalendarIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />}
              />
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {appointments.map((appointment) => (
                <li key={appointment.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {appointment.patient?.name || t("appointments.unknownPatient")}
                        </p>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status === "SCHEDULED" ? t("appointments.scheduled") : appointment.status === "CONFIRMED" ? t("appointments.confirmed") : appointment.status === "COMPLETED" ? t("appointments.completed") : appointment.status === "CANCELLED" ? t("appointments.cancelled") : t("appointments.noShowText")}
                        </span>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            👨‍⚕️ {appointment.therapist?.name || "Terapeuta desconocido"}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                            📅 {new Date(appointment.appointmentDate).toLocaleString("es-ES")}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                            ⏱️ {appointment.duration} min
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          // Guardar el estado actual del calendario en la URL
                          const currentView = calendarView;
                          const currentDate = calendarDate.toISOString();
                          router.push(`/dashboard/appointments/${appointment.id}?returnView=${currentView}&returnDate=${encodeURIComponent(currentDate)}`);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
                      >
                        {t("appointments.view")}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(appointment.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-sm font-medium transition-colors"
                      >
                        {t("appointments.delete")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: "" })}
        onConfirm={handleDeleteConfirm}
        title={t("appointments.deleteTitle")}
        message={t("appointments.deleteMessage")}
        confirmText={t("appointments.delete")}
        cancelText={t("common.cancel")}
        type="danger"
      />
    </div>
  );
}

