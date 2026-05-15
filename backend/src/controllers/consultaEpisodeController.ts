import { Request, Response } from 'express';
import * as episodeService from '../services/consultaEpisodeService';

export const createEpisode = async (req: Request, res: Response) => {
  try {
    const episode = await episodeService.createEpisode(req.body);
    res.status(201).json({ success: true, data: episode });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getEpisodesByPatient = async (req: Request, res: Response) => {
  try {
    const episodes = await episodeService.getEpisodesByPatient(req.params.patientId);
    res.json({ success: true, data: episodes });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getEpisodeById = async (req: Request, res: Response) => {
  try {
    const episode = await episodeService.getEpisodeById(req.params.id);
    if (!episode) return res.status(404).json({ success: false, message: 'Episodio no encontrado' });
    res.json({ success: true, data: episode });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateEpisode = async (req: Request, res: Response) => {
  try {
    const episode = await episodeService.updateEpisode(req.params.id, req.body);
    res.json({ success: true, data: episode });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteEpisode = async (req: Request, res: Response) => {
  try {
    await episodeService.deleteEpisode(req.params.id);
    res.json({ success: true, message: 'Episodio eliminado' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
