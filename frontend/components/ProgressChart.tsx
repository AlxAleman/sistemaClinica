"use client";

import { TreatmentSession } from "@/services/sessionService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import moment from "moment";

interface ProgressChartProps {
  sessions: TreatmentSession[];
}

export default function ProgressChart({ sessions }: ProgressChartProps) {
  // Preparar datos para el gráfico
  const chartData = sessions
    .filter((session) => session.painLevel !== null)
    .map((session) => ({
      date: moment(session.sessionDate).format("DD/MM"),
      fullDate: moment(session.sessionDate).format("YYYY-MM-DD"),
      painLevel: session.painLevel,
      sessionNumber: sessions.indexOf(session) + 1,
    }))
    .sort((a, b) => moment(a.fullDate).valueOf() - moment(b.fullDate).valueOf());

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Evolución del Dolor
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No hay datos de nivel de dolor registrados para mostrar el gráfico.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Evolución del Dolor
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            domain={[0, 10]}
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
            label={{
              value: "Nivel de Dolor (1-10)",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fill: "#9ca3af" },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "6px",
              color: "#e5e7eb",
            }}
            labelStyle={{ color: "#e5e7eb" }}
          />
          <Legend
            wrapperStyle={{ color: "#9ca3af" }}
          />
          <Line
            type="monotone"
            dataKey="painLevel"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: "#ef4444", r: 4 }}
            activeDot={{ r: 6 }}
            name="Nivel de Dolor"
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        Escala de dolor: 1 = sin dolor, 10 = dolor extremo
      </p>
    </div>
  );
}

