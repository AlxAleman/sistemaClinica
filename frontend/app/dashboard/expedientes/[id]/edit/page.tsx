"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { historiaClinicaService, HistoriaClinica } from "@/services/historiaClinicaService";
import Avatar from "@/components/Avatar";
import moment from "moment";

interface AntItem { tiene: boolean; especifique: string }
const defAnt = (): AntItem => ({ tiene: false, especifique: "" });

interface MuscleEntry { di: string; dd: string; fi: string; fd: string }
const defM = (): MuscleEntry => ({ di: "", dd: "", fi: "", fd: "" });

interface GonioEntry { inicial: string; final: string }
const defG = (): GonioEntry => ({ inicial: "", final: "" });

interface PosturalDI { d: string; i: string }
const defP = (): PosturalDI => ({ d: "", i: "" });

const initialForm = {
  peso: "", talla: "", imc: "", etnia: "",
  motivoConsulta: "", tratamientosPrevios: "",
  signosVitales: { ta: "", temperatura: "", pc: "", pb: "" },
  antecedentes: {
    diabetes: defAnt(), alergia: defAnt(), hta: defAnt(), cancer: defAnt(),
    transfusiones: defAnt(), enfReumaticas: defAnt(), hospitalizacion: defAnt(),
    encames: defAnt(), accidentes: defAnt(), cardiopatias: defAnt(),
    cirugias: defAnt(), fracturas: defAnt(),
  } as Record<string, AntItem>,
  fracturasTipo: "",
  espasmos: { tiene: false, sitio: "", caracteristicas: "" },
  habitosSalud: {
    tabaquismo: defAnt(), alcoholismo: defAnt(), drogas: defAnt(),
    actividadFisica: defAnt(), automedica: defAnt(), pasatiempo: defAnt(),
  } as Record<string, AntItem>,
  datosGinecologicos: { embarazada: null as boolean | null, numHijos: "" },
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
    hombro:     { flexion: defG(), extension: defG(), abdHorizontal: defG(), addHorizontal: defG(), rotacionInt: defG(), rotacionExt: defG() } as Record<string, GonioEntry>,
    codo:       { flexion: defG(), extension: defG() } as Record<string, GonioEntry>,
    antebrazo:  { supinacion: defG(), pronacion: defG() } as Record<string, GonioEntry>,
    muneca:     { flexion: defG(), extension: defG(), desviacionCubital: defG(), desviacionRadial: defG() } as Record<string, GonioEntry>,
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
      cabezaCuello: { inclinacion: defP() },
      hombro: { escapulaAdd: defP(), escapulaAbd: defP() },
      pelvis: { lateralizacion: defP() },
      rodilla: { valgo: defP(), varo: defP() },
    },
  },
  columna: { planoSagital: "", planoFrontal: "" },
};

type FormType = typeof initialForm;

function stripUnit(v: string): string {
  if (!v) return "";
  return v.replace(/\s*(mmHg|cmHg|lpm|bpm|°C|°F|[CF]|%|cm)\s*$/i, "").trim();
}

