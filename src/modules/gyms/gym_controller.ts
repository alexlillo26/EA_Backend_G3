import { addGym, deleteGym, getAllGyms, getGymById, updateGym, hideGym, loginGym, refreshGymToken } from './gym_service.js';
import express, { Request, Response } from 'express';
import { verifyToken, verifyRefreshToken, generateToken } from '../../utils/jwt.handle.js'; // Added missing imports
import Gym from './gym_models.js'; // Added missing import

export const addGymHandler = async (req: Request, res: Response) => {
    console.log("ADD GYM!!!!");
    try {
        const gym = await addGym(req.body);
        res.status(201).json(gym);
    } catch (error: any) {
        console.log(error);
        if (error.name === 'ValidationError') {
            res.status(400).json({ message: 'El correo electrónico no es válido' });
        } else if (error.message.includes('ya están en uso')) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Error interno en el servidor', error });
        }
    }
};
export const getAllGymsHandler = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        if (![10, 25, 50].includes(pageSize)) {
            return res.status(400).json({ message: 'El tamaño de la lista debe ser 10, 25 o 50' });
        }

        const { gyms, totalGyms, totalPages, currentPage } = await getAllGyms(page, pageSize);
        res.status(200).json({ gyms, totalGyms, totalPages, currentPage });
    } catch (error: any) {
        console.error('Error en getAllGymsHandler:', error);
        res.status(500).json({ message: error.message });
    }
};
export const getGymByIdHandler = async (req: Request, res: Response) => {
    try {
        const gym = await getGymById(req.params.id);
        res.json(gym);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const updateGymHandler = async (req: Request, res: Response) => {
    try {
        const gym = await updateGym(req.params.id, req.body);
        res.json(gym);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const deleteGymHandler = async (req: Request, res: Response) => {
    try {
        const gym = await deleteGym(req.params.id);
        res.json(gym);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const hideGymHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isHidden } = req.body;

        const gym = await hideGym(id, isHidden);

        if (!gym) {
            res.status(404).json({ message: 'Gimnasio no encontrado' });
        }

        res.status(200).json({ message: `Gimnasio ${isHidden ? 'oculto' : 'visible'}`, gym });
    } catch (error: any) {
        res.status(500).json({ message: 'Error interno en el servidor', error });
    }
};
export const loginGymHandler = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const { token, refreshToken, gym } = await loginGym(email, password);

        res.status(200).json({
            message: 'Inicio de sesión completado',
            token,
            refreshToken,
            gym
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const refreshGymTokenHandler = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token es requerido' });
        }

        const newToken = await refreshGymToken(refreshToken); // Fixed: Ensure refreshToken is passed correctly
        res.status(200).json({ token: newToken });
    } catch (error: any) {
        res.status(403).json({ message: 'Refresh token inválido' });
    }
};

export const getCurrentGymHandler = async (req: any, res: Response) => {
    try {
        // 日志方便排查
        console.log('Received token:', req.headers.authorization);
        console.log('Decoded user:', req.user);

        const gymId = req.user?.id;

        if (!gymId) {
            return res.status(401).json({
                error: 'No se encontró el ID del gimnasio en el token'
            });
        }

        const gym = await Gym.findById(gymId)
            .select('-password')
            .lean();

        if (!gym) {
            return res.status(404).json({
                error: 'Gimnasio no encontrado'
            });
        }

        res.status(200).json(gym);
    } catch (error) {
        console.error('Error en getCurrentGymHandler:', error);
        res.status(500).json({
            error: 'Error al obtener información del gimnasio'
        });
    }
};