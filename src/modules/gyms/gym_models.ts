import mongoose from 'mongoose';
import { encrypt } from '../../utils/bcrypt.handle.js';

export interface IGym {
    _id?: string;    
    name: string;
    email: string;
    phone: string;
    place: string;
    price: number;
    password: string;
    isHidden?: boolean;
    googleId?: string;
}

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
        unique: true, // Asegura que el correo electrónico sea único
        match: /^[^\s@]+@(gmail|yahoo|hotmail|outlook|icloud|protonmail)\.(com|es|org|net|edu|gov|info|io|co|us|uk)$/i // Valida proveedores y dominios comunes
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true, // Permite valores nulos
    }
});

gymSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await encrypt(this.password);
    }
    next();
});

const Gym = mongoose.model('Gym', gymSchema);
export default Gym;