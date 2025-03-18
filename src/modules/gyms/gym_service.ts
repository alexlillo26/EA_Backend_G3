import Gym, { IGym } from './gym_models.js';

export const addGym = async (gymData: IGym) => {
    // Verificar si el nombre, correo o lugar ya existen
    const existingGym = await Gym.findOne({
        $or: [{ name: gymData.name }, { email: gymData.email }, { place: gymData.place }]
    });

    if (existingGym) {
        throw new Error('El nombre, correo electrónico o lugar del gimnasio ya están en uso');
    }

    const gym = new Gym(gymData);
    return await gym.save();
};

export const getAllGyms = async (page: number, pageSize: number) => {
    const offset = (page - 1) * pageSize;
    const gyms = await Gym.find().skip(offset).limit(pageSize);
    return gyms;
};

export const getGymById = async (id: string) => {
    return await Gym.findById(id);
};

export const updateGym = async (id: string, updateData: Partial<IGym>) => {
    return await Gym.updateOne({ _id: id }, { $set: updateData });
};

export const deleteGym = async (id: string) => {
    return await Gym.deleteOne({ _id: id });
};

export const hideGym = async (id: string, isHidden: boolean) => {
    return await Gym.updateOne({ _id: id }, { $set: { isHidden } });
};

export const loginGym = async (email: string, password: string) => {
    return await Gym.findOne({ email, password });
};