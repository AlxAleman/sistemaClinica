"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import EvaluacionFisicaForm from "@/components/EvaluacionFisicaForm";

export default function NuevaEvaluacionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId") ?? "";

  return (
    <EvaluacionFisicaForm
      historiaClinicaId={id}
      patientId={patientId}
      onSaved={() => router.push(`/dashboard/patients/${patientId}?tab=expediente`)}
      onCancel={() => router.push(`/dashboard/patients/${patientId}?tab=expediente`)}
    />
  );
}
