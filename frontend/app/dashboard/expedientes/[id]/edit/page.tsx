"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { historiaClinicaService, HistoriaClinica, AntecedentItem } from "@/services/historiaClinicaService";
import Avatar from "@/components/Avatar";
import moment from "moment";
import Link from "next/link";

const defAnt = (): AntecedentItem => ({ tiene: false, especifique: "" });

const ANTECEDENTES_KEYS: { key: string; label: string }[] = [
  { key: "diabetes",       label: "Diabetes" },
  { key: "alergia",        label: "Alergia" },
  { key: "hta",            label: "HTA (Hipertensión)" },
  { key: "cancer",         label: "Cáncer" },
  { key: "transfusiones",  label: "Transfusiones" },
  { key: "enfReumaticas",  label: "Enfermedades Reumáticas" },
  { key: "hospitalizacion",label: "Hospitalización" },
  { key: "encames",        label: "Encames" },
  { key: "accidentes",     label: "Accidentes" },
  { key: "cardiopatias",   label: "Cardiopatías" },
  { key: "cirugias",       label: "Cirugías" },
  { key: "fracturas",      label: "Fracturas" },
];

const HABITOS_KEYS: { key: string; label: string }[] = [
  { key: "tabaquismo",     label: "Tabaquismo" },
  { key: "alcoholismo",    label: "Alcoholismo" },
  { key: "drogas",         label: "Drogas" },
  { key: "actividadFisica",label: "Actividad Física" },
  { key: "automedica",     label: "Automedicación" },
  { key: "pasatiempo",     label: "Pasatiempo" },
];

const buildDefaultAnt = () =>
  Object.fromEntries(ANTECEDENTES_KEYS.map(({ key }) => [key, defAnt()]));

const buildDefaultHabitos = () =>
  Object.fromEntries(HABITOS_KEYS.map(({ key }) => [key, defAnt()]));

