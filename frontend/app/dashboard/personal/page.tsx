"use client";

import { useEffect, useState, useMemo } from "react";
import { userService, AppUser, UserRole } from "@/services/userService";
import { therapistService, Therapist } from "@/services/therapistService";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface TherapistRecord extends Therapist {
  _count?: { appointments: number; sessions: number };
}

interface StaffMember extends AppUser {
  therapist?: TherapistRecord;
}

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-cyan-500",
  "bg-teal-500", "bg-emerald-500", "bg-rose-500", "bg-orange-500",
  "bg-pink-500", "bg-amber-600",
];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name: string) => {
  const n = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
};

const ROLE_BADGE: Record<UserRole, { label: string; cls: string }> = {
  ADMIN:              { label: "Admin",          cls: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  SUPERVISOR:         { label: "Supervisor",     cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  THERAPIST:          { label: "Terapeuta",      cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  EXTERNAL_THERAPIST: { label: "Externo",        cls: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
  RECEPCION:          { label: "Recepción",      cls: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
  CONTABILIDAD:       { label: "Contabilidad",   cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
};

const ALL_ROLES: { id: UserRole; label: string }[] = [
  { id: "ADMIN",              label: "Administrador"     },
  { id: "SUPERVISOR",         label: "Supervisor"        },
  { id: "THERAPIST",          label: "Terapeuta"         },
  { id: "EXTERNAL_THERAPIST", label: "Terapeuta Externo" },
  { id: "RECEPCION",          label: "Recepción"         },
  { id: "CONTABILIDAD",       label: "Contabilidad"      },
];

const GROUPS: { roles: UserRole[]; title: string }[] = [
  { roles: ["EXTERNAL_THERAPIST"],  title: "Terapeutas Externos" },
  { roles: ["THERAPIST"],           title: "Terapeutas" },
  { roles: ["RECEPCION"],           title: "Recepción" },
  { roles: ["ADMIN", "SUPERVISOR"], title: "Administración" },
  { roles: ["CONTABILIDAD"],        title: "Contabilidad" },
];

// ── Edit Modal ────────────────────────────────────────────────────────────────

interface EditForm {
  name: string;
  role: UserRole;
  password: string;
  phone: string;
  specialization: string;
}

function EditModal({
  member,
  onClose,
  onSave,
}: {
  member: StaffMember;
  onClose: () => void;
  onSave: (updated: StaffMember) => void;
}) {
  const isTherapist = member.role === "THERAPIST" || member.role === "EXTERNAL_THERAPIST";
  const [form, setForm] = useState<EditForm>({
    name:           member.name,
    role:           member.role,
    password:       "",
    phone:          member.therapist?.phone ?? "",
    specialization: member.therapist?.specialization ?? "",
  });
  const [saving, setSaving] = useState(false);

  const hasTherapistFields =
    form.role === "THERAPIST" || form.role === "EXTERNAL_THERAPIST";

  const handleSave = async () => {
    setSaving(true);
    try {
      const userPayload: Parameters<typeof userService.update>[1] = {};
      if (form.name !== member.name) userPayload.name = form.name;
      if (form.role !== member.role) userPayload.role = form.role;
      if (form.password) userPayload.password = form.password;

      const updatedUser = await userService.update(member.id, userPayload);

      let updatedTherapist = member.therapist;
      if (member.therapistId && updatedTherapist) {
        const therapistPayload: Parameters<typeof therapistService.update>[1] = {};
        if (form.phone !== member.therapist?.phone) therapistPayload.phone = form.phone;
        if (form.specialization !== (member.therapist?.specialization ?? ""))
          therapistPayload.specialization = form.specialization || null;
        if (Object.keys(therapistPayload).length > 0) {
          updatedTherapist = await therapistService.update(member.therapistId, therapistPayload);
        }
      }

      onSave({ ...updatedUser, therapist: updatedTherapist });
      toast.success("Usuario actualizado");
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-xs font-semibold">{getInitials(member.name)}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{member.name}</p>
              <p className="text-xs text-gray-400">{member.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rol</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ALL_ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          {hasTherapistFields && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(+502) 0000-0000"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Especialidad</label>
                <input
                  type="text"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  placeholder="Ej. Fisioterapia deportiva"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Nueva contraseña <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Staff Card ────────────────────────────────────────────────────────────────

function StaffCard({
  member,
  onToggleActive,
  onEdit,
  toggling,
}: {
  member: StaffMember;
  onToggleActive: (id: string, active: boolean) => void;
  onEdit: (member: StaffMember) => void;
  toggling: string | null;
}) {
  const badge = ROLE_BADGE[member.role];
  const t = member.therapist;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-start gap-3 transition-opacity ${!member.isActive ? "opacity-50" : ""}`}>
      <div className={`w-10 h-10 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center flex-shrink-0`}>
        <span className="text-white text-sm font-semibold">{getInitials(member.name)}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">{member.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{member.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1 flex-shrink-0">
            {!member.isActive && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                Inactivo
              </span>
            )}
            {member.mustChangePassword && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" title="Debe cambiar su contraseña al primer acceso">
                Temporal
              </span>
            )}
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
        </div>

        {t?.specialization && (
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{t.specialization}</p>
        )}

        {t?.phone && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{t.phone}</p>
        )}

        {t?._count && (
          <div className="flex gap-3 mt-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              <span className="font-semibold text-gray-600 dark:text-gray-400">{t._count.appointments}</span> citas
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              <span className="font-semibold text-gray-600 dark:text-gray-400">{t._count.sessions}</span> sesiones
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => onToggleActive(member.id, !member.isActive)}
            disabled={toggling === member.id}
            className="text-xs px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
          >
            {toggling === member.id ? "..." : member.isActive ? "Desactivar" : "Activar"}
          </button>
          <button
            onClick={() => onEdit(member)}
            className="text-xs px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium transition-colors"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Group Section ─────────────────────────────────────────────────────────────

function GroupSection({
  title, members, onToggleActive, onEdit, toggling,
}: {
  title: string;
  members: StaffMember[];
  onToggleActive: (id: string, active: boolean) => void;
  onEdit: (member: StaffMember) => void;
  toggling: string | null;
}) {
  if (members.length === 0) return null;
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{title}</p>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-600">{members.length}</span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {members.map((m) => (
          <StaffCard key={m.id} member={m} onToggleActive={onToggleActive} onEdit={onEdit} toggling={toggling} />
        ))}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PersonalPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "ALL">("ALL");
  const [toggling, setToggling] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, therapistsRes] = await Promise.all([
          userService.getAll(),
          therapistService.getAll({ limit: 200 }),
        ]);
        const tMap = new Map(therapistsRes.therapists.map((t) => [t.id, t as TherapistRecord]));
        setStaff(users.map((u) => ({ ...u, therapist: u.therapistId ? tMap.get(u.therapistId) : undefined })));
      } catch {
        toast.error("Error al cargar el personal");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggleActive = async (id: string, active: boolean) => {
    setToggling(id);
    try {
      const updated = await userService.update(id, { isActive: active });
      setStaff((prev) => prev.map((m) => (m.id === id ? { ...m, isActive: updated.isActive } : m)));
      toast.success(active ? "Usuario activado" : "Usuario desactivado");
    } catch {
      toast.error("Error al actualizar el usuario");
    } finally {
      setToggling(null);
    }
  };

  const handleSaveEdit = (updated: StaffMember) => {
    setStaff((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setEditingMember(null);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return staff.filter((m) => {
      const matchRole = filterRole === "ALL" || m.role === filterRole;
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.therapist?.specialization ?? "").toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [staff, search, filterRole]);

  const counts = useMemo(() => {
    const c: Partial<Record<UserRole, number>> = {};
    for (const m of staff) c[m.role] = (c[m.role] ?? 0) + 1;
    return c;
  }, [staff]);

  const filterOptions: { role: UserRole | "ALL"; label: string }[] = [
    { role: "ALL",              label: `Todos (${staff.length})` },
    { role: "EXTERNAL_THERAPIST", label: `Externos (${counts.EXTERNAL_THERAPIST ?? 0})` },
    { role: "THERAPIST",        label: `Terapeutas (${counts.THERAPIST ?? 0})` },
    { role: "RECEPCION",        label: `Recepción (${counts.RECEPCION ?? 0})` },
    { role: "ADMIN",            label: `Admin (${(counts.ADMIN ?? 0) + (counts.SUPERVISOR ?? 0)})` },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Personal</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {staff.filter((m) => m.isActive).length} activos &middot; {staff.filter((m) => !m.isActive).length} inactivos
          </p>
        </div>
        <Link
          href="/dashboard/config?tab=usuarios"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          + Agregar usuario
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o especialidad..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
        />
        <div className="flex flex-wrap gap-1.5">
          {filterOptions.map(({ role, label }) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                filterRole === role
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm">No se encontró personal con esos filtros</p>
        </div>
      ) : (
        <div className="space-y-8">
          {GROUPS.map((group) => (
            <GroupSection
              key={group.title}
              title={group.title}
              members={filtered.filter((m) => (group.roles as string[]).includes(m.role))}
              onToggleActive={handleToggleActive}
              onEdit={setEditingMember}
              toggling={toggling}
            />
          ))}
        </div>
      )}

      {editingMember && (
        <EditModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
