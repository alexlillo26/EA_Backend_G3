var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// src/services/user_service.ts
import User from '../users/user_models.js';
import { generateToken, generateRefreshToken, verifyToken } from '../../utils/jwt.handle.js';
import { encrypt, verified } from '../../utils/bcrypt.handle.js';
export const saveMethod = () => {
    return 'Hola';
};
// Crear usuario con validaciones
export const createUser = (userData) => __awaiter(void 0, void 0, void 0, function* () {
    // Verificar si el nombre de usuario o correo ya existen
    const existingUser = yield User.findOne({
        $or: [{ name: userData.name }, { email: userData.email }]
    });
    if (existingUser) {
        throw new Error('El nombre de usuario o el correo electrónico ya están en uso');
    }
    // Verificar que la contraseña tenga al menos 8 caracteres
    if (userData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    // Encriptar la contraseña
    userData.password = yield encrypt(userData.password);
    const user = new User(userData);
    return yield user.save();
});
// Obtener usuarios (solo los visibles)
export const getAllUsers = (page = 1, pageSize = 10, token, refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    let decodedToken;
    try {
        decodedToken = verifyToken(token);
    }
    catch (_a) {
        const newToken = generateToken(refreshToken);
        decodedToken = verifyToken(newToken);
    }
    const skip = (page - 1) * pageSize;
    const users = yield User.find()
        .sort({ isHidden: 1 }) // primero los visibles
        .skip(skip)
        .limit(pageSize);
    const totalUsers = yield User.countDocuments();
    const totalPages = Math.ceil(totalUsers / pageSize);
    return {
        users,
        totalUsers,
        totalPages,
        currentPage: page
    };
});
// Obtener un usuario por ID
export const getUserById = (id, token, refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    let decodedToken;
    try {
        decodedToken = verifyToken(token);
    }
    catch (_b) {
        const newToken = generateToken(refreshToken);
        decodedToken = verifyToken(newToken);
    }
    const user = yield User.findById(id);
    if (user) {
        return Object.assign(Object.assign({}, user.toObject()), { age: calculateAge(user.birthDate) });
    }
    return null;
});
// Actualizar usuario
export const updateUser = (id, updateData, token, refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    let decodedToken;
    try {
        decodedToken = verifyToken(token);
    }
    catch (_c) {
        const newToken = generateToken(refreshToken);
        decodedToken = verifyToken(newToken);
    }
    return yield User.findByIdAndUpdate(id, updateData, { new: true });
});
// Eliminar usuario
export const deleteUser = (id, token, refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    let decodedToken;
    try {
        decodedToken = verifyToken(token);
    }
    catch (_d) {
        const newToken = generateToken(refreshToken);
        decodedToken = verifyToken(newToken);
    }
    return yield User.findByIdAndDelete(id);
});
// Ocultar o mostrar usuario
export const hideUser = (id, isHidden, token, refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    let decodedToken;
    try {
        decodedToken = verifyToken(token);
    }
    catch (_e) {
        const newToken = generateToken(refreshToken);
        decodedToken = verifyToken(newToken);
    }
    return yield User.findByIdAndUpdate(id, { isHidden }, { new: true });
});
// Iniciar sesión con generación de tokens
export const loginUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User.findOne({ email });
    if (!user) {
        throw new Error('Usuario no encontrado');
    }
    // Verificar si el usuario está oculto
    if (user.isHidden) {
        throw new Error('Este usuario está oculto y no puede iniciar sesión');
    }
    // Comparar la contraseña ingresada con la almacenada
    const isCorrect = yield verified(password, user.password);
    if (!isCorrect) {
        throw new Error('Contraseña incorrecta');
    }
    // Generar tokens
    const token = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    return {
        token,
        refreshToken,
        user
    };
});
// Calcular edad a partir de la fecha de nacimiento
const calculateAge = (birthDate) => {
    if (!birthDate) {
        return null;
    }
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};
// Contar usuarios (solo los visibles)
export const getUserCount = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield User.countDocuments({ isHidden: false });
});
