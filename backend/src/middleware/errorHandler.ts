import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  console.error('Error:', err);

  // Errores de validación Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Error de validación',
      message: err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', '),
    });
    return;
  }

  // Error de Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'Ya existe un registro con estos datos',
      });
      return;
    }
  }

  // Error genérico
  res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
  });
};

