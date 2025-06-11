// src/routes/user_routes.ts
import express from 'express';
import { createCombatHandler, getCombatByIdHandler, updateCombatHandler, deleteCombatHandler, getBoxersByCombatIdHandler, getCombatsByBoxerIdHandler, hideCombatHandler, getPendingInvitationsHandler, respondToInvitationHandler, getFutureCombatsHandler, getInvitationsHandler, getSentInvitationsHandler, getFilteredCombatsHandler, updateCombatImageHandler, getUserCombatHistoryHandler, } from '../combats/combat_controller.js';
import { checkJwt } from '../../middleware/session.js'; // Correct import path
import upload from '../../middleware/uploads.js';
const router = express.Router();
/**
 * @openapi
 * /api/combat/invitations:
 *   get:
 *     summary: Obtiene las invitaciones recibidas (pendientes)
 *     tags:
 *       - Combat
 *     responses:
 *       200:
 *         description: Invitaciones recibidas
 */
router.get('/combat/invitations', checkJwt, getInvitationsHandler);
/**
 * @openapi
 * /api/combat/invitations/pending:
 *   get:
 *     summary: Obtiene las invitaciones pendientes
 *     description: Retorna una lista de las invitaciones pendientes para un usuario.
 *     tags:
 *       - Combat
 *     responses:
 *       200:
 *         description: Lista de invitaciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID de la invitación
 *                   combatId:
 *                     type: string
 *                     description: ID del combate
 *                   from:
 *                     type: string
 *                     description: ID del usuario que envió la invitación
 *                   status:
 *                     type: string
 *                     enum: [pending, accepted, rejected]
 *       404:
 *         description: Usuario no encontrado o sin invitaciones pendientes
 *       500:
 *         description: Error interno del servidor
 */
router.get('/combat/invitations/pending', checkJwt, getPendingInvitationsHandler);
/**
 * @openapi
 * /api/combat/sent-invitations:
 *   get:
 *     summary: Obtiene las invitaciones enviadas (pendientes)
 *     tags:
 *       - Combat
 *     responses:
 *       200:
 *         description: Invitaciones enviadas
 */
router.get('/combat/sent-invitations', checkJwt, getSentInvitationsHandler);
/**
 * @openapi
 * /api/combat/future:
 *   get:
 *     summary: Obtiene los combates futuros
 *     description: Retorna una lista de los combates programados para el futuro.
 *     tags:
 *       - Combat
 *     responses:
 *       200:
 *         description: Lista de combates futuros obtenida exitosamente
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
 *                   gym:
 *                     type: string
 *                   boxers:
 *                     type: array
 *                     items:
 *                       type: string
 *       404:
 *         description: No se encontraron combates futuros
 *       500:
 *         description: Error interno del servidor
 */
router.get('/combat/future', checkJwt, getFutureCombatsHandler);
/**
 * @openapi
 * /api/combat/boxer/{boxerId}:
 *   get:
 *     summary: Obtiene los combates en los que ha participado un usuario
 *     description: Retorna una lista de combates en los que un usuario específico ha participado.
 *     tags:
 *       - Combat
 *     parameters:
 *       - name: boxerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario (boxer)
 *     responses:
 *       200:
 *         description: Lista de combates obtenida exitosamente
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
 *                   gym:
 *                     type: string
 *                   boxers:
 *                     type: array
 *                     items:
 *                       type: string
 *       404:
 *         description: Usuario no encontrado o sin combates
 *       500:
 *         description: Error interno del servidor
 */
