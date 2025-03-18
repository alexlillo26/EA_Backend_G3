import { addGym, deleteGym, getAllGyms, getGymById, updateGym, hideGym, loginGym } from './gym_service.js';
import express, { Request, Response } from 'express';

export const addGymHandler = async (req: Request, res: Response) => {
    try {
        const gym = await addGym(req.body);
        res.json(gym);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const getAllGymsHandler = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        if (![10, 25, 50].includes(pageSize)) {
            return res.status(400).json({ message: 'El tamaño de la lista debe ser 10, 25 o 50' });
        }

        const gyms = await getAllGyms(page, pageSize);
        res.status(200).json(gyms);
    } catch (error: any) {
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
        const gym = await loginGym(email, password);

        if (!gym) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({ message: 'Inicio de sesión completado', gym });
    } catch (error: any) {
        res.status(500).json({ message: 'Error interno en el servidor', error });
    }
};