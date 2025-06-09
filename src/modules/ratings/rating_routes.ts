import express from 'express';
import {
  createRatingHandler,
  getAllRatingsHandler,
  getRatingByIdHandler,
  updateRatingHandler,
  deleteRatingHandler,
  hideRatingHandler,
  getRatingsForUserHandler
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
 *             required: [combat, from, to, punctuality, attitude, technique, intensity, sportmanship]
 *             properties:
 *               combat:
 *                 type: string
 *                 description: ID del combate asociado
 *               from:
 *                 type: string
 *                 description: ID del usuario que realiza la valoración
 *               to:
 *                 type: string
 *                 description: ID del usuario que recibe la valoración
 *               punctuality:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Valoración de la puntualidad (1-5 estrellas)
 *               attitude:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Valoración de la actitud (1-5 estrellas)
 *               technique:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Valoración de la técnica (1-5 estrellas)
 *               intensity:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Valoración de la intensidad (1-5 estrellas)
 *               sportmanship:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Valoración de la deportividad (1-5 estrellas)
 *               comment:
 *                 type: string
 *                 description: Comentario adicional (opcional)
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
 *         description: Número de página para la paginación
 *       - name: pageSize
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Tamaño de página para la paginación
 *     responses:
 *       200:
 *         description: Lista de ratings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ratings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       from:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       combat:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           level:
 *                             type: string
 *                       punctuality:
 *                         type: number
 *                         description: Valoración de la puntualidad (1-5)
 *                       attitude:
 *                         type: number
 *                         description: Valoración de la actitud (1-5)
 *                       technique:
 *                         type: number
 *                         description: Valoración de la técnica (1-5)
 *                       intensity:
 *                         type: number
 *                         description: Valoración de la intensidad (1-5)
 *                       sportmanship:
 *                         type: number
 *                         description: Valoración de la deportividad (1-5)
 *                       comment:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 totalRatings:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
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

/**
 * @openapi
 * /api/ratings/user/{userId}:
 *   get:
 *     summary: Obtiene todos los ratings de un usuario específico
 *     tags: [Ratings]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           description: ID del usuario
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *           description: Número de página para la paginación
 *       - name: pageSize
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *           description: Tamaño de página para la paginación
 *     responses:
 *       200:
 *         description: Lista de ratings del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ratings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       from:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       combat:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           level:
 *                             type: string
 *                       punctuality:
 *                         type: number
 *                         description: Valoración de la puntualidad
 *                       attitude:
 *                         type: number
 *                         description: Valoración de la actitud
 *                       technique:
 *                         type: number
 *                         description: Valoración de la técnica
 *                       intensity:
 *                         type: number
 *                         description: Valoración de la intensidad
 *                       sportmanship:
 *                         type: number
 *                         description: Valoración de la deportividad
 *                       comment:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 totalRatings:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       404:
 *         description: No se encontraron ratings para el usuario
 */
router.get('/ratings/user/:userId', getRatingsForUserHandler);

export default router;