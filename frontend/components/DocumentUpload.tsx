"use client";

import { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { DocumentCategory } from "@/services/patientService";
import api from "@/services/api";

const CATEGORIES: { value: DocumentCategory; label: string; icon: string; color: string }[] = [
  { value: "receta",      label: "Receta médica",         icon: "💊", color: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300" },
  { value: "radiografia", label: "Radiografía / Imagen",  icon: "🩻", color: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300" },
  { value: "laboratorio", label: "Examen de laboratorio", icon: "🧪", color: "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300" },
  { value: "referencia",  label: "Referencia médica",     icon: "📋", color: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300" },
  { value: "informe",     label: "Informe / Reporte",     icon: "📄", color: "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300" },
  { value: "otro",        label: "Otro documento",        icon: "📁", color: "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" },
];

interface DocumentUploadProps {
  patientId: string;
  onUploadComplete: () => void;
  preselectedCategory?: DocumentCategory;
}

export default function DocumentUpload({ patientId, onUploadComplete, preselectedCategory }: DocumentUploadProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    fileName: "",
    description: "",
    category: (preselectedCategory ?? "otro") as DocumentCategory,
    file: null as File | null,
    preview: null as string | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowed.includes(file.type)) { toast.error("Solo se permiten imágenes (JPG, PNG, WebP, GIF) y PDFs"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("El archivo no debe exceder 20 MB"); return; }
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setFormData(prev => ({ ...prev, fileName: file.name.replace(/\.[^.]+$/, ""), file, preview }));
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.file || !formData.fileName.trim()) { toast.error("Nombre y archivo son requeridos"); return; }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const body = new FormData();
      body.append("file", formData.file, formData.file.name);
      body.append("fileName", formData.fileName.trim());
      body.append("category", formData.category);
      if (formData.description) body.append("description", formData.description);

      await api.post(`/patients/${patientId}/documents`, body, {
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      toast.success("Documento subido a Cloudflare R2");
      if (formData.preview) URL.revokeObjectURL(formData.preview);
      setFormData({ fileName: "", description: "", category: preselectedCategory ?? "otro", file: null, preview: null });
      setUploadProgress(0);
      setIsModalOpen(false);
      onUploadComplete();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al subir el documento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (formData.preview) URL.revokeObjectURL(formData.preview);
    setFormData({ fileName: "", description: "", category: preselectedCategory ?? "otro", file: null, preview: null });
    setUploadProgress(0);
    setIsModalOpen(false);
  };

  const formatSize = (bytes: number) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Subir documento
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleClose}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Subir documento</h2>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Image preview */}
              {formData.preview && (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <img src={formData.preview} alt="Preview" className="max-h-52 w-full object-contain" />
                </div>
              )}

              {/* File info pill */}
              {formData.file && (
                <div className="mb-4 flex items-center gap-2.5 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 text-xs">
                  {formData.file.type === "application/pdf"
                    ? <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    : <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  }
                  <span className="text-gray-600 dark:text-gray-300 truncate flex-1">{formData.file.name}</span>
                  <span className="text-gray-400 flex-shrink-0">{formatSize(formData.file.size)}</span>
                </div>
              )}

              {/* Categoría */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Categoría</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        formData.category === cat.value
                          ? cat.color + " ring-2 ring-offset-1 ring-current"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="truncate text-xs">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Nombre del documento *</label>
                <input
                  type="text"
                  value={formData.fileName}
                  onChange={e => setFormData(prev => ({ ...prev, fileName: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Radiografía de rodilla derecha"
                />
              </div>

              {/* Descripción */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Notas adicionales</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={2}
                  placeholder="Notas sobre este documento..."
                />
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Subiendo a R2...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button onClick={handleClose} disabled={isUploading} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isUploading || !formData.fileName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isUploading ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Subiendo...</>
                  ) : (
                    "Guardar en R2"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
