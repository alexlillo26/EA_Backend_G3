import Gym, { IGym } from './gym_models.js';



export const addGym = async (gymData: IGym) => {
    // Verificar si el nombre, correo o lugar ya existen
    const existingGym = await Gym.findOne({
        $or: [{ name: gymData.name }, { email: gymData.email }, { place: gymData.place }]
    });

    if (existingGym) {
        throw new Error('El nombre, correo electrónico o lugar del gimnasio ya están en uso');
    }

    if (!/^\d{9}$/.test(gymData.phone)) {
        throw new Error('El número de teléfono debe tener exactamente 9 dígitos');
    }
    
    if (gymData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    // Eliminar el campo _id si está vacío
    if (gymData._id === "") {
        delete gymData._id;
    }

    const gym = new Gym(gymData);
    return await gym.save();
};

export const getAllGyms = async (page: number = 1, pageSize: number = 10) => {
    const skip = (page - 1) * pageSize;
    const gyms = await Gym.find()
                           .sort({ isHidden: 1 }) 
                           .skip(skip)
                           .limit(pageSize);
    const totalGyms = await Gym.countDocuments();
    const totalPages = Math.ceil(totalGyms / pageSize);
    return { 
        gyms,
        totalGyms,
        totalPages,
        currentPage: page
    };
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