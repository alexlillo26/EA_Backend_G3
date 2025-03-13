import { addGym, deleteGym, getAllGyms, getGymById, updateGym } from './gym_service.js';
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
        const gyms = await getAllGyms();
        res.json(gyms);
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
