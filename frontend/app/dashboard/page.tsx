"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { appointmentService, Appointment } from "@/services/appointmentService";
import { Calendar, User, Pill, CalendarDays } from "lucide-react";
import Link from "next/link";
import moment from "moment";
moment.locale("es");

// ── helpers ──────────────────────────────────────────────────────────────────

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
};

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-cyan-500",
  "bg-teal-500", "bg-emerald-500", "bg-rose-500", "bg-orange-500",
  "bg-pink-500", "bg-amber-600",
];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name: string) => {
  const n = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  SCHEDULED:   { label: "Programada",    dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  CONFIRMED:   { label: "Confirmada",    dot: "bg-green-500",  badge: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  COMPLETED:   { label: "Completada",    dot: "bg-gray-400",   badge: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400" },
  CANCELLED:   { label: "Cancelada",     dot: "bg-red-500",    badge: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  NO_SHOW:     { label: "No asistió",    dot: "bg-amber-500",  badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  RESCHEDULED: { label: "Reprogramada",  dot: "bg-purple-500", badge: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
};

// ── sub-components ────────────────────────────────────────────────────────────

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  return (
    <div className={`${cls} rounded-full ${getAvatarColor(name)} flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-semibold">{getInitials(name)}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, dot: "bg-gray-400", badge: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function KPICard({
  label, value, sub, icon, color,
}: {
  label: string; value: number; sub: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [tomorrowAppointments, setTomorrowAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const todayStr    = moment().format("YYYY-MM-DD");
      const tomorrowStr = moment().add(1, "day").format("YYYY-MM-DD");

      const [todayRes, tomorrowRes] = await Promise.all([
        appointmentService.getAll({ date: todayStr,    limit: 500 }),
        appointmentService.getAll({ date: tomorrowStr, limit: 500 }),
      ]);

      const byTime = (a: Appointment, b: Appointment) =>
        moment(a.appointmentDate).valueOf() - moment(b.appointmentDate).valueOf();

      setTodayAppointments([...todayRes.appointments].sort(byTime));
      setTomorrowAppointments([...tomorrowRes.appointments].sort(byTime));
    } catch (err) {
      console.error("Error al cargar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── computed ────────────────────────────────────────────────────────────────
  const todayCompleted  = todayAppointments.filter(a => a.status === "COMPLETED").length;
  const todayAbsences   = todayAppointments.filter(a => ["CANCELLED", "NO_SHOW"].includes(a.status)).length;
  const todayPending    = todayAppointments.filter(a => ["SCHEDULED", "CONFIRMED"].includes(a.status)).length;

  // Therapists with appointment count today
  const therapistMap = new Map<string, { name: string; count: number; confirmed: number }>();
  todayAppointments.forEach(a => {
    if (!a.therapist) return;
    const key = a.therapist.id;
    const prev = therapistMap.get(key);
    if (prev) {
      prev.count++;
      if (["CONFIRMED", "SCHEDULED"].includes(a.status)) prev.confirmed++;
    } else {
      therapistMap.set(key, {
        name: a.therapist.name,
        count: 1,
        confirmed: ["CONFIRMED", "SCHEDULED"].includes(a.status) ? 1 : 0,
      });
    }
  });
  const therapistsToday = Array.from(therapistMap.values()).sort((a, b) => b.count - a.count);

  // ── loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-3 sm:px-4 py-6 space-y-5">
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse w-72" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-44 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            <div className="h-44 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {getGreeting()}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
            {moment().format("dddd, D [de] MMMM [de] YYYY")}
          </p>
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva cita
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard
          label="Citas hoy"
          value={todayAppointments.length}
          sub="total del día"
          color="bg-indigo-50 dark:bg-indigo-900/20"
          icon={
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <KPICard
          label="Pendientes"
          value={todayPending}
          sub="por atender hoy"
          color="bg-blue-50 dark:bg-blue-900/20"
          icon={
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KPICard
          label="Completadas"
          value={todayCompleted}
          sub="sesiones realizadas"
          color="bg-green-50 dark:bg-green-900/20"
          icon={
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KPICard
          label="Ausencias"
          value={todayAbsences}
          sub="canceladas / no asistió"
          color="bg-red-50 dark:bg-red-900/20"
          icon={
            <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Agenda de hoy ── */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Agenda de hoy</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                {moment().format("dddd D [de] MMMM")}
              </p>
            </div>
            <Link
              href={`/dashboard/appointments?date=${moment().format("YYYY-MM-DD")}`}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              Ver todas →
            </Link>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-500"><Calendar className="w-8 h-8" /></div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin citas para hoy</p>
              <Link
                href="/dashboard/appointments/new"
                className="mt-3 inline-flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Agregar una cita →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Encabezado tabla */}
              <div className="hidden sm:grid grid-cols-[90px_1fr_160px_130px] px-6 py-2.5 bg-gray-50/80 dark:bg-gray-700/30 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                <span>Hora</span>
                <span>Paciente</span>
                <span>Terapista</span>
                <span className="text-right">Estado</span>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {todayAppointments.map((apt) => {
                  const name    = apt.patient?.name ?? "Paciente";
                  const therapist = apt.therapist?.name ?? "Sin asignar";
                  const time    = moment(apt.appointmentDate).format("hh:mm A");
                  const dimmed  = ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(apt.status);

                  return (
                    <Link
                      key={apt.id}
                      href={`/dashboard/appointments/${apt.id}`}
                      className={`flex sm:grid sm:grid-cols-[90px_1fr_160px_130px] items-center gap-3 px-6 py-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/20 transition-colors ${dimmed ? "opacity-55" : ""}`}
                    >
                      {/* Hora */}
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums w-[90px] flex-shrink-0">
                        {time}
                      </span>

                      {/* Paciente */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar name={name} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</p>
                          {apt.duration && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">{apt.duration} min</p>
                          )}
                        </div>
                      </div>

                      {/* Terapista */}
                      <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 truncate">{therapist}</p>

                      {/* Estado */}
                      <div className="hidden sm:flex justify-end flex-shrink-0">
                        <StatusBadge status={apt.status} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Panel derecho ── */}
        <div className="flex flex-col gap-4">

          {/* Mañana */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Mañana</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                  {moment().add(1, "day").format("dddd D [de] MMMM")}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                tomorrowAppointments.length > 0
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}>
                {tomorrowAppointments.length} citas
              </span>
            </div>

            {tomorrowAppointments.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">Sin citas programadas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {tomorrowAppointments.slice(0, 5).map((apt) => {
                  const name = apt.patient?.name ?? "Paciente";
                  const time = moment(apt.appointmentDate).format("hh:mm A");
                  return (
                    <Link
                      key={apt.id}
                      href={`/dashboard/appointments/${apt.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <Avatar name={name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {time}
                          {apt.therapist?.name && ` · ${apt.therapist.name}`}
                        </p>
                      </div>
                      <StatusBadge status={apt.status} />
                    </Link>
                  );
                })}
                {tomorrowAppointments.length > 5 && (
                  <Link
                    href={`/dashboard/appointments?date=${moment().add(1, "day").format("YYYY-MM-DD")}`}
                    className="block px-5 py-3 text-xs text-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                  >
                    Ver {tomorrowAppointments.length - 5} más →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Terapistas hoy */}
          {therapistsToday.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Terapistas hoy</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Agenda por especialista</p>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {therapistsToday.map((t) => (
                  <div key={t.name} className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar name={t.name} />
                    <p className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.name}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{t.confirmed} pendiente{t.confirmed !== 1 ? "s" : ""}</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                        {t.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acceso rápido */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Acceso rápido</h2>
            <div className="grid grid-cols-2 gap-2">
              {([
                { href: "/dashboard/patients/new",          label: "Nuevo paciente",   icon: User },
                { href: "/dashboard/appointments/new",      label: "Nueva cita",       icon: Calendar },
                { href: "/dashboard/treatment-plans/new",   label: "Nuevo plan",       icon: Pill },
                { href: "/dashboard/appointments",          label: "Ver agenda",       icon: CalendarDays },
              ] as const).map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
