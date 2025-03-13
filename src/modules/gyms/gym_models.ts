import mongoose from 'mongoose';

export interface IGym {
    name: string;
    place: string;
    price: number;
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
    }

});


const Gym = mongoose.model('Gym', gymSchema);
export default Gym;
