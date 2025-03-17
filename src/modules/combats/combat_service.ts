// src/services/user_service.ts
import Combat, { ICombat } from '../combats/combat_models.js';

export const saveMethod = () => {
    return 'Hola';
};
export const createCombat = async (combatData: ICombat) => {
    const combat = new Combat(combatData);
    return await combat.save();
};

export const getAllCombats = async () => {
    return await Combat.find().populate('boxers');
};

export const getCombatById = async (id: string) => {
    return await Combat.findById(id).populate('boxers');
};

export const updateCombat = async (id: string, updateData: Partial<ICombat>) => {
    return await Combat.updateOne({ _id: id }, { $set: updateData });
};

export const deleteCombat = async (id: string) => {
    return await Combat.deleteOne({ _id: id });
};

export const getBoxersByCombatId = async (id: string) => {
    const combat = await Combat.findById(id).populate('boxers');
    return combat ? combat.boxers : [];
};

export const hideCombat = async (id: string, isHidden: boolean) => {
    return await Combat.updateOne({ _id: id }, { $set: { isHidden } });
};