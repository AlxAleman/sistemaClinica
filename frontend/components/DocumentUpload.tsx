"use client";

import { useState, useRef, DragEvent } from "react";
import { toast } from "react-hot-toast";

interface DocumentUploadProps {
  patientId: string;
  onUploadComplete: () => void;
}

interface UploadFormData {
  fileName: string;
  description: string;
  file: File | null;
  preview: string | null;
}

export default function DocumentUpload({
  patientId,
  onUploadComplete,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<UploadFormData>({
    fileName: "",
    description: "",
    file: null,
    preview: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Solo cambiar estado si realmente salimos del área
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validar tipo de archivo
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Solo se permiten imágenes y PDFs");
      return;
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no debe exceder 10MB");
      return;
    }

    const preview = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null;

    setFormData({
      fileName: file.name,
      description: "",
      file,
      preview,
    });
    setIsModalOpen(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!formData.file) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    if (!formData.fileName.trim()) {
      toast.error("Por favor ingresa un nombre para el documento");
      return;
    }

    setIsUploading(true);

    try {
      // Convertir archivo a base64 para enviarlo
      const base64File = await convertFileToBase64(formData.file);
      
      // Enviar al backend usando el servicio API
      const { patientService } = await import("@/services/patientService");
      
      await patientService.uploadDocument(patientId, {
        fileName: formData.fileName,
        fileUrl: base64File, // Por ahora usamos base64, luego se puede cambiar a S3
        fileType: formData.file.type,
        description: formData.description || null,
      });

      toast.success("Documento subido exitosamente");
      
      // Limpiar formulario
      setFormData({
        fileName: "",
        description: "",
        file: null,
        preview: null,
      });
      setIsModalOpen(false);
      
      // Limpiar preview URL
      if (formData.preview) {
        URL.revokeObjectURL(formData.preview);
      }

      onUploadComplete();
    } catch (error: any) {
      toast.error(error.message || "Error al subir el documento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (formData.preview) {
      URL.revokeObjectURL(formData.preview);
    }
    setFormData({
      fileName: "",
      description: "",
      file: null,
      preview: null,
    });
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Zona de drag & drop */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragging
              ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <svg
          className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-gray-600 dark:text-gray-300 font-medium">
          Arrastra y suelta un archivo aquí, o haz clic para seleccionar
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Imágenes y PDFs (máx. 10MB)
        </p>
      </div>

      {/* Modal para agregar notas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Agregar Documento
              </h2>

              {/* Preview de la imagen */}
              {formData.preview && (
                <div className="mb-4">
                  <img
                    src={formData.preview}
                    alt="Preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                </div>
              )}

              {/* Nombre del archivo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Documento *
                </label>
                <input
                  type="text"
                  value={formData.fileName}
                  onChange={(e) =>
                    setFormData({ ...formData, fileName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Ej: Radiografía de rodilla"
                  required
                />
              </div>

              {/* Descripción/Notas */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas o Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                  rows={4}
                  placeholder="Agrega notas sobre este examen o documento..."
                />
              </div>

              {/* Información del archivo */}
              {formData.file && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Tipo:</span> {formData.file.type}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Tamaño:</span>{" "}
                    {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  disabled={isUploading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isUploading || !formData.fileName.trim()}
                  className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-md text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading ? "Subiendo..." : "Guardar Documento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

