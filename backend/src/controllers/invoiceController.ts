import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import * as invoiceService from '../services/invoiceService';

export const createInvoice = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { paymentId } = req.body;
    const invoice = await invoiceService.createInvoice(paymentId);
    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Factura creada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear factura',
    });
  }
};

export const getInvoiceByPayment = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const invoice = await invoiceService.getInvoiceByPayment(paymentId);
    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Factura no encontrada',
    });
  }
};

export const getInvoicesByPatient = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const invoices = await invoiceService.getInvoicesByPatient(patientId);
    res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener facturas del paciente',
    });
  }
};

export const updateInvoiceStatus = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, externalRef } = req.body;
    const invoice = await invoiceService.updateInvoiceStatus(id, status, externalRef);
    res.status(200).json({
      success: true,
      data: invoice,
      message: 'Estado de factura actualizado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar estado de factura',
    });
  }
};
