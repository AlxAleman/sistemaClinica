"use client";

import { useState, useEffect, useRef } from "react";
import { Appointment } from "@/services/appointmentService";
import moment from "moment";

interface AppointmentSelectorProps {
  appointments: Appointment[];
  value: string | null;
  onChange: (appointmentId: string | null) => void;
  label?: string;
  onSelect?: (appointment: Appointment | null) => void;
}

export default function AppointmentSelector({
  appointments,
  value,
  onChange,
  label = "Cita Relacionada (Opcional)",
  onSelect,
}: AppointmentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(appointments);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredAppointments(appointments);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredAppointments(
        appointments.filter(
          (apt) =>
            apt.patient?.name.toLowerCase().includes(term) ||
            apt.therapist?.name.toLowerCase().includes(term) ||
            moment(apt.appointmentDate).format("DD/MM/YYYY HH:mm").includes(term)
        )
      );
    }
  }, [searchTerm, appointments]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedAppointment = appointments.find((apt) => apt.id === value);

  const handleSelect = (appointmentId: string | null) => {
    onChange(appointmentId);
    const appointment = appointmentId ? appointments.find((apt) => apt.id === appointmentId) : null;
    if (onSelect) {
      onSelect(appointment || null);
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {selectedAppointment ? (
            <span className="block truncate">
              {selectedAppointment.patient?.name} - {moment(selectedAppointment.appointmentDate).format("DD/MM/YYYY HH:mm")} - {selectedAppointment.therapist?.name}
            </span>
          ) : (
            <span className="block truncate text-gray-500 dark:text-gray-400">
              Ninguna (sesión independiente)
            </span>
          )}
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400 dark:text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Buscar por paciente, terapeuta o fecha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>
            <ul className="py-1">
              <li
                onClick={() => handleSelect(null)}
                className={`px-3 py-2 cursor-pointer text-sm ${
                  !value
                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-300"
                    : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <div className="font-medium">Ninguna (sesión independiente)</div>
              </li>
              {filteredAppointments.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron citas
                </li>
              ) : (
                filteredAppointments.map((appointment) => (
                  <li
                    key={appointment.id}
                    onClick={() => handleSelect(appointment.id)}
                    className={`px-3 py-2 cursor-pointer text-sm ${
                      value === appointment.id
                        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-300"
                        : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="font-medium">
                      {appointment.patient?.name || "Paciente desconocido"} - {moment(appointment.appointmentDate).format("DD/MM/YYYY HH:mm")} - {appointment.therapist?.name || "Terapeuta desconocido"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {appointment.duration} min - {appointment.status === "CONFIRMED" ? "Confirmada" : appointment.status === "SCHEDULED" ? "Programada" : appointment.status}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Si seleccionas una cita, se completarán automáticamente el paciente, terapeuta, fecha y duración
      </p>
    </div>
  );
}

