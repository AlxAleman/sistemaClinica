"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { configService, SystemConfig } from "@/services/configService";
import { userService, AppUser, CreateUserData, UserRole } from "@/services/userService";
import Breadcrumbs from "@/components/Breadcrumbs";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Building2, Users, ShieldCheck, Settings, ImageIcon, Palette,
  UserPlus, Brain, Clock, Calendar, Timer, AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "clinica" | "usuarios" | "roles" | "operacion";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "clinica",   label: "Clínica",          icon: Building2 },
  { id: "usuarios",  label: "Usuarios",          icon: Users },
  { id: "roles",     label: "Roles y Accesos",   icon: ShieldCheck },
  { id: "operacion", label: "Operación",         icon: Settings },
];

const ACCENT_COLORS = [
  { id: "indigo", label: "Índigo",   bg: "bg-indigo-500",  ring: "ring-indigo-500"  },
  { id: "violet", label: "Violeta",  bg: "bg-violet-500",  ring: "ring-violet-500"  },
  { id: "teal",   label: "Teal",     bg: "bg-teal-500",    ring: "ring-teal-500"    },
  { id: "emerald",label: "Esmeralda",bg: "bg-emerald-500", ring: "ring-emerald-500" },
  { id: "rose",   label: "Rosa",     bg: "bg-rose-500",    ring: "ring-rose-500"    },
  { id: "amber",  label: "Ámbar",    bg: "bg-amber-500",   ring: "ring-amber-500"   },
];

const MODULES = [
  { key: "patients",      label: "Pacientes" },
  { key: "appointments",  label: "Citas" },
  { key: "treatments",    label: "Tratamientos" },
  { key: "diagnoses",     label: "Diagnósticos" },
  { key: "expedientes",   label: "Expedientes" },
  { key: "evaluations",   label: "Evaluaciones" },
  { key: "prescriptions", label: "Prescripciones" },
  { key: "payments",      label: "Pagos" },
  { key: "invoices",      label: "Facturas" },
  { key: "reports",       label: "Reportes" },
  { key: "config",        label: "Configuración" },
];

