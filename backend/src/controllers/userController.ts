import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import * as userService from '../services/userService';

export const getUsers = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const users = await userService.getUsers();
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createUser = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const user = await userService.createUserWithTherapist(req.body);
    res.status(201).json({ success: true, data: user, message: 'Usuario creado exitosamente' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: user, message: 'Usuario actualizado exitosamente' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    if (req.user?.userId === req.params.id) {
      res.status(400).json({ success: false, error: 'No puedes eliminar tu propio usuario' });
      return;
    }
    await userService.deleteUser(req.params.id);
    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
