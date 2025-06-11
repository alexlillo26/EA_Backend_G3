var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// src/controllers/user_controller.ts
import { saveMethod, createUser, getAllUsers, getUserById, updateUser, deleteUser, hideUser, loginUser, searchUsers, updateUserBoxingVideo } from '../users/user_service.js';
import { verifyRefreshToken, generateToken } from '../../utils/jwt.handle.js';
import User from '../users/user_models.js'; // Ensure this import exists
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';
import { generateUserStatistics } from '../combats/combat_service.js';

export const saveMethodHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = saveMethod();
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const createUserHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield createUser(req.body);
        res.status(201).json(data);
    }
    catch (error) {
        console.error('Error in createUserHandler:', error);
        if (error.name === 'ValidationError') {
            res.status(400).json({ message: 'El correo electrónico no es válido o la contraseña es demasiado corta' });
        }
        else if ((error === null || error === void 0 ? void 0 : error.message) && error.message.includes('ya están en uso')) {
            res.status(400).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Error interno en el servidor', error: error === null || error === void 0 ? void 0 : error.message });
        }
    }
});
export const getAllUsersHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        if (![10, 25, 50].includes(pageSize)) {
            return res.status(400).json({ message: 'El tamaño de la lista debe ser 10, 25 o 50' });
        }
        const { users, totalUsers, totalPages, currentPage } = yield getAllUsers(page, pageSize);
        res.status(200).json({
            users,
            totalUsers,
            totalPages,
            currentPage,
        });
    }
    catch (error) {
        console.error('Error en getAllUsersHandler:', error);
        res.status(500).json({ message: 'Error interno en el servidor', error: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const getUserByIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield getUserById(req.params.id);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const updateUserHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let profilePictureUrl = undefined;
        if (req.file) {
            const file = req.file;
            profilePictureUrl = yield new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({ folder: 'users' }, (error, result) => {
                    if (error)
                        return reject(error);
                    resolve((result === null || result === void 0 ? void 0 : result.secure_url) || '');
                });
                stream.end(file.buffer);
            });
        }
        const updateData = Object.assign({}, req.body);
        if (profilePictureUrl)
            updateData.profilePicture = profilePictureUrl;
        const updatedUser = yield updateUser(req.params.id, updateData);
        res.status(200).json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const deleteUserHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield deleteUser(req.params.id);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const hideUserHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { isHidden } = req.body;
        const user = yield hideUser(id, isHidden);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json({
            message: `Usuario ${isHidden ? 'ocultado' : 'visible'} correctamente`,
            user
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno en el servidor', error: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const loginUserHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const { token, refreshToken, user } = yield loginUser(email, password);
        res.status(200).json({
            message: 'Inicio de sesión completado',
            token,
            refreshToken,
            userId: user._id,
            username: user.name,
        });
    }
    catch (error) {
        console.error('Error en loginUserHandler:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const refreshTokenHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }
        const decoded = verifyRefreshToken(refreshToken);
        const user = yield User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const newToken = generateToken(user.id, user.email, user.name); // Added username argument
        res.status(200).json({ token: newToken });
    }
    catch (error) {
        console.error('Error in refreshTokenHandler:', error);
        res.status(403).json({ message: 'Invalid refresh token', error: error === null || error === void 0 ? void 0 : error.message });
    }
});
export const searchUsersHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Search params:', req.query);
        const { city, weight } = req.query;
        const users = yield searchUsers(city, weight);
        console.log('Search results:', users);
        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar usuarios',
            error: error === null || error === void 0 ? void 0 : error.message
        });
    }
});

export const updateUserBoxingVideoHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha enviado ningún video.' });
        }
        const file = req.file;
        // Sube el video a Cloudinary
        const videoUrl = yield new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'users/videos', resource_type: 'video' }, (error, result) => {
                if (error)
                    return reject(error);
                resolve((result === null || result === void 0 ? void 0 : result.secure_url) || '');
            });
            stream.end(file.buffer);
        });
        const updatedUser = yield updateUserBoxingVideo(req.params.id, videoUrl);
        res.status(200).json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ message: error === null || error === void 0 ? void 0 : error.message });
};
  
export const getUserStatisticsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { boxerId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(boxerId)) {
            return res.status(400).json({ message: 'ID de boxeador inválido.' });
        }
        const statistics = yield generateUserStatistics(boxerId);
        res.status(200).json(statistics);
    }
    catch (error) {
        console.error(`Error en getUserStatisticsHandler: ${error.message}`);
        res.status(500).json({ message: 'Error interno del servidor al generar estadísticas.' });

    }
});
