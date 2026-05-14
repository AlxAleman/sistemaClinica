import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import * as historiaClinicaService from '../services/historiaClinicaService';

export const getAll = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { search } = req.query;
    const historias = await historiaClinicaService.getAll(search as string | undefined);
    res.status(200).json({ success: true, data: historias });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getById = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const historia = await historiaClinicaService.getById(req.params.id);
    res.status(200).json({ success: true, data: historia });
  } catch (error: any) {
    const status = error.message === 'Expediente no encontrado' ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const getByPatientId = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { patientId } = req.params;
    const historia = await historiaClinicaService.getByPatientId(patientId);
    res.status(200).json({ success: true, data: historia ?? null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const create = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const data = { ...req.body, creadoPor: req.user?.userId };
    const historia = await historiaClinicaService.create(data);
    res.status(201).json({ success: true, data: historia });
  } catch (error: any) {
    const status = error.message.includes('no encontrado') ? 404
      : error.message.includes('ya tiene') ? 409
      : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const update = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params;
    const historia = await historiaClinicaService.update(id, req.body);
    res.status(200).json({ success: true, data: historia });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const remove = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params;
    await historiaClinicaService.remove(id);
    res.status(200).json({ success: true, data: { message: 'Historia clínica eliminada' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
