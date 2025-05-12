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
import bcrypt from 'bcryptjs'; // ✅ Necesario para login seguro
import User from '../users/user_models.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.handle.js';
// Guardar método (test)
export const saveMethod = () => {
    return 'Hola';
};
// ✅ Crear usuario con validaciones y bcrypt
export const createUser = (userData) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, confirmPassword, birthDate, weight, city, phone, gender } = userData;
    if (!name || !email || !password || !confirmPassword || !birthDate || !weight || !city || !phone || !gender) {
        throw new Error('Todos los campos son obligatorios: name, email, password, birthDate, weight, city, phone');
    }
    const existingUser = yield User.findOne({
        $or: [{ name }, { email }, { phone }]
    });
    if (existingUser) {
        throw new Error('El nombre de usuario, el correo electrónico o el número de teléfono ya están en uso');
    }
    if (password !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
    }
    if (password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
        throw new Error('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un caracter especial');
    }
    if (!/^[^\s@]+@(gmail|yahoo|hotmail|outlook|icloud|protonmail)\.(com|es|org|net|edu|gov|info|io|co|us|uk)$/i.test(email)) {
        throw new Error('El correo electrónico no es válido');
    }
    if (!/^\d{9}$/.test(phone)) {
        throw new Error('El número de teléfono debe tener 9 dígitos');
    }
    if (new Date(birthDate) > new Date()) {
        throw new Error('La fecha de nacimiento no puede ser futura');
    }
    const validWeights = ['Peso pluma', 'Peso medio', 'Peso pesado'];
    if (!validWeights.includes(weight)) {
        throw new Error(`El peso debe ser uno de los siguientes: ${validWeights.join(', ')}`);
    }
    const validGenders = ['Hombre', 'Mujer'];
    if (!validGenders.includes(gender)) {
        throw new Error(`El género debe ser uno de los siguientes: ${validGenders.join(', ')}`);
    }
    const hashedPassword = yield bcrypt.hash(password, 10); // ✅ Seguridad
    const newUser = new User(Object.assign(Object.assign({}, userData), { password: hashedPassword }));
    return yield newUser.save();
});
// ✅ Obtener usuarios (ordenados por isHidden, paginados)
export const getAllUsers = (page = 1, pageSize = 10) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * pageSize;
    const users = yield User.find()
        .sort({ isHidden: 1 })
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
// ✅ Obtener un usuario por ID
export const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User.findById(id);
    if (user) {
        return Object.assign(Object.assign({}, user.toObject()), { age: calculateAge(user.birthDate) });
    }
    return null;
});
// ✅ Actualizar usuario
export const updateUser = (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    return yield User.findByIdAndUpdate(id, updateData, { new: true });
});
// ✅ Eliminar usuario
export const deleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield User.findByIdAndDelete(id);
});
// ✅ Ocultar o mostrar usuario
export const hideUser = (id, isHidden) => __awaiter(void 0, void 0, void 0, function* () {
    return yield User.findByIdAndUpdate(id, { isHidden }, { new: true });
});
// ✅ Login seguro con bcrypt
export const loginUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User.findOne({ email });
    if (!user) {
        throw new Error('Usuario no encontrado');
    }
    if (user.isHidden) {
        throw new Error('Este usuario está oculto y no puede iniciar sesión');
    }
    const isPasswordValid = yield bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Contraseña incorrecta');
    }
    // Generate tokens
    const token = generateToken(user.id, user.email, user.name);
    const refreshToken = generateRefreshToken(user.id);
    return { token, refreshToken, user };
});
// ✅ Calcular edad
const calculateAge = (birthDate) => {
    if (!birthDate)
        return null;
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};
// ✅ Contar usuarios visibles
export const getUserCount = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield User.countDocuments({ isHidden: false });
});
// usuario del motor de búsqueda
export const searchUsers = (city, weight) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = {};
        if (city) {
            query.city = new RegExp(city, 'i'); // Búsqueda de ciudades sin distinción entre mayúsculas y minúsculas
        }
        if (weight && ['Peso pluma', 'Peso medio', 'Peso pesado'].includes(weight)) {
            query.weight = weight;
        }
        console.log('Search query:', query); // Debug log
        // Si no se proporciona ciudad ni peso, devolver todos los usuarios
        const users = yield User.find(query)
            .select('name city weight -_id') // Devuelve sólo los campos necesarios, excluyendo _id
            .sort({ name: 1 })
            .lean(); // lean() 返回 plain JS 对象，防止 Mongoose bug
        return users;
    }
    catch (error) {
        console.error('Error in searchUsers:', error);
        // 返回空数组而不是抛出异常，防止 500
        return [];
    }
});
