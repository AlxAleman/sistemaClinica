import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando base de datos (manteniendo usuarios)...\n');

  // Orden respetando foreign keys (hijos primero, luego padres)
  await prisma.historiaClinica.deleteMany();
  console.log('✅ HistoriaClinica');

  await prisma.therapistNote.deleteMany();
  console.log('✅ TherapistNote');

  await prisma.medicalDocument.deleteMany();
  console.log('✅ MedicalDocument');

  await prisma.evaluation.deleteMany();
  console.log('✅ Evaluation');

  await prisma.prescription.deleteMany();
  console.log('✅ Prescription');

  await prisma.payment.deleteMany();
  console.log('✅ Payment');

  await prisma.invoice.deleteMany();
  console.log('✅ Invoice');

  await prisma.treatmentSession.deleteMany();
  console.log('✅ TreatmentSession');

  await prisma.appointment.deleteMany();
  console.log('✅ Appointment');

  await prisma.treatmentPlan.deleteMany();
  console.log('✅ TreatmentPlan');

  await prisma.diagnosis.deleteMany();
  console.log('✅ Diagnosis');

  await prisma.medicalProfile.deleteMany();
  console.log('✅ MedicalProfile');

  await prisma.therapistAvailability.deleteMany();
  console.log('✅ TherapistAvailability');

  await prisma.therapist.deleteMany();
  console.log('✅ Therapist');

  await prisma.patient.deleteMany();
  console.log('✅ Patient');

  await prisma.systemConfig.deleteMany();
  console.log('✅ SystemConfig');

  // User NO se toca

  console.log('\n✨ Base de datos limpia. Usuarios conservados:');
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  users.forEach(u => console.log(`   - ${u.email} (${u.role})`));
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
