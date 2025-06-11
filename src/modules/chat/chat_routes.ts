import express from 'express';
import { checkJwt } from '../../middleware/session.js';
import {
  initiateConversationHandler,
  getMyConversationsHandler,
  getConversationMessagesHandler,
} from './chat_controller.js';

const router = express.Router();

/**
 * @openapi
 * /api/chat/conversations/initiate:
 *   post:
 *     summary: Inicia o recupera una conversación 1 a 1 con otro usuario
 *     description: |
 *       Busca si ya existe una conversación entre dos usuarios. Si no existe, la crea.
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - opponentId
 *             properties:
 *               opponentId:
 *                 type: string
 *                 description: ID del usuario con quien se desea conversar
 *                 example: '60d0fe4f5311236168a109ca'
 *     responses:
 *       200:
 *         description: Conversación existente o creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversationId:
 *                   type: string
 *                   example: '60d21b4667d0d8992e610c85'
 *       400:
 *         description: opponentId inválido o es el mismo que el del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado. Token JWT inválido o ausente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario oponente no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/conversations/initiate', checkJwt, initiateConversationHandler);


/*
/**
 * @openapi
 * /api/chat/conversations:
 *   get:
 *     summary: Obtiene la lista de conversaciones del usuario autenticado
 *     description: Lista paginada de conversaciones donde participa el usuario.
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           enum: [10, 20, 50]
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista de conversaciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ConversationPreview'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalConversations:
 *                   type: integer
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
 router.get('/conversations', checkJwt, getMyConversationsHandler);

/**
 * @openapi
 * /api/chat/conversations/{conversationId}/messages:
 *   get:
 *     summary: Obtiene los mensajes de una conversación
 *     description: Devuelve mensajes de una conversación específica, con paginación.
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: conversationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 30
 *       - name: before
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           description: Cursor de paginación (ID del mensaje anterior)
 *     responses:
 *       200:
 *         description: Mensajes recuperados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatMessageResponse'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Usuario no pertenece a la conversación
 *       404:
 *         description: Conversación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/conversations/:conversationId/messages', checkJwt, getConversationMessagesHandler); 

export default router;
