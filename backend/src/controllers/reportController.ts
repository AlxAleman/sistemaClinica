import { Response } from 'express';
import { AuthRequest } from '../types';
import { ApiResponse } from '../types';
import * as reportService from '../services/reportService';

export const getDashboardKPIs = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const kpis = await reportService.getDashboardKPIs();
    res.status(200).json({
      success: true,
      data: kpis,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener KPIs del dashboard',
    });
  }
};

export const getPatientReport = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const filters = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      patientId: req.query.patientId as string | undefined,
    };
    const report = await reportService.getPatientReport(filters);
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener reporte de pacientes',
    });
  }
};

export const getSessionReport = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const filters = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      patientId: req.query.patientId as string | undefined,
      therapistId: req.query.therapistId as string | undefined,
    };
    const report = await reportService.getSessionReport(filters);
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener reporte de sesiones',
    });
  }
};

export const getClinicalProgressReport = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const filters = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      patientId: req.query.patientId as string | undefined,
    };
    const report = await reportService.getClinicalProgressReport(filters);
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener reporte de progreso clínico',
    });
  }
};

export const exportReport = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { type } = req.params;
    const filters = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      patientId: req.query.patientId as string | undefined,
      therapistId: req.query.therapistId as string | undefined,
    };

    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'patients':
        data = await reportService.getPatientReport(filters);
        filename = `reporte-pacientes-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'sessions':
        data = await reportService.getSessionReport(filters);
        filename = `reporte-sesiones-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'clinical-progress':
        data = await reportService.getClinicalProgressReport(filters);
        filename = `reporte-progreso-clinico-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Tipo de reporte no válido',
        });
        return;
    }

    // Convertir a CSV
    if (data.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No hay datos para exportar',
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value).replace(/"/g, '""');
          })
          .map((val) => `"${val}"`)
          .join(',')
      ),
    ];

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send('\ufeff' + csv); // BOM para Excel
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al exportar reporte',
    });
  }
};

