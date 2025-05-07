// src/services/user_service.ts
import bcrypt from 'bcrypt'; // ✅ Necesario para login seguro
import User, { IUser } from '../users/user_models.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.handle.js';

// Guardar método (test)
export const saveMethod = () => {
  return 'Hola';
};

// ✅ Crear usuario con validaciones y bcrypt
export const createUser = async (userData: IUser) => {
  const { name, email, password, birthDate, weight, city, phone } = userData;

  if (!name || !email || !password || !birthDate || !weight || !city || !phone) {
    throw new Error('Todos los campos son obligatorios: name, email, password, birthDate, weight, city, phone');
  }

  const existingUser = await User.findOne({
    $or: [{ name }, { email }, { phone }]
  });

  if (existingUser) {
    throw new Error('El nombre de usuario, el correo electrónico o el número de teléfono ya están en uso');
  }

  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/^[^\s@]+@(gmail|yahoo|hotmail|outlook|icloud|protonmail)\.(com|es|org|net|edu|gov|info|io|co|us|uk)$/i.test(email)) {
    throw new Error('El correo electrónico no es válido');
  }

  if (!/^\d{9}$/.test(phone)) {
    throw new Error('El número de teléfono debe tener 9 dígitos');
  }

  if (new Date(birthDate) > new Date()) {
    throw new Error('La fecha de nacimiento no puede ser futura');
  }

  const validWeights = ['Peso pluma', 'Peso medio', 'Peso pesado'];
  if (!validWeights.includes(weight)) {
    throw new Error(`El peso debe ser uno de los siguientes: ${validWeights.join(', ')}`);
  }

  const hashedPassword = await bcrypt.hash(password, 10); // ✅ Seguridad
  const newUser = new User({
    ...userData,
    password: hashedPassword
  });

  return await newUser.save();
};

// ✅ Obtener usuarios (ordenados por isHidden, paginados)
export const getAllUsers = async (page: number = 1, pageSize: number = 10) => {
  const skip = (page - 1) * pageSize;

  const users = await User.find()
    .sort({ isHidden: 1 })
    .skip(skip)
    .limit(pageSize);

  const totalUsers = await User.countDocuments();
  const totalPages = Math.ceil(totalUsers / pageSize);

  return {
    users,
    totalUsers,
    totalPages,
    currentPage: page
  };
};

// ✅ Obtener un usuario por ID
export const getUserById = async (id: string) => {
  const user = await User.findById(id);
  if (user) {
    return { ...user.toObject(), age: calculateAge(user.birthDate)};
  }
  return null;
};

// ✅ Actualizar usuario
export const updateUser = async (id: string, updateData: Partial<IUser>) => {
  return await User.findByIdAndUpdate(id, updateData, { new: true });
};

// ✅ Eliminar usuario
export const deleteUser = async (id: string) => {
  return await User.findByIdAndDelete(id);
};

// ✅ Ocultar o mostrar usuario
export const hideUser = async (id: string, isHidden: boolean) => {
  return await User.findByIdAndUpdate(id, { isHidden }, { new: true });
};

// ✅ Login seguro con bcrypt
export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  if (user.isHidden) {
    throw new Error('Este usuario está oculto y no puede iniciar sesión');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Contraseña incorrecta');
  }

  // Generate tokens
  const token = generateToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  return { token, refreshToken, user };
};

// ✅ Calcular edad
const calculateAge = (birthDate: Date) => {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// ✅ Contar usuarios visibles
export const getUserCount = async () => {
  return await User.countDocuments({ isHidden: false });
};
