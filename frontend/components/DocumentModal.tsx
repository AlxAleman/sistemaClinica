"use client";

import { useEffect } from "react";

interface DocumentModalProps {
  document: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    description?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export default function DocumentModal({
  document,
  isOpen,
  onClose,
  onDownload,
}: DocumentModalProps) {
  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.document.addEventListener("keydown", handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      window.document.body.style.overflow = "hidden";
    }

    return () => {
      window.document.removeEventListener("keydown", handleEscape);
      window.document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isImage = document.fileType.startsWith("image/");
  const isPDF = document.fileType === "application/pdf" || document.fileUrl.toLowerCase().endsWith(".pdf");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-6xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con botones */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={onDownload}
            className="bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white rounded-full p-2 shadow-lg transition-colors"
            aria-label="Descargar"
            title="Descargar documento"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full p-2 shadow-lg transition-colors"
            aria-label="Cerrar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Título del documento */}
        <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-lg max-w-md transition-colors">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{document.fileName}</h3>
          {document.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{document.description}</p>
          )}
        </div>

        {/* Contenido del documento */}
        <div className="w-full h-full flex items-center justify-center p-4">
          {isImage ? (
            <img
              src={document.fileUrl}
              alt={document.fileName}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : isPDF ? (
            <iframe
              src={document.fileUrl}
              className="w-full h-[85vh] rounded-lg shadow-2xl border-0"
              title={document.fileName}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl max-w-md text-center transition-colors">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Vista previa no disponible para este tipo de archivo
              </p>
              <button
                onClick={onDownload}
                className="bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Descargar {document.fileName}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

