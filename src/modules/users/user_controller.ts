// src/controllers/user_controller.ts
import { saveMethod, createUser, getAllUsers, getUserById, updateUser, deleteUser, hideUser, loginUser, getUserCount, searchUsers } from '../users/user_service.js';
import { verifyRefreshToken, generateToken } from '../../utils/jwt.handle.js';
import User from '../users/user_models.js'; // Ensure this import exists

import express, { Request, Response } from 'express';

export const saveMethodHandler = async (req: Request, res: Response) => {
    try {
        const data = saveMethod();
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
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
        } else if (error.message.includes('ya están en uso')) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Error interno en el servidor', error });
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
        res.status(500).json({ message: 'Error interno en el servidor', error });
    }
};

export const getUserByIdHandler = async (req: Request, res: Response) => {
    try {
        const data = await getUserById(req.params.id);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const updateUserHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "El ID del usuario es requerido" });
        }

        const updatedData = req.body;

        // Si se subió una imagen, agrega la ruta al campo profilePicture
        if (req.file) {
            updatedData.profilePicture = `/uploads/${req.file.filename}`;
        }

        const updatedUser = await User.findByIdAndUpdate(id, updatedData, {
            new: true, // Devuelve el usuario actualizado
            runValidators: true, // Ejecuta las validaciones del esquema
        });

        if (!updatedUser) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.status(200).json(updatedUser);
    } catch (error: any) {
        console.error("Error al actualizar el usuario:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
export const deleteUserHandler = async (req: Request, res: Response) => {
    try {
        const data = await deleteUser(req.params.id);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
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
        res.status(500).json({ message: 'Error interno en el servidor', error });
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
        res.status(500).json({ message: 'Error interno del servidor' });
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
        res.status(403).json({ message: 'Invalid refresh token' });
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
            error: error.message 
        });
    }
};
