import {
  createRating,
  getAllRatings,
  getRatingById,
  updateRating,
  deleteRating,
  hideRating
} from './rating_service.js';
import express, { Request, Response } from 'express';

// Crear un rating
export const createRatingHandler = async (req: Request, res: Response) => {
  try {
    const data = await createRating(req.body);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: error?.message });
  }
};

// Obtener todos los ratings (paginados)
export const getAllRatingsHandler = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const result = await getAllRatings(page, pageSize);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Error interno en el servidor', error: error?.message });
  }
};

// Obtener un rating por ID
export const getRatingByIdHandler = async (req: Request, res: Response) => {
  try {
    const data = await getRatingById(req.params.id);
    if (!data) {
      return res.status(404).json({ message: 'Rating no encontrado' });
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error?.message });
  }
};

// Editar un rating
export const updateRatingHandler = async (req: Request, res: Response) => {
  try {
    const updatedRating = await updateRating(req.params.id, req.body);
    if (!updatedRating) {
      return res.status(404).json({ message: 'Rating no encontrado' });
    }
    res.status(200).json(updatedRating);
  } catch (error: any) {
    res.status(400).json({ message: error?.message });
  }
};

// Eliminar un rating
export const deleteRatingHandler = async (req: Request, res: Response) => {
  try {
    const deleted = await deleteRating(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Rating no encontrado' });
    }
    res.status(200).json({ message: 'Rating eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: error?.message });
  }
};

// Ocultar o mostrar un rating
export const hideRatingHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isHidden } = req.body;
    const rating = await hideRating(id, isHidden);
    if (!rating) {
      return res.status(404).json({ message: 'Rating no encontrado' });
    }
    res.status(200).json({
      message: `Rating ${isHidden ? 'ocultado' : 'visible'} correctamente`,
      rating
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error interno en el servidor', error: error?.message });
  }
};