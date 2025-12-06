import { Response } from 'express';
import { AuthRequest } from '../types';
import { ApiResponse } from '../types';
import * as evaluationService from '../services/evaluationService';

export const createEvaluation = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const evaluation = await evaluationService.createEvaluation(req.body);
    res.status(201).json({
      success: true,
      data: evaluation,
      message: 'Evaluación creada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear evaluación',
    });
  }
};

export const getEvaluations = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { patientId, evaluationType, page, limit } = req.query;
    const result = await evaluationService.getEvaluations({
      patientId: patientId as string,
      evaluationType: evaluationType as string,
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
      error: error.message || 'Error al obtener evaluaciones',
    });
  }
};

export const getEvaluationById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const evaluation = await evaluationService.getEvaluationById(id);
    res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Evaluación no encontrada',
    });
  }
};

export const updateEvaluation = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const evaluation = await evaluationService.updateEvaluation(id, req.body);
    res.status(200).json({
      success: true,
      data: evaluation,
      message: 'Evaluación actualizada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar evaluación',
    });
  }
};

export const deleteEvaluation = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    await evaluationService.deleteEvaluation(id);
    res.status(200).json({
      success: true,
      message: 'Evaluación eliminada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar evaluación',
    });
  }
};

export const getEvaluationComparison = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const comparison = await evaluationService.getEvaluationComparison(patientId);
    res.status(200).json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener comparación de evaluaciones',
    });
  }
};

