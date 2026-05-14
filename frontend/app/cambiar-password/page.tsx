"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { toast } from "react-hot-toast";

export default function CambiarPasswordPage() {
  const router = useRouter();
  const { user, isAuthenticated, setMustChangePassword, logout } = useAuthStore();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword(form.currentPassword, form.newPassword);
      setMustChangePassword(false);
      toast.success("Contraseña actualizada. Bienvenido.");
      router.replace("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar contraseña");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 text-2xl mb-3">
            🔑
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Cambiar contraseña
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hola <span className="font-medium">{user?.name}</span>, debes establecer una nueva contraseña antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña temporal
            </label>
            <input
              type="password"
              required
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Contraseña que te asignaron"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                form.confirmPassword && form.newPassword !== form.confirmPassword
                  ? "border-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Repite la nueva contraseña"
            />
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? "Guardando..." : "Establecer nueva contraseña"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
