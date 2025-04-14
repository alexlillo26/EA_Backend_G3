// src/controllers/user_controller.ts
import { saveMethod, createUser, getAllUsers, getUserById, updateUser, deleteUser, hideUser, loginUser, getUserCount } from '../users/user_service.js';
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
        const token = req.headers.authorization?.split(' ')[1] || '';
        const refreshToken = req.body.refreshToken || '';
        const page = parseInt(req.query.page as string);
        const pageSize = parseInt(req.query.pageSize as string);

        if (![10, 25, 50].includes(pageSize)) {
            return res.status(400).json({ message: 'El tamaño de la lista debe ser 10, 25 o 50' });
        }

        const { users, totalUsers, totalPages, currentPage } = await getAllUsers(page, pageSize, token, refreshToken);

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
        const token = req.headers.authorization?.split(' ')[1] || '';
        const refreshToken = req.body.refreshToken || '';
        const data = await getUserById(req.params.id, token, refreshToken);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const updateUserHandler = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || '';
        const refreshToken = req.body.refreshToken || '';
        const data = await updateUser(req.params.id, req.body, token, refreshToken);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const deleteUserHandler = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || '';
        const refreshToken = req.body.refreshToken || '';
        const data = await deleteUser(req.params.id, token, refreshToken);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const hideUserHandler = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || '';
        const refreshToken = req.body.refreshToken || '';
        const { id } = req.params;
        const { isHidden } = req.body;

        const user = await hideUser(id, isHidden, token, refreshToken);

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
            user
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
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

        const newToken = generateToken(user.id, user.email);
        res.status(200).json({ token: newToken });
    } catch (error: any) {
        console.error('Error in refreshTokenHandler:', error);
        res.status(403).json({ message: 'Invalid refresh token' });
    }
};
