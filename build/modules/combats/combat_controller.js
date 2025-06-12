// src/controllers/_controller.ts
import { saveMethod, createCombat, getAllCombats, getCombatById, updateCombat, deleteCombat, hideCombat, getCompletedCombatHistoryForBoxer, getPendingInvitations, getSentInvitations, getFutureCombats, respondToCombatInvitation
// Se elimina la importación de 'setCombatResult'
 } from '../combats/combat_service.js';
import Combat from './combat_models.js';
import mongoose from 'mongoose';
import { sendPushNotification } from '../../services/notification_service.js';
import User from '../users/user_models.js'; // Necesario para obtener los nombres
let io;
export function setSocketIoInstance(ioInstance) {
    io = ioInstance;
}
// ... (Todos los handlers hasta getUserCombatHistoryHandler se quedan igual)
export const saveMethodHandler = async (req, res) => {
    try {
        const combat = saveMethod();
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error?.message });
    }
};
export const createCombatHandler = async (req, res) => {
    try {
        const { creator, opponent, date, time, level, gym } = req.body;
        if (!creator || !mongoose.Types.ObjectId.isValid(creator) ||
            !opponent || !mongoose.Types.ObjectId.isValid(opponent) ||
            !date || !time || !level ||
            !gym || !mongoose.Types.ObjectId.isValid(gym)) {
            return res.status(400).json({ message: 'Faltan campos obligatorios o IDs inválidos' });
        }
        // Nota: El status 'completed' se mantiene, ya que indica que el sparring se realizó.
        const combat = await createCombat({ creator, opponent, date, time, level, gym, status: 'pending' });
        if (Combat) {
            const creatorDoc = await User.findById(creator).select('name').lean();
            if (creatorDoc) {
                const notificationTitle = '🥊 ¡Nuevo Desafío!';
                const notificationBody = `${creatorDoc.name} te ha invitado a un combate.`;
                const notificationData = { screen: '/combats' }; // Ruta en tu app a la que navegar
                // Enviamos la notificación al oponente
                await sendPushNotification(opponent, notificationTitle, notificationBody, notificationData);
            }
        }
        res.status(201).json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error?.message });
    }
};
export const getAllCombatsHandler = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        if (![10, 25, 50].includes(pageSize)) {
            return res.status(400).json({ message: 'El tamaño de la lista debe ser 10, 25 o 50' });
        }
        const combats = await getAllCombats(page, pageSize);
        res.status(200).json(combats);
    }
    catch (error) {
        res.status(500).json({ message: error?.message });
    }
};
export const getCombatByIdHandler = async (req, res) => {
    try {
        const combat = await Combat.findById(req.params.id)
            .populate('creator')
            .populate('opponent')
            .populate('gym');
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error?.message });
    }
};
export const updateCombatHandler = async (req, res) => {
    try {
        const combat = await updateCombat(req.params.id, req.body);
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error?.message });
    }
};
export const deleteCombatHandler = async (req, res) => {
    try {
        const combat = await deleteCombat(req.params.id);
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error?.message });
    }
};
export const getBoxersByCombatIdHandler = async (req, res) => {
    try {
        const combat = await Combat.findById(req.params.id)
            .populate('creator')
            .populate('opponent');
        if (!combat)
            return res.json([]);
        res.json([combat.creator, combat.opponent]);
    }
    catch (error) {
        res.status(500).json({ message: error?.message });
    }
};
export const hideCombatHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const { isHidden } = req.body;
        const combat = await hideCombat(id, isHidden);
        if (!combat) {
            res.status(404).json({ message: 'Combate no encontrado' });
        }
        res.status(200).json({ message: `Combate ${isHidden ? 'oculto' : 'visible'}`, combat });
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno en el servidor', error: error?.message });
    }
};
export const getCombatsByBoxerIdHandler = async (req, res) => {
    try {
        const { boxerId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
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
    }
    catch (error) {
        console.error('Error al obtener combates:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error?.message });
    }
};
export const getCombatsByGymIdHandler = async (req, res) => {
    try {
        const { gymId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const result = await getCombatById(gymId, page, pageSize);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: error?.message });
    }
};
export const getFutureCombatsHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const combats = await getFutureCombats(userId);
        res.json(combats);
    }
    catch (error) {
        res.status(500).json({ message: error?.message });
    }
};
export const getPendingInvitationsHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const invitations = await getPendingInvitations(userId);
        res.json(invitations);
    }
    catch (error) {
        res.status(500).json({ message: error?.message });
    }
};
export const getSentInvitationsHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const invitations = await getSentInvitations(userId);
        res.json(invitations);
    }
    catch (error) {
        res.status(500).json({ message: error?.message });
    }
};
// 3. Modifica el respondToInvitationHandler
export const respondToInvitationHandler = async (req, res) => {
    try {
        const opponentId = req.user?.id; // El que responde es el oponente
        const { id } = req.params;
        const { status } = req.body;
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }
        // Primero, guardamos el combate antes de enviar la notificación para tener el creatorId
        const combatBeforeResponse = await Combat.findById(id).lean();
        if (!combatBeforeResponse) {
            return res.status(404).json({ message: 'Combate no encontrado' });
        }
        const creatorId = combatBeforeResponse.creator.toString();
        const result = await respondToCombatInvitation(id, opponentId, status);
        const opponentDoc = await User.findById(opponentId).select('name').lean();
        if (opponentDoc) {
            let notificationTitle = '';
            let notificationBody = '';
            if (status === 'accepted') {
                notificationTitle = '✅ ¡Combate Aceptado!';
                notificationBody = `${opponentDoc.name} ha aceptado tu desafío.`;
            }
            else { // status === 'rejected'
                notificationTitle = '❌ Invitación Rechazada';
                notificationBody = `${opponentDoc.name} ha rechazado tu invitación.`;
            }
            const notificationData = { screen: '/combats' };
            // Enviamos la notificación al creador del combate
            await sendPushNotification(creatorId, notificationTitle, notificationBody, notificationData);
        }
        res.json(result);
    }
    catch (error) {
        res.status(403).json({ message: error?.message });
    }
};
export const getInvitationsHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const invitations = await Combat.find({ opponent: userId, status: 'pending' })
            .populate('creator')
            .populate('opponent')
            .populate('gym');
        res.status(200).json({ success: true, invitations });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error?.message });
    }
};
export const getFilteredCombatsHandler = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const { status, creator, opponent, user } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (creator) {
            if (!mongoose.Types.ObjectId.isValid(creator)) {
                return res.status(400).json({ message: 'creator no es un ObjectId válido' });
            }
            filter.creator = new mongoose.Types.ObjectId(creator);
        }
        if (opponent) {
            if (!mongoose.Types.ObjectId.isValid(opponent)) {
                return res.status(400).json({ message: 'opponent no es un ObjectId válido' });
            }
            filter.opponent = new mongoose.Types.ObjectId(opponent);
        }
        if (user) {
            if (!mongoose.Types.ObjectId.isValid(user)) {
                return res.status(400).json({ message: 'user no es un ObjectId válido' });
            }
            filter.$or = [
                { creator: new mongoose.Types.ObjectId(user) },
                { opponent: new mongoose.Types.ObjectId(user) }
            ];
        }
        const combats = await Combat.find(filter)
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('creator')
            .populate('opponent')
            .populate('gym');
        res.status(200).json({ combats, totalPages: 1 });
    }
    catch (error) {
        console.error("Error filtrando combates:", error);
        res.status(500).json({ message: error?.message || String(error) });
    }
};
export const getUserCombatHistoryHandler = async (req, res) => {
    try {
        const { boxerId } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        if (!mongoose.Types.ObjectId.isValid(boxerId)) {
            res.status(400).json({ message: 'ID de boxeador inválido.' });
            return;
        }
        const historyResult = await getCompletedCombatHistoryForBoxer(boxerId, page, pageSize);
        const transformedCombats = historyResult.combats.map((combat) => {
            const boxerIdStr = boxerId.toString();
            const creator = combat.creator;
            const opponentUser = combat.opponent;
            let opponentInfo = null;
            if (creator?._id?.toString() === boxerIdStr) {
                opponentInfo = opponentUser;
            }
            else if (opponentUser?._id?.toString() === boxerIdStr) {
                opponentInfo = creator;
            }
            const actualOpponentDetails = opponentInfo
                ? { id: opponentInfo._id.toString(), username: opponentInfo.name, profileImage: opponentInfo.profileImage || undefined }
                : { id: 'N/A', username: 'Oponente no identificado' };
            const gym = combat.gym;
            const creatorDetails = creator
                ? { id: creator._id.toString(), username: creator.name, profileImage: creator.profileImage || undefined }
                : { id: 'N/A', username: 'Creador no identificado' };
            // Se elimina la lógica de 'winner' y 'resultForUser'
            return {
                _id: combat._id.toString(),
                date: combat.date,
                time: combat.time,
                gym: gym ? { _id: gym._id.toString(), name: gym.name, location: gym.location } : null,
                creator: creatorDetails,
                opponent: actualOpponentDetails,
                level: combat.level,
                status: combat.status,
                // El campo 'result' ya no se envía
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
    }
    catch (error) {
        console.error(`Error en getUserCombatHistoryHandler: ${error.message}`, error.stack);
        res.status(500).json({ message: 'Error interno del servidor al obtener el historial.', details: error.message });
    }
};
// Se elimina el handler setCombatResultHandler
