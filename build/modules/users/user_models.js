import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true // Asegura que el nombre de usuario sea único
    },
    birthDate: {
        type: Date,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@(gmail|yahoo|hotmail|outlook|icloud|protonmail)\.(com|es|org|net|edu|gov|info|io|co|us|uk)$/i // Valida proveedores y dominios comunes
    },
    password: {
        type: String,
        required: true,
        minlength: 8 // Asegura que la contraseña tenga al menos 8 caracteres
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
        sparse: true, // Permite valores nulos
    }
});
const User = mongoose.model('User', userSchema);
export default User;
