import prisma from '../config/database';
import { CreateTherapistNoteData } from '../types/therapistNote';

export const createTherapistNote = async (data: CreateTherapistNoteData) => {
  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado');
  }

  const medicalProfile = await prisma.medicalProfile.upsert({
    where: { patientId: data.patientId },
    update: {},
    create: {
      patientId: data.patientId,
    },
  });

  const note = await prisma.therapistNote.create({
    data: {
      patientId: data.patientId,
      therapistId: data.therapistId,
      medicalProfileId: medicalProfile.id,
      sessionId: data.sessionId || null,
      content: data.content,
    },
    include: {
      therapist: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
    },
  });

  return note;
};

export const getNotesByPatient = async (patientId: string) => {
  const notes = await prisma.therapistNote.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    include: {
      therapist: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
    },
  });

  return notes;
};

export const getNotesByMedicalProfile = async (medicalProfileId: string) => {
  const notes = await prisma.therapistNote.findMany({
    where: { medicalProfileId },
    orderBy: { createdAt: 'desc' },
    include: {
      therapist: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
    },
  });

  return notes;
};

export const deleteTherapistNote = async (id: string) => {
  const note = await prisma.therapistNote.findUnique({
    where: { id },
  });

  if (!note) {
    throw new Error('Nota no encontrada');
  }

  await prisma.therapistNote.delete({
    where: { id },
  });
};
