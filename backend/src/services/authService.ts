import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/jwt';

type UserRole = 'ADMIN' | 'THERAPIST' | 'PATIENT' | 'RECEPCION' | 'CONTABILIDAD' | 'SUPERVISOR' | 'EXTERNAL_THERAPIST';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    mustChangePassword: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { email, password } = credentials;

  // Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  if (!user.isActive) {
    throw new Error('Cuenta desactivada. Contacte al administrador.');
  }

  // Verificar contraseña
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Credenciales inválidas');
  }

  // Generar tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    accessToken,
    refreshToken,
  };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuario no encontrado');

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) throw new Error('Contraseña actual incorrecta');

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, mustChangePassword: false },
  });
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const { email, password, name, role = 'ADMIN' as UserRole } = data;

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('El usuario ya existe');
  }

  // Hashear contraseña
  const hashedPassword = await hashPassword(password);

  // Crear usuario
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
    },
  });

  // Generar tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    accessToken,
    refreshToken,
  };
};

import { verifyRefreshToken } from '../utils/jwt';

export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  const payload = verifyRefreshToken(refreshToken);

  const newTokenPayload: TokenPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  return generateAccessToken(newTokenPayload);
};

