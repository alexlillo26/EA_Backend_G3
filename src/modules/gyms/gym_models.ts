import mongoose from 'mongoose';

export interface IGym {
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
        required: true
    },
    place: {
        type: String,
        required: true
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
        required: true
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
