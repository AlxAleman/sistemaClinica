import prisma from '../config/database';
import { hashPassword } from '../utils/hash';

type UserRole = 'ADMIN' | 'THERAPIST' | 'RECEPCION' | 'CONTABILIDAD' | 'SUPERVISOR' | 'EXTERNAL_THERAPIST';

export interface CreateUserWithTherapistData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  specialization?: string;
}

export interface UpdateUserData {
  name?: string;
  role?: UserRole;
  password?: string;
}

export const getUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      therapistId: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const createUserWithTherapist = async (data: CreateUserWithTherapistData) => {
  const { name, email, password, role, phone, specialization } = data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new Error('Ya existe un usuario con ese correo');

  const hashedPassword = await hashPassword(password);

  return prisma.$transaction(async (tx) => {
    let therapistId: string | undefined;

    if (role === 'THERAPIST' || role === 'EXTERNAL_THERAPIST') {
      const therapist = await tx.therapist.create({
        data: {
          name,
          email: email.toLowerCase(),
          phone: phone || '',
          specialization: specialization || null,
        },
      });
      therapistId = therapist.id;
    }

    const user = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
        therapistId: therapistId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        therapistId: true,
        createdAt: true,
      },
    });

    return user;
  });
};

export const updateUser = async (id: string, data: UpdateUserData) => {
  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.role) updateData.role = data.role;
  if (data.password) updateData.password = await hashPassword(data.password);

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      therapistId: true,
      createdAt: true,
    },
  });
};

export const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('Usuario no encontrado');

  await prisma.user.delete({ where: { id } });
};
