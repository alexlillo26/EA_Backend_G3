var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { addGym, deleteGym, getAllGyms, getGymById, updateGym, hideGym, loginGym } from './gym_service.js';
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
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        if (![10, 25, 50].includes(pageSize)) {
            return res.status(400).json({ message: 'El tamaño de la lista debe ser 10, 25 o 50' });
        }
        const { gyms, totalGyms, totalPages, currentPage } = yield getAllGyms(page, pageSize);
        res.status(200).json({ gyms, totalGyms, totalPages, currentPage });
    }
    catch (error) {
        console.error('Error en getAllGymsHandler:', error);
        res.status(500).json({ message: 'Error interno del servidor: ', error });
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
        const gym = yield loginGym(email, password);
        if (!gym) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json({ message: 'Inicio de sesión completado', gym });
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno en el servidor', error });
    }
});
