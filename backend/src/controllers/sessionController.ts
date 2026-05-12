import { Response } from 'express';
import { AuthRequest } from '../types';
import { ApiResponse } from '../types';
import * as sessionService from '../services/sessionService';

export const createSession = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const session = await sessionService.createSession(req.body);
    res.status(201).json({
      success: true,
      data: session,
      message: 'Sesión creada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear sesión',
    });
  }
};

export const getSessions = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { patientId, therapistId, treatmentPlanId, appointmentId, date, page, limit } = req.query;
    const result = await sessionService.getSessions({
      patientId: patientId as string,
      therapistId: therapistId as string,
      treatmentPlanId: treatmentPlanId as string,
      appointmentId: appointmentId as string,
      date: date as string,
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
      error: error.message || 'Error al obtener sesiones',
    });
  }
};

export const getSessionById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const session = await sessionService.getSessionById(id);
    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Sesión no encontrada',
    });
  }
};

export const updateSession = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const session = await sessionService.updateSession(id, req.body);
    res.status(200).json({
      success: true,
      data: session,
      message: 'Sesión actualizada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar sesión',
    });
  }
};

export const deleteSession = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    await sessionService.deleteSession(id);
    res.status(200).json({
      success: true,
      message: 'Sesión eliminada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar sesión',
    });
  }
};

export const confirmAttendance = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const { attendanceStatus, notes } = req.body;
    const session = await sessionService.confirmAttendance(id, attendanceStatus, notes);
    res.status(200).json({
      success: true,
      data: session,
      message: 'Asistencia registrada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al confirmar asistencia',
    });
  }
};

export const detectConflicts = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { therapistId, appointmentDate, duration, excludeAppointmentId } = req.query;
    const conflicts = await sessionService.detectScheduleConflicts(
      therapistId as string,
      new Date(appointmentDate as string),
      parseInt(duration as string) || 60,
      excludeAppointmentId as string | undefined
    );
    res.status(200).json({
      success: true,
      data: { conflicts, hasConflicts: conflicts.length > 0 },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al verificar conflictos',
    });
  }
};

