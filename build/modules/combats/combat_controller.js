var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// src/controllers/_controller.ts
import { saveMethod, createCombat, getAllCombats, getCombatById, updateCombat, deleteCombat, hideCombat, getCompletedCombatHistoryForBoxer, getPendingInvitations, getSentInvitations, getFutureCombats, respondToCombatInvitation
// Se elimina la importación de 'setCombatResult'
 } from '../combats/combat_service.js';
import Combat from './combat_models.js';
import mongoose from 'mongoose';
let io;
export function setSocketIoInstance(ioInstance) {
    io = ioInstance;
}
// ... (Todos los handlers hasta getUserCombatHistoryHandler se quedan igual)
export const saveMethodHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const combat = saveMethod();
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const createCombatHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { creator, opponent, date, time, level, gym } = req.body;
        if (!creator || !mongoose.Types.ObjectId.isValid(creator) ||
            !opponent || !mongoose.Types.ObjectId.isValid(opponent) ||
            !date || !time || !level ||
            !gym || !mongoose.Types.ObjectId.isValid(gym)) {
            return res.status(400).json({ message: 'Faltan campos obligatorios o IDs inválidos' });
        }
        // Nota: El status 'completed' se mantiene, ya que indica que el sparring se realizó.
        const combat = yield createCombat({ creator, opponent, date, time, level, gym, status: 'completed' });
        if (io && opponent) {
            io.to(opponent.toString()).emit('new_invitation', combat);
        }
        res.status(201).json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getAllCombatsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        if (![10, 25, 50].includes(pageSize)) {
            return res.status(400).json({ message: 'El tamaño de la lista debe ser 10, 25 o 50' });
        }
        const combats = yield getAllCombats(page, pageSize);
        res.status(200).json(combats);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getCombatByIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const combat = yield Combat.findById(req.params.id)
            .populate('creator')
            .populate('opponent')
            .populate('gym');
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const updateCombatHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const combat = yield updateCombat(req.params.id, req.body);
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const deleteCombatHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const combat = yield deleteCombat(req.params.id);
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getBoxersByCombatIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const combat = yield Combat.findById(req.params.id)
            .populate('creator')
            .populate('opponent');
        if (!combat)
            return res.json([]);
        res.json([combat.creator, combat.opponent]);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const hideCombatHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { isHidden } = req.body;
        const combat = yield hideCombat(id, isHidden);
        if (!combat) {
            res.status(404).json({ message: 'Combate no encontrado' });
        }
        res.status(200).json({ message: `Combate ${isHidden ? 'oculto' : 'visible'}`, combat });
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno en el servidor', error: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getCombatsByBoxerIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { boxerId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const boxerObjectId = new mongoose.Types.ObjectId(boxerId);
        const totalCombats = yield Combat.countDocuments({ boxers: boxerId });
        const totalPages = Math.ceil(totalCombats / pageSize);
        const combats = yield Combat.find({ boxers: new mongoose.Types.ObjectId(boxerId) })
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
        res.status(500).json({ message: 'Error interno del servidor', error: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getCombatsByGymIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gymId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const result = yield getCombatById(gymId, page, pageSize);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getFutureCombatsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const combats = yield getFutureCombats(userId);
        res.json(combats);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getPendingInvitationsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        const invitations = yield getPendingInvitations(userId);
        res.json(invitations);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getSentInvitationsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
        const invitations = yield getSentInvitations(userId);
        res.json(invitations);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const respondToInvitationHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d.id;
        const { id } = req.params;
        const { status } = req.body;
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }
        const result = yield respondToCombatInvitation(id, userId, status);
        res.json(result);
    }
    catch (error) {
        res.status(403).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getInvitationsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const userId = (_e = req.user) === null || _e === void 0 ? void 0 : _e.id;
        const invitations = yield Combat.find({ opponent: userId, status: 'pending' })
            .populate('creator')
            .populate('opponent')
            .populate('gym');
        res.status(200).json({ success: true, invitations });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getFilteredCombatsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const combats = yield Combat.find(filter)
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('creator')
            .populate('opponent')
            .populate('gym');
        res.status(200).json({ combats, totalPages: 1 });
    }
    catch (error) {
        console.error("Error filtrando combates:", error);
        res.status(500).json({ message: (error === null || error === void 0 ? void 0 : error.message) || String(error) });
    }
});
export const getUserCombatHistoryHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { boxerId } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        if (!mongoose.Types.ObjectId.isValid(boxerId)) {
            res.status(400).json({ message: 'ID de boxeador inválido.' });
            return;
        }
        const historyResult = yield getCompletedCombatHistoryForBoxer(boxerId, page, pageSize);
        const transformedCombats = historyResult.combats.map((combat) => {
            var _a, _b;
            const boxerIdStr = boxerId.toString();
            const creator = combat.creator;
            const opponentUser = combat.opponent;
            let opponentInfo = null;
            if (((_a = creator === null || creator === void 0 ? void 0 : creator._id) === null || _a === void 0 ? void 0 : _a.toString()) === boxerIdStr) {
                opponentInfo = opponentUser;
            }
            else if (((_b = opponentUser === null || opponentUser === void 0 ? void 0 : opponentUser._id) === null || _b === void 0 ? void 0 : _b.toString()) === boxerIdStr) {
                opponentInfo = creator;
            }
            const actualOpponentDetails = opponentInfo
                ? { id: opponentInfo._id.toString(), username: opponentInfo.name, profileImage: opponentInfo.profileImage || undefined }
                : { id: 'N/A', username: 'Oponente no identificado' };
            const gym = combat.gym;
            // Se elimina la lógica de 'winner' y 'resultForUser'
            return {
                _id: combat._id.toString(),
                date: combat.date,
                time: combat.time,
                gym: gym ? { _id: gym._id.toString(), name: gym.name, location: gym.location } : null,
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
});
// Se elimina el handler setCombatResultHandler
