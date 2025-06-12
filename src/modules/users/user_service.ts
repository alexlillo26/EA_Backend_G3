// src/services/user_service.ts
import bcrypt from 'bcryptjs'; // ✅ Necesario para login seguro
import User, { IUser } from '../users/user_models.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.handle.js';

// Guardar método (test)
export const saveMethod = () => {
  return 'Hola';
};

// ✅ Crear usuario con validaciones y bcrypt
export const createUser = async (userData: IUser & {confirmPassword: string}) => {
  const { name, email, password, confirmPassword, birthDate, weight, city, phone, gender } = userData;

  // En user_service.ts, dentro de createUser
if (!name || !email || !password || !confirmPassword || !birthDate || !weight || !city || !phone || !gender) {
  throw new Error('Todos los campos son obligatorios: name, email, password, confirmPassword, birthDate, weight, city, phone, gender'); // <--- MENSAJE ACTUALIZADO
}
  const existingUser = await User.findOne({
    $or: [{ name }, { email }, { phone }]
  });

  if (existingUser) {
    throw new Error('El nombre de usuario, el correo electrónico o el número de teléfono ya están en uso');
  }

  if (password !== confirmPassword) {
    throw new Error('Las contraseñas no coinciden');
  }

  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
    throw new Error('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un caracter especial');
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

  const validGenders = ['Hombre', 'Mujer'];
  if(!validGenders.includes(gender)) {
    throw new Error(`El género debe ser uno de los siguientes: ${validGenders.join(', ')}`);
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
    .limit(pageSize)
    .lean()
    .then(users => users.map(user => ({
      ...user,
      id: user._id?.toString(),
    })));

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
    return { ...user.toObject(), age: calculateAge(user.birthDate), id: user._id.toString() };
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
  const token = generateToken(user.id, user.email, user.name);
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



// usuario del motor de búsqueda
export const searchUsers = async (city?: string, weight?: string) => {
  try {
    let query: any = {};

    if (city) {
      query.city = new RegExp(city, 'i'); // Búsqueda de ciudades sin distinción entre mayúsculas y minúsculas
    }
    if (weight && ['Peso pluma', 'Peso medio', 'Peso pesado'].includes(weight)) {
      query.weight = weight;
    }

    console.log('Search query:', query); // Debug log
    // Si no se proporciona ciudad ni peso, devolver todos los usuarios
    const users = await User.find(query)
      .select('name email city weight') // conserva _id
      .sort({ name: 1 })
      .lean()
      .then(users => users.map(user => ({
        ...user,
        id: user._id?.toString(),
      })));
    return users;
  } catch (error) {
    console.error('Error in searchUsers:', error);
    // Devolver una matriz vacía en lugar de lanzar una excepción evita que los 500
    return [];
  }

};

export const saveFcmToken = async (userId: string, fcmToken: string) => {
  if (!userId || !fcmToken) {
    throw new Error('El ID de usuario y el token FCM son requeridos.');
  }

  // Usamos findByIdAndUpdate para actualizar solo el campo fcmToken
  // sin disparar las validaciones de otros campos del documento.
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { fcmToken: fcmToken }, // El campo que queremos actualizar
    { new: true } // Devuelve el documento actualizado
  );

  if (!updatedUser) {
    throw new Error('Usuario no encontrado al guardar token.');
  }

  console.log(`[DEBUG] Token para ${updatedUser.name} actualizado en DB.`);
  return updatedUser;
};