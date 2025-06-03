// src/controllers/_controller.ts
import {
    saveMethod, createCombat, getAllCombats, getCombatById, updateCombat, deleteCombat, getBoxersByCombatId, hideCombat, getCombatsByGymId,
    getPendingInvitations, getSentInvitations, getFutureCombats, respondToCombatInvitation, updateCombatImage
} from '../combats/combat_service.js';

import express, { Request, Response } from 'express';
import Combat from './combat_models.js';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import cloudinary from '../config/cloudinary.js';

// --- Socket.IO instance holder ---
let io: SocketIOServer | undefined;
export function setSocketIoInstance(ioInstance: SocketIOServer) {
    io = ioInstance;
}

export const saveMethodHandler = async (req: Request, res: Response) => {
    try {
        const combat = saveMethod();
        res.json(combat);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};

// POST /api/combat - Crear combate y notificar por socket.io
export const createCombatHandler = async (req: Request, res: Response) => {
    try {
        const { creator, opponent, date, time, level, gym } = req.body;
        // Log para debug
        console.log('Datos recibidos en POST /combat:', req.body);

        // Validación mejorada de campos obligatorios y ObjectId válidos
        if (
            !creator || !mongoose.Types.ObjectId.isValid(creator) ||
            !opponent || !mongoose.Types.ObjectId.isValid(opponent) ||
            !date || !time || !level ||
            !gym || !mongoose.Types.ObjectId.isValid(gym)
        ) {
            return res.status(400).json({ message: 'Faltan campos obligatorios o IDs inválidos' });
        }

        let imageUrl: string | undefined = undefined;
        if (req.file) {
            const file = req.file;
            console.log('Archivo recibido:', file.originalname, file.mimetype, file.size);
            // Sube la imagen a Cloudinary usando el buffer de multer
            imageUrl = await new Promise<string>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'combats' },
                    (error, result) => {
                        if (error) {
                            console.error('Error Cloudinary:', error);
                            return reject(error);
                        }
                        resolve(result?.secure_url || '');
                    }
                );
                stream.end(file.buffer);
            });
            console.log('URL de la imagen subida a Cloudinary:', imageUrl);
        }

        const combat = await createCombat({ creator, opponent, date, time, level, gym, status: 'pending' }, imageUrl);

        // Notificar al oponente por socket.io si está conectado
        if (io && opponent) {
            io.to(opponent.toString()).emit('new_invitation', combat);
        }
        res.status(201).json(combat);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};

export const getAllCombatsHandler = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        if (![10, 25, 50].includes(pageSize)) {
            return res.status(400).json({ message: 'El tamaño de la lista debe ser 10, 25 o 50' });
        }

        const combats = await getAllCombats(page, pageSize);
        res.status(200).json(combats);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};
