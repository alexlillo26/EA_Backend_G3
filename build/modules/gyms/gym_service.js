var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Gym from './gym_models.js';
export const addGym = (gymData) => __awaiter(void 0, void 0, void 0, function* () {
    // Verificar si el nombre, correo o lugar ya existen
    const existingGym = yield Gym.findOne({
        $or: [{ name: gymData.name }, { email: gymData.email }, { place: gymData.place }]
    });
    if (existingGym) {
        throw new Error('El nombre, correo electrónico o lugar del gimnasio ya están en uso');
    }
    // Eliminar el campo _id si está vacío
    if (gymData._id === "") {
        delete gymData._id;
    }
    const gym = new Gym(gymData);
    return yield gym.save();
});
export const getAllGyms = (page = 1, pageSize = 10) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * pageSize;
    const gyms = yield Gym.find()
        .sort({ isHidden: 1 })
        .skip(skip)
        .limit(pageSize);
    const totalGyms = yield Gym.countDocuments();
    const totalPages = Math.ceil(totalGyms / pageSize);
    return {
        gyms,
        totalGyms,
        totalPages,
        currentPage: page
    };
});
export const getGymById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Gym.findById(id);
});
export const updateGym = (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Gym.updateOne({ _id: id }, { $set: updateData });
});
export const deleteGym = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Gym.deleteOne({ _id: id });
});
export const hideGym = (id, isHidden) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Gym.updateOne({ _id: id }, { $set: { isHidden } });
});
export const loginGym = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Gym.findOne({ email, password });
});
