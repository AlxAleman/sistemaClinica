"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, helperText, className = "", ...props }, ref) => {
    return (
      <div>
        <input
          ref={ref}
          className={`
            mt-1 block w-full rounded-md border shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-offset-0
            sm:text-sm transition-colors
            ${
              error
                ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 placeholder-red-300 dark:placeholder-red-700"
                : "border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            }
            ${className}
          `}
          {...props}
        />
        {helperText && (
          <p
            className={`mt-1 text-xs ${
              error
                ? "text-red-600 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

