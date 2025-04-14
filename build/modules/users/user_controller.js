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
import { saveMethod, createUser, getAllUsers, getUserById, updateUser, deleteUser, hideUser, loginUser } from '../users/user_service.js';
import { verifyRefreshToken, generateToken } from '../../utils/jwt.handle.js';
import User from '../users/user_models.js'; // Ensure this import exists
export const saveMethodHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = saveMethod();
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const createUserHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield createUser(req.body);
        res.status(201).json(data);
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json({ message: 'El correo electrónico no es válido o la contraseña es demasiado corta' });
        }
        else if (error.message.includes('ya están en uso')) {
            res.status(400).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Error interno en el servidor', error });
        }
    }
});
export const getAllUsersHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]) || '';
        const refreshToken = req.body.refreshToken || '';
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        if (![10, 25, 50].includes(pageSize)) {
            return res.status(400).json({ message: 'El tamaño de la lista debe ser 10, 25 o 50' });
        }
        const { users, totalUsers, totalPages, currentPage } = yield getAllUsers(page, pageSize, token, refreshToken);
        res.status(200).json({
            users,
            totalUsers,
            totalPages,
            currentPage,
        });
    }
    catch (error) {
        console.error('Error en getAllUsersHandler:', error);
        res.status(500).json({ message: 'Error interno en el servidor', error });
    }
});
export const getUserByIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const token = ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1]) || '';
        const refreshToken = req.body.refreshToken || '';
        const data = yield getUserById(req.params.id, token, refreshToken);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const updateUserHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const token = ((_c = req.headers.authorization) === null || _c === void 0 ? void 0 : _c.split(' ')[1]) || '';
        const refreshToken = req.body.refreshToken || '';
        const data = yield updateUser(req.params.id, req.body, token, refreshToken);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const deleteUserHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const token = ((_d = req.headers.authorization) === null || _d === void 0 ? void 0 : _d.split(' ')[1]) || '';
        const refreshToken = req.body.refreshToken || '';
        const data = yield deleteUser(req.params.id, token, refreshToken);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const hideUserHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const token = ((_e = req.headers.authorization) === null || _e === void 0 ? void 0 : _e.split(' ')[1]) || '';
        const refreshToken = req.body.refreshToken || '';
        const { id } = req.params;
        const { isHidden } = req.body;
        const user = yield hideUser(id, isHidden, token, refreshToken);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json({
            message: `Usuario ${isHidden ? 'ocultado' : 'visible'} correctamente`,
            user
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno en el servidor', error });
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
            user
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
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
        const newToken = generateToken(user.id, user.email);
        res.status(200).json({ token: newToken });
    }
    catch (error) {
        console.error('Error in refreshTokenHandler:', error);
        res.status(403).json({ message: 'Invalid refresh token' });
    }
});
