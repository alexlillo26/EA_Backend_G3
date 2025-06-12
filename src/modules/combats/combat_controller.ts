// src/modules/combats/combat_controller.ts

import {
  saveMethod,
  createCombat,
  getAllCombats,
  getCombatById,
  updateCombat,
  deleteCombat,
  getBoxersByCombatId,
  hideCombat,
  getCombatsByGymId,
  getPendingInvitations,
  getSentInvitations,
  getFutureCombats,
  respondToCombatInvitation,
  updateCombatImage,
  getCompletedCombatHistoryForBoxer,
  setCombatResult,
  generateUserStatistics
} from '../combats/combat_service.js';

import Follower from "../followers/follower_model.js";
import webpush from "web-push";
import express, { Request, Response } from 'express';
import Combat from './combat_models.js';
import mongoose, { Types } from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import User from "../users/user_models.js";
import path from 'path';
import cloudinary from '../config/cloudinary.js';

let io: SocketIOServer | undefined;
export function setSocketIoInstance(ioInstance: SocketIOServer) {
  io = ioInstance;
}

// Auxiliar: IDs de seguidores de un usuario
const getFollowersOfUser = async (userId: string): Promise<string[]> => {
  const followers = await Follower.find({ following: userId }).select("follower");
  return followers.map(f => f.follower.toString());
};

export const saveMethodHandler = async (req: Request, res: Response) => {
  try {
    const combat = saveMethod();
    res.json(combat);
  } catch (error: any) {
    res.status(500).json({ message: error?.message });
  }
};

// Crear combate (con imagen opcional) + notificaciones socket y push
export const createCombatHandler = async (req: Request, res: Response) => {
  try {
    const { creator, opponent, date, time, level, gym } = req.body;
    // Validación básica
    if (
      !creator || !mongoose.Types.ObjectId.isValid(creator) ||
      !opponent || !mongoose.Types.ObjectId.isValid(opponent) ||
      !date || !time || !level ||
      !gym || !mongoose.Types.ObjectId.isValid(gym)
    ) {
      return res.status(400).json({ message: 'Faltan campos obligatorios o IDs inválidos' });
    }

    // Subida de imagen a Cloudinary si viene en req.file
    let imageUrl: string | undefined;
    if (req.file) {
      imageUrl = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'combats' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result?.secure_url || '');
          }
        );
        stream.end((req.file as any).buffer);
      });
    }

    const combat = await createCombat(
      { creator, opponent, date, time, level, gym, status: 'pending' },
      imageUrl
    );

    // Socket: notificar invitación
    if (io && opponent) {
      io.to(opponent.toString()).emit('new_invitation', combat);
    }

    // Socket + Push a seguidores del creator
    if (io && creator) {
      const followers = await Follower.find({ following: creator }).select("follower pushSubscription");
      const actorUser = await User.findById(creator).select("name");
      const actor = { id: creator, name: actorUser?.name || "Usuario" };

      for (const f of followers) {
        const followerId = f.follower.toString();
        // Socket.IO
        const socketId = (global as any).userSocketMap?.get(followerId);
        if (socketId) {
          io.to(socketId).emit("new_combat_from_followed", { combat, actor });
        }
        // Push
        if (f.pushSubscription) {
          const payload = JSON.stringify({
            title: "¡Nuevo combate de usuario seguido!",
            body: `Tu usuario seguido ha creado un combate.`,
            data: { combatId: combat._id.toString() },
          });
          webpush.sendNotification(f.pushSubscription, payload).catch(console.error);
        }
      }
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
    res.json(combat ? [combat.creator, combat.opponent] : []);
  } catch (error: any) {
    res.status(500).json({ message: error?.message });
  }
};

export const hideCombatHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isHidden } = req.body;
    const combat = await hideCombat(id, isHidden);
    if (!combat) return res.status(404).json({ message: 'Combate no encontrado' });
    res.status(200).json({ message: `Combate ${isHidden ? 'oculto' : 'visible'}`, combat });
  } catch (error: any) {
    res.status(500).json({ message: 'Error interno', error: error?.message });
  }
};

