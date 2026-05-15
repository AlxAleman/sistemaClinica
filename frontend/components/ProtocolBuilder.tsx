"use client";

import { useState } from "react";
import { ProtocolItem } from "@/services/treatmentPlanService";

// ─── Catálogo de terapias ─────────────────────────────────────────────────────

interface FieldDef {
  key: keyof ProtocolItem;
  label: string;
  type: "number" | "select" | "text";
  options?: string[];
  unit?: string;
  placeholder?: string;
}

interface TherapyTypeDef {
  procedures: string[];
  fields: FieldDef[];
}

const AREA_OPTIONS = [
  "Cervical", "Dorsal", "Lumbar", "Sacro", "Hombro D", "Hombro I",
  "Codo D", "Codo I", "Muñeca D", "Muñeca I", "Mano D", "Mano I",
  "Cadera D", "Cadera I", "Rodilla D", "Rodilla I",
  "Tobillo D", "Tobillo I", "Pie D", "Pie I",
  "Torácico", "Abdominal", "Glúteo D", "Glúteo I",
  "Isquiotibial D", "Isquiotibial I", "Cuádriceps D", "Cuádriceps I",
  "Gemelar D", "Gemelar I", "General",
];

const INTENSITY_OPTIONS = ["Baja", "Media", "Alta", "Muy alta"];

const F_AREA: FieldDef = { key: "area", label: "Área corporal", type: "select", options: AREA_OPTIONS };
const F_DURATION: FieldDef = { key: "duration", label: "Duración", type: "number", unit: "min", placeholder: "20" };
const F_INTENSITY: FieldDef = { key: "intensity", label: "Intensidad", type: "select", options: INTENSITY_OPTIONS };
const F_SERIES: FieldDef = { key: "series", label: "Series", type: "number", placeholder: "3" };
const F_REPS: FieldDef = { key: "reps", label: "Repeticiones", type: "number", placeholder: "10" };
const F_WEIGHT: FieldDef = { key: "weight", label: "Peso / Carga", type: "text", placeholder: "Ej: 2 kg" };
const F_RESISTANCE: FieldDef = { key: "resistance", label: "Resistencia", type: "text", placeholder: "Ej: Liga verde" };

