import { Response } from 'express';
import { AuthRequest } from '../types';
import { ApiResponse } from '../types';
import * as therapistService from '../services/therapistService';

export const createTherapist = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const therapist = await therapistService.createTherapist(req.body);
    res.status(201).json({
      success: true,
      data: therapist,
      message: 'Terapeuta creado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear terapeuta',
    });
  }
};

export const getTherapists = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { search, page, limit } = req.query;
    const result = await therapistService.getTherapists({
      search: search as string,
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
      error: error.message || 'Error al obtener terapeutas',
    });
  }
};

export const getTherapistById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const therapist = await therapistService.getTherapistById(id);
    res.status(200).json({
      success: true,
      data: therapist,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Terapeuta no encontrado',
    });
  }
};

export const updateTherapist = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const therapist = await therapistService.updateTherapist(id, req.body);
    res.status(200).json({
      success: true,
      data: therapist,
      message: 'Terapeuta actualizado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar terapeuta',
    });
  }
};

export const deleteTherapist = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    await therapistService.deleteTherapist(id);
    res.status(200).json({
      success: true,
      message: 'Terapeuta eliminado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar terapeuta',
    });
  }
};

// Disponibilidad
export const createAvailability = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const availability = await therapistService.createAvailability(id, req.body);
    res.status(201).json({
      success: true,
      data: availability,
      message: 'Disponibilidad creada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear disponibilidad',
    });
  }
};

export const getAvailability = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const availability = await therapistService.getTherapistAvailability(id);
    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener disponibilidad',
    });
  }
};

export const updateAvailability = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { availabilityId } = req.params;
    const availability = await therapistService.updateAvailability(availabilityId, req.body);
    res.status(200).json({
      success: true,
      data: availability,
      message: 'Disponibilidad actualizada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar disponibilidad',
    });
  }
};

export const deleteAvailability = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { availabilityId } = req.params;
    await therapistService.deleteAvailability(availabilityId);
    res.status(200).json({
      success: true,
      message: 'Disponibilidad eliminada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar disponibilidad',
    });
  }
};

