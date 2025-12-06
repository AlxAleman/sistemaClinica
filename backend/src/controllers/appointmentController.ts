import { Response } from 'express';
import { AuthRequest } from '../types';
import { ApiResponse } from '../types';
import * as appointmentService from '../services/appointmentService';

export const createAppointment = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const appointment = await appointmentService.createAppointment(req.body);
    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Cita creada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear cita',
    });
  }
};

export const getAppointments = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { patientId, therapistId, date, status, page, limit } = req.query;
    const result = await appointmentService.getAppointments({
      patientId: patientId as string,
      therapistId: therapistId as string,
      date: date as string,
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
      error: error.message || 'Error al obtener citas',
    });
  }
};

export const getAppointmentById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.getAppointmentById(id);
    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Cita no encontrada',
    });
  }
};

export const updateAppointment = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.updateAppointment(id, req.body);
    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Cita actualizada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar cita',
    });
  }
};

export const deleteAppointment = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    await appointmentService.deleteAppointment(id);
    res.status(200).json({
      success: true,
      message: 'Cita eliminada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar cita',
    });
  }
};

export const confirmAppointment = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.confirmAppointment(id);
    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Cita confirmada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al confirmar cita',
    });
  }
};

