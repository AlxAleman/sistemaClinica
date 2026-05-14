-- AlterTable
ALTER TABLE "Diagnosis" ADD COLUMN "evaluacionFisicaId" TEXT;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_evaluacionFisicaId_fkey" FOREIGN KEY ("evaluacionFisicaId") REFERENCES "EvaluacionFisica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Diagnosis_evaluacionFisicaId_idx" ON "Diagnosis"("evaluacionFisicaId");
