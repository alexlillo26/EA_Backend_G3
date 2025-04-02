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
import { saveMethod, createCombat, getAllCombats, getCombatById, updateCombat, deleteCombat, getBoxersByCombatId, hideCombat } from '../combats/combat_service.js';
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
