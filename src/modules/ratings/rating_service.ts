import Rating from './rating_model.js';
import { Types } from 'mongoose';

// Crear un rating
export const createRating = async (ratingData: {
  combat: string;
  from: string;
  to: string;
  punctuality: number;
  attitude: number;
  technique: number;
  intensity: number;
  sportmanship: number;
  comment?: string;
}) => {
  const { combat, from, to, punctuality, attitude, technique, intensity, sportmanship, comment } = ratingData;

  if (!combat || !from || !to || !punctuality || !attitude || !technique || !intensity || !sportmanship) {
    throw new Error('Todos los campos obligatorios: combat, from, to, score');
  }
  if ([punctuality, attitude, technique, intensity, sportmanship].some(value => value < 1 || value > 5)) {
  throw new Error('Cada puntuación debe estar entre 1 y 5');
  }

  const newRating = new Rating({
    combat: new Types.ObjectId(combat),
    from: new Types.ObjectId(from),
    to: new Types.ObjectId(to),
    punctuality,
    attitude,
    technique,
    intensity,
    sportmanship,
    comment,
    isHidden: false,
  });

  return await newRating.save();
};

// Obtener todos los ratings (paginados, ordenados por isHidden)
export const getAllRatings = async (page: number = 1, pageSize: number = 10) => {
  const skip = (page - 1) * pageSize;
  const ratings = await Rating.find()
    .sort({ isHidden: 1 })
    .skip(skip)
    .limit(pageSize)
    .populate('from to combat')
    .lean();

  const totalRatings = await Rating.countDocuments();
  const totalPages = Math.ceil(totalRatings / pageSize);

  return {
    ratings,
    totalRatings,
    totalPages,
    currentPage: page,
  };
};

// Obtener un rating por ID
export const getRatingById = async (id: string) => {
  return await Rating.findById(id).populate('from to combat').lean();
};

// Editar un rating
export const updateRating = async (
  id: string,
  updateData: Partial<{
    punctuality: number;
    attitude: number;
    technique: number;
    intensity: number;
    sportmanship: number;
    comment: string;
  }>
) => {
  // Lista de campos a validar
  type RatingNumericFields = 'punctuality' | 'attitude' | 'technique' | 'intensity' | 'sportmanship';

  const ratingFields: RatingNumericFields[] = [
    'punctuality',
    'attitude',
    'technique',
    'intensity',
    'sportmanship'
  ];

  ratingFields.forEach(field => {
    const value = updateData[field];
    if (value !== undefined && (value < 1 || value > 5)) {
      throw new Error(`La puntuación para ${field} debe estar entre 1 y 5`);
    }
  });

   return await Rating.findByIdAndUpdate(id, updateData, { new: true });
};

// Eliminar un rating
export const deleteRating = async (id: string) => {
  return await Rating.findByIdAndDelete(id);
};

// Ocultar o mostrar un rating
export const hideRating = async (id: string, isHidden: boolean) => {
  return await Rating.findByIdAndUpdate(id, { isHidden }, { new: true });
};

// Obtener todos los ratings de un usuario específico
export const getRatingsForUser = async (userId: string, page: number = 1, pageSize: number = 10) => {
  const skip = (page - 1) * pageSize;

  // Buscar ratings donde el usuario sea el destinatario (campo `to`)
  const ratings = await Rating.find({ to: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 }) // Ordenar por fecha de creación (más recientes primero)
    .skip(skip)
    .limit(pageSize)
    .populate('from combat') // Popular los campos `from` y `combat` para más detalles
    .lean();

  // Contar el total de ratings para el usuario
  const totalRatings = await Rating.countDocuments({ to: new Types.ObjectId(userId) });
  const totalPages = Math.ceil(totalRatings / pageSize);

  return {
    ratings,
    totalRatings,
    totalPages,
    currentPage: page,
  };
};