export default function ExpedienteEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [historia, setHistoria] = useState<HistoriaClinica | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    peso: "",
    talla: "",
    etnia: "",
    motivoConsulta: "",
    tratamientosPrevios: "",
    referidoPor: "",
    antecedentes: buildDefaultAnt() as Record<string, AntecedentItem>,
    habitosSalud: buildDefaultHabitos() as Record<string, AntecedentItem>,
    datosGinecologicos: { embarazada: null as boolean | null, numHijos: "" },
  });

  useEffect(() => {
    historiaClinicaService.getById(id).then(h => {
      setHistoria(h);
      setForm({
        peso:              String(h.peso ?? ""),
        talla:             String(h.talla ?? ""),
        etnia:             h.etnia ?? "",
        motivoConsulta:    h.motivoConsulta ?? "",
        tratamientosPrevios: h.tratamientosPrevios ?? "",
        referidoPor:       h.referidoPor ?? "",
        antecedentes:      { ...buildDefaultAnt(), ...(h.antecedentes ?? {}) } as Record<string, AntecedentItem>,
        habitosSalud:      { ...buildDefaultHabitos(), ...(h.habitosSalud ?? {}) } as Record<string, AntecedentItem>,
        datosGinecologicos: {
          embarazada: (h.datosGinecologicos as any)?.embarazada ?? null,
          numHijos:   String((h.datosGinecologicos as any)?.numHijos ?? ""),
        },
      });
    }).catch(() => {
      toast.error("Error al cargar el expediente");
      router.push("/dashboard/patients");
    }).finally(() => setLoading(false));
  }, [id]);

  const handleAnt = (section: "antecedentes" | "habitosSalud", key: string, field: "tiene" | "especifique", value: boolean | string) => {
    setForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: { ...prev[section][key], [field]: value },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await historiaClinicaService.update(id, {
        peso:              form.peso ? parseFloat(form.peso) : undefined,
        talla:             form.talla ? parseFloat(form.talla) : undefined,
        etnia:             form.etnia || undefined,
        motivoConsulta:    form.motivoConsulta || undefined,
        tratamientosPrevios: form.tratamientosPrevios || undefined,
        referidoPor:       form.referidoPor || undefined,
        antecedentes:      form.antecedentes,
        habitosSalud:      form.habitosSalud,
        datosGinecologicos: {
          embarazada: form.datosGinecologicos.embarazada,
          numHijos:   form.datosGinecologicos.numHijos ? parseInt(form.datosGinecologicos.numHijos) : null,
        },
      });
      toast.success("Expediente actualizado");
      router.push(`/dashboard/patients/${historia?.patientId}?tab=expediente`);
    } catch {
      toast.error("Error al guardar el expediente");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const patient = historia?.patient;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/dashboard/patients/${historia?.patientId}?tab=expediente`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Volver al expediente
        </Link>
      </div>

      {patient && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-6 py-4 mb-6 flex items-center gap-4">
          <Avatar photoUrl={patient.photoUrl} gender={patient.gender as any} name={patient.name} size="md" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{patient.name}</p>
            {patient.birthDate && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {moment().diff(moment(patient.birthDate), "years")} años
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección: Datos baseline */}
        <Section title="Datos Baseline" icon="📏">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <FormField label="Peso (kg)">
              <input type="number" step="0.1" value={form.peso}
                onChange={e => setForm(p => ({ ...p, peso: e.target.value }))}
                className={inputCls} placeholder="65.0" />
            </FormField>
            <FormField label="Talla (m)">
              <input type="number" step="0.01" value={form.talla}
                onChange={e => setForm(p => ({ ...p, talla: e.target.value }))}
                className={inputCls} placeholder="1.70" />
            </FormField>
            <FormField label="Etnia">
              <input type="text" value={form.etnia}
                onChange={e => setForm(p => ({ ...p, etnia: e.target.value }))}
                className={inputCls} />
            </FormField>
          </div>
        </Section>

        {/* Sección: Consulta */}
        <Section title="Motivo de Consulta" icon="📋">
          <div className="space-y-4">
            <FormField label="Referido por">
              <input type="text" value={form.referidoPor}
                onChange={e => setForm(p => ({ ...p, referidoPor: e.target.value }))}
                className={inputCls} placeholder="Dr. García / Hospital Nacional / Automático..." />
            </FormField>
            <FormField label="Motivo de consulta">
              <textarea rows={3} value={form.motivoConsulta}
                onChange={e => setForm(p => ({ ...p, motivoConsulta: e.target.value }))}
                className={inputCls} />
            </FormField>
            <FormField label="Tratamientos previos">
              <textarea rows={2} value={form.tratamientosPrevios}
                onChange={e => setForm(p => ({ ...p, tratamientosPrevios: e.target.value }))}
                className={inputCls} />
            </FormField>
          </div>
        </Section>

        {/* Sección: Antecedentes Patológicos */}
        <Section title="Antecedentes Patológicos y Heredofamiliares" icon="📂">
          <div className="space-y-3">
            {ANTECEDENTES_KEYS.map(({ key, label }) => (
              <AntRow key={key} label={label}
                value={form.antecedentes[key] ?? defAnt()}
                onChange={(field, val) => handleAnt("antecedentes", key, field, val)} />
            ))}
          </div>
        </Section>

        {/* Sección: Hábitos de Salud */}
        <Section title="Hábitos de Salud" icon="🌿">
          <div className="space-y-3">
            {HABITOS_KEYS.map(({ key, label }) => (
              <AntRow key={key} label={label}
                value={form.habitosSalud[key] ?? defAnt()}
                onChange={(field, val) => handleAnt("habitosSalud", key, field, val)} />
            ))}
          </div>
        </Section>

        {/* Sección: Datos Ginecológicos */}
        <Section title="Datos Ginecológicos" icon="🩺">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="¿Embarazada?">
              <select
                value={form.datosGinecologicos.embarazada === null ? "" : String(form.datosGinecologicos.embarazada)}
                onChange={e => setForm(p => ({
                  ...p,
                  datosGinecologicos: {
                    ...p.datosGinecologicos,
                    embarazada: e.target.value === "" ? null : e.target.value === "true",
                  },
                }))}
                className={inputCls}
              >
                <option value="">No aplica / No especificado</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </FormField>
            <FormField label="N° de hijos">
              <input type="number" min={0} value={form.datosGinecologicos.numHijos}
                onChange={e => setForm(p => ({
                  ...p,
                  datosGinecologicos: { ...p.datosGinecologicos, numHijos: e.target.value },
                }))}
                className={inputCls} />
            </FormField>
          </div>
        </Section>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href={`/dashboard/patients/${historia?.patientId}?tab=expediente`}
            className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {saving ? "Guardando..." : "Guardar Expediente"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-sm">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function AntRow({
  label, value, onChange,
}: {
  label: string;
  value: AntecedentItem;
  onChange: (field: "tiene" | "especifique", val: boolean | string) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center gap-2 w-52 flex-shrink-0 pt-1">
        <input
          type="checkbox"
          checked={value.tiene}
          onChange={e => onChange("tiene", e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      {value.tiene && (
        <input
          type="text"
          value={value.especifique}
          onChange={e => onChange("especifique", e.target.value)}
          placeholder="Especifique..."
          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}
    </div>
  );
}