const THERAPY_CATALOG: Record<string, TherapyTypeDef> = {
  "Electroterapia": {
    procedures: ["TENS", "EMS", "Interferencial", "Corriente rusa", "Iontoforesis", "Electroestimulación muscular"],
    fields: [F_AREA, F_DURATION, F_INTENSITY],
  },
  "Termoterapia": {
    procedures: ["Compresas calientes", "Parafina", "Infrarrojo", "Ultrasonido térmico", "Baño de parafina"],
    fields: [F_AREA, F_DURATION],
  },
  "Crioterapia": {
    procedures: ["Hielo local", "Cold pack", "Criocompresión", "Baño de contraste", "Masaje con hielo"],
    fields: [F_AREA, F_DURATION],
  },
  "Ultrasonido": {
    procedures: ["Pulsado 1 MHz", "Pulsado 3 MHz", "Continuo 1 MHz", "Continuo 3 MHz"],
    fields: [F_AREA, F_DURATION, { key: "intensity", label: "Intensidad (W/cm²)", type: "text", placeholder: "0.5" }],
  },
  "Láser": {
    procedures: ["Láser frío (LLLT)", "Láser puntual", "Láser de barrido"],
    fields: [F_AREA, F_DURATION, F_INTENSITY],
  },
  "Terapia manual": {
    procedures: ["Masoterapia", "Liberación miofascial", "Movilización pasiva", "Manipulación articular",
      "Drenaje linfático", "Terapia de puntos gatillo", "Técnica neuromuscular (TNM)"],
    fields: [F_AREA, F_DURATION],
  },
  "Ejercicio terapéutico": {
    procedures: ["Bicicleta estática", "Caminadora", "Elevación de pierna recta", "Sentadillas asistidas",
      "Poleas", "Banda elástica", "Ejercicios cervicales", "Ejercicios lumbares",
      "Propiocepción", "Ejercicios de hombro", "Ejercicios de rodilla",
      "Abducción de cadera", "Curl de bíceps", "Extensión de tríceps"],
    fields: [F_AREA, F_SERIES, F_REPS, F_WEIGHT, F_RESISTANCE],
  },
  "Estiramientos": {
    procedures: ["Estiramiento cervical", "Estiramiento lumbar", "Isquiotibiales",
      "Cuádriceps", "Gemelos", "Hombro", "Cadera", "Pectorales",
      "Piriformis", "Flexores de cadera", "Banda iliotibial"],
    fields: [F_AREA, F_DURATION, F_REPS],
  },
  "Fortalecimiento": {
    procedures: ["Mancuernas", "Liga de resistencia", "Poleas", "Sentadilla",
      "Escalón terapéutico", "Press de hombro", "Curl de bíceps", "Plancha"],
    fields: [F_AREA, F_SERIES, F_REPS, F_WEIGHT, F_RESISTANCE],
  },
  "Balance y coordinación": {
    procedures: ["Tabla de propiocepción", "Bosu", "Ejercicios oculomotores",
      "Marcha controlada", "Equilibrio monopodal", "Ejercicios vestibulares"],
    fields: [F_AREA, F_DURATION, F_REPS],
  },
  "Reeducación funcional": {
    procedures: ["Marcha con andadera", "Marcha con bastón", "Transferencias",
      "Actividades de la vida diaria (AVD)", "Subir y bajar escaleras", "Sedestación-bipedestación"],
    fields: [F_AREA, F_DURATION],
  },
  "Movilización articular": {
    procedures: ["Movilización grado I", "Movilización grado II", "Movilización grado III",
      "Movilización grado IV", "Tracción articular", "Deslizamiento articular"],
    fields: [F_AREA, F_REPS, F_DURATION],
  },
  "Tracción": {
    procedures: ["Tracción cervical mecánica", "Tracción cervical manual",
      "Tracción lumbar mecánica", "Tracción lumbar manual"],
    fields: [F_DURATION, { key: "weight", label: "Peso de tracción", type: "text", placeholder: "Ej: 8 kg" }],
  },
  "Punción seca": {
    procedures: ["Punción seca superficial", "Punción seca profunda"],
    fields: [F_AREA],
  },
  "Vendaje": {
    procedures: ["Vendaje funcional", "Vendaje neuromuscular (kinesiotape)", "Vendaje rígido", "Vendaje compresivo"],
    fields: [F_AREA],
  },
  "Masoterapia": {
    procedures: ["Masaje sueco", "Masaje descontracturante", "Masaje transverso profundo (Cyriax)",
      "Masaje deportivo", "Effleurage", "Petrissage"],
    fields: [F_AREA, F_DURATION],
  },
  "Terapia respiratoria": {
    procedures: ["Técnicas de higiene bronquial", "Reeducación diafragmática",
      "Ejercicios inspiratorios", "Drenaje postural", "Percusión torácica"],
    fields: [F_DURATION, F_REPS],
  },
  "Hidroterapia": {
    procedures: ["Baño de remolino", "Tanque de Hubbard", "Piscina terapéutica", "Ducha Vichy"],
    fields: [F_DURATION, { key: "intensity", label: "Temperatura (°C)", type: "text", placeholder: "37" }],
  },
  "Otros": {
    procedures: ["Especificar en notas"],
    fields: [F_AREA, F_DURATION],
  },
};

const THERAPY_TYPE_LABELS = Object.keys(THERAPY_CATALOG);

const TYPE_ICONS: Record<string, string> = {
  "Electroterapia": "⚡",
  "Termoterapia": "🔥",
  "Crioterapia": "❄️",
  "Ultrasonido": "📡",
  "Láser": "💡",
  "Terapia manual": "🙌",
  "Ejercicio terapéutico": "🏋️",
  "Estiramientos": "🤸",
  "Fortalecimiento": "💪",
  "Balance y coordinación": "⚖️",
  "Reeducación funcional": "🚶",
  "Movilización articular": "🔄",
  "Tracción": "↕️",
  "Punción seca": "📍",
  "Vendaje": "🩹",
  "Masoterapia": "👐",
  "Terapia respiratoria": "🫁",
  "Hidroterapia": "💧",
  "Otros": "📋",
};

// ─── Componente principal ─────────────────────────────────────────────────────

interface ProtocolBuilderProps {
  items: ProtocolItem[];
  onChange: (items: ProtocolItem[]) => void;
}

function emptyItem(order: number): ProtocolItem {
  return { order, type: "", procedure: "" };
}

