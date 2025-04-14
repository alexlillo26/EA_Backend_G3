var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from 'mongoose';
import { encrypt } from '../../utils/bcrypt.handle.js';
const gymSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true // Asegura que el nombre del gimnasio sea único
    },
    place: {
        type: String,
        required: true,
        unique: true // Asegura que la ubicación del gimnasio sea única
    },
    price: {
        type: Number,
        required: true
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@(gmail|yahoo|hotmail|outlook|icloud|protonmail)\.(com|es|org|net|edu|gov|info|io|co|us|uk)$/i // Valida proveedores y dominios comunes
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});
gymSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified('password')) {
            this.password = yield encrypt(this.password);
        }
        next();
    });
});
const Gym = mongoose.model('Gym', gymSchema);
export default Gym;
