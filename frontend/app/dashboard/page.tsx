"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { patientService } from "@/services/patientService";
import { appointmentService, Appointment } from "@/services/appointmentService";
import { sessionService } from "@/services/sessionService";
import { reportService, DashboardKPIs } from "@/services/reportService";
import Link from "next/link";
import moment from "moment";
import { UsersIcon, CalendarIcon, HospitalIcon, CheckIcon, ChartBarIcon } from "@/components/Icons";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useTranslation } from "@/hooks/useTranslation";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalSessions: 0,
  });

  const [dayStats, setDayStats] = useState({
    appointments: 0,
    confirmed: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    sessions: 0,
  });

  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [weekStats, setWeekStats] = useState({
    appointments: 0,
    confirmed: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchAllData();
  }, [selectedDate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Obtener KPIs del backend
      const kpisData = await reportService.getDashboardKPIs();
      setKpis(kpisData);
      
      // Mantener compatibilidad con código existente
      setStats({
        totalPatients: kpisData.totalPatients,
        totalAppointments: kpisData.totalAppointments,
        totalSessions: kpisData.totalSessions,
      });
      
      // Obtener estadísticas generales (para citas próximas)
      const [patientsRes, appointmentsRes, sessionsRes] = await Promise.all([
        patientService.getAll({ limit: 1 }),
        appointmentService.getAll({ limit: 1000 }),
        sessionService.getAll({ limit: 1 }),
      ]);

      // Obtener citas y sesiones del día seleccionado
      const selectedDateStr = moment(selectedDate).format("YYYY-MM-DD");
      const [dayAppointmentsRes, daySessionsRes] = await Promise.all([
        appointmentService.getAll({
          date: selectedDateStr,
          limit: 1000,
        }),
        sessionService.getAll({
          date: selectedDateStr,
          limit: 1000,
        }),
      ]);

      const dayAppointments = dayAppointmentsRes.appointments;
      const daySessions = daySessionsRes.sessions;
      
      setDayStats({
        appointments: dayAppointments.length,
        confirmed: dayAppointments.filter((a) => a.status === "CONFIRMED").length,
        scheduled: dayAppointments.filter((a) => a.status === "SCHEDULED").length,
        completed: dayAppointments.filter((a) => a.status === "COMPLETED").length,
        cancelled: dayAppointments.filter((a) => a.status === "CANCELLED").length,
        sessions: daySessions.length,
      });

      setTodayAppointments(dayAppointments);

      // Obtener próximas citas (próximos 7 días)
      const today = moment().startOf("day");
      const nextWeek = moment().add(7, "days").endOf("day");
      
      const upcoming = appointmentsRes.appointments
        .filter((apt) => {
          const aptDate = moment(apt.appointmentDate);
          return aptDate.isAfter(today) && aptDate.isBefore(nextWeek) && apt.status !== "CANCELLED";
        })
        .sort((a, b) => 
          moment(a.appointmentDate).valueOf() - moment(b.appointmentDate).valueOf()
        )
        .slice(0, 5);

      setUpcomingAppointments(upcoming);

      // Estadísticas de la semana actual
      const weekStart = moment().startOf("week");
      const weekEnd = moment().endOf("week");
      
      const weekAppointments = appointmentsRes.appointments.filter((apt) => {
        const aptDate = moment(apt.appointmentDate);
        return aptDate.isBetween(weekStart, weekEnd, null, "[]");
      });

      setWeekStats({
        appointments: weekAppointments.length,
        confirmed: weekAppointments.filter((a) => a.status === "CONFIRMED").length,
        completed: weekAppointments.filter((a) => a.status === "COMPLETED").length,
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const isToday = moment(selectedDate).isSame(moment(), "day");

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0 space-y-6">
        <LoadingSkeleton type="card" count={3} />
        <LoadingSkeleton type="chart" count={2} />
      </div>
    );
  }

  return (
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t("dashboard.welcome")}, {user?.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {t("dashboard.subtitle")}
            </p>
          </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Link
          href="/dashboard/patients"
          className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 truncate">
                {t("dashboard.totalPatients")}
              </h2>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalPatients}</p>
            </div>
            <div className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2">
              <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/appointments"
          className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 truncate">
                {t("dashboard.totalAppointments")}
              </h2>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalAppointments}</p>
            </div>
            <div className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2">
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
          </div>
        </Link>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 truncate">
                {t("dashboard.totalSessions")}
              </h2>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalSessions}</p>
            </div>
            <div className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2">
              <HospitalIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Avanzados */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("dashboard.activePatients")}
                </h3>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {kpis.activePatients}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("dashboard.of")} {kpis.totalPatients} {t("dashboard.total")}
                </p>
              </div>
              <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400 flex-shrink-0 ml-2" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("dashboard.attendanceRate")}
                </h3>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {kpis.attendanceRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("dashboard.last30Days")}
                </p>
              </div>
              <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("dashboard.monthlyRevenue")}
                </h3>
                <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${kpis.revenue.month.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {t("dashboard.totalRevenue")}: ${kpis.revenue.total.toFixed(2)}
                </p>
              </div>
              <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 ml-2" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("dashboard.weekAppointments")}
                </h3>
                <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {kpis.weekAppointments}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("dashboard.sessions")}: {kpis.weekSessions}
                </p>
              </div>
              <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2" />
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      {kpis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Gráfico de Citas por Estado */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow transition-colors">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
              {t("dashboard.appointmentsByStatus")}
            </h3>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <PieChart>
                <Pie
                  data={[
                    { name: t("appointments.scheduled"), value: kpis.appointmentsByStatus.scheduled, color: '#3b82f6' },
                    { name: t("appointments.confirmed"), value: kpis.appointmentsByStatus.confirmed, color: '#10b981' },
                    { name: t("appointments.completed"), value: kpis.appointmentsByStatus.completed, color: '#6b7280' },
                    { name: t("appointments.cancelled"), value: kpis.appointmentsByStatus.cancelled, color: '#ef4444' },
                    { name: t("appointments.noShow"), value: kpis.appointmentsByStatus.noShow, color: '#f59e0b' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: t("appointments.scheduled"), value: kpis.appointmentsByStatus.scheduled, color: '#3b82f6' },
                    { name: t("appointments.confirmed"), value: kpis.appointmentsByStatus.confirmed, color: '#10b981' },
                    { name: t("appointments.completed"), value: kpis.appointmentsByStatus.completed, color: '#6b7280' },
                    { name: t("appointments.cancelled"), value: kpis.appointmentsByStatus.cancelled, color: '#ef4444' },
                    { name: t("appointments.noShow"), value: kpis.appointmentsByStatus.noShow, color: '#f59e0b' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Actividad Temporal */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow transition-colors">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
              {t("dashboard.recentActivity")}
            </h3>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart
                data={[
                  { name: t("dashboard.today"), citas: kpis.todayAppointments, sesiones: kpis.todaySessions },
                  { name: t("dashboard.week"), citas: kpis.weekAppointments, sesiones: kpis.weekSessions },
                  { name: t("dashboard.month"), citas: kpis.monthAppointments, sesiones: kpis.monthSessions },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="citas" fill="#3b82f6" name={t("dashboard.appointments")} />
                <Bar dataKey="sesiones" fill="#10b981" name={t("dashboard.sessions")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Selector de Fecha y Estadísticas del Día */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t("dashboard.dayStats")}
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={moment(selectedDate).format("YYYY-MM-DD")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            {!isToday && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors whitespace-nowrap"
              >
                {t("common.today")}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-indigo-600">{dayStats.appointments}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("dashboard.totalCitas")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{dayStats.confirmed}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("dashboard.confirmed")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{dayStats.scheduled}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("dashboard.scheduled")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">{dayStats.completed}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("dashboard.completed")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-red-600">{dayStats.cancelled}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("dashboard.cancelled")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-purple-600">{dayStats.sessions}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("dashboard.sessions")}</p>
          </div>
        </div>

        {/* Lista de citas del día seleccionado */}
        {todayAppointments.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
              {t("dashboard.appointmentsOf")} {moment(selectedDate).format("DD/MM/YYYY")}
            </h3>
            <div className="space-y-2">
              {todayAppointments.slice(0, 5).map((appointment) => (
                <Link
                  key={appointment.id}
                  href={`/dashboard/appointments/${appointment.id}`}
                  className="block p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                        {appointment.patient?.name || t("patients.unknownPatient")}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                        {moment(appointment.appointmentDate).format("HH:mm")} - {appointment.therapist?.name}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        appointment.status === "CONFIRMED"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : appointment.status === "SCHEDULED"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                          : appointment.status === "COMPLETED"
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                          : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                      }`}
                    >
                      {appointment.status === "CONFIRMED"
                        ? t("appointments.confirmed")
                        : appointment.status === "SCHEDULED"
                        ? t("appointments.scheduled")
                        : appointment.status === "COMPLETED"
                        ? t("appointments.completed")
                        : t("appointments.cancelled")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {todayAppointments.length > 5 && (
              <Link
                href={`/dashboard/appointments?date=${moment(selectedDate).format("YYYY-MM-DD")}`}
                className="mt-3 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                {t("dashboard.seeAllAppointments")} ({todayAppointments.length}) →
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Próximas Citas */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow transition-colors">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              {t("dashboard.upcomingAppointments")}
            </h2>
            <Link
              href="/dashboard/appointments"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              Ver todas →
            </Link>
          </div>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  href={`/dashboard/appointments/${appointment.id}`}
                  className="block p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                        {appointment.patient?.name || t("patients.unknownPatient")}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                        {moment(appointment.appointmentDate).format("DD/MM/YYYY HH:mm")} - {appointment.therapist?.name}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        appointment.status === "CONFIRMED"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                      }`}
                    >
                      {appointment.status === "CONFIRMED" ? t("appointments.confirmed") : t("appointments.scheduled")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              {t("dashboard.noUpcomingAppointments")}
            </p>
          )}
        </div>

        {/* Estadísticas de la Semana */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow transition-colors">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
            {t("dashboard.thisWeek")}
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("dashboard.totalAppointmentsWeek")}</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{weekStats.appointments}</p>
              </div>
              <div className="text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2">
                <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
            <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("dashboard.confirmed")}</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{weekStats.confirmed}</p>
              </div>
              <div className="text-green-600 dark:text-green-400 flex-shrink-0 ml-2">
                <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
            <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("dashboard.completed")}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">{weekStats.completed}</p>
              </div>
              <div className="text-gray-600 dark:text-gray-400 flex-shrink-0 ml-2">
                <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/appointments"
            className="mt-3 sm:mt-4 inline-block w-full text-center px-3 sm:px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-800 text-xs sm:text-sm font-medium transition-colors"
          >
            {t("dashboard.seeFullCalendar")}
          </Link>
        </div>
      </div>
    </div>
  );
}
