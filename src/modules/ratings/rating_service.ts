import Rating from './rating_model.js';
import { Types } from 'mongoose';

// Crear un rating
export const createRating = async (ratingData: {
  combat: string;
  from: string;
  to: string;
  score: number;
  comment?: string;
}) => {
  const { combat, from, to, score, comment } = ratingData;

  if (!combat || !from || !to || !score) {
    throw new Error('Todos los campos obligatorios: combat, from, to, score');
  }
  if (score < 1 || score > 5) {
    throw new Error('La puntuación debe estar entre 1 y 5');
  }

  const newRating = new Rating({
    combat: new Types.ObjectId(combat),
    from: new Types.ObjectId(from),
    to: new Types.ObjectId(to),
    score,
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
export const updateRating = async (id: string, updateData: Partial<{ score: number; comment: string }>) => {
  if (updateData.score && (updateData.score < 1 || updateData.score > 5)) {
    throw new Error('La puntuación debe estar entre 1 y 5');
  }
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