import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import * as expedienteService from '../services/expedienteService';

export const getExpediente = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const expediente = await expedienteService.getExpediente(patientId);
    res.status(200).json({
      success: true,
      data: expediente,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Error al obtener el expediente del paciente',
    });
  }
};
