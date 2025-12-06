"use client";

import { ReactNode } from "react";
import { InfoIcon } from "./Icons";
import Tooltip from "./Tooltip";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export default function FormField({
  label,
  required = false,
  error,
  hint,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        <span className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
          {hint && (
            <Tooltip content={hint} position="right">
              <InfoIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-help" />
            </Tooltip>
          )}
        </span>
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

