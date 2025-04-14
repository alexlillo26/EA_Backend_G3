// src/services/user_service.ts
import User, { IUser } from '../users/user_models.js';
import { generateToken, generateRefreshToken, verifyToken } from '../../utils/jwt.handle.js';
import { encrypt, verified } from '../../utils/bcrypt.handle.js';

export const saveMethod = () => {
    return 'Hola';
};

// Crear usuario con validaciones
export const createUser = async (userData: IUser) => {
    // Verificar si el nombre de usuario o correo ya existen
    const existingUser = await User.findOne({
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
    userData.password = await encrypt(userData.password);

    const user = new User(userData);
    return await user.save();
};

// Obtener usuarios (solo los visibles)
export const getAllUsers = async (page: number = 1, pageSize: number = 10, token: string, refreshToken: string) => {
    let decodedToken;
    try {
        decodedToken = verifyToken(token);
    } catch {
        const newToken = generateToken(refreshToken);
        decodedToken = verifyToken(newToken);
    }

    const skip = (page - 1) * pageSize;
    const users = await User.find()
                            .sort({ isHidden: 1 }) // primero los visibles
                            .skip(skip)
                            .limit(pageSize);
    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / pageSize);
    return {
        users,
        totalUsers,
        totalPages,
        currentPage: page
   }; 
};

// Obtener un usuario por ID
export const getUserById = async (id: string, token: string, refreshToken: string) => {
    let decodedToken;
    try {
        decodedToken = verifyToken(token);
    } catch {
        const newToken = generateToken(refreshToken);
        decodedToken = verifyToken(newToken);
    }

    const user = await User.findById(id);
    if (user) {
        return { ...user.toObject(), age: calculateAge(user.birthDate) };
    }
    return null;
};

// Actualizar usuario
export const updateUser = async (id: string, updateData: Partial<IUser>, token: string, refreshToken: string) => {
    let decodedToken;
    try {
        decodedToken = verifyToken(token);
    } catch {
        const newToken = generateToken(refreshToken);
        decodedToken = verifyToken(newToken);
    }

    return await User.findByIdAndUpdate(id, updateData, { new: true });
};

// Eliminar usuario
export const deleteUser = async (id: string, token: string, refreshToken: string) => {
    let decodedToken;
    try {
        decodedToken = verifyToken(token);
    } catch {
        const newToken = generateToken(refreshToken);
        decodedToken = verifyToken(newToken);
    }

    return await User.findByIdAndDelete(id);
};

// Ocultar o mostrar usuario
export const hideUser = async (id: string, isHidden: boolean, token: string, refreshToken: string) => {
    let decodedToken;
    try {
        decodedToken = verifyToken(token);
    } catch {
        const newToken = generateToken(refreshToken);
        decodedToken = verifyToken(newToken);
    }

    return await User.findByIdAndUpdate(id, { isHidden }, { new: true });
};

// Iniciar sesión con generación de tokens
export const loginUser = async (email: string, password: string) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error('Usuario no encontrado');
    }

    // Verificar si el usuario está oculto
    if (user.isHidden) {
        throw new Error('Este usuario está oculto y no puede iniciar sesión');
    }

    // Comparar la contraseña ingresada con la almacenada
    const isCorrect = await verified(password, user.password);
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
};

// Calcular edad a partir de la fecha de nacimiento
const calculateAge = (birthDate: Date) => {
    if (!birthDate) {
        return null;
    }
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// Contar usuarios (solo los visibles)
export const getUserCount = async () => {
    return await User.countDocuments({ isHidden: false });
};