function buildFormFromHistoria(h: HistoriaClinica): FormType {
  const sv = (h.signosVitales as any) ?? {};
  const ant = (h.antecedentes as any) ?? {};
  const hab = (h.habitosSalud as any) ?? {};
  const esp = (h.espasmos as any) ?? {};
  const diag = (h.diagnosticoRehabilitacion as any) ?? {};
  const tras = (h.traslados as any) ?? {};
  const marcha = (h.marchaDeambulacion as any) ?? {};
  const fm = (h.fuerzaMuscular as any) ?? {};
  const gs = (h.goniometriaSuper as any) ?? {};
  const gi = (h.goniometriaInfer as any) ?? {};
  const vp = (h.valoracionPostural as any) ?? {};
  const col = (h.columna as any) ?? {};
  const dg = (h.datosGinecologicos as any) ?? {};

  return {
    ...initialForm,
    peso: h.peso?.toString() ?? "",
    talla: h.talla?.toString() ?? "",
    imc: h.imc?.toString() ?? "",
    etnia: h.etnia ?? "",
    motivoConsulta: h.motivoConsulta ?? "",
    tratamientosPrevios: h.tratamientosPrevios ?? "",
    signosVitales: {
      ta: stripUnit(sv.ta ?? ""),
      temperatura: stripUnit(sv.temperatura ?? ""),
      pc: stripUnit(sv.pc ?? ""),
      pb: stripUnit(sv.pb ?? ""),
    },
    antecedentes: { ...initialForm.antecedentes, ...ant },
    fracturasTipo: ant.fracturasTipo ?? "",
    espasmos: { tiene: esp.tiene ?? false, sitio: esp.sitio ?? "", caracteristicas: esp.caracteristicas ?? "" },
    habitosSalud: { ...initialForm.habitosSalud, ...hab },
    datosGinecologicos: {
      embarazada: dg.embarazada ?? null,
      numHijos: dg.numHijos?.toString() ?? "",
    },
    diagnosticoRehabilitacion: { ...initialForm.diagnosticoRehabilitacion, ...diag },
    cicatrizQuirurgica: h.cicatrizQuirurgica ?? "",
    traslados: { ...initialForm.traslados, ...tras },
    marchaDeambulacion: { ...initialForm.marchaDeambulacion, ...marcha },
    escalaDolor: h.escalaDolor ?? 0,
    fuerzaMuscular: {
      miembroSuperior: { ...initialForm.fuerzaMuscular.miembroSuperior, ...(fm.miembroSuperior ?? {}) },
      miembroInferior: { ...initialForm.fuerzaMuscular.miembroInferior, ...(fm.miembroInferior ?? {}) },
    },
    goniometriaSuper: {
      hombro:    { ...initialForm.goniometriaSuper.hombro,    ...(gs.hombro ?? {}) },
      codo:      { ...initialForm.goniometriaSuper.codo,      ...(gs.codo ?? {}) },
      antebrazo: { ...initialForm.goniometriaSuper.antebrazo, ...(gs.antebrazo ?? {}) },
      muneca:    { ...initialForm.goniometriaSuper.muneca,    ...(gs.muneca ?? {}) },
    },
    goniometriaInfer: {
      cadera:  { ...initialForm.goniometriaInfer.cadera,  ...(gi.cadera ?? {}) },
      rodilla: { ...initialForm.goniometriaInfer.rodilla, ...(gi.rodilla ?? {}) },
      tobillo: { ...initialForm.goniometriaInfer.tobillo, ...(gi.tobillo ?? {}) },
    },
    valoracionPostural: {
      vistaAnterior: { ...initialForm.valoracionPostural.vistaAnterior, ...(vp.vistaAnterior ?? {}) },
      vistaLateral:  { ...initialForm.valoracionPostural.vistaLateral,  ...(vp.vistaLateral ?? {}) },
      vistaPosterior: { ...initialForm.valoracionPostural.vistaPosterior, ...(vp.vistaPosterior ?? {}) },
    },
    columna: { planoSagital: col.planoSagital ?? "", planoFrontal: col.planoFrontal ?? "" },
  };
}

const ANT_LABELS: Record<string, string> = {
  diabetes: "Diabetes", alergia: "Alergia", hta: "HTA",
  cancer: "Cáncer", transfusiones: "Transfusiones",
  enfReumaticas: "Enf. Reumáticas", hospitalizacion: "Hospitalización",
  encames: "Encames", accidentes: "Accidentes",
  cardiopatias: "Cardiopatías", cirugias: "Cirugías", fracturas: "Fracturas",
};
const HABITO_LABELS: Record<string, string> = {
  tabaquismo: "Tabaquismo", alcoholismo: "Alcoholismo", drogas: "Drogas",
  actividadFisica: "Actividad Física", automedica: "Se Automedica", pasatiempo: "Pasatiempo",
};
const MS_LABELS: Record<string, string> = {
  fxHombro: "Fx de Hombro", exHombro: "Ex de Hombro",
  abdHombro: "Abd de Hombro", addHombro: "Add de Hombro",
  fxCodo: "Fx de Codo", exCodo: "Ex de Codo",
  fxMuneca: "Fx de Muñeca", exMuneca: "Ex de Muñeca",
};
const MI_LABELS: Record<string, string> = {
  fxCadera: "Fx de Cadera", exCadera: "Ex de Cadera",
  abdCadera: "Abd de Cadera", addCadera: "Add de Cadera",
  fxRodilla: "Fx de Rodilla", exRodilla: "Ex de Rodilla",
  fxTobillo: "Fx de Tobillo", exTobillo: "Ex de Tobillo",
};
const HOMBRO_LABELS: Record<string, string> = {
  flexion: "Flexión (0°-180°)", extension: "Extensión (0°-60°)",
  abdHorizontal: "Abducción (0°-180°)", addHorizontal: "Aducción (0°-125°)",
  rotacionInt: "Rot. Interna (0°-90°)", rotacionExt: "Rot. Externa (0°-90°)",
};
const CADERA_LABELS: Record<string, string> = {
  flexionRodFlex: "Flexión c/Rod. Flex. (0°-125°)", flexionRodExt: "Flexión c/Rod. Ext.",
  extension: "Extensión (0°-15°)", abduccion: "Abducción",
  adduccion: "Aducción", rotacionInt: "Rot. Interna", rotacionExt: "Rot. Externa",
};

