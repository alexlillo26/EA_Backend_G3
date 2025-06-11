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
import { saveMethod, createCombat, getAllCombats, getCombatById, updateCombat, deleteCombat, hideCombat, getPendingInvitations, getSentInvitations, getFutureCombats, respondToCombatInvitation, updateCombatImage, getCompletedCombatHistoryForBoxer, setCombatResult, sendCancellationEmail } from '../combats/combat_service.js';
import Combat from './combat_models.js';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
let io;
export function setSocketIoInstance(ioInstance) {
    io = ioInstance;
}
// --- El resto de tus handlers ---
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
        let imageUrl = undefined;
        if (req.file) {
            const file = req.file;
            console.log('Archivo recibido:', file.originalname, file.mimetype, file.size);
            // Sube la imagen a Cloudinary usando el buffer de multer
            imageUrl = yield new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({ folder: 'combats' }, (error, result) => {
                    if (error) {
                        console.error('Error Cloudinary:', error);
                        return reject(error);
                    }
                    resolve((result === null || result === void 0 ? void 0 : result.secure_url) || '');
                });
                stream.end(file.buffer);
            });
            console.log('URL de la imagen subida a Cloudinary:', imageUrl);
        }
        const combat = yield createCombat({ creator, opponent, date, time, level, gym, status: 'pending' }, imageUrl);
        // Notificar al oponente por socket.io si está conectado
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
        const combats = yield Combat.find({ boxers: new mongoose.Types.ObjectId(boxerId) })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('gym')
            .populate('boxers');
        if (!combats || combats.length === 0) {
            return res.status(404).json({ message: 'No se encontraron combates para este usuario' });
        }
        const totalCombats = yield Combat.countDocuments({ boxers: boxerId });
        const totalPages = Math.ceil(totalCombats / pageSize);
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
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const combats = yield getFutureCombats(userId, page, pageSize);
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
export const updateCombatImageHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha enviado ninguna imagen.' });
        }
        const file = req.file;
        // Sube la imagen a Cloudinary usando el buffer de multer
        const imageUrl = yield new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'combats' }, (error, result) => {
                if (error)
                    return reject(error);
                resolve((result === null || result === void 0 ? void 0 : result.secure_url) || '');
            });
            stream.end(file.buffer);
        });
        const updatedCombat = yield updateCombatImage(id, imageUrl);
        if (!updatedCombat) {
            return res.status(404).json({ message: 'Combate no encontrado.' });
        }
        res.status(200).json({ message: 'Imagen actualizada correctamente.', combat: updatedCombat });
    }
    catch (error) {
        console.log("Error al actualizar la imagen del combate:", error);
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
// --- Código corregido y final ---
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
                ? {
                    id: opponentInfo._id.toString(),
                    username: opponentInfo.name,
                    profileImage: opponentInfo.profileImage || undefined
                }
                : {
                    id: 'N/A',
                    username: 'Oponente no identificado'
                };
            const winner = combat.winner;
            let resultForUser = 'Empate';
            if (winner === null || winner === void 0 ? void 0 : winner._id) {
                resultForUser = winner._id.toString() === boxerIdStr ? 'Victoria' : 'Derrota';
            }
            const gym = combat.gym;
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
    }
    catch (error) {
        console.error(`Error en getUserCombatHistoryHandler: ${error.message}`, error.stack);
        res.status(500).json({ message: 'Error interno del servidor al obtener el historial.', details: error.message });
    }
});
export const setCombatResultHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { winnerId } = req.body;
        if (!winnerId || !mongoose.Types.ObjectId.isValid(winnerId)) {
            return res.status(400).json({ message: 'Se requiere un ID de ganador válido.' });
        }
        const updatedCombat = yield setCombatResult(id, winnerId);
        res.status(200).json({ message: 'Resultado del combate actualizado con éxito', combat: updatedCombat });
    }
    catch (error) {
        if (error.message === 'Combate no encontrado') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('debe ser uno de los participantes') || error.message.includes('ya tiene un resultado')) {
            return res.status(409).json({ message: error.message });
        }
        console.error(`Error en setCombatResultHandler: ${error.message}`);
        res.status(500).json({ message: 'Error interno del servidor.', details: error.message });
    }
});
export const cancelCombatHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    try {
        console.log('Cancel combat request:', req.params, req.body, req.user);
        const combatId = req.params.id;
        const { reason } = req.body; // Motivo seleccionado en el modal
        const combat = yield Combat.findById(combatId).populate('creator opponent');
        console.log('Combat encontrado:', combat);
        if (!combat)
            return res.status(404).json({ message: 'Combate no encontrado' });
        combat.status = 'cancelled';
        yield combat.save();
        console.log('Combate actualizado a cancelled');
        const userId = ((_g = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id) === null || _g === void 0 ? void 0 : _g.toString()) || ((_h = req.user) === null || _h === void 0 ? void 0 : _h.id); // Soporta ambos casos
        const creatorId = ((_k = (_j = combat.creator._id) === null || _j === void 0 ? void 0 : _j.toString) === null || _k === void 0 ? void 0 : _k.call(_j)) || ((_m = (_l = combat.creator.id) === null || _l === void 0 ? void 0 : _l.toString) === null || _m === void 0 ? void 0 : _m.call(_l));
        const opponentId = ((_p = (_o = combat.opponent._id) === null || _o === void 0 ? void 0 : _o.toString) === null || _p === void 0 ? void 0 : _p.call(_o)) || ((_r = (_q = combat.opponent.id) === null || _q === void 0 ? void 0 : _q.toString) === null || _r === void 0 ? void 0 : _r.call(_q));
        let otherUser = null;
        if (userId === creatorId) {
            otherUser = combat.opponent;
        }
        else if (userId === opponentId) {
            otherUser = combat.creator;
        }
        else {
            console.log('No tienes permiso para cancelar este combate');
            return res.status(403).json({ message: 'No tienes permiso para cancelar este combate.' });
        }
        console.log('Usuario a notificar:', otherUser);
        if (!otherUser || !otherUser.email) {
            console.log('No se pudo obtener el email del otro usuario');
            return res.status(400).json({ message: 'No se pudo obtener el email del otro usuario.' });
        }
        yield sendCancellationEmail(otherUser.email, reason, combat);
        console.log('Email enviado a:', otherUser.email);
        res.json({ message: 'Combate cancelado y notificado correctamente.' });
    }
    catch (error) {
        console.error('Error en cancelCombatHandler:', error);
        res.status(500).json({ message: 'Error al cancelar el combate', error });
    }
});
