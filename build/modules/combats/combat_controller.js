var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// src/controllers/_controller.ts
import { saveMethod, createCombat, getAllCombats, getCombatById, updateCombat, deleteCombat, getBoxersByCombatId, hideCombat, getCombatsByGymId } from '../combats/combat_service.js';
import Combat from './combat_models.js';
import mongoose from 'mongoose';
export const saveMethodHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const combat = saveMethod();
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const createCombatHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const combat = yield createCombat(req.body);
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const getAllCombatsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        if (![10, 25, 50].includes(pageSize)) {
            return res.status(400).json({ message: 'El tamaño de la lista debe ser 10, 25 o 50' });
        }
        const combats = yield getAllCombats(page, pageSize);
        res.status(200).json(combats);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const getCombatByIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const combat = yield getCombatById(req.params.id);
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const updateCombatHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const combat = yield updateCombat(req.params.id, req.body);
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const deleteCombatHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const combat = yield deleteCombat(req.params.id);
        res.json(combat);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const getBoxersByCombatIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const boxers = yield getBoxersByCombatId(req.params.id);
        res.json(boxers);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const hideCombatHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { isHidden } = req.body;
        const combat = yield hideCombat(id, isHidden);
        if (!combat) {
            res.status(404).json({ message: 'Combate no encontrado' });
        }
        res.status(200).json({ message: `Combate ${isHidden ? 'oculto' : 'visible'}`, combat });
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno en el servidor', error });
    }
});
export const getCombatsByBoxerIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Solicitud recibida para el boxeador: ${req.params.boxerId}`);
    console.log(`Query Params - Página: ${req.query.page}, Tamaño: ${req.query.pageSize}`);
    try {
        const { boxerId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const boxerObjectId = new mongoose.Types.ObjectId(boxerId);
        const totalCombats = yield Combat.countDocuments({ boxers: boxerId });
        const totalPages = Math.ceil(totalCombats / pageSize);
        const combats = yield Combat.find({ boxers: new mongoose.Types.ObjectId(boxerId) })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('gym') // opcional, si gym es un ID
            .populate('boxers'); // opcional, si boxers son IDs
        if (!combats || combats.length === 0) {
            return res.status(404).json({ message: 'No se encontraron combates para este usuario' });
        }
        res.status(200).json({ combats, totalPages });
    }
    catch (error) {
        console.error('Error al obtener combates:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});
export const getCombatsByGymIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gymId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const result = yield getCombatsByGymId(gymId, page, pageSize);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