const STEPS = [
  "Exploración y Consulta",
  "Antecedentes",
  "Hábitos y Datos Adicionales",
  "Diagnóstico y Marcha",
  "Fuerza Muscular",
  "Goniometría Superior",
  "Goniometría Inferior",
  "Valoración Postural",
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-4 pb-2 border-b border-indigo-100 dark:border-indigo-900/30">
      {children}
    </h3>
  );
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{children}</label>;
}
function TextInput({ value, onChange, placeholder = "", type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
  );
}
function TextArea({ value, onChange, rows = 3, placeholder = "" }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none" />
  );
}
function AntRow({ label, value, onChange }: { label: string; value: AntItem; onChange: (v: AntItem) => void }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[130px]">{label}</span>
      <div className="flex items-center gap-3">
        {[true, false].map((v) => (
          <label key={String(v)} className="flex items-center gap-1 cursor-pointer">
            <input type="radio" checked={value.tiene === v} onChange={() => onChange({ ...value, tiene: v })} className="text-indigo-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">{v ? "Sí" : "No"}</span>
          </label>
        ))}
      </div>
      {value.tiene && (
        <input type="text" placeholder="Especifique..." value={value.especifique}
          onChange={(e) => onChange({ ...value, especifique: e.target.value })}
          className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
      )}
    </div>
  );
}
function GonioRow({ label, value, onChange }: { label: string; value: GonioEntry; onChange: (v: GonioEntry) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-center py-1.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
      <input type="text" placeholder="Inicial" value={value.inicial} onChange={(e) => onChange({ ...value, inicial: e.target.value })}
        className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" />
      <input type="text" placeholder="Final" value={value.final} onChange={(e) => onChange({ ...value, final: e.target.value })}
        className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" />
    </div>
  );
}
function MuscleRow({ label, value, onChange }: { label: string; value: MuscleEntry; onChange: (v: MuscleEntry) => void }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 items-center py-1.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <span className="text-xs text-gray-600 dark:text-gray-400 col-span-1">{label}</span>
      {(["di", "dd", "fi", "fd"] as const).map((k) => (
        <input key={k} type="text" placeholder="0-5" value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })}
          className="px-1 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" />
      ))}
    </div>
  );
}
function PosturalRow({ label, value, onChange }: { label: string; value: { d: string; i: string }; onChange: (v: { d: string; i: string }) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-center py-1.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
      <input type="text" placeholder="D" value={value.d} onChange={(e) => onChange({ ...value, d: e.target.value })}
        className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" />
      <input type="text" placeholder="I" value={value.i} onChange={(e) => onChange({ ...value, i: e.target.value })}
        className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" />
    </div>
  );
}