router.get('/combat/boxer/:boxerId', getCombatsByBoxerIdHandler);
/**
 * @openapi
 * /api/combat:
 *   post:
 *     summary: Crea un nuevo combate
 *     description: Añade un nuevo combate con todos los campos requeridos.
 *     tags:
 *       - Combat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - creator
 *               - opponent
 *               - date
 *               - time
 *               - level
 *               - gym
 *               - status
 *             properties:
 *               creator:
 *                 type: string
 *                 description: ID del usuario creador
 *               opponent:
 *                 type: string
 *                 description: ID del oponente
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Fecha del combate (YYYY-MM-DD)
 *                 example: "2024-06-01"
 *               time:
 *                 type: string
 *                 description: Hora del combate (HH:mm)
 *                 example: "18:00"
 *               level:
 *                 type: string
 *                 description: Nivel del combate
 *                 example: "avanzado"
 *               gym:
 *                 type: string
 *                 description: ID del gimnasio
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected, completed, active, cancelled]
 *                 description: Estado del combate
 *                 example: pending
 *     responses:
 *       201:
 *         description: Combate creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/combat', checkJwt, upload.single('image'), createCombatHandler);
/**
 * @openapi
 * /api/combat:
 *   get:
 *     summary: Obtiene una lista de combates con paginación
 *     description: Retorna una lista de combates paginada.
 *     tags:
 *       - Combat
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: pageSize
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           enum: [10, 25, 50]
 *           default: 10
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
 *                   name:
 *                     type: string
 *                     description: Nombre del combate
 *                   date:
 *                     type: string
 *                     description: Fecha del combate
 *                   location:
 *                     type: string
 *                     description: Ubicación del combate
 *       400:
 *         description: Tamaño de página inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/combat', checkJwt, getFilteredCombatsHandler);
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
router.put('/combat/:id', checkJwt, updateCombatHandler);
router.put('/combat/:id', checkJwt, updateCombatHandler);
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
router.delete('/combat/:id', checkJwt, deleteCombatHandler);
router.delete('/combat/:id', checkJwt, deleteCombatHandler);
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
router.get('/combat/:id/boxers', getBoxersByCombatIdHandler);
/**
 * @openapi
 * /api/combat/{id}/oculto:
 *   put:
 *     summary: Cambia la visibilidad de un combate por ID
 *     description: Oculta o muestra un combate específico.
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
 *               isHidden:
 *                 type: boolean
 *                 description: Estado de visibilidad del combate
 *     responses:
 *       200:
 *         description: Combate actualizado exitosamente
 *       404:
 *         description: Combate no encontrado
 */
router.put('/combat/:id/oculto', checkJwt, hideCombatHandler); // Require authentication
/**
 * @openapi
 * /api/combat/{id}/respond:
 *   post:
 *     summary: Responde a una invitación
 *     description: Acepta o rechaza una invitación a un combate.
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
 *               response:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 description: Respuesta a la invitación
 *     responses:
 *       200:
 *         description: Respuesta a la invitación procesada exitosamente
 *       404:
 *         description: Invitación no encontrada
 */
router.patch('/combat/:id/respond', checkJwt, respondToInvitationHandler);
/**
 * @openapi
 * /api/combat/history/user/{boxerId}:
 *   get:
 *     summary: Obtiene el historial de combates completados de un usuario (boxeador)
 *     description: Retorna una lista paginada de los combates completados en los que un usuario específico ha participado.
 *     tags:
 *       - Combat
 *     parameters:
 *       - name: boxerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario (boxeador).
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página.
 *       - name: pageSize
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de combates por página.
 *     responses:
 *       200:
 *         description: Historial de combates obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     combats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           date:
 *                             type: string
 *                             format: date-time
 *                           time:
 *                             type: string
 *                           opponent:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *                                 nullable: true
 *                             nullable: true
 *                           result:
 *                             type: string
 *                             enum: ["Victoria", "Derrota", "Empate"]
 *                           level:
 *                             type: string
 *                             nullable: true
 *                           status:
 *                             type: string
 *                           gym:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               location:
 *                                 type: string
 *                                 nullable: true
 *                             nullable: true
 *                     totalCombats:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *       400:
 *         description: ID de boxeador inválido.
 *       401:
 *         description: No autenticado (si `checkJwt` está activo).
 *       500:
 *         description: Error interno del servidor.
 *     security:
 *       - bearerAuth: [] # Asumiendo que usas JWT
 */
router.get('/combat/history/user/:boxerId', /* checkJwt, */ getUserCombatHistoryHandler);
router.put('/combat/:id/image', checkJwt, upload.single('image'), updateCombatImageHandler);
export default router;
