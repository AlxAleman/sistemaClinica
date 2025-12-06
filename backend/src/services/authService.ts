import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/jwt';

type UserRole = 'ADMIN' | 'THERAPIST' | 'PATIENT';

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
    },
    accessToken,
    refreshToken,
  };
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

