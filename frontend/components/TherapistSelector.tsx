"use client";

import { useState, useEffect, useRef } from "react";
import { Therapist } from "@/services/therapistService";

interface TherapistSelectorProps {
  therapists: Therapist[];
  value: string;
  onChange: (therapistId: string) => void;
  required?: boolean;
  label?: string;
}

export default function TherapistSelector({
  therapists,
  value,
  onChange,
  required = false,
  label = "Terapeuta",
}: TherapistSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTherapists, setFilteredTherapists] = useState<Therapist[]>(therapists);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredTherapists(therapists);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredTherapists(
        therapists.filter(
          (therapist) =>
            therapist.name.toLowerCase().includes(term) ||
            therapist.email.toLowerCase().includes(term) ||
            therapist.phone.includes(term) ||
            therapist.specialization?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, therapists]);

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

  const selectedTherapist = therapists.find((t) => t.id === value);

  const handleSelect = (therapistId: string) => {
    onChange(therapistId);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {selectedTherapist ? (
            <span className="block truncate">
              {selectedTherapist.name}
              {selectedTherapist.specialization && (
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  - {selectedTherapist.specialization}
                </span>
              )}
            </span>
          ) : (
            <span className="block truncate text-gray-500 dark:text-gray-400">
              Seleccionar terapeuta
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
                placeholder="Buscar por nombre, email, teléfono o especialización..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>
            <ul className="py-1">
              {filteredTherapists.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron terapeutas
                </li>
              ) : (
                filteredTherapists.map((therapist) => (
                  <li
                    key={therapist.id}
                    onClick={() => handleSelect(therapist.id)}
                    className={`px-3 py-2 cursor-pointer text-sm ${
                      value === therapist.id
                        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-300"
                        : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="font-medium">{therapist.name}</div>
                    {therapist.specialization && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {therapist.specialization}
                      </div>
                    )}
                    {therapist.email && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {therapist.email}
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

