import Gym from './gym_models.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.handle.js';
import { verified } from '../../utils/bcrypt.handle.js';
export const addGym = async (gymData) => {
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
    // Eliminar la encriptación redundante aquí
    // gymData.password = await encrypt(gymData.password);
    const gym = new Gym(gymData);
    return await gym.save();
};
export const getAllGyms = async (page = 1, pageSize = 10) => {
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
        currentPage: page,
    };
};
export const getGymById = async (id) => {
    return await Gym.findById(id);
};
export const updateGym = async (id, updateData) => {
    return await Gym.updateOne({ _id: id }, { $set: updateData });
};
export const deleteGym = async (id) => {
    return await Gym.deleteOne({ _id: id });
};
export const hideGym = async (id, isHidden) => {
    return await Gym.updateOne({ _id: id }, { $set: { isHidden } });
};
export const loginGym = async (email, password) => {
    const gym = await Gym.findOne({ email });
    if (!gym) {
        throw new Error('Gimnasio no encontrado');
    }
    // Verificar si el gimnasio está oculto
    if (gym.isHidden) {
        throw new Error('Este gimnasio está oculto y no puede iniciar sesión');
    }
    // Comparar la contraseña ingresada con la almacenada
    const isCorrect = await verified(password, gym.password);
    if (!isCorrect) {
        throw new Error('Contraseña incorrecta');
    }
    // Generar tokens
    const token = generateToken(gym.id, gym.email, gym.name); // Fixed: Added name argument
    const refreshToken = generateRefreshToken(gym.id);
    return {
        token,
        refreshToken,
        gym
    };
};
export const refreshGymToken = async (refreshToken) => {
    const decoded = verifyRefreshToken(refreshToken);
    const gym = await Gym.findById(decoded.id);
    if (!gym) {
        throw new Error('Gimnasio no encontrado');
    }
    const newToken = generateToken(gym.id, gym.email, gym.name); // Fixed: Added username argument
    return newToken;
};
export const getCurrentGym = async (userId) => {
    const gym = await Gym.findById(userId).select('-password');
    if (!gym) {
        throw new Error('Gimnasio no encontrado');
    }
    if (gym.isHidden) {
        throw new Error('Este gimnasio está oculto');
    }
    return {
        id: gym._id,
        name: gym.name,
        email: gym.email,
        phone: gym.phone,
        place: gym.place,
        price: gym.price
    };
};
