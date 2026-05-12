"use client";

import { useState, useMemo, useEffect } from "react";
import { Calendar, momentLocalizer, View, Event } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
// El inglés es el idioma por defecto de moment, no necesita import
import { Appointment } from "@/services/appointmentService";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguageStore } from "@/store/languageStore";

// Importar CSS del calendario
if (typeof window !== "undefined") {
  require("react-big-calendar/lib/css/react-big-calendar.css");
}

// El localizer se creará dinámicamente cuando cambie el idioma

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent?: (event: Appointment) => void;
  defaultDate?: Date;
  defaultView?: View;
  onViewChange?: (view: View) => void;
  onNavigate?: (date: Date) => void;
}

export default function AppointmentCalendar({
  appointments,
  onSelectSlot,
  onSelectEvent,
  defaultDate = new Date(),
  defaultView = "month",
  onViewChange,
  onNavigate,
}: AppointmentCalendarProps) {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [currentDate, setCurrentDate] = useState(defaultDate);
  const [currentView, setCurrentView] = useState<View>(defaultView);

  // Configurar locale de moment según el idioma seleccionado
  // SIEMPRE iniciar en domingo (dow: 0) independientemente del idioma
  useEffect(() => {
    if (language === "es") {
      moment.locale("es", {
        months: [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ],
        monthsShort: [
          "Ene", "Feb", "Mar", "Abr", "May", "Jun",
          "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
        ],
        weekdays: [
          "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
        ],
        weekdaysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
        week: {
          dow: 0, // SIEMPRE domingo es el primer día de la semana
        },
      });
    } else {
      moment.locale("en", {
        months: [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ],
        monthsShort: [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ],
        weekdays: [
          "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ],
        weekdaysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        week: {
          dow: 0, // SIEMPRE domingo es el primer día de la semana
        },
      });
    }
    // Forzar actualización del calendario
    setCurrentDate((prev) => new Date(prev.getTime()));
  }, [language]);

  // Crear localizer dinámicamente con el locale actual
  const localizer = useMemo(() => {
    // Asegurar que el locale esté configurado antes de crear el localizer
    if (language === "es") {
      moment.locale("es");
    } else {
      moment.locale("en");
    }
    return momentLocalizer(moment);
  }, [language]);

  // Actualizar cuando cambien los props
  useEffect(() => {
    setCurrentDate(defaultDate);
  }, [defaultDate]);

  useEffect(() => {
    setCurrentView(defaultView);
  }, [defaultView]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWeekRangePicker, setShowWeekRangePicker] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState<Date | null>(null);
  const [weekEndDate, setWeekEndDate] = useState<Date | null>(null);
  const [customRange, setCustomRange] = useState<Date[] | null>(null);

  // Convertir citas a eventos del calendario
  const events: Event[] = useMemo(() => {
    return appointments.map((appointment) => {
      const start = new Date(appointment.appointmentDate);
      const end = new Date(start.getTime() + appointment.duration * 60000);

      return {
        id: appointment.id,
        title: `${appointment.patient?.name || "Paciente"} - ${appointment.therapist?.name || "⚠ Sin terapeuta"}`,
        start,
        end,
        resource: appointment,
      };
    });
  }, [appointments]);

  // Colores según el estado de la cita
  const eventStyleGetter = (event: Event) => {
    const appointment = event.resource as Appointment;
    let backgroundColor = "#3174ad"; // Azul por defecto (SCHEDULED)

    // Unassigned appointments get amber regardless of status
    if (!appointment.therapistId) {
      backgroundColor = "#d97706"; // Amber
    } else {
      switch (appointment.status) {
        case "CONFIRMED":
          backgroundColor = "#28a745"; // Verde
          break;
        case "COMPLETED":
          backgroundColor = "#6c757d"; // Gris
          break;
        case "CANCELLED":
          backgroundColor = "#dc3545"; // Rojo
          break;
        case "NO_SHOW":
          backgroundColor = "#ffc107"; // Amarillo
          break;
        default:
          backgroundColor = "#3174ad"; // Azul
      }
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
    if (onNavigate) {
      onNavigate(newDate);
    }
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    // Resetear los selectores cuando cambia la vista
    setShowDatePicker(false);
    setShowWeekRangePicker(false);
    // Si cambia de vista, resetear el rango personalizado
    if (view !== "week") {
      setCustomRange(null);
      setWeekStartDate(null);
      setWeekEndDate(null);
    }
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const handleDateSelect = (selectedDate: Date) => {
    setCurrentDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleWeekRangeApply = () => {
    if (weekStartDate && weekEndDate) {
      // Crear un rango personalizado
      const range: Date[] = [];
      const start = moment(weekStartDate).startOf("day");
      const end = moment(weekEndDate).endOf("day");
      
      let current = start.clone();
      while (current.isSameOrBefore(end, "day")) {
        range.push(current.toDate());
        current.add(1, "day");
      }
      
      setCustomRange(range);
      setCurrentDate(weekStartDate);
      setShowWeekRangePicker(false);
    }
  };

  // Calcular el rango de la semana actual
  const getCurrentWeekRange = () => {
    const start = moment(currentDate).startOf("week").toDate();
    const end = moment(currentDate).endOf("week").toDate();
    return { start, end };
  };

  const currentWeekRange = getCurrentWeekRange();

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow transition-colors">
      {/* Controles adicionales para vista Día */}
      {currentView === "day" && (
        <div className="mb-4 flex items-center gap-2 flex-wrap relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            📅 {t("calendar.selectDay")}
          </button>
          {showDatePicker && (
            <div className="absolute z-10 top-full left-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
              <input
                type="date"
                value={moment(currentDate).format("YYYY-MM-DD")}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  handleDateSelect(selectedDate);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                autoFocus
              />
            </div>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t("calendar.day")}: {moment(currentDate).format("DD/MM/YYYY")}
          </span>
        </div>
      )}

      {/* Controles adicionales para vista Semana */}
      {currentView === "week" && (
        <div className="mb-4 flex items-center gap-2 flex-wrap relative">
          <button
            onClick={() => setShowWeekRangePicker(!showWeekRangePicker)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            📅 {t("calendar.selectRange")}
          </button>
          {showWeekRangePicker && (
            <div className="absolute z-10 top-full left-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 min-w-[300px]">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("calendar.startDate")}
                  </label>
                  <input
                    type="date"
                    value={
                      weekStartDate
                        ? moment(weekStartDate).format("YYYY-MM-DD")
                        : moment(currentWeekRange.start).format("YYYY-MM-DD")
                    }
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setWeekStartDate(date);
                      // Si no hay fecha de fin, establecerla automáticamente 6 días después
                      if (!weekEndDate) {
                        setWeekEndDate(moment(date).add(6, "days").toDate());
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("calendar.endDate")}
                  </label>
                  <input
                    type="date"
                    value={
                      weekEndDate
                        ? moment(weekEndDate).format("YYYY-MM-DD")
                        : moment(currentWeekRange.end).format("YYYY-MM-DD")
                    }
                    onChange={(e) => {
                      setWeekEndDate(new Date(e.target.value));
                    }}
                    min={
                      weekStartDate
                        ? moment(weekStartDate).format("YYYY-MM-DD")
                        : undefined
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleWeekRangeApply}
                    disabled={!weekStartDate || !weekEndDate}
                    className="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-md text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t("calendar.apply")}
                  </button>
                  <button
                    onClick={() => {
                      setShowWeekRangePicker(false);
                      setWeekStartDate(null);
                      setWeekEndDate(null);
                      setCustomRange(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}
          {!showWeekRangePicker && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {customRange
                ? `${t("calendar.selectRange")}: ${moment(customRange[0]).format("DD/MM/YYYY")} - ${moment(
                    customRange[customRange.length - 1]
                  ).format("DD/MM/YYYY")}`
                : `${t("calendar.week")}: ${moment(currentWeekRange.start).format("DD/MM/YYYY")} - ${moment(
                    currentWeekRange.end
                  ).format("DD/MM/YYYY")}`}
            </span>
          )}
        </div>
      )}

      <div className="h-[600px] relative">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          date={currentDate}
          view={currentView}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectSlot={onSelectSlot}
          onSelectEvent={(event) => {
            if (onSelectEvent && event.resource) {
              onSelectEvent(event.resource as Appointment);
            }
          }}
          eventPropGetter={eventStyleGetter}
          selectable
          formats={{
            monthHeaderFormat: (date: Date) => {
              const month = moment(date);
              return month.format("MMMM YYYY");
            },
            dayFormat: (date: Date) => {
              return moment(date).format("ddd");
            },
            dayHeaderFormat: (date: Date) => {
              return moment(date).format("ddd");
            },
            dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) => {
              return `${moment(start).format("MMM D")} - ${moment(end).format("MMM D, YYYY")}`;
            },
          }}
          messages={{
            next: t("common.next"),
            previous: t("common.previous"),
            today: t("common.today"),
            month: t("calendar.month"),
            week: t("calendar.week"),
            day: t("calendar.day"),
            agenda: t("calendar.agenda"),
            date: t("calendar.startDate"),
            time: t("calendar.startDate"),
            event: t("appointments.title"),
            noEventsInRange: t("calendar.noEvents"),
          }}
        />
      </div>
    </div>
  );
}

