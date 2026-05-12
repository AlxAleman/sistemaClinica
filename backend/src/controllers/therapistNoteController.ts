import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import * as therapistNoteService from '../services/therapistNoteService';

export const createTherapistNote = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const note = await therapistNoteService.createTherapistNote(req.body);
    res.status(201).json({
      success: true,
      data: note,
      message: 'Nota creada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear nota',
    });
  }
};

export const getNotesByPatient = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const notes = await therapistNoteService.getNotesByPatient(patientId);
    res.status(200).json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener notas del paciente',
    });
  }
};

export const deleteTherapistNote = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    await therapistNoteService.deleteTherapistNote(id);
    res.status(200).json({
      success: true,
      message: 'Nota eliminada exitosamente',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar nota',
    });
  }
};
