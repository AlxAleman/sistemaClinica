import { Response } from 'express';
import { AuthRequest } from '../types';
import { ApiResponse } from '../types';
import * as prescriptionService from '../services/prescriptionService';

export const createPrescription = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const prescription = await prescriptionService.createPrescription(req.body);
    res.status(201).json({
      success: true,
      data: prescription,
      message: 'Receta creada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear receta',
    });
  }
};

export const getPrescriptions = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { patientId, therapistId, page, limit } = req.query;
    const result = await prescriptionService.getPrescriptions({
      patientId: patientId as string,
      therapistId: therapistId as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener recetas',
    });
  }
};

export const getPrescriptionById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const prescription = await prescriptionService.getPrescriptionById(id);
    res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Receta no encontrada',
    });
  }
};

export const updatePrescription = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const prescription = await prescriptionService.updatePrescription(id, req.body);
    res.status(200).json({
      success: true,
      data: prescription,
      message: 'Receta actualizada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar receta',
    });
  }
};

export const deletePrescription = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    await prescriptionService.deletePrescription(id);
    res.status(200).json({
      success: true,
      message: 'Receta eliminada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar receta',
    });
  }
};

export const markAsPrinted = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const prescription = await prescriptionService.markAsPrinted(id);
    res.status(200).json({
      success: true,
      data: prescription,
      message: 'Receta marcada como impresa',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al marcar receta como impresa',
    });
  }
};

