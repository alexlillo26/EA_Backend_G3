import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    birthDate: {
        type: Date,
        required: true,
        default: new Date("2017-01-01T00:00:00.000Z")
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@(gmail|yahoo|hotmail|outlook|icloud|protonmail)\.(com|es|org|net|edu|gov|info|io|co|us|uk)$/i
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    weight: {
        type: String,
        enum: ['Peso pluma', 'Peso medio', 'Peso pesado'],
        required: true
    },
    city: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: null
    },
});
const User = mongoose.model('User', userSchema);
export default User;
