import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import * as evaluacionFisicaService from '../services/evaluacionFisicaService';

export const getByHistoria = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const data = await evaluacionFisicaService.getByHistoria(req.params.historiaClinicaId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getByPatient = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const data = await evaluacionFisicaService.getByPatient(req.params.patientId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getById = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const data = await evaluacionFisicaService.getById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    const status = error.message === 'Evaluación física no encontrada' ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const create = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const data = { ...req.body, creadoPor: req.user?.userId };
    const evaluacion = await evaluacionFisicaService.create(data);
    res.status(201).json({ success: true, data: evaluacion });
  } catch (error: any) {
    const status = error.message === 'Expediente no encontrado' ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const update = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const evaluacion = await evaluacionFisicaService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: evaluacion });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const remove = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    await evaluacionFisicaService.remove(req.params.id);
    res.status(200).json({ success: true, data: { message: 'Evaluación eliminada' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
