
import mongoose from 'mongoose';
import Combat, { ICombat } from '../combats/combat_models.js';

export const saveMethod = () => {
    return 'Hola';
};
export const createCombat = async (combatData: ICombat) => {
    try {
        // Asegúrate de que gym es un ObjectId válido.
        if (typeof combatData.gym === 'string') {
            combatData.gym = new mongoose.Types.ObjectId(combatData.gym);
        }
        
        // Asegúrate de que boxers es un array ObjectId válido.
        if (Array.isArray(combatData.boxers)) {
            combatData.boxers = combatData.boxers.map(id => 
                typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
            );
        }
        
        console.log('Datos de combate procesados:', combatData);
        
        const combat = new Combat(combatData);
        return await combat.save();
    } catch (error) {
        console.error('Createcombat error:', error);
        throw error;
    }
};

export const getAllCombats = async (page: number, pageSize: number) => {
    const offset = (page - 1) * pageSize;
    const combats = await Combat.find().skip(offset).limit(pageSize);
    return combats;
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