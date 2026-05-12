import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import * as diagnosisService from '../services/diagnosisService';

export const createDiagnosis = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const diagnosis = await diagnosisService.createDiagnosis(req.body);
    res.status(201).json({
      success: true,
      data: diagnosis,
      message: 'Diagnóstico creado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear diagnóstico',
    });
  }
};

export const getDiagnosesByPatient = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const diagnoses = await diagnosisService.getDiagnosesByPatient(patientId);
    res.status(200).json({
      success: true,
      data: diagnoses,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener diagnósticos del paciente',
    });
  }
};

export const getDiagnosisById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const diagnosis = await diagnosisService.getDiagnosisById(id);
    res.status(200).json({
      success: true,
      data: diagnosis,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Diagnóstico no encontrado',
    });
  }
};

export const updateDiagnosis = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const diagnosis = await diagnosisService.updateDiagnosis(id, req.body);
    res.status(200).json({
      success: true,
      data: diagnosis,
      message: 'Diagnóstico actualizado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar diagnóstico',
    });
  }
};

export const deleteDiagnosis = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    await diagnosisService.deleteDiagnosis(id);
    res.status(200).json({
      success: true,
      message: 'Diagnóstico eliminado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar diagnóstico',
    });
  }
};
