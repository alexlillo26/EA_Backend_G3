import Gym, { IGym } from './gym_models.js';

export const addGym = async (gymData: IGym) => {
    const gym = new Gym(gymData);
    return await gym.save();
};

export const getAllGyms = async () => {
    return await Gym.find();
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
}

export const loginGym = async (email: string, password: string) => {
    return await Gym.findOne ({ email, password });
};



