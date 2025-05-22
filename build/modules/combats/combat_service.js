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
export const saveMethod = () => {
    return 'Hola';
};
export const createCombat = (combatData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Asegúrate de que gym es un ObjectId válido.
        if (typeof combatData.gym === 'string') {
            combatData.gym = new mongoose.Types.ObjectId(combatData.gym);
        }
        // Asegúrate de que boxers es un array ObjectId válido.
        if (Array.isArray(combatData.boxers)) {
            combatData.boxers = combatData.boxers.map(id => typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id);
        }
        console.log('Datos de combate procesados:', combatData);
        const combat = new Combat(combatData);
        return yield combat.save();
    }
    catch (error) {
        console.error('Createcombat error:', error);
        throw error;
    }
});
export const getAllCombats = (page, pageSize) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Contar el número de registros omitidos
        const skip = (page - 1) * pageSize;
        // Consulta de registros totales
        const totalCombats = yield Combat.countDocuments();
        // cCalcular el número total de páginas
        const totalPages = Math.ceil(totalCombats / pageSize);
        // cObtener la página actual de registros
        const combats = yield Combat.find().skip(skip).limit(pageSize);
        // Devolución de información y registros de paginación
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
export const getCombatById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Combat.findById(id).populate('boxers');
});
export const updateCombat = (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Combat.updateOne({ _id: id }, { $set: updateData });
});
export const deleteCombat = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Combat.deleteOne({ _id: id });
});
export const getBoxersByCombatId = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const combat = yield Combat.findById(id).populate('boxers');
    return combat ? combat.boxers : [];
});
export const hideCombat = (id, isHidden) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Combat.updateOne({ _id: id }, { $set: { isHidden } });
});
export const getCombatsByGymId = (gymId, page, pageSize) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const skip = (page - 1) * pageSize;
        // gym字段是ObjectId类型，查询时需转换
        const query = { gym: new mongoose.Types.ObjectId(gymId), isHidden: false };
        const totalCombats = yield Combat.countDocuments(query);
        const totalPages = Math.ceil(totalCombats / pageSize);
        const combats = yield Combat.find(query)
            .skip(skip)
            .limit(pageSize)
            .populate('gym')
            .populate('boxers');
        return {
            combats,
            totalCombats,
            totalPages,
            currentPage: page,
            pageSize
        };
    }
    catch (error) {
        console.error('Error in getCombatsByGymId:', error);
        throw error;
    }
});
