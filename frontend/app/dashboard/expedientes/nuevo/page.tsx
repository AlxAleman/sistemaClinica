"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { historiaClinicaService, AntecedentItem } from "@/services/historiaClinicaService";
import { patientService, Patient } from "@/services/patientService";
import Avatar from "@/components/Avatar";

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

export default function NuevoExpedientePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [form, setForm] = useState({
    peso: "", talla: "",
    etnia: "",
    motivoConsulta: "",
    tratamientosPrevios: "",
    referidoPor: "",
    antecedentes: buildDefaultAnt() as Record<string, AntecedentItem>,
    habitosSalud: buildDefaultHabitos() as Record<string, AntecedentItem>,
    datosGinecologicos: { embarazada: null as boolean | null, numHijos: "" },
  });

  const searchPatients = useCallback(async (q: string) => {
    if (q.length < 2) { setPatients([]); return; }
    try {
      const res = await patientService.getAll({ search: q, limit: 8 });
      setPatients(res.patients);
      setShowDropdown(true);
    } catch { setPatients([]); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchPatients(patientSearch), 300);
    return () => clearTimeout(t);
  }, [patientSearch, searchPatients]);

  const handleAnt = (section: "antecedentes" | "habitosSalud", key: string, field: "tiene" | "especifique", value: boolean | string) => {
    setForm(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: { ...prev[section][key], [field]: value } },
    }));
  };

  const handleSave = async () => {
    if (!selectedPatient) { toast.error("Selecciona un paciente"); return; }
    setSaving(true);
    try {
      const historia = await historiaClinicaService.create({
        patientId: selectedPatient.id,
        peso:  form.peso  ? parseFloat(form.peso)  : undefined,
        talla: form.talla ? parseFloat(form.talla) : undefined,
        etnia: form.etnia || undefined,
        motivoConsulta:      form.motivoConsulta || undefined,
        tratamientosPrevios: form.tratamientosPrevios || undefined,
        referidoPor:         form.referidoPor || undefined,
        antecedentes:        form.antecedentes,
        habitosSalud:        form.habitosSalud,
        datosGinecologicos: {
          embarazada: form.datosGinecologicos.embarazada,
          numHijos: form.datosGinecologicos.numHijos ? parseInt(form.datosGinecologicos.numHijos) : null,
        },
      });
      toast.success("Expediente creado correctamente");
      router.push(`/dashboard/patients/${selectedPatient.id}?tab=expediente`);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Error al crear el expediente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nuevo Expediente Médico</h1>

      {/* Selección de paciente */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Paciente</h2>
        {selectedPatient ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar photoUrl={selectedPatient.photoUrl} gender={selectedPatient.gender as any} name={selectedPatient.name} size="md" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedPatient.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedPatient.phone}</p>
              </div>
            </div>
            <button type="button" onClick={() => setSelectedPatient(null)}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors">Cambiar</button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar paciente por nombre o teléfono..."
              value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {showDropdown && patients.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                {patients.map(p => (
                  <button key={p.id} type="button"
                    onClick={() => { setSelectedPatient(p); setShowDropdown(false); setPatientSearch(""); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Avatar photoUrl={p.photoUrl} gender={p.gender as any} name={p.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{p.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Datos baseline */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-sm">📏</span>
          Datos Baseline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Peso (kg)", key: "peso", placeholder: "65.0" },
            { label: "Talla (m)", key: "talla", placeholder: "1.70" },
            { label: "Etnia", key: "etnia", placeholder: "" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{f.label}</label>
              <input type={f.key === "etnia" ? "text" : "number"} step="0.01"
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Motivo de consulta */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-sm">📋</span>
          Motivo de Consulta
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Referido por</label>
            <input type="text" value={form.referidoPor}
              onChange={e => setForm(p => ({ ...p, referidoPor: e.target.value }))}
              placeholder="Dr. García / Hospital Nacional / Automático..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Motivo de consulta</label>
            <textarea rows={3} value={form.motivoConsulta}
              onChange={e => setForm(p => ({ ...p, motivoConsulta: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Tratamientos previos</label>
            <textarea rows={2} value={form.tratamientosPrevios}
              onChange={e => setForm(p => ({ ...p, tratamientosPrevios: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
        </div>
      </div>

      {/* Antecedentes */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-sm">📂</span>
          Antecedentes Patológicos
        </h2>
        <div className="space-y-3">
          {ANTECEDENTES_KEYS.map(({ key, label }) => (
            <AntRow key={key} label={label}
              value={form.antecedentes[key] ?? defAnt()}
              onChange={(field, val) => handleAnt("antecedentes", key, field, val)} />
          ))}
        </div>
      </div>

      {/* Hábitos */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-sm">🌿</span>
          Hábitos de Salud
        </h2>
        <div className="space-y-3">
          {HABITOS_KEYS.map(({ key, label }) => (
            <AntRow key={key} label={label}
              value={form.habitosSalud[key] ?? defAnt()}
              onChange={(field, val) => handleAnt("habitosSalud", key, field, val)} />
          ))}
        </div>
      </div>

      {/* Datos Ginecológicos */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-sm">🩺</span>
          Datos Ginecológicos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">¿Embarazada?</label>
            <select
              value={form.datosGinecologicos.embarazada === null ? "" : String(form.datosGinecologicos.embarazada)}
              onChange={e => setForm(p => ({ ...p, datosGinecologicos: { ...p.datosGinecologicos, embarazada: e.target.value === "" ? null : e.target.value === "true" } }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">No aplica</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">N° de hijos</label>
            <input type="number" min={0} value={form.datosGinecologicos.numHijos}
              onChange={e => setForm(p => ({ ...p, datosGinecologicos: { ...p.datosGinecologicos, numHijos: e.target.value } }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Cancelar
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !selectedPatient}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
          {saving ? "Guardando..." : "Crear Expediente"}
        </button>
      </div>
    </div>
  );
}

function AntRow({ label, value, onChange }: {
  label: string;
  value: AntecedentItem;
  onChange: (field: "tiene" | "especifique", val: boolean | string) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center gap-2 w-52 flex-shrink-0 pt-1">
        <input type="checkbox" checked={value.tiene}
          onChange={e => onChange("tiene", e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      {value.tiene && (
        <input type="text" value={value.especifique}
          onChange={e => onChange("especifique", e.target.value)}
          placeholder="Especifique..."
          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      )}
    </div>
  );
}