export const getCombatByIdHandler = async (req: Request, res: Response) => {
    try {
        const combat = await Combat.findById(req.params.id)
            .populate('creator')
            .populate('opponent')
            .populate('gym');
        res.json(combat);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};
export const updateCombatHandler = async (req: Request, res: Response) => {
    try {
        const combat = await updateCombat(req.params.id, req.body);
        res.json(combat);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};
export const deleteCombatHandler = async (req: Request, res: Response) => {
    try {
        const combat = await deleteCombat(req.params.id);
        res.json(combat);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};
export const getBoxersByCombatIdHandler = async (req: Request, res: Response) => {
    try {
        const combat = await Combat.findById(req.params.id)
            .populate('creator')
            .populate('opponent');
        if (!combat) return res.json([]);
        res.json([combat.creator, combat.opponent]);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
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
        res.status(500).json({ message: 'Error interno en el servidor', error: error?.message });
    }
};
export const getCombatsByBoxerIdHandler = async (req: Request, res: Response) => {
    console.log(`Solicitud recibida para el boxeador: ${req.params.boxerId}`);
    console.log(`Query Params - Página: ${req.query.page}, Tamaño: ${req.query.pageSize}`);

    try {
        const { boxerId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        
        const boxerObjectId = new mongoose.Types.ObjectId(boxerId);
        const totalCombats = await Combat.countDocuments({ boxers: boxerId });
        const totalPages = Math.ceil(totalCombats / pageSize);
        const combats = await Combat.find({ boxers: new mongoose.Types.ObjectId(boxerId) })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('gym') // opcional, si gym es un ID
            .populate('boxers'); // opcional, si boxers son IDs

        if (!combats || combats.length === 0) {
            return res.status(404).json({ message: 'No se encontraron combates para este usuario' });
        }

        res.status(200).json({ combats, totalPages });
    } catch (error: any) {
        console.error('Error al obtener combates:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error?.message });
    }
};
export const getCombatsByGymIdHandler = async (req: Request, res: Response) => {
    try {
        const { gymId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const result = await getCombatsByGymId(gymId, page, pageSize);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};

// GET /api/combat/future - Combates aceptados del usuario autenticado
export const getFutureCombatsHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const combats = await getFutureCombats(userId);
        res.json(combats);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};

// GET /api/combat/invitations/pending - Invitaciones pendientes recibidas
export const getPendingInvitationsHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const invitations = await getPendingInvitations(userId);
        res.json(invitations);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};

// GET /api/combat/sent-invitations - Invitaciones pendientes enviadas
export const getSentInvitationsHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const invitations = await getSentInvitations(userId);
        res.json(invitations);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};

// PATCH /api/combat/:id/respond - Aceptar o rechazar invitación
export const respondToInvitationHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const { status } = req.body;
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }
        const result = await respondToCombatInvitation(id, userId, status);
        res.json(result);
    } catch (error: any) {
        res.status(403).json({ message: error?.message });
    }
};

// GET /api/combat/invitations - Combates pendientes donde el usuario es opponent
export const getInvitationsHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        // Busca combates donde el usuario es el oponente y el estado es 'pending'
        const invitations = await Combat.find({ opponent: userId, status: 'pending' })
            .populate('creator')
            .populate('opponent')
            .populate('gym');
        res.status(200).json({ success: true, invitations });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error?.message });
    }
};

export const getFilteredCombatsHandler = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        const { status, creator, opponent, user } = req.query;

        // Debug log
        console.log("[getFilteredCombatsHandler] Query params:", req.query);

        const filter: any = {};
        if (status) filter.status = status;
        if (creator) {
            if (!mongoose.Types.ObjectId.isValid(creator as string)) {
                return res.status(400).json({ message: 'creator no es un ObjectId válido' });
            }
            filter.creator = new mongoose.Types.ObjectId(creator as string);
        }
        if (opponent) {
            if (!mongoose.Types.ObjectId.isValid(opponent as string)) {
                return res.status(400).json({ message: 'opponent no es un ObjectId válido' });
            }
            filter.opponent = new mongoose.Types.ObjectId(opponent as string);
        }
        if (user) {
            if (!mongoose.Types.ObjectId.isValid(user as string)) {
                return res.status(400).json({ message: 'user no es un ObjectId válido' });
            }
            filter.$or = [
                { creator: new mongoose.Types.ObjectId(user as string) },
                { opponent: new mongoose.Types.ObjectId(user as string) }
            ];
        }

        console.log("[getFilteredCombatsHandler] Mongo filter:", filter);

        const combats = await Combat.find(filter)
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('creator')
            .populate('opponent')
            .populate('gym');

        res.status(200).json({ combats, totalPages: 1 }); // Simplificado
    } catch (error: any) {
        console.error("Error filtrando combates:", error);
        res.status(500).json({ message: error?.message || String(error) });
    }
};

export const updateCombatImageHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha enviado ninguna imagen.' });
        }
        const file = req.file;
        // Sube la imagen a Cloudinary usando el buffer de multer
        const imageUrl = await new Promise<string>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'combats' },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result?.secure_url || '');
                }
            );
            stream.end(file.buffer);
        });

        const updatedCombat = await updateCombatImage(id, imageUrl);

        if (!updatedCombat) {
            return res.status(404).json({ message: 'Combate no encontrado.' });
        }

        res.status(200).json({ message: 'Imagen actualizada correctamente.', combat: updatedCombat });
    } catch (error: any) {
        console.log("Error al actualizar la imagen del combate:", error);
        res.status(500).json({ message: error?.message });
    }
};