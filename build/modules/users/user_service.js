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
import mongoose from 'mongoose';
// Guardar método (test)
export const saveMethod = () => {
    return 'Hola';
};
// ✅ Crear usuario con validaciones y bcrypt
export const createUser = (userData) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, confirmPassword, birthDate, weight, city, phone, gender } = userData;
    // En user_service.ts, dentro de createUser
    if (!name || !email || !password || !confirmPassword || !birthDate || !weight || !city || !phone || !gender) {
        throw new Error('Todos los campos son obligatorios: name, email, password, confirmPassword, birthDate, weight, city, phone, gender'); // <--- MENSAJE ACTUALIZADO
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
        .limit(pageSize)
        .lean()
        .then(users => users.map(user => {
        var _a;
        return (Object.assign(Object.assign({}, user), { id: (_a = user._id) === null || _a === void 0 ? void 0 : _a.toString() }));
    }));
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
        return Object.assign(Object.assign({}, user.toObject()), { age: calculateAge(user.birthDate), id: user._id.toString() });
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
export const searchUsers = (city, weight, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = {};
        // Filtro por ciudad (ignorar mayúsculas/minúsculas y espacios adicionales)
        if (city && city.trim() !== '') {
            query.city = { $regex: new RegExp(city.trim(), 'i') }; // Coincidencia flexible
        }
        // Filtro por peso (asegúrate de que el valor sea válido)
        if (weight && weight.trim() !== '') {
            query.weight = weight.trim(); // Coincidencia exacta
        }
        console.log('Search query:', query); // Log 1: Verifica cómo se construye el objeto de consulta
        const users = yield User.find(query)
            .select('name city weight followers') // Incluye `followers` para calcular `isFollowed`
            .sort({ name: 1 })
            .lean();
        console.log('Raw users from DB:', users); // Log 2: Verifica los datos devueltos directamente por la base de datos
        const updatedUsers = users.map(user => {
            var _a;
            const isFollowed = Array.isArray(user.followers) && user.followers.some((followerId) => followerId.toString() === currentUserId);
            console.log(`User: ${user.name}, isFollowed: ${isFollowed}`); // Log 3: Verifica el estado de isFollowed para cada usuario
            return Object.assign(Object.assign({}, user), { id: (_a = user._id) === null || _a === void 0 ? void 0 : _a.toString(), isFollowed });
        });
        console.log('Search results with isFollowed:', updatedUsers); // Log 4: Verifica los resultados finales después de la transformación
        return updatedUsers;
    }
    catch (error) {
        console.error('Error in searchUsers:', error); // Log 5: Captura cualquier error en la función
        return [];
    }
});
export const followUser = (currentUserId, targetUserId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose.Types.ObjectId.isValid(currentUserId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
        throw new Error('IDs de usuario no válidos');
    }
    if (currentUserId === targetUserId) {
        throw new Error('No puedes seguirte a ti mismo');
    }
    const currentUser = yield User.findById(currentUserId);
    const targetUser = yield User.findById(targetUserId);
    if (!currentUser || !targetUser) {
        throw new Error('Usuario no encontrado');
    }
    if (currentUser.following.includes(new mongoose.Types.ObjectId(targetUserId))) {
        throw new Error('Ya sigues a este usuario');
    }
    currentUser.following.push(new mongoose.Types.ObjectId(targetUserId));
    targetUser.followers.push(new mongoose.Types.ObjectId(currentUserId));
    yield currentUser.save();
    yield targetUser.save();
    return { message: 'Usuario seguido exitosamente' };
});
export const unfollowUser = (currentUserId, targetUserId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose.Types.ObjectId.isValid(currentUserId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
        throw new Error('IDs de usuario no válidos');
    }
    const currentUser = yield User.findById(currentUserId);
    const targetUser = yield User.findById(targetUserId);
    if (!currentUser || !targetUser) {
        throw new Error('Usuario no encontrado');
    }
    if (!currentUser.following.includes(new mongoose.Types.ObjectId(targetUserId))) {
        throw new Error('No sigues a este usuario');
    }
    currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
    yield currentUser.save();
    yield targetUser.save();
    return { message: 'Usuario dejado de seguir exitosamente' };
});
