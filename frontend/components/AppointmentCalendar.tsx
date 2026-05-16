"use client";

import { useState, useMemo, useEffect } from "react";
import { Calendar, momentLocalizer, View, Event } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import { Appointment } from "@/services/appointmentService";
import { TreatmentSession } from "@/services/sessionService";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguageStore } from "@/store/languageStore";

if (typeof window !== "undefined") {
  require("react-big-calendar/lib/css/react-big-calendar.css");
}

export type CalendarEventType = "appointment" | "session" | "proposed";

export interface UnifiedCalendarEvent extends Event {
  id: string;
  eventType: CalendarEventType;
  resource: Appointment | TreatmentSession | null;
}

export interface ProposedEvent {
  start: Date;
  end: Date;
  label: string;
}

interface AppointmentCalendarProps {
  appointments: Appointment[];
  sessions?: TreatmentSession[];
  proposedEvents?: ProposedEvent[];
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent?: (event: UnifiedCalendarEvent) => void;
  defaultDate?: Date;
  defaultView?: View;
  onViewChange?: (view: View) => void;
  onNavigate?: (date: Date) => void;
}

// ── Color palettes ────────────────────────────────────────────────────────────

const appointmentColor = (appt: Appointment): string => {
  switch (appt.status) {
    case "CONFIRMED":  return "#16a34a"; // green-600
    case "COMPLETED":  return "#6b7280"; // gray-500
    case "CANCELLED":  return "#dc2626"; // red-600
    case "NO_SHOW":    return "#f59e0b"; // amber-500
    default:           return "#4f46e5"; // indigo-600 — SCHEDULED
  }
};

const sessionColor = (s: TreatmentSession): string => {
  switch (s.attendanceStatus) {
    case "ATTENDED":      return "#0d9488"; // teal-600
    case "NOT_ATTENDED":  return "#b45309"; // amber-700
    case "RESCHEDULED":   return "#7c3aed"; // violet-600
    default:              return "#0891b2"; // cyan-600 — PENDING
  }
};

// ── Custom event renderer ─────────────────────────────────────────────────────

