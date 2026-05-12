-- AddColumn: category to MedicalDocument with default 'otro'
ALTER TABLE "MedicalDocument" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'otro';

-- CreateIndex for patientId + category lookups
CREATE INDEX IF NOT EXISTS "MedicalDocument_patientId_category_idx" ON "MedicalDocument"("patientId", "category");
