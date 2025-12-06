import { Response } from 'express';
import { AuthRequest } from '../types';
import { ApiResponse } from '../types';
import * as treatmentPlanService from '../services/treatmentPlanService';

export const createTreatmentPlan = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const treatmentPlan = await treatmentPlanService.createTreatmentPlan(req.body);
    res.status(201).json({
      success: true,
      data: treatmentPlan,
      message: 'Plan de tratamiento creado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear plan de tratamiento',
    });
  }
};

export const getTreatmentPlans = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { patientId, status, page, limit } = req.query;
    const result = await treatmentPlanService.getTreatmentPlans({
      patientId: patientId as string,
      status: status as string,
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
      error: error.message || 'Error al obtener planes de tratamiento',
    });
  }
};

export const getTreatmentPlanById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const treatmentPlan = await treatmentPlanService.getTreatmentPlanById(id);
    res.status(200).json({
      success: true,
      data: treatmentPlan,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Plan de tratamiento no encontrado',
    });
  }
};

export const updateTreatmentPlan = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const treatmentPlan = await treatmentPlanService.updateTreatmentPlan(id, req.body);
    res.status(200).json({
      success: true,
      data: treatmentPlan,
      message: 'Plan de tratamiento actualizado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar plan de tratamiento',
    });
  }
};

export const deleteTreatmentPlan = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    await treatmentPlanService.deleteTreatmentPlan(id);
    res.status(200).json({
      success: true,
      message: 'Plan de tratamiento eliminado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar plan de tratamiento',
    });
  }
};

export const approveTreatmentPlan = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const treatmentPlan = await treatmentPlanService.approveTreatmentPlan(id);
    res.status(200).json({
      success: true,
      data: treatmentPlan,
      message: 'Plan de tratamiento aprobado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al aprobar plan de tratamiento',
    });
  }
};