const ROLES: { id: UserRole; label: string }[] = [
  { id: "ADMIN",              label: "Administrador"     },
  { id: "THERAPIST",          label: "Terapeuta"         },
  { id: "RECEPCION",          label: "Recepción"         },
  { id: "CONTABILIDAD",       label: "Contabilidad"      },
  { id: "SUPERVISOR",         label: "Supervisor"        },
  { id: "EXTERNAL_THERAPIST", label: "Terapeuta Externo" },
];

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN:              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  THERAPIST:          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  RECEPCION:          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CONTABILIDAD:       "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  SUPERVISOR:         "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  EXTERNAL_THERAPIST: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConfigPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("clinica");

  // ── Clínica ──
  const [clinicFields, setClinicFields] = useState({
    clinic_name: "", clinic_accent_color: "indigo",
    clinic_phone: "", clinic_email: "", clinic_address: "",
  });
  const [clinicLogoUrl, setClinicLogoUrl] = useState("");
  const [logoFile, setLogoFile]         = useState<File | null>(null);
  const [logoPreview, setLogoPreview]   = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingClinic, setSavingClinic] = useState(false);

  // ── Usuarios ──
  const [users, setUsers]             = useState<AppUser[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser]  = useState<AppUser | null>(null);
  const [deleteUserDialog, setDeleteUserDialog] = useState<AppUser | null>(null);
  const [savingUser, setSavingUser]    = useState(false);
  const [userPrefix, setUserPrefix]    = useState("Dr.");
  const [userForm, setUserForm]        = useState<CreateUserData>({
    name: "", email: "", password: "", role: "THERAPIST", phone: "", specialization: "",
  });
  const [editUserForm, setEditUserForm] = useState<{ name: string; role: UserRole; password: string }>({
    name: "", role: "THERAPIST", password: "",
  });

  // ── Roles ──
  const [rolePerms, setRolePerms]    = useState<Record<string, Record<string, boolean>>>({});
  const [savingRoles, setSavingRoles] = useState(false);

  // ── Operación ──
  const [therapyTypes, setTherapyTypes]     = useState<string[]>([]);
  const [editingTherapy, setEditingTherapy] = useState(false);
  const [therapyDraft, setTherapyDraft]     = useState("");
  const [savingTherapy, setSavingTherapy]   = useState(false);
  const [scheduleFields, setScheduleFields] = useState({
    morning_shift_start: "", morning_shift_end: "",
    afternoon_shift_start: "", afternoon_shift_end: "",
    morning_therapists_count: "", afternoon_therapists_count: "",
  });
  const [savingSchedules, setSavingSchedules] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState("60");
  const [savingSessions, setSavingSessions]   = useState(false);
  const [restoreDialog, setRestoreDialog]     = useState(false);
  const [restoringDefaults, setRestoringDefaults] = useState(false);
  const [calendarDefaultView, setCalendarDefaultView] = useState<"month" | "week" | "day">("week");

  // ─── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("calendarDefaultView");
      if (saved === "month" || saved === "week" || saved === "day") setCalendarDefaultView(saved);
    } catch {}
    Promise.all([fetchAllConfigs(), fetchUsers()]).finally(() => setLoading(false));
  }, []);

  const fetchUsers = async () => {
    try { setUsers(await userService.getAll()); } catch { /* silent */ }
  };

  const fetchAllConfigs = async () => {
    try {
      const all = await configService.getAll();
      const v = (key: string, fb = "") => all.find(c => c.key === key)?.value ?? fb;

      setClinicFields({
        clinic_name:         v("clinic_name", "Mi Clínica"),
        clinic_accent_color: v("clinic_accent_color", "indigo"),
        clinic_phone:        v("clinic_phone"),
        clinic_email:        v("clinic_email"),
        clinic_address:      v("clinic_address"),
      });
      const logoUrl = v("clinic_logo_url");
      setClinicLogoUrl(logoUrl);
      if (logoUrl) setLogoPreview(logoUrl);

      try {
        const rp = JSON.parse(v("role_permissions", "{}"));
        setRolePerms(rp);
      } catch { setRolePerms({}); }

      try {
        const parsed = JSON.parse(v("therapy_types", "[]"));
        if (Array.isArray(parsed)) { setTherapyTypes(parsed); setTherapyDraft(parsed.join(", ")); }
      } catch { setTherapyTypes([]); }

      setScheduleFields({
        morning_shift_start:      v("morning_shift_start", "07:00"),
        morning_shift_end:        v("morning_shift_end", "12:00"),
        afternoon_shift_start:    v("afternoon_shift_start", "12:00"),
        afternoon_shift_end:      v("afternoon_shift_end", "17:00"),
        morning_therapists_count:   v("morning_therapists_count", "2"),
        afternoon_therapists_count: v("afternoon_therapists_count", "1"),
      });
      setDefaultDuration(v("default_session_duration", "60"));
    } catch { toast.error("Error al cargar la configuración"); }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const url = await configService.uploadLogo(logoFile);
      setClinicLogoUrl(url);
      setLogoFile(null);
      toast.success("Logo actualizado");
    } catch { toast.error("Error al subir el logo"); }
    finally { setUploadingLogo(false); }
  };

  const handleSaveClinic = async () => {
    setSavingClinic(true);
    try {
      await Promise.all(
        Object.entries(clinicFields).map(([key, value]) =>
          configService.upsert(key, { value, category: "clinic" })
        )
      );
      toast.success("Datos de la clínica guardados");
    } catch { toast.error("Error al guardar"); }
    finally { setSavingClinic(false); }
  };

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast.error("Nombre, correo y contraseña son obligatorios"); return;
    }
    setSavingUser(true);
    try {
      const created = await userService.create({ ...userForm, name: `${userPrefix} ${userForm.name}` });
      setUsers(prev => [...prev, created]);
      setShowUserForm(false);
      setUserPrefix("Dr.");
      setUserForm({ name: "", email: "", password: "", role: "THERAPIST", phone: "", specialization: "" });
      toast.success("Usuario creado — recibirá sus credenciales en el primer acceso");
    } catch (e: any) { toast.error(e.response?.data?.error || "Error al crear usuario"); }
    finally { setSavingUser(false); }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const updated = await userService.update(editingUser.id, {
        name: editUserForm.name || undefined,
        role: editUserForm.role,
        ...(editUserForm.password ? { password: editUserForm.password } : {}),
      });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setEditingUser(null);
      toast.success("Usuario actualizado");
    } catch (e: any) { toast.error(e.response?.data?.error || "Error al actualizar"); }
    finally { setSavingUser(false); }
  };

  const handleToggleActive = async (user: AppUser) => {
    try {
      const updated = await userService.update(user.id, { isActive: !user.isActive });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      toast.success(updated.isActive ? "Usuario activado" : "Usuario desactivado");
    } catch { toast.error("Error al actualizar estado"); }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserDialog) return;
    try {
      await userService.delete(deleteUserDialog.id);
      setUsers(prev => prev.filter(u => u.id !== deleteUserDialog.id));
      setDeleteUserDialog(null);
      toast.success("Usuario eliminado");
    } catch (e: any) { toast.error(e.response?.data?.error || "Error al eliminar"); }
  };

  const handleTogglePerm = (role: string, mod: string) => {
    if (role === "ADMIN" && mod === "config") return; // config siempre activo para ADMIN
    setRolePerms(prev => ({
      ...prev,
      [role]: { ...(prev[role] ?? {}), [mod]: !(prev[role]?.[mod] ?? false) },
    }));
  };

  const handleSaveRoles = async () => {
    setSavingRoles(true);
    try {
      await configService.upsert("role_permissions", {
        value: JSON.stringify(rolePerms), category: "roles",
        description: "Permisos de acceso por rol (JSON)",
      });
      toast.success("Permisos guardados");
    } catch { toast.error("Error al guardar permisos"); }
    finally { setSavingRoles(false); }
  };

  const handleSaveTherapyTypes = async () => {
    const types = therapyDraft.split(",").map(s => s.trim()).filter(Boolean);
    setSavingTherapy(true);
    try {
      await configService.upsert("therapy_types", { value: JSON.stringify(types), category: "therapy_types" });
      setTherapyTypes(types); setEditingTherapy(false);
      toast.success("Tipos de terapia actualizados");
    } catch { toast.error("Error al guardar tipos de terapia"); }
    finally { setSavingTherapy(false); }
  };

  const handleSaveSchedules = async () => {
    setSavingSchedules(true);
    try {
      await Promise.all(
        Object.entries(scheduleFields).map(([key, value]) =>
          configService.upsert(key, { value, category: "schedules" })
        )
      );
      toast.success("Horarios guardados");
    } catch { toast.error("Error al guardar horarios"); }
    finally { setSavingSchedules(false); }
  };

  const handleSaveSessions = async () => {
    const d = parseInt(defaultDuration, 10);
    if (isNaN(d) || d <= 0) { toast.error("Duración inválida"); return; }
    setSavingSessions(true);
    try {
      await configService.upsert("default_session_duration", { value: String(d), category: "session_durations" });
      toast.success("Configuración de sesiones guardada");
    } catch { toast.error("Error al guardar"); }
    finally { setSavingSessions(false); }
  };

  const handleRestoreDefaults = async () => {
    setRestoringDefaults(true);
    try {
      await configService.initDefaults();
      await fetchAllConfigs();
      toast.success("Valores predeterminados restaurados");
    } catch { toast.error("Error al restaurar"); }
    finally { setRestoringDefaults(false); setRestoreDialog(false); }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-5xl mx-auto">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Configuración" }]} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuración</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra los parámetros del sistema</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300"
              }`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab: Clínica ─────────────────────────────────────────────────────── */}
      {activeTab === "clinica" && (
        <div className="space-y-6">
          <Card title="Perfil de la Clínica" icon={<Building2 className="w-4 h-4" />}>
            <div className="space-y-4">
              <Field label="Nombre de la clínica">
                <input type="text" value={clinicFields.clinic_name}
                  onChange={e => setClinicFields(p => ({ ...p, clinic_name: e.target.value }))}
                  className={inputCls} placeholder="Clínica Fisioterapia..." />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Teléfono">
                  <input type="text" value={clinicFields.clinic_phone}
                    onChange={e => setClinicFields(p => ({ ...p, clinic_phone: e.target.value }))}
                    className={inputCls} placeholder="+503 2222-3333" />
                </Field>
                <Field label="Email">
                  <input type="email" value={clinicFields.clinic_email}
                    onChange={e => setClinicFields(p => ({ ...p, clinic_email: e.target.value }))}
                    className={inputCls} placeholder="contacto@clinica.com" />
                </Field>
              </div>
              <Field label="Dirección">
                <input type="text" value={clinicFields.clinic_address}
                  onChange={e => setClinicFields(p => ({ ...p, clinic_address: e.target.value }))}
                  className={inputCls} placeholder="Av. Principal #123, Ciudad..." />
              </Field>
            </div>
          </Card>

          <Card title="Logo de la Clínica" icon={<ImageIcon className="w-4 h-4" />}>
            <div className="flex items-start gap-5">
              {/* Preview */}
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-700/30">
                {logoPreview
                  ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                  : <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                }
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Formato PNG o JPG, máximo 5 MB. Se mostrará en el navbar del sistema.
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Seleccionar imagen
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} className="hidden" />
                </label>
                {logoFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{logoFile.name}</span>
                    <button onClick={handleUploadLogo} disabled={uploadingLogo}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors">
                      {uploadingLogo ? "Subiendo..." : "Subir logo"}
                    </button>
                    <button onClick={() => { setLogoFile(null); setLogoPreview(clinicLogoUrl); }}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Cancelar
                    </button>
                  </div>
                )}
                {clinicLogoUrl && !logoFile && (
                  <p className="text-xs text-green-600 dark:text-green-400">✓ Logo guardado</p>
                )}
              </div>
            </div>
          </Card>

          <Card title="Color de acento" icon={<Palette className="w-4 h-4" />}>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Elige el color principal que se usará en botones y acentos del sistema.
            </p>
            <div className="flex flex-wrap gap-3">
              {ACCENT_COLORS.map(c => (
                <button key={c.id} onClick={() => setClinicFields(p => ({ ...p, clinic_accent_color: c.id }))}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                    clinicFields.clinic_accent_color === c.id
                      ? "border-gray-900 dark:border-white scale-105"
                      : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                  }`}>
                  <span className={`w-8 h-8 rounded-full ${c.bg} ${clinicFields.clinic_accent_color === c.id ? `ring-2 ring-offset-2 ${c.ring}` : ""}`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{c.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <button onClick={handleSaveClinic} disabled={savingClinic}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
              {savingClinic ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Usuarios ────────────────────────────────────────────────────── */}
      {activeTab === "usuarios" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">{users.length} usuario{users.length !== 1 ? "s" : ""} registrados</p>
            <button onClick={() => { setShowUserForm(true); setEditingUser(null); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
              + Nuevo usuario
            </button>
          </div>

          {/* Form crear */}
          {showUserForm && !editingUser && (
            <Card title="Nuevo Usuario" icon={<UserPlus className="w-4 h-4" />}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Prefijo">
                    <select value={userPrefix} onChange={e => setUserPrefix(e.target.value)} className={inputCls}>
                      {["Dr.", "Dra.", "Lic.", "Lcda.", "Tec.", ""].map(p => <option key={p} value={p}>{p || "Sin prefijo"}</option>)}
                    </select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Nombre completo">
                      <input type="text" value={userForm.name}
                        onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))}
                        className={inputCls} placeholder="Nombre..." />
                    </Field>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Correo electrónico">
                    <input type="email" value={userForm.email}
                      onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                      className={inputCls} placeholder="correo@clinica.com" />
                  </Field>
                  <Field label="Contraseña temporal">
                    <input type="text" value={userForm.password}
                      onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))}
                      className={inputCls} placeholder="Contraseña provisional..." />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Rol">
                    <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value as UserRole }))} className={inputCls}>
                      {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </Field>
                  {(userForm.role === "THERAPIST" || userForm.role === "EXTERNAL_THERAPIST") && (
                    <Field label="Especialización">
                      <input type="text" value={userForm.specialization ?? ""}
                        onChange={e => setUserForm(p => ({ ...p, specialization: e.target.value }))}
                        className={inputCls} placeholder="Ej: Fisioterapia Deportiva" />
                    </Field>
                  )}
                </div>
                <p className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  El usuario deberá cambiar su contraseña en el primer inicio de sesión.
                </p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowUserForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleCreateUser} disabled={savingUser}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                    {savingUser ? "Creando..." : "Crear usuario"}
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Lista de usuarios */}
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className={`bg-white dark:bg-gray-800 rounded-2xl border ${user.isActive ? "border-gray-100 dark:border-gray-700" : "border-gray-200 dark:border-gray-600 opacity-60"} p-4`}>
                {editingUser?.id === user.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Field label="Nombre">
                        <input type="text" value={editUserForm.name}
                          onChange={e => setEditUserForm(p => ({ ...p, name: e.target.value }))}
                          className={inputCls} />
                      </Field>
                      <Field label="Rol">
                        <select value={editUserForm.role} onChange={e => setEditUserForm(p => ({ ...p, role: e.target.value as UserRole }))} className={inputCls}>
                          {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                      </Field>
                      <Field label="Nueva contraseña (opcional)">
                        <input type="text" value={editUserForm.password}
                          onChange={e => setEditUserForm(p => ({ ...p, password: e.target.value }))}
                          className={inputCls} placeholder="Dejar en blanco para no cambiar" />
                      </Field>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingUser(null)}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Cancelar
                      </button>
                      <button onClick={handleUpdateUser} disabled={savingUser}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors">
                        {savingUser ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${ROLE_COLORS[user.role]}`}>
                          {ROLES.find(r => r.id === user.role)?.label ?? user.role}
                        </span>
                        {user.mustChangePassword && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Primer acceso pendiente
                          </span>
                        )}
                        {!user.isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                            Desactivado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setEditingUser(user); setEditUserForm({ name: user.name, role: user.role, password: "" }); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Editar">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleToggleActive(user)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${user.isActive ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "text-amber-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"}`}
                        title={user.isActive ? "Desactivar" : "Activar"}>
                        {user.isActive
                          ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        }
                      </button>
                      <button onClick={() => setDeleteUserDialog(user)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Roles y Accesos ─────────────────────────────────────────────── */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define qué módulos puede acceder cada rol. Los cambios se aplican al guardar.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-36">
                      Módulo
                    </th>
                    {ROLES.map(r => (
                      <th key={r.id} className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${ROLE_COLORS[r.id]}`}>
                          {r.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {MODULES.map(mod => (
                    <tr key={mod.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {mod.label}
                      </td>
                      {ROLES.map(r => {
                        const locked = r.id === "ADMIN" && mod.key === "config";
                        const active = locked ? true : (rolePerms[r.id]?.[mod.key] ?? false);
                        return (
                          <td key={r.id} className="px-3 py-3 text-center">
                            <button
                              onClick={() => handleTogglePerm(r.id, mod.key)}
                              disabled={locked}
                              className={`w-8 h-5 rounded-full transition-colors relative ${active ? "bg-indigo-500" : "bg-gray-200 dark:bg-gray-600"} ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                              title={locked ? "Siempre activo para ADMIN" : undefined}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${active ? "left-3.5" : "left-0.5"}`} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveRoles} disabled={savingRoles}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
              {savingRoles ? "Guardando..." : "Guardar permisos"}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Operación ───────────────────────────────────────────────────── */}
      {activeTab === "operacion" && (
        <div className="space-y-6">
          {/* Tipos de Terapia */}
          <Card title="Tipos de Terapia" icon={<Brain className="w-4 h-4" />}
            action={!editingTherapy ? (
              <button onClick={() => { setTherapyDraft(therapyTypes.join(", ")); setEditingTherapy(true); }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                Editar lista
              </button>
            ) : undefined}>
            {!editingTherapy ? (
              <div className="flex flex-wrap gap-2">
                {therapyTypes.length === 0
                  ? <p className="text-sm text-gray-400 italic">Sin tipos configurados</p>
                  : therapyTypes.map((t, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">{t}</span>
                  ))}
              </div>
            ) : (
              <div className="space-y-3">
                <textarea rows={4} value={therapyDraft} onChange={e => setTherapyDraft(e.target.value)}
                  placeholder="Fisioterapia, Hidroterapia, Electroterapia, ..."
                  className={`${inputCls} resize-none`} />
                <p className="text-xs text-gray-400">Separados por coma</p>
                <div className="flex gap-2">
                  <button onClick={handleSaveTherapyTypes} disabled={savingTherapy}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                    {savingTherapy ? "Guardando..." : "Guardar"}
                  </button>
                  <button onClick={() => setEditingTherapy(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Horarios */}
          <Card title="Horarios de Atención" icon={<Clock className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: "Turno Mañana",  keys: ["morning_shift_start",   "morning_shift_end",   "morning_therapists_count"]   },
                { label: "Turno Tarde",   keys: ["afternoon_shift_start", "afternoon_shift_end", "afternoon_therapists_count"] },
              ].map(shift => (
                <div key={shift.label} className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{shift.label}</h3>
                  {shift.keys.map(key => (
                    <Field key={key} label={key.includes("start") ? "Hora inicio" : key.includes("end") ? "Hora fin" : "Nº terapeutas"}>
                      <input
                        type={key.includes("count") ? "number" : "time"} min={key.includes("count") ? 1 : undefined}
                        value={(scheduleFields as any)[key]}
                        onChange={e => setScheduleFields(p => ({ ...p, [key]: e.target.value }))}
                        className={inputCls} />
                    </Field>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handleSaveSchedules} disabled={savingSchedules}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                {savingSchedules ? "Guardando..." : "Guardar horarios"}
              </button>
            </div>
          </Card>

          {/* Calendario */}
          <Card title="Calendario" icon={<Calendar className="w-4 h-4" />}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Vista predeterminada al abrir el calendario</p>
            <div className="flex gap-2">
              {(["month", "week", "day"] as const).map(v => {
                const labels: Record<string, string> = { month: "Mes", week: "Semana", day: "Día" };
                return (
                  <button
                    key={v}
                    onClick={() => {
                      try { localStorage.setItem("calendarDefaultView", v); } catch {}
                      setCalendarDefaultView(v);
                      toast.success(`Vista "${labels[v]}" guardada`);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                      calendarDefaultView === v
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                        : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {labels[v]}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Sesiones */}
          <Card title="Sesiones" icon={<Timer className="w-4 h-4" />}>
            <Field label="Duración predeterminada (minutos)">
              <input type="number" min={1} value={defaultDuration}
                onChange={e => setDefaultDuration(e.target.value)}
                className={`${inputCls} max-w-[140px]`} />
            </Field>
            <div className="mt-4 flex justify-end">
              <button onClick={handleSaveSessions} disabled={savingSessions}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                {savingSessions ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </Card>

          {/* Restaurar */}
          <div className="flex justify-end">
            <button onClick={() => setRestoreDialog(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Restaurar valores predeterminados
            </button>
          </div>
        </div>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────────────── */}
      <ConfirmDialog isOpen={!!deleteUserDialog} onClose={() => setDeleteUserDialog(null)}
        onConfirm={handleDeleteUser} title="Eliminar usuario"
        message={`¿Eliminar a "${deleteUserDialog?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar" cancelText="Cancelar" type="danger" />

      <ConfirmDialog isOpen={restoreDialog} onClose={() => setRestoreDialog(false)}
        onConfirm={handleRestoreDefaults} title="Restaurar valores predeterminados"
        message="¿Restaurar todos los valores de operación a sus defaults? Los datos de la clínica y usuarios no se verán afectados."
        confirmText={restoringDefaults ? "Restaurando..." : "Restaurar"}
        cancelText="Cancelar" type="warning" />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";

function Card({ title, icon, children, action }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
