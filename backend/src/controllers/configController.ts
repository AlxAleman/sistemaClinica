import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import * as configService from '../services/configService';

export const getConfigs = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { category } = req.query;
    const configs = await configService.getConfigs(category as string | undefined);
    res.status(200).json({
      success: true,
      data: configs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener configuraciones',
    });
  }
};

export const getConfigByKey = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { key } = req.params;
    const config = await configService.getConfigByKey(key);
    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Configuración no encontrada',
    });
  }
};

export const upsertConfig = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { key } = req.params;
    const { value, description, category } = req.body;

    if (value === undefined || value === null) {
      res.status(400).json({
        success: false,
        error: 'El campo value es requerido',
      });
      return;
    }

    const config = await configService.upsertConfig(key, value, description, category);
    res.status(200).json({
      success: true,
      data: config,
      message: 'Configuración actualizada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar configuración',
    });
  }
};

export const deleteConfig = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { key } = req.params;
    await configService.deleteConfig(key);
    res.status(200).json({
      success: true,
      message: 'Configuración eliminada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar configuración',
    });
  }
};

export const uploadClinicLogo = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No se recibió ningún archivo' });
      return;
    }

    const { uploadToR2, r2Enabled } = await import('../services/r2Service');
    if (!r2Enabled()) {
      res.status(503).json({ success: false, error: 'R2 no está configurado en el servidor' });
      return;
    }

    const ext = req.file.originalname.split('.').pop() ?? 'png';
    const key = `clinic/logo.${ext}`;
    const url = await uploadToR2(key, req.file.buffer, req.file.mimetype);

    const config = await configService.upsertConfig('clinic_logo_url', url, 'URL del logo de la clínica', 'clinic');
    res.status(200).json({ success: true, data: config, message: 'Logo actualizado' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Error al subir el logo' });
  }
};

export const initDefaultConfigs = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const configs = await configService.initDefaultConfigs();
    res.status(200).json({
      success: true,
      data: configs,
      message: 'Configuraciones predeterminadas inicializadas exitosamente',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al inicializar configuraciones predeterminadas',
    });
  }
};
