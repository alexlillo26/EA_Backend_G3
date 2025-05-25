import express from 'express';
import {
  createRatingHandler,
  getAllRatingsHandler,
  getRatingByIdHandler,
  updateRatingHandler,
  deleteRatingHandler,
  hideRatingHandler
} from './rating_controller.js';
import { checkJwt } from '../../middleware/session.js';

const router = express.Router();

/**
 * @openapi
 * /api/ratings:
 *   post:
 *     summary: Crea un nuevo rating
 *     tags: [Ratings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [combat, from, to, score]
 *             properties:
 *               combat:
 *                 type: string
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *               score:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rating creado exitosamente
 */
router.post('/ratings', checkJwt, createRatingHandler);

/**
 * @openapi
 * /api/ratings:
 *   get:
 *     summary: Obtiene todos los ratings (paginados)
 *     tags: [Ratings]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: pageSize
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de ratings
 */
router.get('/ratings', getAllRatingsHandler);

/**
 * @openapi
 * /api/ratings/{id}:
 *   get:
 *     summary: Obtiene un rating por ID
 *     tags: [Ratings]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rating encontrado
 *       404:
 *         description: Rating no encontrado
 */
router.get('/ratings/:id', getRatingByIdHandler);

/**
 * @openapi
 * /api/ratings/{id}:
 *   put:
 *     summary: Actualiza un rating por ID
 *     tags: [Ratings]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rating actualizado
 *       404:
 *         description: Rating no encontrado
 */
router.put('/ratings/:id', checkJwt, updateRatingHandler);

/**
 * @openapi
 * /api/ratings/{id}:
 *   delete:
 *     summary: Elimina un rating por ID
 *     tags: [Ratings]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rating eliminado
 *       404:
 *         description: Rating no encontrado
 */
router.delete('/ratings/:id', checkJwt, deleteRatingHandler);

/**
 * @openapi
 * /api/ratings/{id}/oculto:
 *   put:
 *     summary: Cambia la visibilidad de un rating por ID
 *     tags: [Ratings]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isHidden:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Rating actualizado exitosamente
 *       404:
 *         description: Rating no encontrado
 */
router.put('/ratings/:id/oculto', checkJwt, hideRatingHandler);

export default router;