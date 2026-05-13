import { Response } from 'express';
import { AuthRequest } from '../types';
import { ApiResponse } from '../types';
import * as patientService from '../services/patientService';

export const createPatient = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const patient = await patientService.createPatient(req.body);
    res.status(201).json({
      success: true,
      data: patient,
      message: 'Paciente creado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear paciente',
    });
  }
};

export const getPatients = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { search, page, limit } = req.query;
    const result = await patientService.getPatients({
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
      error: error.message || 'Error al obtener pacientes',
    });
  }
};

export const getPatientById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const patient = await patientService.getPatientById(id);
    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Paciente no encontrado',
    });
  }
};

export const updatePatient = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const patient = await patientService.updatePatient(id, req.body);
    res.status(200).json({
      success: true,
      data: patient,
      message: 'Paciente actualizado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar paciente',
    });
  }
};

export const deletePatient = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    await patientService.deletePatient(id);
    res.status(200).json({
      success: true,
      message: 'Paciente eliminado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar paciente',
    });
  }
};

export const createOrUpdateMedicalProfile = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const profile = await patientService.createMedicalProfile(id, req.body);
    res.status(200).json({
      success: true,
      data: profile,
      message: 'Perfil médico actualizado exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar perfil médico',
    });
  }
};

export const uploadMedicalDocument = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const { description, category } = req.body;
    const cat = category || 'otro';

    let finalFileName: string;
    let finalFileUrl: string;
    let finalFileType: string;

    if (req.file) {
      // ── Ruta R2: archivo multipart ──
      const { buildR2Key, uploadToR2, r2Enabled } = await import('../services/r2Service');

      if (!r2Enabled()) {
        res.status(503).json({ success: false, error: 'R2 no está configurado en el servidor' });
        return;
      }

      const patient = await patientService.getPatientById(id);
      const key = buildR2Key(id, patient.name, patient.dui, cat, req.file.originalname);
      finalFileUrl = await uploadToR2(key, req.file.buffer, req.file.mimetype);
      finalFileName = req.body.fileName || req.file.originalname;
      finalFileType = req.file.mimetype;

    } else {
      // ── Ruta legacy: JSON con base64 ──
      const { fileName, fileUrl, fileType } = req.body;
      if (!fileName || !fileUrl || !fileType) {
        res.status(400).json({ success: false, error: 'fileName, fileUrl y fileType son requeridos' });
        return;
      }
      if (fileUrl.length > 15 * 1024 * 1024) {
        res.status(400).json({ success: false, error: 'El archivo es demasiado grande' });
        return;
      }
      finalFileName = fileName;
      finalFileUrl = fileUrl;
      finalFileType = fileType;
    }

    const document = await patientService.createMedicalDocument(id, {
      fileName: finalFileName,
      fileUrl: finalFileUrl,
      fileType: finalFileType,
      description: description || null,
      category: cat,
    });

    res.status(201).json({ success: true, data: document, message: 'Documento subido exitosamente' });
  } catch (error: any) {
    console.error('Error al subir documento:', error);
    res.status(500).json({ success: false, error: error.message || 'Error al subir documento' });
  }
};

export const deleteMedicalDocument = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id, documentId } = req.params;
    await patientService.deleteMedicalDocument(id, documentId);
    res.status(200).json({ success: true, message: 'Documento eliminado exitosamente' });
  } catch (error: any) {
    res.status(error.message === 'Documento no encontrado' ? 404 : 500).json({
      success: false,
      error: error.message || 'Error al eliminar documento',
    });
  }
};

