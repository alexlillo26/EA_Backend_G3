// src/controllers/user_controller.ts
import { saveMethod, createUser, getAllUsers, getUserById, updateUser, deleteUser, hideUser, loginUser, getUserCount, searchUsers, updateUserBoxingVideo } from '../users/user_service.js';
import { verifyRefreshToken, generateToken } from '../../utils/jwt.handle.js';
import User from '../users/user_models.js'; // Ensure this import exists
import cloudinary from '../config/cloudinary.js';

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { generateUserStatistics } from '../combats/combat_service.js';

export const saveMethodHandler = async (req: Request, res: Response) => {
    try {
        const data = saveMethod();
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};
export const createUserHandler = async (req: Request, res: Response) => {
    try {
        const data = await createUser(req.body);
        res.status(201).json(data);
    } catch (error: any) {
        console.error('Error in createUserHandler:', error);
        if (error.name === 'ValidationError') {
            res.status(400).json({ message: 'El correo electrónico no es válido o la contraseña es demasiado corta' });
        } else if (error?.message && error.message.includes('ya están en uso')) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Error interno en el servidor', error: error?.message });
        }
    }
};
export const getAllUsersHandler = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        if (![10, 25, 50].includes(pageSize)) {
            return res.status(400).json({ message: 'El tamaño de la lista debe ser 10, 25 o 50' });
        }

        const { users, totalUsers, totalPages, currentPage } = await getAllUsers(page, pageSize);

        res.status(200).json({
            users,
            totalUsers,
            totalPages,
            currentPage,
        });
    } catch (error: any) {
        console.error('Error en getAllUsersHandler:', error);
        res.status(500).json({ message: 'Error interno en el servidor', error: error?.message });
    }
};

export const getUserByIdHandler = async (req: Request, res: Response) => {
    try {
        const data = await getUserById(req.params.id);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};
export const updateUserHandler = async (req: Request, res: Response) => {
    try {
        let profilePictureUrl: string | undefined = undefined;
        if (req.file) {
            const file = req.file;
            profilePictureUrl = await new Promise<string>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'users' },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result?.secure_url || '');
                    }
                );
                stream.end(file.buffer);
            });
        }

        const updateData = { ...req.body };
        if (profilePictureUrl) updateData.profilePicture = profilePictureUrl;

        const updatedUser = await updateUser(req.params.id, updateData);
        res.status(200).json(updatedUser);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};
export const deleteUserHandler = async (req: Request, res: Response) => {
    try {
        const data = await deleteUser(req.params.id);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};
export const hideUserHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isHidden } = req.body;

        const user = await hideUser(id, isHidden);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({
            message: `Usuario ${isHidden ? 'ocultado' : 'visible'} correctamente`,
            user
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error interno en el servidor', error: error?.message });
    }
};
export const loginUserHandler = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const { token, refreshToken, user } = await loginUser(email, password);

        res.status(200).json({
            message: 'Inicio de sesión completado',
            token,
            refreshToken,
            userId: user._id,
            username: user.name,
        });
    } catch (error: any) {
        console.error('Error en loginUserHandler:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error?.message });
    }
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        const decoded: any = verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newToken = generateToken(user.id, user.email, user.name); // Added username argument
        res.status(200).json({ token: newToken });
    } catch (error: any) {
        console.error('Error in refreshTokenHandler:', error);
        res.status(403).json({ message: 'Invalid refresh token', error: error?.message });
    }
};

export const searchUsersHandler = async (req: Request, res: Response) => {
    try {
        console.log('Search params:', req.query); 
        
        const { city, weight } = req.query;
        const users = await searchUsers(
            city as string,
            weight as string
        );

        console.log('Search results:', users); 

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error: any) {
        console.error('Search error:', error); 
        res.status(500).json({ 
            success: false, 
            message: 'Error al buscar usuarios',
            error: error?.message 
        });
    }
};


export const uploadUserAvatarHandler = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha enviado ningún avatar.' });
        }
        const file = req.file;
        const avatarUrl = await new Promise<string>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'users/avatars' },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result?.secure_url || '');
                }
            );
            stream.end(file.buffer);
        });
        // req.user.id debe estar presente por checkJwt
        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'No autorizado' });
        const updatedUser = await User.findByIdAndUpdate(userId, { profilePicture: avatarUrl }, { new: true });
        res.status(200).json(updatedUser);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};

export const updateUserBoxingVideoHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha enviado ningún video.' });
    }
    const file = req.file;
    const videoUrl = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'users/videos', resource_type: 'video' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result?.secure_url || '');
        }
      );
      stream.end(file.buffer);
    });
    const updatedUser = await updateUserBoxingVideo(req.params.id, videoUrl);
    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al subir vídeo', details: error.message });
  }
};

export const getUserStatisticsHandler = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id || (req as any).user?.id;
        if (!userId) return res.status(400).json({ message: 'ID de usuario requerido.' });
        const statistics = await generateUserStatistics(userId);
        res.status(200).json(statistics);
    } catch (error: any) {
        res.status(500).json({ message: 'Error interno del servidor al generar estadísticas.' });
    }
};
