var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Gym from './gym_models.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.handle.js';
import { verified } from '../../utils/bcrypt.handle.js';
export const addGym = (gymData) => __awaiter(void 0, void 0, void 0, function* () {
    // Verificar si el nombre, correo o lugar ya existen
    const existingGym = yield Gym.findOne({
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
    return yield gym.save();
});
export const getAllGyms = (page = 1, pageSize = 10) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * pageSize;
    const gyms = yield Gym.find()
        .sort({ isHidden: 1 })
        .skip(skip)
        .limit(pageSize);
    const totalGyms = yield Gym.countDocuments();
    const totalPages = Math.ceil(totalGyms / pageSize);
    return {
        gyms,
        totalGyms,
        totalPages,
        currentPage: page,
    };
});
export const getGymById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Gym.findById(id);
});
export const updateGym = (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Gym.updateOne({ _id: id }, { $set: updateData });
});
export const deleteGym = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Gym.deleteOne({ _id: id });
});
export const hideGym = (id, isHidden) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Gym.updateOne({ _id: id }, { $set: { isHidden } });
});
export const loginGym = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const gym = yield Gym.findOne({ email });
    if (!gym) {
        throw new Error('Gimnasio no encontrado');
    }
    // Verificar si el gimnasio está oculto
    if (gym.isHidden) {
        throw new Error('Este gimnasio está oculto y no puede iniciar sesión');
    }
    // Comparar la contraseña ingresada con la almacenada
    const isCorrect = yield verified(password, gym.password);
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
});
export const refreshGymToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = verifyRefreshToken(refreshToken);
    const gym = yield Gym.findById(decoded.id);
    if (!gym) {
        throw new Error('Gimnasio no encontrado');
    }
    const newToken = generateToken(gym.id, gym.email, gym.name); // Fixed: Added username argument
    return newToken;
});
export const getCurrentGym = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const gym = yield Gym.findById(userId).select('-password');
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
});
