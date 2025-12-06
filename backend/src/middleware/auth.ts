import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { ApiResponse } from '../types';

export const authenticate = (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Token de autenticación no proporcionado',
      });
      return;
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Token inválido o expirado',
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error en autenticación',
    });
    return;
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'No autenticado',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para esta acción',
      });
      return;
    }

    next();
  };
};