function CalendarEventWrapper({ event, title }: { event: UnifiedCalendarEvent; title: string }) {
  const noTherapist = event.eventType !== "proposed" && (
    event.eventType === "appointment"
      ? !(event.resource as Appointment).therapistId
      : !(event.resource as TreatmentSession).therapistId
  );

  return (
    <div style={{ display: "flex", alignItems: "center", height: "100%", overflow: "hidden", gap: "4px", paddingLeft: "1px" }}>
      {noTherapist && (
        <span style={{
          backgroundColor: "#fbbf24",
          color: "#78350f",
          fontSize: "9px",
          fontWeight: 800,
          padding: "1px 4px",
          borderRadius: "4px",
          flexShrink: 0,
          lineHeight: "1.5",
          letterSpacing: "0.03em",
        }}>
          ST
        </span>
      )}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "11px", fontWeight: 500 }}>
        {title}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AppointmentCalendar({
  appointments,
  sessions = [],
  proposedEvents = [],
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWeekRangePicker, setShowWeekRangePicker] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState<Date | null>(null);
  const [weekEndDate, setWeekEndDate] = useState<Date | null>(null);
  const [customRange, setCustomRange] = useState<Date[] | null>(null);

  // Locale setup
  useEffect(() => {
    const cfg = language === "es"
      ? {
          months: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
          monthsShort: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
          weekdays: ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"],
          weekdaysShort: ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],
          week: { dow: 0 },
        }
      : {
          months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
          monthsShort: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
          weekdays: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
          weekdaysShort: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
          week: { dow: 0 },
        };
    moment.locale(language === "es" ? "es" : "en", cfg);
    setCurrentDate(prev => new Date(prev.getTime()));
  }, [language]);

  const localizer = useMemo(() => {
    moment.locale(language === "es" ? "es" : "en");
    return momentLocalizer(moment);
  }, [language]);

  useEffect(() => { setCurrentDate(defaultDate); }, [defaultDate]);
  useEffect(() => { setCurrentView(defaultView); }, [defaultView]);

  // ── Build unified event list ────────────────────────────────────────────────

  const events: UnifiedCalendarEvent[] = useMemo(() => {
    const apptEvents: UnifiedCalendarEvent[] = appointments.map(a => {
      const start = new Date(a.appointmentDate);
      const end = new Date(start.getTime() + a.duration * 60000);
      return {
        id: a.id,
        eventType: "appointment" as const,
        title: `${a.patient?.name ?? "Paciente"} · Evaluación`,
        start,
        end,
        resource: a,
      };
    });

    const sessionEvents: UnifiedCalendarEvent[] = sessions.map(s => {
      const start = new Date(s.sessionDate);
      const end = new Date(start.getTime() + s.duration * 60000);
      const planTitle = (s as any).treatmentPlan?.title ?? "Sesión";
      return {
        id: s.id,
        eventType: "session" as const,
        title: `${s.patient?.name ?? "Paciente"} · Sesión`,
        start,
        end,
        resource: s,
        tooltip: planTitle,
      };
    });

    const proposedCalendarEvents: UnifiedCalendarEvent[] = proposedEvents.map((p, i) => ({
      id: `proposed-${i}`,
      eventType: "proposed" as const,
      title: p.label,
      start: p.start,
      end: p.end,
      resource: null,
    }));

    return [...apptEvents, ...sessionEvents, ...proposedCalendarEvents];
  }, [appointments, sessions, proposedEvents]);

  // ── Styles ──────────────────────────────────────────────────────────────────

  const eventStyleGetter = (event: Event) => {
    const e = event as UnifiedCalendarEvent;

    if (e.eventType === "proposed") {
      return {
        style: {
          backgroundColor: "#f97316",
          borderRadius: "6px",
          opacity: 0.85,
          color: "white",
          border: "2px dashed #ea580c",
          display: "block",
          fontSize: "11px",
          fontWeight: 500,
          paddingLeft: "4px",
        },
      };
    }

    const color = e.eventType === "appointment"
      ? appointmentColor(e.resource as Appointment)
      : sessionColor(e.resource as TreatmentSession);

    return {
      style: {
        backgroundColor: color,
        borderRadius: "6px",
        opacity: 0.92,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "11px",
        fontWeight: 500,
        paddingLeft: "4px",
      },
    };
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
    onNavigate?.(newDate);
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    setShowDatePicker(false);
    setShowWeekRangePicker(false);
    if (view !== "week") { setCustomRange(null); setWeekStartDate(null); setWeekEndDate(null); }
    onViewChange?.(view);
  };

  const handleWeekRangeApply = () => {
    if (weekStartDate && weekEndDate) {
      const range: Date[] = [];
      const start = moment(weekStartDate).startOf("day");
      const end = moment(weekEndDate).endOf("day");
      let cur = start.clone();
      while (cur.isSameOrBefore(end, "day")) { range.push(cur.toDate()); cur.add(1, "day"); }
      setCustomRange(range);
      setCurrentDate(weekStartDate);
      setShowWeekRangePicker(false);
    }
  };

  const currentWeekRange = {
    start: moment(currentDate).startOf("week").toDate(),
    end:   moment(currentDate).endOf("week").toDate(),
  };

  // ── Legend ──────────────────────────────────────────────────────────────────

  const Legend = () => (
    <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-gray-600 dark:text-gray-400">
      <span className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Evaluaciones:</span>
      {[
        { color: "#4f46e5", label: "Programada" },
        { color: "#16a34a", label: "Confirmada" },
        { color: "#6b7280", label: "Completada" },
        { color: "#dc2626", label: "Cancelada" },
      ].map(({ color, label }) => (
        <span key={label} className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
      <span className="ml-2 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sesiones:</span>
      {[
        { color: "#0891b2", label: "Pendiente" },
        { color: "#0d9488", label: "Realizada" },
        { color: "#b45309", label: "No asistió" },
        { color: "#7c3aed", label: "Reagendada" },
      ].map(({ color, label }) => (
        <span key={label} className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
      <span className="ml-2 flex items-center gap-1.5">
        <span style={{
          backgroundColor: "#fbbf24",
          color: "#78350f",
          fontSize: "9px",
          fontWeight: 800,
          padding: "1px 5px",
          borderRadius: "4px",
          letterSpacing: "0.03em",
        }}>
          ST
        </span>
        Sin terapeuta
      </span>
      {proposedEvents.length > 0 && (
        <span className="ml-2 flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: "#f97316", border: "1.5px dashed #ea580c" }} />
          Propuestas
        </span>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow transition-colors">
      <Legend />

      {/* Day picker */}
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
                onChange={e => { handleNavigate(new Date(e.target.value)); setShowDatePicker(false); }}
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

      {/* Week range picker */}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("calendar.startDate")}</label>
                  <input
                    type="date"
                    value={weekStartDate ? moment(weekStartDate).format("YYYY-MM-DD") : moment(currentWeekRange.start).format("YYYY-MM-DD")}
                    onChange={e => { const d = new Date(e.target.value); setWeekStartDate(d); if (!weekEndDate) setWeekEndDate(moment(d).add(6,"days").toDate()); }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("calendar.endDate")}</label>
                  <input
                    type="date"
                    value={weekEndDate ? moment(weekEndDate).format("YYYY-MM-DD") : moment(currentWeekRange.end).format("YYYY-MM-DD")}
                    onChange={e => setWeekEndDate(new Date(e.target.value))}
                    min={weekStartDate ? moment(weekStartDate).format("YYYY-MM-DD") : undefined}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleWeekRangeApply} disabled={!weekStartDate || !weekEndDate} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">{t("calendar.apply")}</button>
                  <button onClick={() => { setShowWeekRangePicker(false); setWeekStartDate(null); setWeekEndDate(null); setCustomRange(null); }} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">{t("common.cancel")}</button>
                </div>
              </div>
            </div>
          )}
          {!showWeekRangePicker && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {customRange
                ? `${moment(customRange[0]).format("DD/MM/YYYY")} - ${moment(customRange[customRange.length-1]).format("DD/MM/YYYY")}`
                : `${moment(currentWeekRange.start).format("DD/MM/YYYY")} - ${moment(currentWeekRange.end).format("DD/MM/YYYY")}`}
            </span>
          )}
        </div>
      )}

      <div className="h-[600px] relative [&_.rbc-timeslot-group]:min-h-[60px]">
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
          onSelectEvent={event => {
            const e = event as UnifiedCalendarEvent;
            if (e.eventType === "proposed") return;
            onSelectEvent?.(e);
          }}
          eventPropGetter={eventStyleGetter}
          components={{ event: CalendarEventWrapper as any }}
          dayLayoutAlgorithm={currentView === "day" ? "no-overlap" : "overlap"}
          selectable
          formats={{
            monthHeaderFormat: (date: Date) => moment(date).format("MMMM YYYY"),
            dayFormat: (date: Date) => moment(date).format("ddd D"),
            dayHeaderFormat: (date: Date) => moment(date).format("dddd D - YYYY"),
            dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
              `${moment(start).format("MMM D")} - ${moment(end).format("MMM D, YYYY")}`,
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
