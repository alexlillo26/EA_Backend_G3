// src/controllers/_controller.ts
import { saveMethod, createCombat, getAllCombats, getCombatById, updateCombat, deleteCombat, getBoxersByCombatId, hideCombat } from '../combats/combat_service.js';

import express, { Request, Response } from 'express';

export const saveMethodHandler = async (req: Request, res: Response) => {
    try {
        const combat = saveMethod();
        res.json(combat);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const createCombatHandler = async (req: Request, res: Response) => {
    try {
        const combat = await createCombat(req.body);
        res.json(combat);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const getAllCombatsHandler = async (req: Request, res: Response) => {
    try {
        const combats = await getAllCombats();
        res.json(combats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const getCombatByIdHandler = async (req: Request, res: Response) => {
    try {
        const combat = await getCombatById(req.params.id);
        res.json(combat);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const updateCombatHandler = async (req: Request, res: Response) => {
    try {
        const combat = await updateCombat(req.params.id, req.body);
        res.json(combat);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const deleteCombatHandler = async (req: Request, res: Response) => {
    try {
        const combat = await deleteCombat(req.params.id);
        res.json(combat);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const getBoxersByCombatIdHandler = async (req: Request, res: Response) => {
    try {
        const boxers = await getBoxersByCombatId(req.params.id);
        res.json(boxers);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const hideCombatHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isHidden } = req.body;

        const combat = await hideCombat(id, isHidden);

        if (!combat) {
            res.status(404).json({ message: 'Combate no encontrado' });
        }

        res.status(200).json({ message: `Combate ${isHidden ? 'oculto' : 'visible'}`, combat });
    } catch (error: any) {
        res.status(500).json({ message: 'Error interno en el servidor', error });
    }
};