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
import bcrypt from 'bcrypt'; // ✅ Necesario para login seguro
import User from '../users/user_models.js';
// Guardar método (test)
export const saveMethod = () => {
    return 'Hola';
};
// ✅ Crear usuario con validaciones y bcrypt
export const createUser = (userData) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, birthDate, weight, city } = userData;
    if (!name || !email || !password || !birthDate || !weight || !city) {
        throw new Error('Todos los campos son obligatorios: name, email, password, birthDate, weight, city');
    }
    const existingUser = yield User.findOne({
        $or: [{ name }, { email }]
    });
    if (existingUser) {
        throw new Error('El nombre de usuario o el correo electrónico ya están en uso');
    }
    if (password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    const validWeights = ['Peso pluma', 'Peso medio', 'Peso pesado'];
    if (!validWeights.includes(weight)) {
        throw new Error(`El peso debe ser uno de los siguientes: ${validWeights.join(', ')}`);
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
    return user;
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
