"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { treatmentPlanService } from "@/services/treatmentPlanService";

export default function TreatmentPlanDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    treatmentPlanService.getById(id)
      .then((plan) => {
        if (plan.patientId) {
          router.replace(`/dashboard/patients/${plan.patientId}?tab=tratamiento`);
        } else {
          router.replace("/dashboard/patients");
        }
      })
      .catch(() => router.replace("/dashboard/patients"));
  }, [id, router]);

  return null;
}