function VitalInput({ label, value, onChange, units, unit, onUnitChange }: {
  label: string; value: string; onChange: (v: string) => void;
  units: string[]; unit: string; onUnitChange: (u: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
        {units.length === 1 ? (
          <span className="px-2.5 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-200 dark:border-gray-600 rounded-r-lg text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center">
            {units[0]}
          </span>
        ) : (
          <select value={unit} onChange={(e) => onUnitChange(e.target.value)}
            className="px-1.5 py-2 text-xs bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-200 dark:border-gray-600 rounded-r-lg text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer">
            {units.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

export default function EditarExpedientePage() {
  const params = useParams();
  const router = useRouter();
  const historiaId = params.id as string;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormType>(initialForm);
  const [historia, setHistoria] = useState<HistoriaClinica | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tempUnit, setTempUnit] = useState<"°C" | "°F">("°C");

  useEffect(() => {
    historiaClinicaService.getById(historiaId)
      .then((data) => {
        setHistoria(data);
        setForm(buildFormFromHistoria(data));
        const sv = (data.signosVitales as any) ?? {};
        if (sv.temperatura && /°?F\s*$/i.test(sv.temperatura)) setTempUnit("°F");
      })
      .catch(() => {
        toast.error("No se pudo cargar el expediente");
        router.push("/dashboard/expedientes");
      })
      .finally(() => setLoading(false));
  }, [historiaId]);

  useEffect(() => {
    const peso = parseFloat(form.peso);
    const talla = parseFloat(form.talla);
    if (peso > 0 && talla > 0) {
      const tallaM = talla < 3 ? talla : talla / 100;
      setForm((f) => ({ ...f, imc: (peso / (tallaM * tallaM)).toFixed(1) }));
    }
  }, [form.peso, form.talla]);

  const setAnt    = (key: string, val: AntItem) => setForm((f) => ({ ...f, antecedentes: { ...f.antecedentes, [key]: val } }));
  const setHabito = (key: string, val: AntItem) => setForm((f) => ({ ...f, habitosSalud: { ...f.habitosSalud, [key]: val } }));
  const setMuscSup = (key: string, val: MuscleEntry) =>
    setForm((f) => ({ ...f, fuerzaMuscular: { ...f.fuerzaMuscular, miembroSuperior: { ...f.fuerzaMuscular.miembroSuperior, [key]: val } } }));
  const setMuscInf = (key: string, val: MuscleEntry) =>
    setForm((f) => ({ ...f, fuerzaMuscular: { ...f.fuerzaMuscular, miembroInferior: { ...f.fuerzaMuscular.miembroInferior, [key]: val } } }));
  const setGonioSup = (seg: string, key: string, val: GonioEntry) =>
    setForm((f) => ({ ...f, goniometriaSuper: { ...f.goniometriaSuper, [seg]: { ...(f.goniometriaSuper as any)[seg], [key]: val } } }));
  const setGonioInf = (seg: string, key: string, val: GonioEntry) =>
    setForm((f) => ({ ...f, goniometriaInfer: { ...f.goniometriaInfer, [seg]: { ...(f.goniometriaInfer as any)[seg], [key]: val } } }));
  const setPostural = (vista: string, seg: string, mov: string, val: { d: string; i: string }) =>
    setForm((f) => ({
      ...f, valoracionPostural: {
        ...f.valoracionPostural,
        [vista]: { ...(f.valoracionPostural as any)[vista], [seg]: { ...(f.valoracionPostural as any)[vista][seg], [mov]: val } },
      },
    }));

  const handleSave = async () => {
    if (!historia) return;
    setSaving(true);
    try {
      await historiaClinicaService.update(historiaId, {
        peso: form.peso ? parseFloat(form.peso) : undefined,
        talla: form.talla ? parseFloat(form.talla) : undefined,
        imc: form.imc ? parseFloat(form.imc) : undefined,
        etnia: form.etnia || undefined,
        motivoConsulta: form.motivoConsulta || undefined,
        tratamientosPrevios: form.tratamientosPrevios || undefined,
        signosVitales: {
          ta: form.signosVitales.ta ? `${form.signosVitales.ta} mmHg` : "",
          temperatura: form.signosVitales.temperatura ? `${form.signosVitales.temperatura} ${tempUnit}` : "",
          pc: form.signosVitales.pc ? `${form.signosVitales.pc} lpm` : "",
          pb: form.signosVitales.pb ? `${form.signosVitales.pb}%` : "",
        },
        antecedentes: form.antecedentes,
        espasmos: form.espasmos,
        habitosSalud: form.habitosSalud,
        datosGinecologicos: {
          embarazada: form.datosGinecologicos.embarazada,
          numHijos: form.datosGinecologicos.numHijos ? parseInt(form.datosGinecologicos.numHijos) : null,
        },
        diagnosticoRehabilitacion: form.diagnosticoRehabilitacion,
        cicatrizQuirurgica: form.cicatrizQuirurgica || undefined,
        traslados: form.traslados,
        marchaDeambulacion: form.marchaDeambulacion,
        escalaDolor: form.escalaDolor,
        fuerzaMuscular: form.fuerzaMuscular,
        goniometriaSuper: form.goniometriaSuper,
        goniometriaInfer: form.goniometriaInfer,
        valoracionPostural: form.valoracionPostural,
        columna: form.columna,
      });
      toast.success("Expediente actualizado exitosamente");
      router.push(`/dashboard/patients/${historia.patientId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al actualizar el expediente");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="space-y-6">
          <div>
            <SectionTitle>Exploración Física</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[{ label: "Peso (kg)", key: "peso" }, { label: "Estatura (cm)", key: "talla" }, { label: "IMC (auto)", key: "imc" }].map(({ label, key }) => (
                <div key={key}>
                  <FieldLabel>{label}</FieldLabel>
                  <TextInput value={(form as any)[key]} onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                    type="number" placeholder={key === "imc" ? "Auto" : ""} />
                </div>
              ))}
            </div>
            {form.imc && (
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                {[
                  { label: "Bajo peso", range: "< 18.5", color: "bg-blue-100 text-blue-700", check: parseFloat(form.imc) < 18.5 },
                  { label: "Normal", range: "18.5–24.9", color: "bg-green-100 text-green-700", check: parseFloat(form.imc) >= 18.5 && parseFloat(form.imc) < 25 },
                  { label: "Sobrepeso", range: "25–29.9", color: "bg-yellow-100 text-yellow-700", check: parseFloat(form.imc) >= 25 && parseFloat(form.imc) < 30 },
                  { label: "Obeso", range: "> 30", color: "bg-red-100 text-red-700", check: parseFloat(form.imc) >= 30 },
                ].map((b) => (
                  <div key={b.label} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${b.color} ${b.check ? "ring-2 ring-offset-1 ring-current" : "opacity-40"}`}>
                    {b.label} <span className="opacity-70">({b.range})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <SectionTitle>Motivo de Consulta</SectionTitle>
            <TextArea value={form.motivoConsulta} onChange={(v) => setForm((f) => ({ ...f, motivoConsulta: v }))} rows={4} placeholder="Describa el motivo principal de la consulta..." />
          </div>
          <div>
            <SectionTitle>Tratamientos Previos</SectionTitle>
            <TextArea value={form.tratamientosPrevios} onChange={(v) => setForm((f) => ({ ...f, tratamientosPrevios: v }))} rows={3} placeholder="Tratamientos previos relevantes..." />
          </div>
          <div>
            <SectionTitle>Signos Vitales</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <VitalInput label="T/A" value={form.signosVitales.ta} unit="mmHg" units={["mmHg"]}
                onChange={(v) => setForm((f) => ({ ...f, signosVitales: { ...f.signosVitales, ta: v } }))}
                onUnitChange={() => {}} />
              <VitalInput label="Temperatura" value={form.signosVitales.temperatura} unit={tempUnit} units={["°C", "°F"]}
                onChange={(v) => setForm((f) => ({ ...f, signosVitales: { ...f.signosVitales, temperatura: v } }))}
                onUnitChange={(u) => setTempUnit(u as "°C" | "°F")} />
              <VitalInput label="Pulso" value={form.signosVitales.pc} unit="lpm" units={["lpm"]}
                onChange={(v) => setForm((f) => ({ ...f, signosVitales: { ...f.signosVitales, pc: v } }))}
                onUnitChange={() => {}} />
              <VitalInput label="Pulsioximetría" value={form.signosVitales.pb} unit="%" units={["%"]}
                onChange={(v) => setForm((f) => ({ ...f, signosVitales: { ...f.signosVitales, pb: v } }))}
                onUnitChange={() => {}} />
            </div>
          </div>
        </div>
      );

      case 1: return (
        <div className="space-y-6">
          <div>
            <SectionTitle>Antecedentes Patológicos y Heredofamiliares</SectionTitle>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
              {Object.keys(ANT_LABELS).map((key) => (
                <AntRow key={key} label={ANT_LABELS[key]} value={form.antecedentes[key]} onChange={(v) => setAnt(key, v)} />
              ))}
            </div>
            {form.antecedentes.fracturas?.tiene && (
              <div className="mt-3"><FieldLabel>Tipo de Fractura</FieldLabel>
                <TextInput value={form.fracturasTipo} onChange={(v) => setForm((f) => ({ ...f, fracturasTipo: v }))} placeholder="Describa el tipo de fractura..." />
              </div>
            )}
          </div>
          <div>
            <SectionTitle>Espasmos o Contractura Muscular</SectionTitle>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">¿Presenta espasmos?</span>
                {[true, false].map((v) => (
                  <label key={String(v)} className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={form.espasmos.tiene === v} onChange={() => setForm((f) => ({ ...f, espasmos: { ...f.espasmos, tiene: v } }))} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{v ? "Sí" : "No"}</span>
                  </label>
                ))}
              </div>
              {form.espasmos.tiene && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><FieldLabel>Sitio</FieldLabel><TextInput value={form.espasmos.sitio} onChange={(v) => setForm((f) => ({ ...f, espasmos: { ...f.espasmos, sitio: v } }))} /></div>
                  <div><FieldLabel>Características</FieldLabel><TextInput value={form.espasmos.caracteristicas} onChange={(v) => setForm((f) => ({ ...f, espasmos: { ...f.espasmos, caracteristicas: v } }))} /></div>
                </div>
              )}
            </div>
          </div>
        </div>
      );

      case 2: return (
        <div className="space-y-6">
          <div>
            <SectionTitle>Hábitos de Salud</SectionTitle>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
              {Object.keys(HABITO_LABELS).map((key) => (
                <AntRow key={key} label={HABITO_LABELS[key]} value={form.habitosSalud[key]} onChange={(v) => setHabito(key, v)} />
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>En Mujeres — Estado de Gravidez</SectionTitle>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">¿Está embarazada?</span>
                {([true, false, null] as (boolean | null)[]).map((v) => (
                  <label key={String(v)} className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={form.datosGinecologicos.embarazada === v}
                      onChange={() => setForm((f) => ({ ...f, datosGinecologicos: { ...f.datosGinecologicos, embarazada: v } }))} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{v === null ? "N/A" : v ? "Sí" : "No"}</span>
                  </label>
                ))}
              </div>
              <div className="w-40"><FieldLabel>N° de hijos</FieldLabel>
                <TextInput type="number" value={form.datosGinecologicos.numHijos}
                  onChange={(v) => setForm((f) => ({ ...f, datosGinecologicos: { ...f.datosGinecologicos, numHijos: v } }))} />
              </div>
            </div>
          </div>
        </div>
      );

      case 3: return (
        <div className="space-y-6">
          <div>
            <SectionTitle>Diagnóstico Médico en Rehabilitación</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{ label: "Reflejos", key: "reflejos" }, { label: "Sensibilidad", key: "sensibilidad" }, { label: "Lenguaje / Orientación", key: "lenguajeOrientacion" }, { label: "Otros", key: "otros" }].map(({ label, key }) => (
                <div key={key}><FieldLabel>{label}</FieldLabel>
                  <TextArea value={(form.diagnosticoRehabilitacion as any)[key]} rows={2}
                    onChange={(v) => setForm((f) => ({ ...f, diagnosticoRehabilitacion: { ...f.diagnosticoRehabilitacion, [key]: v } }))} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>Cicatriz Quirúrgica</SectionTitle>
            <TextArea value={form.cicatrizQuirurgica} onChange={(v) => setForm((f) => ({ ...f, cicatrizQuirurgica: v }))} rows={2} placeholder="Descripción de cicatrices quirúrgicas..." />
          </div>
          <div>
            <SectionTitle>Traslados</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[{ label: "Velocidad Inicial", key: "velInicial" }, { label: "Velocidad Final", key: "velFinal" }].map(({ label, key }) => (
                <div key={key}><FieldLabel>{label}</FieldLabel>
                  <select value={(form.traslados as any)[key]} onChange={(e) => setForm((f) => ({ ...f, traslados: { ...f.traslados, [key]: e.target.value } }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <option value="">-- Seleccionar --</option>
                    <option value="independiente">Independiente</option>
                    <option value="sillaRuedas">Silla de Ruedas</option>
                    <option value="conAyuda">Con Ayuda</option>
                    <option value="camillas">Camillas</option>
                    <option value="muletas">Muletas</option>
                    <option value="andador">Andador</option>
                  </select>
                </div>
              ))}
              <div><FieldLabel>Observaciones</FieldLabel>
                <TextInput value={form.traslados.observaciones} onChange={(v) => setForm((f) => ({ ...f, traslados: { ...f.traslados, observaciones: v } }))} />
              </div>
            </div>
          </div>
          <div>
            <SectionTitle>Marcha / Deambulación</SectionTitle>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {[{ key: "libre", label: "Libre" }, { key: "claudicante", label: "Claudicante" }, { key: "conAyuda", label: "Con Ayuda" }, { key: "espastica", label: "Espástica" }, { key: "ataxica", label: "Atáxica" }, { key: "otros", label: "Otros" }].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(form.marchaDeambulacion as any)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, marchaDeambulacion: { ...f.marchaDeambulacion, [key]: e.target.checked } }))}
                      className="rounded text-indigo-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
              <div><FieldLabel>Observaciones de marcha</FieldLabel>
                <TextInput value={form.marchaDeambulacion.observaciones} onChange={(v) => setForm((f) => ({ ...f, marchaDeambulacion: { ...f.marchaDeambulacion, observaciones: v } }))} />
              </div>
            </div>
          </div>
          <div>
            <SectionTitle>Intensidad de Dolor (EVA)</SectionTitle>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6">
              <div className="relative">
                <div className="h-4 rounded-full overflow-hidden" style={{ background: "linear-gradient(to right, #3b82f6, #22c55e, #eab308, #ef4444)" }} />
                <input type="range" min={0} max={10} step={1} value={form.escalaDolor}
                  onChange={(e) => setForm((f) => ({ ...f, escalaDolor: parseInt(e.target.value) }))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-4" />
                <div className="absolute top-0 h-4 w-1 bg-white border-2 border-gray-800 dark:border-gray-200 rounded-full transition-all"
                  style={{ left: `${(form.escalaDolor / 10) * 100}%`, transform: "translateX(-50%)" }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                {[0,1,2,3,4,5,6,7,8,9,10].map((n) => <span key={n}>{n}</span>)}
              </div>
              <div className="flex justify-between text-xs font-medium mt-1 text-gray-500 dark:text-gray-400">
                <span>Sin dolor</span><span>Dolor Moderado</span><span>Insoportable</span>
              </div>
              <div className="text-center mt-4">
                <span className={`text-2xl font-bold ${form.escalaDolor <= 3 ? "text-green-600" : form.escalaDolor <= 6 ? "text-yellow-600" : "text-red-600"}`}>{form.escalaDolor}</span>
                <span className="text-gray-400 dark:text-gray-500 text-sm ml-1">/ 10</span>
              </div>
            </div>
          </div>
        </div>
      );

      case 4: return (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Escala de Fuerza: 0=Nula · 1=Vestigio · 2=Mal · 3=Regular · 4=Bueno · 5=Normal</p>
          </div>
          <div>
            <SectionTitle>Miembro Superior</SectionTitle>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {["Segmento","D Ini.","D Fin.","I Ini.","I Fin."].map((h) => <span key={h} className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center first:text-left">{h}</span>)}
              </div>
              {Object.keys(MS_LABELS).map((key) => (
                <MuscleRow key={key} label={MS_LABELS[key]} value={form.fuerzaMuscular.miembroSuperior[key]} onChange={(v) => setMuscSup(key, v)} />
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>Miembro Inferior</SectionTitle>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {["Segmento","D Ini.","D Fin.","I Ini.","I Fin."].map((h) => <span key={h} className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center first:text-left">{h}</span>)}
              </div>
              {Object.keys(MI_LABELS).map((key) => (
                <MuscleRow key={key} label={MI_LABELS[key]} value={form.fuerzaMuscular.miembroInferior[key]} onChange={(v) => setMuscInf(key, v)} />
              ))}
            </div>
          </div>
        </div>
      );

      case 5: return (
        <div className="space-y-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4">
            <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">Goniometría en Miembros Superiores — ingrese grados para evaluación inicial y final</p>
          </div>
          {[
            { label: "Hombro", seg: "hombro", labels: HOMBRO_LABELS },
            { label: "Codo", seg: "codo", labels: { flexion: "Flexión (0°-145°)", extension: "Extensión (145°-0°)" } },
            { label: "Antebrazo", seg: "antebrazo", labels: { supinacion: "Supinación (0°-90°)", pronacion: "Pronación (0°-80°)" } },
            { label: "Muñeca", seg: "muneca", labels: { flexion: "Flexión (0°-80°)", extension: "Extensión (0°-70°)", desviacionCubital: "Desviación Cubital (0°-35°)", desviacionRadial: "Desviación Radial (0°-20°)" } },
          ].map(({ label, seg, labels }) => (
            <div key={seg}>
              <SectionTitle>{label}</SectionTitle>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {["Movimiento","E. Inicial (°)","E. Final (°)"].map((h) => <span key={h} className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center first:text-left">{h}</span>)}
                </div>
                {Object.entries(labels).map(([key, lbl]) => (
                  <GonioRow key={key} label={lbl as string} value={(form.goniometriaSuper as any)[seg][key]} onChange={(v) => setGonioSup(seg, key, v)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );

      case 6: return (
        <div className="space-y-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4">
            <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">Goniometría en Miembros Inferiores — ingrese grados para evaluación inicial y final</p>
          </div>
          {[
            { label: "Cadera", seg: "cadera", labels: CADERA_LABELS },
            { label: "Rodilla", seg: "rodilla", labels: { flexion: "Flexión (0°-135°)", extension: "Extensión" } },
            { label: "Tobillo / Pie", seg: "tobillo", labels: { dorsiflexion: "Dorsiflexión (0°-20°)", plantiflexion: "Plantiflexión (0°-50°)", inversion: "Inversión (0°-35°)", eversion: "Eversión (0°-20°)" } },
          ].map(({ label, seg, labels }) => (
            <div key={seg}>
              <SectionTitle>{label}</SectionTitle>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {["Movimiento","E. Inicial (°)","E. Final (°)"].map((h) => <span key={h} className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center first:text-left">{h}</span>)}
                </div>
                {Object.entries(labels).map(([key, lbl]) => (
                  <GonioRow key={key} label={lbl as string} value={(form.goniometriaInfer as any)[seg][key]} onChange={(v) => setGonioInf(seg, key, v)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );

      case 7: return (
        <div className="space-y-6">
          <div>
            <SectionTitle>Vista Anterior</SectionTitle>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {["Segmento/Movimiento","D","I"].map((h) => <span key={h} className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center first:text-left">{h}</span>)}
              </div>
              <PosturalRow label="Cabeza & Cuello — Rotación" value={form.valoracionPostural.vistaAnterior.cabezaCuello.rotacion} onChange={(v) => setPostural("vistaAnterior","cabezaCuello","rotacion",v)} />
              <PosturalRow label="Hombro — Elevación" value={form.valoracionPostural.vistaAnterior.hombro.elevacion} onChange={(v) => setPostural("vistaAnterior","hombro","elevacion",v)} />
              <PosturalRow label="Pelvis — Descenso" value={form.valoracionPostural.vistaAnterior.pelvis.descenso} onChange={(v) => setPostural("vistaAnterior","pelvis","descenso",v)} />
              <PosturalRow label="Pelvis — Elevación" value={form.valoracionPostural.vistaAnterior.pelvis.elevacion} onChange={(v) => setPostural("vistaAnterior","pelvis","elevacion",v)} />
              <PosturalRow label="M. Inferior — Rotación Int." value={form.valoracionPostural.vistaAnterior.miembroInferior.rotacionInt} onChange={(v) => setPostural("vistaAnterior","miembroInferior","rotacionInt",v)} />
              <PosturalRow label="M. Inferior — Rotación Ext." value={form.valoracionPostural.vistaAnterior.miembroInferior.rotacionExt} onChange={(v) => setPostural("vistaAnterior","miembroInferior","rotacionExt",v)} />
            </div>
          </div>
          <div>
            <SectionTitle>Vista Lateral</SectionTitle>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {["Segmento/Movimiento","D","I"].map((h) => <span key={h} className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center first:text-left">{h}</span>)}
              </div>
              {[
                ["cabezaCuello","proyeccionAnt","Cabeza & Cuello — Proyección Ant."],
                ["cabezaCuello","proyeccionPost","Cabeza & Cuello — Proyección Post."],
                ["cabezaCuello","rectificacion","Cabeza & Cuello — Rectificación"],
                ["cabezaCuello","hiperlordosis","Cabeza & Cuello — Hiperlordosis"],
                ["hombro","retropulsion","Hombro — Retropulsión"],
                ["hombro","antepulsion","Hombro — Antepulsión"],
                ["pelvis","retroversion","Pelvis — Retroversión"],
                ["pelvis","anteversion","Pelvis — Anteversión"],
                ["rodilla","flexum","Rodilla — Flexum"],
                ["rodilla","recurvatum","Rodilla — Recurvatum"],
              ].map(([seg, mov, lbl]) => (
                <PosturalRow key={`${seg}-${mov}`} label={lbl} value={(form.valoracionPostural.vistaLateral as any)[seg][mov]} onChange={(v) => setPostural("vistaLateral",seg,mov,v)} />
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>Vista Posterior</SectionTitle>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {["Segmento/Movimiento","D","I"].map((h) => <span key={h} className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center first:text-left">{h}</span>)}
              </div>
              {[
                ["cabezaCuello","inclinacion","Cabeza & Cuello — Inclinación"],
                ["hombro","escapulaAdd","Hombro — Escápula ADD"],
                ["hombro","escapulaAbd","Hombro — Escápula ABD"],
                ["pelvis","lateralizacion","Pelvis — Lateralización"],
                ["rodilla","valgo","Rodilla — Valgo"],
                ["rodilla","varo","Rodilla — Varo"],
              ].map(([seg, mov, lbl]) => (
                <PosturalRow key={`${seg}-${mov}`} label={lbl} value={(form.valoracionPostural.vistaPosterior as any)[seg][mov]} onChange={(v) => setPostural("vistaPosterior",seg,mov,v)} />
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>Columna</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><FieldLabel>Plano Sagital</FieldLabel>
                <TextArea value={form.columna.planoSagital} onChange={(v) => setForm((f) => ({ ...f, columna: { ...f.columna, planoSagital: v } }))} rows={3} placeholder="Hipercifosis, Hiperlordosis, etc." />
              </div>
              <div><FieldLabel>Plano Frontal</FieldLabel>
                <TextArea value={form.columna.planoFrontal} onChange={(v) => setForm((f) => ({ ...f, columna: { ...f.columna, planoFrontal: v } }))} rows={3} placeholder="Escoliosis tipo C, S, etc." />
              </div>
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Cargando expediente...</p>
        </div>
      </div>
    );
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Editar Expediente Médico</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Historia clínica de fisioterapia</p>
      </div>

      {/* Paciente vinculado */}
      {historia?.patient && (
        <div className="mb-6 flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
          <Avatar
            photoUrl={historia.patient.photoUrl}
            gender={historia.patient.gender as any}
            name={historia.patient.name}
            size="md"
          />
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{historia.patient.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {historia.patient.phone && `${historia.patient.phone} · `}
              Actualizado {moment(historia.updatedAt).fromNow()}
            </p>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  i === step ? "bg-indigo-600 text-white shadow-sm"
                  : i < step ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 cursor-pointer hover:bg-indigo-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-default"
                }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < step ? "bg-indigo-600 text-white" : i === step ? "bg-white text-indigo-600" : "bg-gray-300 dark:bg-gray-600 text-gray-500"
                }`}>{i < step ? "✓" : i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`h-0.5 w-3 ${i < step ? "bg-indigo-400" : "bg-gray-200 dark:bg-gray-600"}`} />}
            </div>
          ))}
        </div>
        <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {/* Contenido del paso */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-h-[400px]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {step + 1}
          </span>
          {STEPS[step]}
        </h2>
        {renderStep()}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={() => step > 0 ? setStep((s) => s - 1) : router.push(`/dashboard/patients/${historia?.patientId}`)}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          {step === 0 ? "← Cancelar" : "← Anterior"}
        </button>

        <span className="text-sm text-gray-400 dark:text-gray-500">Paso {step + 1} de {STEPS.length}</span>

        {isLastStep ? (
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Guardando...</> : "Guardar Cambios"}
          </button>
        ) : (
          <button onClick={() => setStep((s) => s + 1)}
            className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
            Siguiente →
          </button>
        )}
      </div>
    </div>
  );
}
