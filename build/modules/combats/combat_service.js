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

export const createCombat = (combatData, imagePath) => __awaiter(void 0, void 0, void 0, function* () {
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
    if (imagePath) {
        combatData.image = imagePath;
    }
    const combat = new Combat(combatData);
    return yield combat.save();
});

// Devuelve todos los combates aceptados donde el usuario es creator u opponent
export const getFutureCombats = (userId, page = 1, pageSize = 10) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * pageSize;
    const filter = {
        status: 'accepted',
        $or: [{ creator: userId }, { opponent: userId }]
    };
    const totalCombats = yield Combat.countDocuments(filter);
    const totalPages = Math.ceil(totalCombats / pageSize);
    const combats = yield Combat.find(filter)
        .skip(skip)
        .limit(pageSize)
        .populate('creator')
        .populate('opponent')
        .populate('gym');
    return {
        combats,
        totalCombats,
        totalPages,
        currentPage: page,
        pageSize
    };
});
export const getPendingInvitations = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return Combat.find({ opponent: userId, status: 'pending' })
        .populate('creator')
        .populate('opponent')
        .populate('gym');
});
export const getSentInvitations = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return Combat.find({ creator: userId, status: 'pending' })
        .populate('creator')
        .populate('opponent')
        .populate('gym');
});
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
    const now = new Date();
    const query = {
        $and: [
            {
                $or: [
                    { creator: boxerObjectId },
                    { opponent: boxerObjectId },
                ]
            },
            {
                $or: [
                    { status: 'completed' },
                    { status: 'accepted', date: { $lte: now } }
                ]
            }
        ]
    };
    const totalCombats = yield CombatModel.countDocuments(query);
    const totalPages = Math.ceil(totalCombats / pageSize);
    const combats = yield CombatModel.find(query)
        // === CAMBIO CLAVE Y DEFINITIVO AQUÍ ===
        .populate('creator', 'name profileImage') // <-- Pedimos 'name'
        .populate('opponent', 'name profileImage') // <-- Pedimos 'name'
        .populate('winner', 'name') // <-- Pedimos 'name' también para el ganador
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
export const setCombatResult = (combatId, winnerId) => __awaiter(void 0, void 0, void 0, function* () {
    const combat = yield Combat.findById(combatId);
    if (!combat) {
        throw new Error('Combate no encontrado');
    }
    if (combat.winner) {
        throw new Error('Este combate ya tiene un resultado asignado.');
    }
    const isWinnerParticipant = [combat.creator.toString(), combat.opponent.toString()].includes(winnerId);
    if (!isWinnerParticipant) {
        throw new Error('El ganador debe ser uno de los participantes del combate.');
    }
    combat.status = 'completed';
    combat.winner = new mongoose.Types.ObjectId(winnerId);
    yield combat.save();
    return combat.populate(['creator', 'opponent', 'gym', 'winner']);
});
// Añadir al final de src/combats/combat_service.js
/**
 * Genera estadísticas de combate para un boxeador específico.
 * @param {string} boxerId - El ID del boxeador.
 * @returns {Promise<object>} Un objeto con las estadísticas calculadas.
 */
export const generateUserStatistics = (boxerId) => __awaiter(void 0, void 0, void 0, function* () {
    const boxerObjectId = new mongoose.Types.ObjectId(boxerId);
    // 1. Oponente más frecuente
    const opponentAggregation = yield Combat.aggregate([
        { $match: { status: 'completed', $or: [{ creator: boxerObjectId }, { opponent: boxerObjectId }] } },
        { $project: { actualOpponent: { $cond: { if: { $eq: ['$creator', boxerObjectId] }, then: '$opponent', else: '$creator' } } } },
        { $group: { _id: '$actualOpponent', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'opponentDetails' } },
        { $unwind: '$opponentDetails' },
        { $project: { _id: 0, opponent: { id: '$opponentDetails._id', name: '$opponentDetails.name' }, count: '$count' } }
    ]);
    // 2. Gimnasios más frecuentes (Top 5)
    const frequentGyms = yield Combat.aggregate([
        { $match: { status: 'completed', $or: [{ creator: boxerObjectId }, { opponent: boxerObjectId }] } },
        { $group: { _id: '$gym', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'gyms', localField: '_id', foreignField: 'id', as: 'gymDetails' } },
        { $unwind: '$gymDetails' },
        { $project: { _id: 0, gym: { id: '$gymDetails._id', name: '$gymDetails.name' }, count: '$count' } }
    ]);
    // 3. Número de sparrings por mes
    const combatsPerMonth = yield Combat.aggregate([
        { $match: { status: 'completed', $or: [{ creator: boxerObjectId }, { opponent: boxerObjectId }] } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $project: { _id: 0, year: '$_id.year', month: '$_id.month', count: '$count' } }
    ]);
    return {
        mostFrequentOpponent: opponentAggregation.length > 0 ? opponentAggregation[0] : null,
        frequentGyms,
        combatsPerMonth
    };
});
export const updateCombatImage = (combatId, imagePath) => __awaiter(void 0, void 0, void 0, function* () {
    // Asegura que la ruta se guarde con barras normales para la web
    const normalizedPath = imagePath.replace(/\\/g, '/');
    return yield Combat.findByIdAndUpdate(combatId, { $set: { image: normalizedPath } }, { new: true });
});