export const getCombatsByBoxerIdHandler = async (req: Request, res: Response) => {
  try {
    const { boxerId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    if (!mongoose.Types.ObjectId.isValid(boxerId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const total = await Combat.countDocuments({ boxers: boxerId });
    const combats = await Combat.find({ boxers: boxerId })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('gym')
      .populate('boxers');
    if (!combats.length) return res.status(404).json({ message: 'No se encontraron combates' });
    res.status(200).json({ combats, totalPages: Math.ceil(total / pageSize) });
  } catch (error: any) {
    res.status(500).json({ message: 'Error interno', error: error?.message });
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
    const { id: combatId } = req.params;
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const result = await respondToCombatInvitation(combatId, userId, status);

    if (status === 'accepted') {
      if (!io) throw new Error("Socket.IO no inicializado");
      // A) seguidores de quien acepta
      const actorUser = await User.findById(userId).select("name");
      const actor = { id: userId, name: actorUser?.name || "Usuario" };
      // Enviar socket y push a cada seguidor
      const followers = await Follower.find({ following: userId }).select("follower pushSubscription");
      for (const f of followers) {
        const fid = f.follower.toString();
        io.to(fid).emit("new_combat_from_followed", { combat: result, actor });
        if (f.pushSubscription) {
          // --- FIX: Solo accede a _id si existe y es string o ObjectId ---
          let combatIdStr = '';
          if (result && typeof result === 'object' && '_id' in result && result._id) {
            // Puede ser ObjectId o string
            combatIdStr = typeof result._id === 'string'
              ? result._id
              : typeof result._id === 'object' && 'toString' in result._id
                ? (result._id as any).toString()
                : '';
          }
          const payload = JSON.stringify({
            title: "¡Tu seguido ha aceptado un combate!",
            body: `${actor.name} ha aceptado un combate.`,
            data: { combatId: combatIdStr, type: "accepted" }
          });
          webpush.sendNotification(f.pushSubscription, payload)
            .catch(err => console.error("Error push accept:", err));
        }
      }

      // B) seguidores del creador original
      const originalCombat = await Combat.findById(combatId).select("creator");
      if (originalCombat?.creator) {
        const creatorId = originalCombat.creator.toString();
        const creatorUser = await User.findById(creatorId).select("name");
        const creatorActor = { id: creatorId, name: creatorUser?.name || "Usuario" };
        const followersOfCreator = await Follower.find({ following: creatorId }).select("follower pushSubscription");
        for (const f of followersOfCreator) {
          const fid = f.follower.toString();
          io.to(fid).emit("new_combat_from_followed", { combat: result, actor: creatorActor });
          if (f.pushSubscription) {
            // --- FIX: Solo accede a _id si existe y es string o ObjectId ---
            let combatIdStr = '';
            if (result && typeof result === 'object' && '_id' in result && result._id) {
              combatIdStr = typeof result._id === 'string'
                ? result._id
                : typeof result._id === 'object' && 'toString' in result._id
                  ? (result._id as any).toString()
                  : '';
            }
            const payload = JSON.stringify({
              title: "¡Tu seguido ha aceptado un combate!",
              body: `${creatorActor.name} ha aceptado un combate.`,
              data: { combatId: combatIdStr, type: "accepted" }
            });
            webpush.sendNotification(f.pushSubscription, payload)
              .catch(err => console.error("Error push accept (creator):", err));
          }
        }
      }
    }

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
    if (creator && mongoose.Types.ObjectId.isValid(creator as string)) {
      filter.creator = new mongoose.Types.ObjectId(creator as string);
    }
    if (opponent && mongoose.Types.ObjectId.isValid(opponent as string)) {
      filter.opponent = new mongoose.Types.ObjectId(opponent as string);
    }
    if (user && mongoose.Types.ObjectId.isValid(user as string)) {
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

    res.status(200).json({ combats, totalPages: Math.ceil((await Combat.countDocuments(filter)) / pageSize) });
  } catch (error: any) {
    console.error("Error filtrando combates:", error);
    res.status(500).json({ message: error?.message });
  }
};

// Actualizar imagen de combate
export const updateCombatImageHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No se ha enviado imagen.' });

    const imageUrl = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'combats' },
        (err, result) => err ? reject(err) : resolve(result?.secure_url || '')
      );
      stream.end((req.file as any).buffer);
    });

    const updated = await updateCombatImage(id, imageUrl);
    if (!updated) return res.status(404).json({ message: 'Combate no encontrado.' });

    res.status(200).json({ message: 'Imagen actualizada.', combat: updated });
  } catch (error: any) {
    console.error("Error updateCombatImage:", error);
    res.status(500).json({ message: error?.message });
  }
};

// Historial completo de combates de un usuario
export const getUserCombatHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { boxerId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    if (!mongoose.Types.ObjectId.isValid(boxerId)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const history = await getCompletedCombatHistoryForBoxer(boxerId, page, pageSize);
    // Mapea, transforma, etc. (igual que antes)
    // …

    res.status(200).json({ data: history });
  } catch (error: any) {
    console.error("Error getUserCombatHistoryHandler:", error);
    res.status(500).json({ message: 'Error interno.', details: error.message });
  }
};

// Establecer resultado de combate
export const setCombatResultHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { winnerId } = req.body;
    if (!winnerId || !mongoose.Types.ObjectId.isValid(winnerId)) {
      return res.status(400).json({ message: 'winnerId inválido.' });
    }
    const updated = await setCombatResult(id, winnerId);
    res.status(200).json({ message: 'Resultado actualizado.', combat: updated });
  } catch (error: any) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('participantes') || error.message.includes('resultado')) {
      return res.status(409).json({ message: error.message });
    }
    console.error("Error setCombatResultHandler:", error);
    res.status(500).json({ message: 'Error interno.', details: error.message });
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

export const getCombatsByGymSearchHandler = async (req: Request, res: Response) => {
    try {
        const { gymId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        if (!mongoose.Types.ObjectId.isValid(gymId)) {
            return res.status(400).json({ message: 'ID de gimnasio inválido' });
        }
        // Cambia getCombatsByGym por getCombatsByGymId
        const result = await getCombatsByGymId(gymId, page, pageSize);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ message: error?.message });
    }
};