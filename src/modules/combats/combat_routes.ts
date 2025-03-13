// src/routes/user_routes.ts
import express from 'express';
import {
    saveMethodHandler,
    createCombatHandler,
    getAllCombatsHandler,
    getCombatByIdHandler,
    updateCombatHandler,
    deleteCombatHandler,
    getBoxersByCombatIdHandler
} from '../combats/combat_controller.js';

const router = express.Router();

/**
 * @openapi
 * /api/combat:
 *   post:
 *     summary: Crea un nuevo combate
 *     description: Añade un nuevo combate con fecha, gimnasio y boxeadores.
 *     tags:
 *       - Combat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora del combate
 *               gym:
 *                 type: string
 *                 description: ID del gimnasio donde se lleva a cabo el combate
 *               boxers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de IDs de los boxeadores participantes
 *     responses:
 *       201:
 *         description: Combate creado exitosamente
 *       400:
 *         description: Datos inválidos
 */

router.post('/combat', createCombatHandler);

/**
 * @openapi
 * /api/combat:
 *   get:
 *     summary: Obtiene todos los combates
 *     description: Retorna una lista de todos los combates registrados.
 *     tags:
 *       - Combat
 *     responses:
 *       200:
 *         description: Éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     description: Fecha y hora del combate
 *                   gym:
 *                     type: ObjectId
 *                     description: ID del gimnasio donde se lleva a cabo el combate
 *                   boxers:
 *                     type: array
 *                     items:
 *                       type: ObjectId
 *                     description: Lista de IDs de los boxeadores participantes
 */


router.get('/combat', getAllCombatsHandler);

/**
 * @openapi
 * /api/combat/{id}:
 *   get:
 *     summary: Obtiene un combate por ID
 *     description: Retorna los detalles de un combate específico.
 *     tags:
 *       - Combat
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   description: Fecha y hora del combate
 *                 gym:
 *                   type: string
 *                   description: ID del gimnasio donde se lleva a cabo el combate
 *                 boxers:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Lista de IDs de los boxeadores participantes
 *       404:
 *         description: Combate no encontrado
 */


router.get('/combat/:id', getCombatByIdHandler);

/**
 * @openapi
 * /api/combat/{id}:
 *   put:
 *     summary: Actualiza un combate por ID
 *     description: Modifica los detalles de un combate específico.
 *     tags:
 *       - Combat
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
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora del combate
 *               gym:
 *                 type: string
 *                 description: ID del gimnasio donde se lleva a cabo el combate
 *               boxers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de IDs de los boxeadores participantes
 *     responses:
 *       200:
 *         description: Combate actualizado exitosamente
 *       404:
 *         description: Combate no encontrado
 */

router.put('/combat/:id', updateCombatHandler);

/**
 * @openapi
 * /api/combat/{id}:
 *   delete:
 *     summary: Elimina un combate por ID
 *     description: Elimina un combate específico.
 *     tags:
 *       - Combat
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Combate eliminado exitosamente
 *       404:
 *         description: Combate no encontrado
 */

router.delete('/combat/:id', deleteCombatHandler);

/**
 * @openapi
 * /api/combat/{id}/boxers:
 *   get:
 *     summary: Obtener boxeadores por ID del combate
 *     description: Obtiene una lista de los boxeadores participantes en un combate específico usando su ID.
 *     tags:
 *       - Combat
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de boxeadores obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID del boxeador
 *                   name:
 *                     type: string
 *                     description: Nombre del boxeador
 *                   email:
 *                     type: string
 *                     description: Correo electrónico del boxeador
 *       404:
 *         description: Combate no encontrado
 */

router.get('/combat/:id/boxers', getBoxersByCombatIdHandler);

export default router;
