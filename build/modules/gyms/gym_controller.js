var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { addGym, deleteGym, getAllGyms, getGymById, updateGym, hideGym, loginGym, refreshGymToken } from './gym_service.js';
import Gym from './gym_models.js'; // Added missing import
export const addGymHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("ADD GYM!!!!");
    try {
        const gym = yield addGym(req.body);
        res.status(201).json(gym);
    }
    catch (error) {
        console.log(error);
        if (error.name === 'ValidationError') {
            res.status(400).json({ message: 'El correo electrónico no es válido' });
        }
        else if (error.message.includes('ya están en uso')) {
            res.status(400).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Error interno en el servidor', error });
        }
    }
});
export const getAllGymsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        if (![10, 25, 50].includes(pageSize)) {
            return res.status(400).json({ message: 'El tamaño de la lista debe ser 10, 25 o 50' });
        }
        const { gyms, totalGyms, totalPages, currentPage } = yield getAllGyms(page, pageSize);
        res.status(200).json({ gyms, totalGyms, totalPages, currentPage });
    }
    catch (error) {
        console.error('Error en getAllGymsHandler:', error);
        res.status(500).json({ message: error.message });
    }
});
export const getGymByIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gym = yield getGymById(req.params.id);
        res.json(gym);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const updateGymHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gym = yield updateGym(req.params.id, req.body);
        res.json(gym);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const deleteGymHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gym = yield deleteGym(req.params.id);
        res.json(gym);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const hideGymHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { isHidden } = req.body;
        const gym = yield hideGym(id, isHidden);
        if (!gym) {
            res.status(404).json({ message: 'Gimnasio no encontrado' });
        }
        res.status(200).json({ message: `Gimnasio ${isHidden ? 'oculto' : 'visible'}`, gym });
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno en el servidor', error });
    }
});
export const loginGymHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const { token, refreshToken, gym } = yield loginGym(email, password);
        res.status(200).json({
            message: 'Inicio de sesión completado',
            token,
            refreshToken,
            gym
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const refreshGymTokenHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token es requerido' });
        }
        const newToken = yield refreshGymToken(refreshToken); // Fixed: Ensure refreshToken is passed correctly
        res.status(200).json({ token: newToken });
    }
    catch (error) {
        res.status(403).json({ message: 'Refresh token inválido' });
    }
});
export const getCurrentGymHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 日志方便排查
        console.log('Received token:', req.headers.authorization);
        console.log('Decoded user:', req.user);
        const gymId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!gymId) {
            return res.status(401).json({
                error: 'No se encontró el ID del gimnasio en el token'
            });
        }
        const gym = yield Gym.findById(gymId)
            .select('-password')
            .lean();
        if (!gym) {
            return res.status(404).json({
                error: 'Gimnasio no encontrado'
            });
        }
        res.status(200).json(gym);
    }
    catch (error) {
        console.error('Error en getCurrentGymHandler:', error);
        res.status(500).json({
            error: 'Error al obtener información del gimnasio'
        });
    }
});
