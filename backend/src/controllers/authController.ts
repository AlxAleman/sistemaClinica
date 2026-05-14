import { Response } from 'express';
import { AuthRequest } from '../types';
import { ApiResponse } from '../types';
import * as authService from '../services/authService';

export const login = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Inicio de sesión exitoso',
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message || 'Error en el inicio de sesión',
    });
  }
};

export const register = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;
    const result = await authService.register({ email, password, name, role });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Usuario registrado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error en el registro',
    });
  }
};

export const refreshToken = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token requerido',
      });
      return;
    }

    const newAccessToken = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
      message: 'Token renovado exitosamente',
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message || 'Error renovando token',
    });
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Se requieren contraseña actual y nueva' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres' });
      return;
    }
    await authService.changePassword(req.user.userId, currentPassword, newPassword);
    res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || 'Error al cambiar contraseña' });
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'No autenticado',
      });
      return;
    }

    const prisma = await import('../config/database').then(m => m.default);
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error obteniendo información del usuario',
    });
  }
};

