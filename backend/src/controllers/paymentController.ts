import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import * as paymentService from '../services/paymentService';

export const createPayment = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const payment = await paymentService.createPayment(req.body);
    res.status(201).json({
      success: true,
      data: payment,
      message: 'Pago creado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear pago',
    });
  }
};

export const getPayments = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { patientId, treatmentPlanId, method, status, startDate, endDate, page, limit } =
      req.query;

    const result = await paymentService.getPayments({
      patientId: patientId as string,
      treatmentPlanId: treatmentPlanId as string,
      method: method as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
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
      error: error.message || 'Error al obtener pagos',
    });
  }
};

export const getPaymentById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);
    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Pago no encontrado',
    });
  }
};

export const getPaymentsByPatient = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const payments = await paymentService.getPaymentsByPatient(patientId);
    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener pagos del paciente',
    });
  }
};

export const updatePayment = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await paymentService.updatePayment(id, req.body);
    res.status(200).json({
      success: true,
      data: payment,
      message: 'Pago actualizado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar pago',
    });
  }
};

export const deletePayment = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    await paymentService.deletePayment(id);
    res.status(200).json({
      success: true,
      message: 'Pago eliminado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar pago',
    });
  }
};

export const getPaymentSummary = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await paymentService.getPaymentSummary(
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener resumen de pagos',
    });
  }
};
