import mongoose from "mongoose";

export interface IUser {
  _id?: string; // ID opcional para permitir la creación de nuevos usuarios sin especificar un ID
  name: string;
  birthDate: Date;
  email: string;
  password: string;
  isAdmin: boolean;
  isHidden: boolean;
  googleId?: string; 
  weight: string; 
  city: string;  
  phone: string; 
  gender: string;
  profilePicture?: string; // URL de la imagen de perfil
}

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
    required: false,
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
    required: false
  },
  city: { 
    type: String,
    required: false
  },
  phone: { 
    type: String,
    required: false
  },
  profilePicture: { 
    type: String,
    default: null
  },
  gender:{
    type: String,
    enum: ['Hombre', 'Mujer'],
    required: true
  }
});

const User = mongoose.model('User', userSchema);
export default User;
