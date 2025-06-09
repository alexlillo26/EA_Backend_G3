// src/controllers/_controller.ts
import {
    saveMethod, createCombat, getAllCombats, getCombatById, updateCombat, deleteCombat, getBoxersByCombatId, hideCombat, getCompletedCombatHistoryForBoxer ,
    getPendingInvitations, getSentInvitations, getFutureCombats, respondToCombatInvitation,
    setCombatResult // <-- CAMBIO: Importa la nueva función del servicio
} from '../combats/combat_service.js';

import express, { Request, Response } from 'express';
import Combat from './combat_models.js';
import mongoose, { Types } from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';

// ... (El resto de tus interfaces e imports sin cambios) ...
interface PopulatedUser {
    _id: Types.ObjectId;
    username: string;
    profileImage?: string;
}
interface PopulatedGym {
    _id: Types.ObjectId;
    name: string;
    location?: string;
}


// --- Socket.IO instance holder ---
let io: SocketIOServer | undefined;
export function setSocketIoInstance(ioInstance: SocketIOServer) {
    io = ioInstance;
}


// === TUS HANDLERS EXISTENTES (SIN CAMBIOS) ===

export const saveMethodHandler = async (req: Request, res: Response) => {
    try {
        const combat = saveMethod();
        res.json(combat);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};

export const createCombatHandler = async (req: Request, res: Response) => {
    try {
        const { creator, opponent, date, time, level, gym } = req.body;
        if (
            !creator || !mongoose.Types.ObjectId.isValid(creator) ||
            !opponent || !mongoose.Types.ObjectId.isValid(opponent) ||
            !date || !time || !level ||
            !gym || !mongoose.Types.ObjectId.isValid(gym)
        ) {
            return res.status(400).json({ message: 'Faltan campos obligatorios o IDs inválidos' });
        }
        const combat = await createCombat({ creator, opponent, date, time, level, gym, status: 'completed' });
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
            .populate('gym')
            .populate('boxers');
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
        const result = await getCombatById(gymId, page, pageSize);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};

export const getFutureCombatsHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const combats = await getFutureCombats(userId);
        res.json(combats);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};

export const getPendingInvitationsHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const invitations = await getPendingInvitations(userId);
        res.json(invitations);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};

export const getSentInvitationsHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const invitations = await getSentInvitations(userId);
        res.json(invitations);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};

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

export const getInvitationsHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
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
        const combats = await Combat.find(filter)
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('creator')
            .populate('opponent')
            .populate('gym');
        res.status(200).json({ combats, totalPages: 1 });
    } catch (error: any) {
        console.error("Error filtrando combates:", error);
        res.status(500).json({ message: error?.message || String(error) });
    }
};

export const getUserCombatHistoryHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { boxerId } = req.params;
      const page = parseInt(req.query.page as string, 10) || 1;
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
  
      if (!mongoose.Types.ObjectId.isValid(boxerId)) {
        res.status(400).json({ message: 'ID de boxeador inválido.' });
        return;
      }
  
      const historyResult = await getCompletedCombatHistoryForBoxer(boxerId, page, pageSize);
  
      const transformedCombats = historyResult.combats.map((combat) => {
        const creator = (combat.creator && typeof combat.creator === 'object' && 'username' in combat.creator)
            ? (combat.creator as PopulatedUser)
            : null;
        const opponentUser = (combat.opponent && typeof combat.opponent === 'object' && 'username' in combat.opponent)
            ? (combat.opponent as PopulatedUser)
            : null;
        const winner = combat.winner as PopulatedUser | null;
        const gym = (combat.gym && typeof combat.gym === 'object' && 'name' in combat.gym) 
            ? (combat.gym as PopulatedGym) 
            : null;
  
        let actualOpponentDetails: { id?: string; username: string; profileImage?: string } | null = null;
        let resultForUser: 'Victoria' | 'Derrota' | 'Empate' = 'Empate';
        const boxerIdStr = boxerId.toString();
  
        if (creator && creator._id.toString() === boxerIdStr) {
          if (opponentUser) {
            actualOpponentDetails = { id: opponentUser._id.toString(), username: opponentUser.username, profileImage: opponentUser.profileImage };
          }
        } else if (opponentUser && opponentUser._id.toString() === boxerIdStr) {
          if (creator) {
            actualOpponentDetails = { id: creator._id.toString(), username: creator.username, profileImage: creator.profileImage };
          }
        }
        
        if (combat.status === 'completed') {
          if (winner && winner._id) {
            resultForUser = winner._id.toString() === boxerIdStr ? 'Victoria' : 'Derrota';
          } else {
            resultForUser = 'Empate';
          }
        }
  
        return {
          _id: combat._id.toString(),
          date: combat.date,
          time: combat.time,
          gym: gym ? { _id: gym._id.toString(), name: gym.name, location: gym.location } : null,
          opponent: actualOpponentDetails,
          result: resultForUser,
          level: combat.level,
          status: combat.status,
        };
      });
  
      res.status(200).json({
        message: "Historial de combates obtenido exitosamente.",
        data: {
          combats: transformedCombats,
          totalCombats: historyResult.totalCombats,
          totalPages: historyResult.totalPages,
          currentPage: historyResult.currentPage,
          pageSize: historyResult.pageSize,
        }
      });
  
    } catch (error: any) {
      console.error(`Error en getUserCombatHistoryHandler: ${error.message}`, error.stack);
      res.status(500).json({ message: 'Error interno del servidor al obtener el historial.', details: error.message });
    }
  };

export const setCombatResultHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // ID del combate
        const { winnerId } = req.body; // ID del ganador que viene en el cuerpo de la petición

        if (!winnerId || !mongoose.Types.ObjectId.isValid(winnerId)) {
            return res.status(400).json({ message: 'Se requiere un ID de ganador válido.' });
        }

        const updatedCombat = await setCombatResult(id, winnerId);
        
        res.status(200).json({ message: 'Resultado del combate actualizado con éxito', combat: updatedCombat });

    } catch (error: any) {
        if (error.message === 'Combate no encontrado') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('debe ser uno de los participantes') || error.message.includes('ya tiene un resultado')) {
            return res.status(409).json({ message: error.message });
        }
        
        console.error(`Error en setCombatResultHandler: ${error.message}`);
        res.status(500).json({ message: 'Error interno del servidor.', details: error.message });
    }
};