-- CreateTable: EvaluacionFisica (examen físico por visita)
CREATE TABLE "EvaluacionFisica" (
    "id" TEXT NOT NULL,
    "historiaClinicaId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "tipo" TEXT,
    "fechaEvaluacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "peso" DOUBLE PRECISION,
    "talla" DOUBLE PRECISION,
    "imc" DOUBLE PRECISION,
    "signosVitales" JSONB,
    "espasmos" JSONB,
    "diagnosticoRehabilitacion" JSONB,
    "cicatrizQuirurgica" TEXT,
    "traslados" JSONB,
    "marchaDeambulacion" JSONB,
    "escalaDolor" INTEGER,
    "fuerzaMuscular" JSONB,
    "goniometriaSuper" JSONB,
    "goniometriaInfer" JSONB,
    "valoracionPostural" JSONB,
    "columna" JSONB,
    "creadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluacionFisica_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey for EvaluacionFisica
ALTER TABLE "EvaluacionFisica" ADD CONSTRAINT "EvaluacionFisica_historiaClinicaId_fkey"
    FOREIGN KEY ("historiaClinicaId") REFERENCES "HistoriaClinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvaluacionFisica" ADD CONSTRAINT "EvaluacionFisica_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex for EvaluacionFisica
CREATE INDEX "EvaluacionFisica_historiaClinicaId_idx" ON "EvaluacionFisica"("historiaClinicaId");
CREATE INDEX "EvaluacionFisica_patientId_idx" ON "EvaluacionFisica"("patientId");
CREATE INDEX "EvaluacionFisica_fechaEvaluacion_idx" ON "EvaluacionFisica"("fechaEvaluacion");

-- Add referidoPor to HistoriaClinica
ALTER TABLE "HistoriaClinica" ADD COLUMN "referidoPor" TEXT;

-- DataMigration: move existing physical exam data from HistoriaClinica → EvaluacionFisica
INSERT INTO "EvaluacionFisica" (
    "id", "historiaClinicaId", "patientId", "tipo", "fechaEvaluacion",
    "peso", "talla", "imc",
    "signosVitales", "espasmos", "diagnosticoRehabilitacion", "cicatrizQuirurgica",
    "traslados", "marchaDeambulacion", "escalaDolor", "fuerzaMuscular",
    "goniometriaSuper", "goniometriaInfer", "valoracionPostural", "columna",
    "creadoPor", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    hc."id",
    hc."patientId",
    'inicial',
    hc."fechaEvaluacion",
    hc."peso", hc."talla", hc."imc",
    hc."signosVitales", hc."espasmos", hc."diagnosticoRehabilitacion", hc."cicatrizQuirurgica",
    hc."traslados", hc."marchaDeambulacion", hc."escalaDolor", hc."fuerzaMuscular",
    hc."goniometriaSuper", hc."goniometriaInfer", hc."valoracionPostural", hc."columna",
    hc."creadoPor", hc."createdAt", hc."updatedAt"
FROM "HistoriaClinica" hc
WHERE (
    hc."signosVitales" IS NOT NULL OR hc."espasmos" IS NOT NULL OR
    hc."diagnosticoRehabilitacion" IS NOT NULL OR hc."cicatrizQuirurgica" IS NOT NULL OR
    hc."traslados" IS NOT NULL OR hc."marchaDeambulacion" IS NOT NULL OR
    hc."escalaDolor" IS NOT NULL OR hc."fuerzaMuscular" IS NOT NULL OR
    hc."goniometriaSuper" IS NOT NULL OR hc."goniometriaInfer" IS NOT NULL OR
    hc."valoracionPostural" IS NOT NULL OR hc."columna" IS NOT NULL
);

-- Drop dynamic exam columns from HistoriaClinica
ALTER TABLE "HistoriaClinica" DROP COLUMN IF EXISTS "signosVitales";
ALTER TABLE "HistoriaClinica" DROP COLUMN IF EXISTS "espasmos";
ALTER TABLE "HistoriaClinica" DROP COLUMN IF EXISTS "diagnosticoRehabilitacion";
ALTER TABLE "HistoriaClinica" DROP COLUMN IF EXISTS "cicatrizQuirurgica";
ALTER TABLE "HistoriaClinica" DROP COLUMN IF EXISTS "traslados";
ALTER TABLE "HistoriaClinica" DROP COLUMN IF EXISTS "marchaDeambulacion";
ALTER TABLE "HistoriaClinica" DROP COLUMN IF EXISTS "escalaDolor";
ALTER TABLE "HistoriaClinica" DROP COLUMN IF EXISTS "fuerzaMuscular";
ALTER TABLE "HistoriaClinica" DROP COLUMN IF EXISTS "goniometriaSuper";
ALTER TABLE "HistoriaClinica" DROP COLUMN IF EXISTS "goniometriaInfer";
ALTER TABLE "HistoriaClinica" DROP COLUMN IF EXISTS "valoracionPostural";
ALTER TABLE "HistoriaClinica" DROP COLUMN IF EXISTS "columna";
ALTER TABLE "HistoriaClinica" DROP COLUMN IF EXISTS "fechaEvaluacion";
