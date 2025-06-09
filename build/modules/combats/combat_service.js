var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from 'mongoose';
import Combat from '../combats/combat_models.js';
import CombatModel from '../combats/combat_models.js';
export const saveMethod = () => {
    return 'Hola';
};
export const createCombat = (combatData) => __awaiter(void 0, void 0, void 0, function* () {
    // Validar y convertir IDs a ObjectId si son string
    if (combatData.creator && typeof combatData.creator === 'string') {
        combatData.creator = new mongoose.Types.ObjectId(combatData.creator);
    }
    if (combatData.opponent && typeof combatData.opponent === 'string') {
        combatData.opponent = new mongoose.Types.ObjectId(combatData.opponent);
    }
    if (combatData.gym && typeof combatData.gym === 'string') {
        combatData.gym = new mongoose.Types.ObjectId(combatData.gym);
    }
    const combat = new Combat(combatData);
    return yield combat.save();
});
// Devuelve todos los combates aceptados donde el usuario es creator u opponent
export const getFutureCombats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return Combat.find({
        status: 'accepted',
        $or: [{ creator: userId }, { opponent: userId }]
    })
        .populate('creator')
        .populate('opponent')
        .populate('gym');
});
// Devuelve todas las invitaciones pendientes donde el usuario es opponent
export const getPendingInvitations = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return Combat.find({ opponent: userId, status: 'pending' })
        .populate('creator')
        .populate('opponent')
        .populate('gym');
});
// Devuelve todas las invitaciones pendientes enviadas por el usuario (creator)
export const getSentInvitations = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return Combat.find({ creator: userId, status: 'pending' })
        .populate('creator')
        .populate('opponent')
        .populate('gym');
});
// Permite que solo el opponent acepte o rechace la invitación
export const respondToCombatInvitation = (combatId, userId, status) => __awaiter(void 0, void 0, void 0, function* () {
    const combat = yield Combat.findById(combatId);
    if (!combat)
        throw new Error('Combate no encontrado');
    if (combat.opponent.toString() !== userId)
        throw new Error('Solo el usuario invitado puede responder');
    if (status === 'accepted') {
        combat.status = 'accepted';
        yield combat.save();
        return combat;
    }
    else if (status === 'rejected') {
        yield Combat.deleteOne({ _id: combatId });
        return { deleted: true };
    }
    else {
        throw new Error('Estado inválido');
    }
});
export const getAllCombats = (page, pageSize) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const skip = (page - 1) * pageSize;
        const totalCombats = yield Combat.countDocuments();
        const totalPages = Math.ceil(totalCombats / pageSize);
        const combats = yield Combat.find().skip(skip).limit(pageSize);
        return {
            combats,
            totalCombats,
            totalPages,
            currentPage: page,
            pageSize
        };
    }
    catch (error) {
        console.error('Error in getAllCombats:', error);
        throw error;
    }
});
export const getCombatById = (id, page, pageSize) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Combat.findById(id)
        .populate('creator')
        .populate('opponent')
        .populate('gym');
});
export const updateCombat = (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Combat.updateOne({ _id: id }, { $set: updateData });
});
export const deleteCombat = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Combat.deleteOne({ _id: id });
});
export const getBoxersByCombatId = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const combat = yield Combat.findById(id)
        .populate('creator')
        .populate('opponent');
    if (!combat)
        return [];
    return [
        combat.creator,
        combat.opponent
    ];
});
export const hideCombat = (id, isHidden) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Combat.updateOne({ _id: id }, { $set: { isHidden } });
});
export const getCompletedCombatHistoryForBoxer = (boxerId, page = 1, pageSize = 10) => __awaiter(void 0, void 0, void 0, function* () {
    const boxerObjectId = new mongoose.Types.ObjectId(boxerId);
    const skip = (page - 1) * pageSize;
    const query = {
        status: 'completed',
        $or: [
            { creator: boxerObjectId },
            { opponent: boxerObjectId },
        ],
    };
    const totalCombats = yield CombatModel.countDocuments(query);
    const totalPages = Math.ceil(totalCombats / pageSize);
    const combats = yield CombatModel.find(query)
        .populate('creator', 'username profileImage')
        .populate('opponent', 'username profileImage')
        .populate('winner', 'username')
        .populate('gym', 'name location')
        .sort({ date: -1, time: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean();
    return {
        combats,
        totalCombats,
        totalPages,
        currentPage: page,
        pageSize,
    };
});
// --- CAMBIO: NUEVA FUNCIÓN AÑADIDA ---
/**
 * Establece el resultado de un combate.
 * @param {string} combatId - El ID del combate a actualizar.
 * @param {string} winnerId - El ID del boxeador que ha ganado.
 * @returns El combate actualizado.
 */
export const setCombatResult = (combatId, winnerId) => __awaiter(void 0, void 0, void 0, function* () {
    const combat = yield Combat.findById(combatId);
    if (!combat) {
        throw new Error('Combate no encontrado');
    }
    if (combat.winner) {
        throw new Error('Este combate ya tiene un resultado asignado.');
    }
    // Comprueba que el ganador es uno de los dos participantes
    const isWinnerParticipant = [combat.creator.toString(), combat.opponent.toString()].includes(winnerId);
    if (!isWinnerParticipant) {
        throw new Error('El ganador debe ser uno de los participantes del combate.');
    }
    combat.status = 'completed';
    combat.winner = new mongoose.Types.ObjectId(winnerId);
    yield combat.save();
    return combat.populate(['creator', 'opponent', 'gym', 'winner']);
});
