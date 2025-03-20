import mongoose from 'mongoose';

export interface IGym {
    _id?: string;    
    name: string;
    email: string;
    phone: string;
    place: string;
    price: number;
    password: string;
    isHidden: boolean;
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
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Valida la estructura del correo electrónico
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

const Gym = mongoose.model('Gym', gymSchema);
export default Gym;