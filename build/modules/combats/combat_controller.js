// src/modules/combats/combat_controller.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { saveMethod, createCombat, getAllCombats, updateCombat, deleteCombat, hideCombat, getCombatsByGymId, getPendingInvitations, getSentInvitations, getFutureCombats, respondToCombatInvitation, updateCombatImage, getCompletedCombatHistoryForBoxer, setCombatResult } from '../combats/combat_service.js';
import Follower from "../followers/follower_model.js";
import webpush from "web-push";
import Combat from './combat_models.js';
import mongoose from 'mongoose';
import User from "../users/user_models.js";
import cloudinary from '../config/cloudinary.js';
let io;
export function setSocketIoInstance(ioInstance) {
    io = ioInstance;
}
// Auxiliar: IDs de seguidores de un usuario
const getFollowersOfUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const followers = yield Follower.find({ following: userId }).select("follower");
    return followers.map(f => f.follower.toString());
});
export const saveMethodHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const combat = saveMethod();
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
// Crear combate (con imagen opcional) + notificaciones socket y push
export const createCombatHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { creator, opponent, date, time, level, gym } = req.body;
        // Validación básica
        if (!creator || !mongoose.Types.ObjectId.isValid(creator) ||
            !opponent || !mongoose.Types.ObjectId.isValid(opponent) ||
            !date || !time || !level ||
            !gym || !mongoose.Types.ObjectId.isValid(gym)) {
            return res.status(400).json({ message: 'Faltan campos obligatorios o IDs inválidos' });
        }
        // Subida de imagen a Cloudinary si viene en req.file
        let imageUrl;
        if (req.file) {
            imageUrl = yield new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({ folder: 'combats' }, (error, result) => {
                    if (error)
                        return reject(error);
                    resolve((result === null || result === void 0 ? void 0 : result.secure_url) || '');
                });
                stream.end(req.file.buffer);
            });
        }
        const combat = yield createCombat({ creator, opponent, date, time, level, gym, status: 'pending' }, imageUrl);
        // Socket: notificar invitación
        if (io && opponent) {
            io.to(opponent.toString()).emit('new_invitation', combat);
        }
        // Socket + Push a seguidores del creator
        if (io && creator) {
            const followers = yield Follower.find({ following: creator }).select("follower pushSubscription");
            const actorUser = yield User.findById(creator).select("name");
            const actor = { id: creator, name: (actorUser === null || actorUser === void 0 ? void 0 : actorUser.name) || "Usuario" };
            for (const f of followers) {
                const followerId = f.follower.toString();
                // Socket.IO
                const socketId = (_a = global.userSocketMap) === null || _a === void 0 ? void 0 : _a.get(followerId);
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
        res.json(combat ? [combat.creator, combat.opponent] : []);
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
        if (!combat)
            return res.status(404).json({ message: 'Combate no encontrado' });
        res.status(200).json({ message: `Combate ${isHidden ? 'oculto' : 'visible'}`, combat });
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno', error: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getCombatsByBoxerIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { boxerId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        if (!mongoose.Types.ObjectId.isValid(boxerId)) {
            return res.status(400).json({ message: 'ID inválido' });
        }
        const total = yield Combat.countDocuments({ boxers: boxerId });
        const combats = yield Combat.find({ boxers: boxerId })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('gym')
            .populate('boxers');
        if (!combats.length)
            return res.status(404).json({ message: 'No se encontraron combates' });
        res.status(200).json({ combats, totalPages: Math.ceil(total / pageSize) });
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno', error: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getCombatsByGymIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gymId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const result = yield getCombatsByGymId(gymId, page, pageSize);
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
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const invitations = yield getPendingInvitations(userId);
        res.json(invitations);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getSentInvitationsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const invitations = yield getSentInvitations(userId);
        res.json(invitations);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const respondToInvitationHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { id: combatId } = req.params;
        const { status } = req.body;
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }
        const result = yield respondToCombatInvitation(combatId, userId, status);
        if (status === 'accepted') {
            if (!io)
                throw new Error("Socket.IO no inicializado");
            // A) seguidores de quien acepta
            const actorUser = yield User.findById(userId).select("name");
            const actor = { id: userId, name: (actorUser === null || actorUser === void 0 ? void 0 : actorUser.name) || "Usuario" };
            for (const fId of yield getFollowersOfUser(userId)) {
                io.to(fId).emit("new_combat_from_followed", { combat: result, actor });
            }
            // B) seguidores del creador original
            const orig = yield Combat.findById(combatId).select("creator");
            if (orig === null || orig === void 0 ? void 0 : orig.creator) {
                const creatorId = orig.creator.toString();
                const creatorUser = yield User.findById(creatorId).select("name");
                const creatorActor = { id: creatorId, name: (creatorUser === null || creatorUser === void 0 ? void 0 : creatorUser.name) || "Usuario" };
                for (const fId of yield getFollowersOfUser(creatorId)) {
                    io.to(fId).emit("new_combat_from_followed", { combat: result, actor: creatorActor });
                }
            }
        }
        res.json(result);
    }
    catch (error) {
        res.status(403).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getInvitationsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
        if (creator && mongoose.Types.ObjectId.isValid(creator)) {
            filter.creator = new mongoose.Types.ObjectId(creator);
        }
        if (opponent && mongoose.Types.ObjectId.isValid(opponent)) {
            filter.opponent = new mongoose.Types.ObjectId(opponent);
        }
        if (user && mongoose.Types.ObjectId.isValid(user)) {
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
        res.status(200).json({ combats, totalPages: Math.ceil((yield Combat.countDocuments(filter)) / pageSize) });
    }
    catch (error) {
        console.error("Error filtrando combates:", error);
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
// Actualizar imagen de combate
export const updateCombatImageHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!req.file)
            return res.status(400).json({ message: 'No se ha enviado imagen.' });
        const imageUrl = yield new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'combats' }, (err, result) => err ? reject(err) : resolve((result === null || result === void 0 ? void 0 : result.secure_url) || ''));
            stream.end(req.file.buffer);
        });
        const updated = yield updateCombatImage(id, imageUrl);
        if (!updated)
            return res.status(404).json({ message: 'Combate no encontrado.' });
        res.status(200).json({ message: 'Imagen actualizada.', combat: updated });
    }
    catch (error) {
        console.error("Error updateCombatImage:", error);
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
// Historial completo de combates de un usuario
export const getUserCombatHistoryHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { boxerId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        if (!mongoose.Types.ObjectId.isValid(boxerId)) {
            return res.status(400).json({ message: 'ID inválido.' });
        }
        const history = yield getCompletedCombatHistoryForBoxer(boxerId, page, pageSize);
        // Mapea, transforma, etc. (igual que antes)
        // …
        res.status(200).json({ data: history });
    }
    catch (error) {
        console.error("Error getUserCombatHistoryHandler:", error);
        res.status(500).json({ message: 'Error interno.', details: error.message });
    }
});
// Establecer resultado de combate
export const setCombatResultHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { winnerId } = req.body;
        if (!winnerId || !mongoose.Types.ObjectId.isValid(winnerId)) {
            return res.status(400).json({ message: 'winnerId inválido.' });
        }
        const updated = yield setCombatResult(id, winnerId);
        res.status(200).json({ message: 'Resultado actualizado.', combat: updated });
    }
    catch (error) {
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('participantes') || error.message.includes('resultado')) {
            return res.status(409).json({ message: error.message });
        }
        console.error("Error setCombatResultHandler:", error);
        res.status(500).json({ message: 'Error interno.', details: error.message });
    }
});
