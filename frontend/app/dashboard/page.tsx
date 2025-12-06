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

export default function DashboardPage() {
  const { user } = useAuthStore();
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
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Bienvenido, {user?.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sistema de Gestión Clínica - Dashboard
            </p>
          </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link
          href="/dashboard/patients"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Total Pacientes
              </h2>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalPatients}</p>
            </div>
            <div className="text-indigo-600 dark:text-indigo-400">
              <UsersIcon className="h-8 w-8" />
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/appointments"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Total Citas
              </h2>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalAppointments}</p>
            </div>
            <div className="text-indigo-600 dark:text-indigo-400">
              <CalendarIcon className="h-8 w-8" />
            </div>
          </div>
        </Link>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Total Sesiones
              </h2>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalSessions}</p>
            </div>
            <div className="text-indigo-600 dark:text-indigo-400">
              <HospitalIcon className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Avanzados */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Pacientes Activos
                </h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {kpis.activePatients}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  de {kpis.totalPatients} totales
                </p>
              </div>
              <UsersIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Tasa de Asistencia
                </h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {kpis.attendanceRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Últimos 30 días
                </p>
              </div>
              <CheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Ingresos del Mes
                </h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${kpis.revenue.month.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Total: ${kpis.revenue.total.toFixed(2)}
                </p>
              </div>
              <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Citas Esta Semana
                </h3>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {kpis.weekAppointments}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Sesiones: {kpis.weekSessions}
                </p>
              </div>
              <CalendarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Citas por Estado */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Citas por Estado
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Programadas', value: kpis.appointmentsByStatus.scheduled, color: '#3b82f6' },
                    { name: 'Confirmadas', value: kpis.appointmentsByStatus.confirmed, color: '#10b981' },
                    { name: 'Completadas', value: kpis.appointmentsByStatus.completed, color: '#6b7280' },
                    { name: 'Canceladas', value: kpis.appointmentsByStatus.cancelled, color: '#ef4444' },
                    { name: 'No Show', value: kpis.appointmentsByStatus.noShow, color: '#f59e0b' },
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
                    { name: 'Programadas', value: kpis.appointmentsByStatus.scheduled, color: '#3b82f6' },
                    { name: 'Confirmadas', value: kpis.appointmentsByStatus.confirmed, color: '#10b981' },
                    { name: 'Completadas', value: kpis.appointmentsByStatus.completed, color: '#6b7280' },
                    { name: 'Canceladas', value: kpis.appointmentsByStatus.cancelled, color: '#ef4444' },
                    { name: 'No Show', value: kpis.appointmentsByStatus.noShow, color: '#f59e0b' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Actividad Temporal */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Actividad Reciente
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'Hoy', citas: kpis.todayAppointments, sesiones: kpis.todaySessions },
                  { name: 'Semana', citas: kpis.weekAppointments, sesiones: kpis.weekSessions },
                  { name: 'Mes', citas: kpis.monthAppointments, sesiones: kpis.monthSessions },
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
                <Bar dataKey="citas" fill="#3b82f6" name="Citas" />
                <Bar dataKey="sesiones" fill="#10b981" name="Sesiones" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Selector de Fecha y Estadísticas del Día */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Estadísticas del Día
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={moment(selectedDate).format("YYYY-MM-DD")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            {!isToday && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                Hoy
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{dayStats.appointments}</p>
            <p className="text-sm text-gray-600">Total Citas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{dayStats.confirmed}</p>
            <p className="text-sm text-gray-600">Confirmadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{dayStats.scheduled}</p>
            <p className="text-sm text-gray-600">Programadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{dayStats.completed}</p>
            <p className="text-sm text-gray-600">Completadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{dayStats.cancelled}</p>
            <p className="text-sm text-gray-600">Canceladas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{dayStats.sessions}</p>
            <p className="text-sm text-gray-600">Sesiones</p>
          </div>
        </div>

        {/* Lista de citas del día seleccionado */}
        {todayAppointments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Citas del {moment(selectedDate).format("DD/MM/YYYY")}
            </h3>
            <div className="space-y-2">
              {todayAppointments.slice(0, 5).map((appointment) => (
                <Link
                  key={appointment.id}
                  href={`/dashboard/appointments/${appointment.id}`}
                  className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {appointment.patient?.name || "Paciente desconocido"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
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
                        ? "Confirmada"
                        : appointment.status === "SCHEDULED"
                        ? "Programada"
                        : appointment.status === "COMPLETED"
                        ? "Completada"
                        : "Cancelada"}
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
                Ver todas las citas del día ({todayAppointments.length}) →
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Próximas Citas */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Próximas Citas
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
                  className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {appointment.patient?.name || "Paciente desconocido"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
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
                      {appointment.status === "CONFIRMED" ? "Confirmada" : "Programada"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No hay citas próximas programadas
            </p>
          )}
        </div>

        {/* Estadísticas de la Semana */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Esta Semana
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Citas</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{weekStats.appointments}</p>
              </div>
              <div className="text-blue-600 dark:text-blue-400">
                <CalendarIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confirmadas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{weekStats.confirmed}</p>
              </div>
              <div className="text-green-600 dark:text-green-400">
                <CheckIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{weekStats.completed}</p>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <CheckIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/appointments"
            className="mt-4 inline-block w-full text-center px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-800 text-sm font-medium transition-colors"
          >
            Ver Calendario Completo
          </Link>
        </div>
      </div>
    </div>
  );
}
