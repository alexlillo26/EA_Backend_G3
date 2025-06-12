import mongoose from 'mongoose';
import Combat from '../combats/combat_models.js';
import CombatModel from '../combats/combat_models.js';
export const saveMethod = () => {
    return 'Hola';
};
export const createCombat = async (combatData) => {
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
    return await combat.save();
};
export const getFutureCombats = async (userId) => {
    return Combat.find({
        status: 'accepted',
        $or: [{ creator: userId }, { opponent: userId }]
    })
        .populate('creator')
        .populate('opponent')
        .populate('gym');
};
export const getPendingInvitations = async (userId) => {
    return Combat.find({ opponent: userId, status: 'pending' })
        .populate('creator')
        .populate('opponent')
        .populate('gym');
};
export const getSentInvitations = async (userId) => {
    return Combat.find({ creator: userId, status: 'pending' })
        .populate('creator')
        .populate('opponent')
        .populate('gym');
};
export const respondToCombatInvitation = async (combatId, userId, status) => {
    const combat = await Combat.findById(combatId);
    if (!combat)
        throw new Error('Combate no encontrado');
    if (combat.opponent.toString() !== userId)
        throw new Error('Solo el usuario invitado puede responder');
    if (status === 'accepted') {
        combat.status = 'accepted';
        await combat.save();
        return combat;
    }
    else if (status === 'rejected') {
        await Combat.deleteOne({ _id: combatId });
        return { deleted: true };
    }
    else {
        throw new Error('Estado inválido');
    }
};
export const getAllCombats = async (page, pageSize) => {
    try {
        const skip = (page - 1) * pageSize;
        const totalCombats = await Combat.countDocuments();
        const totalPages = Math.ceil(totalCombats / pageSize);
        const combats = await Combat.find().skip(skip).limit(pageSize);
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
};
export const getCombatById = async (id, page, pageSize) => {
    return await Combat.findById(id)
        .populate('creator')
        .populate('opponent')
        .populate('gym');
};
export const updateCombat = async (id, updateData) => {
    return await Combat.updateOne({ _id: id }, { $set: updateData });
};
export const deleteCombat = async (id) => {
    return await Combat.deleteOne({ _id: id });
};
export const getBoxersByCombatId = async (id) => {
    const combat = await Combat.findById(id)
        .populate('creator')
        .populate('opponent');
    if (!combat)
        return [];
    return [
        combat.creator,
        combat.opponent
    ];
};
export const hideCombat = async (id, isHidden) => {
    return await Combat.updateOne({ _id: id }, { $set: { isHidden } });
};
export const getCompletedCombatHistoryForBoxer = async (boxerId, page = 1, pageSize = 10) => {
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
    const totalCombats = await CombatModel.countDocuments(query);
    const totalPages = Math.ceil(totalCombats / pageSize);
    const combats = await CombatModel.find(query)
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
};
export const setCombatResult = async (combatId, winnerId) => {
    const combat = await Combat.findById(combatId);
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
    await combat.save();
    return combat.populate(['creator', 'opponent', 'gym', 'winner']);
};