export default function ProtocolBuilder({ items, onChange }: ProtocolBuilderProps) {
  const addItem = () => onChange([...items, emptyItem(items.length + 1)]);

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, order: i + 1 })));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...items];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    onChange(updated.map((it, i) => ({ ...it, order: i + 1 })));
  };

  const moveDown = (idx: number) => {
    if (idx === items.length - 1) return;
    const updated = [...items];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    onChange(updated.map((it, i) => ({ ...it, order: i + 1 })));
  };

  const updateItem = (idx: number, patch: Partial<ProtocolItem>) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const handleTypeChange = (idx: number, newType: string) => {
    updateItem(idx, {
      type: newType, procedure: "", area: undefined,
      duration: undefined, intensity: undefined, series: undefined, reps: undefined,
      weight: undefined, resistance: undefined, notes: undefined,
    });
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">Sin pasos en el protocolo</p>
          <p className="text-xs text-gray-400 dark:text-gray-600">Agrega los bloques terapéuticos que se realizarán en cada sesión</p>
        </div>
      )}

      {items.map((item, idx) => (
        <ProtocolItemCard
          key={idx}
          item={item}
          idx={idx}
          total={items.length}
          onTypeChange={(t) => handleTypeChange(idx, t)}
          onUpdate={(patch) => updateItem(idx, patch)}
          onMoveUp={() => moveUp(idx)}
          onMoveDown={() => moveDown(idx)}
          onRemove={() => removeItem(idx)}
        />
      ))}

      <button
        type="button"
        onClick={addItem}
        className="w-full py-3 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
      >
        + Agregar bloque terapéutico
      </button>
    </div>
  );
}

// ─── Tarjeta de item individual ───────────────────────────────────────────────

interface ItemCardProps {
  item: ProtocolItem;
  idx: number;
  total: number;
  onTypeChange: (t: string) => void;
  onUpdate: (patch: Partial<ProtocolItem>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function ProtocolItemCard({ item, idx, total, onTypeChange, onUpdate, onMoveUp, onMoveDown, onRemove }: ItemCardProps) {
  const [expanded, setExpanded] = useState(true);
  const catalog = item.type ? THERAPY_CATALOG[item.type] : null;
  const icon = item.type ? (TYPE_ICONS[item.type] ?? "📋") : null;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
          {item.order}
        </span>

        <button type="button" className="flex-1 min-w-0 text-left" onClick={() => setExpanded(!expanded)}>
          {item.type ? (
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate block">
              {icon} {item.type}{item.procedure ? ` · ${item.procedure}` : ""}
              {item.area ? ` — ${item.area}` : ""}
            </span>
          ) : (
            <span className="text-sm text-gray-400 italic">Sin configurar — haz clic para editar</span>
          )}
        </button>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button type="button" onClick={onMoveUp} disabled={idx === 0}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-25 disabled:cursor-not-allowed" title="Subir">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <button type="button" onClick={onMoveDown} disabled={idx === total - 1}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-25 disabled:cursor-not-allowed" title="Bajar">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button type="button" onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>
          <button type="button" onClick={onRemove}
            className="p-1.5 text-red-400 hover:text-red-600 ml-1" title="Eliminar bloque">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-4 space-y-3 bg-white dark:bg-gray-800">
          {/* Tipo + Procedimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Tipo de terapia <span className="text-red-500">*</span>
              </label>
              <select
                value={item.type}
                onChange={(e) => onTypeChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">— Seleccionar tipo —</option>
                {THERAPY_TYPE_LABELS.map((t) => (
                  <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Procedimiento <span className="text-red-500">*</span>
              </label>
              {catalog ? (
                <select
                  value={item.procedure}
                  onChange={(e) => onUpdate({ procedure: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">— Seleccionar procedimiento —</option>
                  {catalog.procedures.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400">
                  Primero selecciona el tipo
                </div>
              )}
            </div>
          </div>

          {/* Parámetros dinámicos */}
          {catalog && catalog.fields.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {catalog.fields.map((field) => (
                <DynamicField
                  key={String(field.key)}
                  field={field}
                  value={(item as any)[field.key] ?? ""}
                  onChange={(val) => onUpdate({ [field.key]: val === "" ? undefined : val })}
                />
              ))}
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Notas / Indicaciones especiales
            </label>
            <textarea
              rows={2}
              value={item.notes ?? ""}
              onChange={(e) => onUpdate({ notes: e.target.value || undefined })}
              placeholder="Ej: Evitar presión directa, iniciar con intensidad baja, pausar si hay dolor..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Campo dinámico ───────────────────────────────────────────────────────────

function DynamicField({ field, value, onChange }: {
  field: FieldDef;
  value: string | number;
  onChange: (val: string | number | undefined) => void;
}) {
  const base = "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
        {field.label}{field.unit ? ` (${field.unit})` : ""}
      </label>
      {field.type === "select" ? (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} className={base}>
          <option value="">—</option>
          {field.options!.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === "number" ? (
        <input
          type="number"
          min={0}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          placeholder={field.placeholder}
          className={base}
        />
      ) : (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder={field.placeholder}
          className={base}
        />
      )}
    </div>
  );
}
