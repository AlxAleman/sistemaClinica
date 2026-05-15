"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  evaluacionFisicaService,
  EvaluacionFisica,
  MuscleEntry,
  GonioEntry,
  PosturalDI,
} from "@/services/evaluacionFisicaService";
import Link from "next/link";

// ─── Helpers ────────────────────────────────────────────────────────────────
const defM = (): MuscleEntry => ({ di: "", dd: "", fi: "", fd: "" });
const defG = (): GonioEntry  => ({ izquierdo: "", derecho: "" });
const defP = (): PosturalDI  => ({ d: "", i: "" });

function buildDefaultForm() {
  return {
    tipo: "inicial" as string,
    fechaEvaluacion: new Date().toISOString().slice(0, 16),
    peso: "", talla: "", imc: "",
    signosVitales: { ta: "", temperatura: "", pc: "", pb: "" },
    espasmos: { tiene: false, sitio: "", caracteristicas: "" },
    diagnosticoRehabilitacion: { reflejos: "", sensibilidad: "", lenguajeOrientacion: "", otros: "" },
    cicatrizQuirurgica: "",
    traslados: { velInicial: "", velFinal: "", observaciones: "" },
    marchaDeambulacion: {
      libre: false, claudicante: false, conAyuda: false,
      espastica: false, ataxica: false, otros: false, observaciones: "",
    },
    escalaDolor: 0,
    fuerzaMuscular: {
      miembroSuperior: {
        fxHombro: defM(), exHombro: defM(), abdHombro: defM(), addHombro: defM(),
        fxCodo: defM(), exCodo: defM(), fxMuneca: defM(), exMuneca: defM(),
      } as Record<string, MuscleEntry>,
      miembroInferior: {
        fxCadera: defM(), exCadera: defM(), abdCadera: defM(), addCadera: defM(),
        fxRodilla: defM(), exRodilla: defM(), fxTobillo: defM(), exTobillo: defM(),
      } as Record<string, MuscleEntry>,
    },
    goniometriaSuper: {
      hombro:    { flexion: defG(), extension: defG(), abdHorizontal: defG(), addHorizontal: defG(), rotacionInt: defG(), rotacionExt: defG() } as Record<string, GonioEntry>,
      codo:      { flexion: defG(), extension: defG() } as Record<string, GonioEntry>,
      antebrazo: { supinacion: defG(), pronacion: defG() } as Record<string, GonioEntry>,
      muneca:    { flexion: defG(), extension: defG(), desviacionCubital: defG(), desviacionRadial: defG() } as Record<string, GonioEntry>,
    },
    goniometriaInfer: {
      cadera:  { flexionRodFlex: defG(), flexionRodExt: defG(), extension: defG(), abduccion: defG(), adduccion: defG(), rotacionInt: defG(), rotacionExt: defG() } as Record<string, GonioEntry>,
      rodilla: { flexion: defG(), extension: defG() } as Record<string, GonioEntry>,
      tobillo: { dorsiflexion: defG(), plantiflexion: defG(), inversion: defG(), eversion: defG() } as Record<string, GonioEntry>,
    },
    valoracionPostural: {
      vistaAnterior: {
        cabezaCuello: { rotacion: defP() },
        hombro: { elevacion: defP() },
        pelvis: { descenso: defP(), elevacion: defP() },
        miembroInferior: { rotacionInt: defP(), rotacionExt: defP() },
      },
      vistaLateral: {
        cabezaCuello: { proyeccionAnt: defP(), proyeccionPost: defP(), rectificacion: defP(), hiperlordosis: defP() },
        hombro: { retropulsion: defP(), antepulsion: defP() },
        pelvis: { retroversion: defP(), anteversion: defP() },
        rodilla: { flexum: defP(), recurvatum: defP() },
      },
      vistaPosterior: {
        cabezaCuello: { lateralizacion: defP() },
        hombro: { elevacion: defP() },
        pelvis: { elevacion: defP() },
        miembroInferior: { genu_varum: defP(), genu_valgum: defP() },
      },
    },
    columna: { planoSagital: "", planoFrontal: "" },
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
interface Props {
  historiaClinicaId: string;
  patientId: string;
  evaluacionId?: string;
  onSaved: () => void;
  onCancel: () => void;
}

export default function EvaluacionFisicaForm({ historiaClinicaId, patientId, evaluacionId, onSaved, onCancel }: Props) {
  const [loading, setLoading] = useState(!!evaluacionId);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(buildDefaultForm());
  const isEdit = !!evaluacionId;

  useEffect(() => {
    if (!evaluacionId) return;
    evaluacionFisicaService.getById(evaluacionId).then(ev => {
      setForm({
        tipo: ev.tipo ?? "inicial",
        fechaEvaluacion: ev.fechaEvaluacion ? new Date(ev.fechaEvaluacion).toISOString().slice(0, 16) : buildDefaultForm().fechaEvaluacion,
        peso: String(ev.peso ?? ""),
        talla: String(ev.talla ?? ""),
        imc: String(ev.imc ?? ""),
        signosVitales: ev.signosVitales ?? buildDefaultForm().signosVitales,
        espasmos: ev.espasmos ?? buildDefaultForm().espasmos,
        diagnosticoRehabilitacion: ev.diagnosticoRehabilitacion ?? buildDefaultForm().diagnosticoRehabilitacion,
        cicatrizQuirurgica: ev.cicatrizQuirurgica ?? "",
        traslados: ev.traslados ?? buildDefaultForm().traslados,
        marchaDeambulacion: ev.marchaDeambulacion ?? buildDefaultForm().marchaDeambulacion,
        escalaDolor: ev.escalaDolor ?? 0,
        fuerzaMuscular: ev.fuerzaMuscular ?? buildDefaultForm().fuerzaMuscular,
        goniometriaSuper: ev.goniometriaSuper ?? buildDefaultForm().goniometriaSuper,
        goniometriaInfer: ev.goniometriaInfer ?? buildDefaultForm().goniometriaInfer,
        valoracionPostural: ev.valoracionPostural ?? buildDefaultForm().valoracionPostural,
        columna: ev.columna ?? buildDefaultForm().columna,
      } as any);
    }).catch(() => toast.error("Error al cargar la evaluación"))
      .finally(() => setLoading(false));
  }, [evaluacionId]);


  const set = (path: string, value: unknown) => {
    setForm(prev => {
      const keys = path.split(".");
      const next = { ...prev } as any;
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<EvaluacionFisica> = {
        historiaClinicaId,
        patientId,
        tipo: form.tipo || undefined,
        fechaEvaluacion: new Date(form.fechaEvaluacion).toISOString(),
        peso:  form.peso  ? parseFloat(form.peso)  : undefined,
        talla: form.talla ? parseFloat(form.talla) : undefined,
        imc:   form.imc   ? parseFloat(form.imc)   : undefined,
        signosVitales: form.signosVitales as any,
        espasmos: form.espasmos as any,
        diagnosticoRehabilitacion: form.diagnosticoRehabilitacion as any,
        cicatrizQuirurgica: form.cicatrizQuirurgica || undefined,
        traslados: form.traslados as any,
        marchaDeambulacion: form.marchaDeambulacion as any,
        escalaDolor: form.escalaDolor > 0 ? form.escalaDolor : undefined,
        fuerzaMuscular: form.fuerzaMuscular as any,
        goniometriaSuper: form.goniometriaSuper as any,
        goniometriaInfer: form.goniometriaInfer as any,
        valoracionPostural: form.valoracionPostural as any,
        columna: form.columna as any,
      };
      if (isEdit && evaluacionId) {
        await evaluacionFisicaService.update(evaluacionId, payload);
        toast.success("Evaluación actualizada");
      } else {
        await evaluacionFisicaService.create(payload);
        toast.success("Evaluación registrada");
      }
      onSaved();
    } catch {
      toast.error("Error al guardar la evaluación");
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <button type="button" onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          ← Volver al expediente
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? "Editar Evaluación Física" : "Nueva Evaluación Física"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos generales */}
        <Section title="Datos de la Evaluación" icon="📅">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tipo">
              <select value={form.tipo} onChange={e => set("tipo", e.target.value)} className={inputCls}>
                <option value="inicial">Inicial</option>
                <option value="progreso">Progreso</option>
                <option value="seguimiento">Seguimiento</option>
                <option value="final">Final</option>
              </select>
            </FormField>
            <FormField label="Fecha">
              <input type="datetime-local" value={form.fechaEvaluacion}
                onChange={e => set("fechaEvaluacion", e.target.value)} className={inputCls} />
            </FormField>
          </div>
        </Section>

        {/* Escala de Dolor */}
        <Section title="Escala de Dolor" icon="🩹">
          <div className="flex items-center gap-6">
            <div className="flex-1 space-y-2">
              {/* Barra de color degradada */}
              <div className="relative h-2 rounded-full overflow-hidden"
                style={{ background: "linear-gradient(to right, #22c55e 0%, #86efac 25%, #fbbf24 45%, #f97316 65%, #ef4444 100%)" }}>
                <div
                  className="absolute top-0 right-0 h-full bg-gray-100 dark:bg-gray-700 transition-all"
                  style={{ width: `${((10 - form.escalaDolor) / 10) * 100}%` }}
                />
              </div>
              <input
                type="range" min={0} max={10} value={form.escalaDolor}
                onChange={e => set("escalaDolor", parseInt(e.target.value))}
                className="w-full h-1 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-400 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:-mt-1.5"
              />
              {/* Etiquetas 0-10 clicables */}
              <div className="flex justify-between px-0.5">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => set("escalaDolor", i)}
                    className={`text-[10px] font-semibold w-5 text-center rounded transition-colors ${
                      form.escalaDolor === i
                        ? i <= 3 ? "text-green-600 dark:text-green-400"
                          : i <= 6 ? "text-yellow-500 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"
                        : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <span className={`text-2xl font-bold w-10 text-center flex-shrink-0 ${
              form.escalaDolor === 0 ? "text-gray-400" :
              form.escalaDolor <= 3 ? "text-green-600 dark:text-green-400" :
              form.escalaDolor <= 6 ? "text-yellow-500 dark:text-yellow-400" : "text-red-600 dark:text-red-400"
            }`}>{form.escalaDolor}</span>
          </div>
        </Section>

        {/* Espasmos */}
        <Section title="Espasmos / Contractura Muscular" icon="⚡">
          <div className="flex items-center gap-3 mb-3">
            <input type="checkbox" checked={(form.espasmos as any).tiene}
              onChange={e => set("espasmos.tiene", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Presenta espasmos</span>
          </div>
          {(form.espasmos as any).tiene && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Sitio">
                <input type="text" value={(form.espasmos as any).sitio}
                  onChange={e => set("espasmos.sitio", e.target.value)} className={inputCls} />
              </FormField>
              <FormField label="Características">
                <input type="text" value={(form.espasmos as any).caracteristicas}
                  onChange={e => set("espasmos.caracteristicas", e.target.value)} className={inputCls} />
              </FormField>
            </div>
          )}
        </Section>

        {/* Cicatriz Quirúrgica */}
        <Section title="Cicatriz Quirúrgica" icon="🔪">
          <textarea rows={2} value={form.cicatrizQuirurgica}
            onChange={e => set("cicatrizQuirurgica", e.target.value)}
            placeholder="Describir ubicación, características..."
            className={`${inputCls} resize-none`} />
        </Section>

        {/* Marcha y Deambulación */}
        <Section title="Marcha / Deambulación" icon="🚶">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {(["libre","claudicante","conAyuda","espastica","ataxica","otros"] as const).map(k => (
              <label key={k} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={(form.marchaDeambulacion as any)[k]}
                  onChange={e => set(`marchaDeambulacion.${k}`, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                {k === "conAyuda" ? "Con ayuda" : k === "espastica" ? "Espástica" : k === "ataxica" ? "Atáxica" : k.charAt(0).toUpperCase() + k.slice(1)}
              </label>
            ))}
          </div>
          <FormField label="Observaciones">
            <input type="text" value={(form.marchaDeambulacion as any).observaciones}
              onChange={e => set("marchaDeambulacion.observaciones", e.target.value)} className={inputCls} />
          </FormField>
        </Section>

        {/* Diagnóstico Rehabilitación */}
        <Section title="Diagnóstico en Rehabilitación" icon="🏥">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["reflejos","sensibilidad","lenguajeOrientacion","otros"] as const).map(k => (
              <FormField key={k} label={k === "lenguajeOrientacion" ? "Lenguaje / Orientación" : k.charAt(0).toUpperCase() + k.slice(1)}>
                <input type="text" value={(form.diagnosticoRehabilitacion as any)[k]}
                  onChange={e => set(`diagnosticoRehabilitacion.${k}`, e.target.value)} className={inputCls} />
              </FormField>
            ))}
          </div>
        </Section>

        {/* Traslados */}
        <Section title="Traslados" icon="🚗">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Velocidad inicial">
              <input type="text" value={(form.traslados as any).velInicial}
                onChange={e => set("traslados.velInicial", e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Velocidad final">
              <input type="text" value={(form.traslados as any).velFinal}
                onChange={e => set("traslados.velFinal", e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Observaciones">
              <input type="text" value={(form.traslados as any).observaciones}
                onChange={e => set("traslados.observaciones", e.target.value)} className={inputCls} />
            </FormField>
          </div>
        </Section>

        {/* Fuerza Muscular */}
        <Section title="Valoración de Fuerza Muscular" icon="💪">
          {(["miembroSuperior","miembroInferior"] as const).map(member => (
            <div key={member} className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {member === "miembroSuperior" ? "Miembro Superior" : "Miembro Inferior"}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs table-fixed">
                  <colgroup>
                    <col />
                    <col className="w-16" />
                    <col className="w-16" />
                  </colgroup>
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40">
                      <th className="text-left py-2 pl-2 pr-4 font-medium rounded-l-lg">Movimiento</th>
                      <th className="text-center py-2 px-1 font-medium">F.I.</th>
                      <th className="text-center py-2 px-1 font-medium rounded-r-lg">F.D.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys((form.fuerzaMuscular as any)[member]).map(key => {
                      const entry: MuscleEntry = (form.fuerzaMuscular as any)[member][key];
                      return (
                        <tr key={key} className="border-t border-gray-100 dark:border-gray-700">
                          <td className="py-1.5 pl-2 pr-4 text-gray-700 dark:text-gray-300 capitalize whitespace-nowrap">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </td>
                          {(["fi","fd"] as const).map(f => (
                            <td key={f} className="py-1 px-1 text-center">
                              <input type="text" value={entry[f]}
                                onChange={e => set(`fuerzaMuscular.${member}.${key}.${f}`, e.target.value)}
                                placeholder="0-5"
                                className="w-full text-center px-1.5 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </Section>

        {/* Goniometría Superior */}
        <Section title="Goniometría — Miembro Superior" icon="📐">
          {(["hombro","codo","antebrazo","muneca"] as const).map(joint => (
            <div key={joint} className="mb-5">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 capitalize">
                {joint === "muneca" ? "Muñeca" : joint}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs table-fixed">
                  <colgroup>
                    <col />
                    <col className="w-20" />
                    <col className="w-20" />
                  </colgroup>
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40">
                      <th className="text-left py-2 pl-2 pr-4 font-medium rounded-l-lg">Movimiento</th>
                      <th className="text-center py-2 px-1 font-medium">Izq°</th>
                      <th className="text-center py-2 px-1 font-medium rounded-r-lg">Der°</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys((form.goniometriaSuper as any)[joint]).map(key => {
                      const entry: GonioEntry = (form.goniometriaSuper as any)[joint][key];
                      return (
                        <tr key={key} className="border-t border-gray-100 dark:border-gray-700">
                          <td className="py-1.5 pl-2 pr-4 text-gray-700 dark:text-gray-300 capitalize whitespace-nowrap">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </td>
                          {(["izquierdo","derecho"] as const).map(f => (
                            <td key={f} className="py-1 px-1 text-center">
                              <input type="text" value={entry[f]}
                                onChange={e => set(`goniometriaSuper.${joint}.${key}.${f}`, e.target.value)}
                                placeholder="0°"
                                className="w-full text-center px-1.5 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </Section>

        {/* Goniometría Inferior */}
        <Section title="Goniometría — Miembro Inferior" icon="📐">
          {(["cadera","rodilla","tobillo"] as const).map(joint => (
            <div key={joint} className="mb-5">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 capitalize">{joint}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs table-fixed">
                  <colgroup>
                    <col />
                    <col className="w-20" />
                    <col className="w-20" />
                  </colgroup>
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40">
                      <th className="text-left py-2 pl-2 pr-4 font-medium rounded-l-lg">Movimiento</th>
                      <th className="text-center py-2 px-1 font-medium">Izq°</th>
                      <th className="text-center py-2 px-1 font-medium rounded-r-lg">Der°</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys((form.goniometriaInfer as any)[joint]).map(key => {
                      const entry: GonioEntry = (form.goniometriaInfer as any)[joint][key];
                      return (
                        <tr key={key} className="border-t border-gray-100 dark:border-gray-700">
                          <td className="py-1.5 pl-2 pr-4 text-gray-700 dark:text-gray-300 capitalize whitespace-nowrap">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </td>
                          {(["izquierdo","derecho"] as const).map(f => (
                            <td key={f} className="py-1 px-1 text-center">
                              <input type="text" value={entry[f]}
                                onChange={e => set(`goniometriaInfer.${joint}.${key}.${f}`, e.target.value)}
                                placeholder="0°"
                                className="w-full text-center px-1.5 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </Section>

        {/* Columna */}
        <Section title="Columna" icon="🦴">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Plano Sagital">
              <input type="text" value={(form.columna as any).planoSagital}
                onChange={e => set("columna.planoSagital", e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Plano Frontal">
              <input type="text" value={(form.columna as any).planoFrontal}
                onChange={e => set("columna.planoFrontal", e.target.value)} className={inputCls} />
            </FormField>
          </div>
        </Section>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
            {saving ? "Guardando..." : isEdit ? "Guardar Cambios" : "Registrar Evaluación"}
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
