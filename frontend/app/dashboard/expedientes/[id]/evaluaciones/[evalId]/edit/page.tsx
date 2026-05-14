"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import EvaluacionFisicaForm from "@/components/EvaluacionFisicaForm";

export default function EditarEvaluacionPage() {
  const { id, evalId } = useParams<{ id: string; evalId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId") ?? "";

  return (
    <EvaluacionFisicaForm
      historiaClinicaId={id}
      patientId={patientId}
      evaluacionId={evalId}
      onSaved={() => router.push(`/dashboard/patients/${patientId}?tab=expediente`)}
      onCancel={() => router.push(`/dashboard/patients/${patientId}?tab=expediente`)}
    />
  );
}
