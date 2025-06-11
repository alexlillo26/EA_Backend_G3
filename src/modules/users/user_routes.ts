import express from 'express';
import upload from '../../middleware/uploads.js';
import uploadVideo from '../../middleware/uploadVideo.js';
import {
    saveMethodHandler,
    createUserHandler,
    getAllUsersHandler,
    getUserByIdHandler,
    updateUserHandler,
    deleteUserHandler,
    hideUserHandler,
    loginUserHandler,
    refreshTokenHandler,
    searchUsersHandler,
    updateUserBoxingVideoHandler,
    getUserStatisticsHandler
} from '../users/user_controller.js';
import { checkJwt } from '../../middleware/session.js'; // Correct import path
import User from './user_models.js';

const router = express.Router();

/**
 * @openapi
 * /api/main:
 *   get:
 *     summary: Página de bienvenida
 *     description: Retorna un mensaje de bienvenida.
 *     tags:
 *       - Main
 *     responses:
 *       200:
 *         description: Éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bienvenido a la API
 */
router.get('/main', saveMethodHandler);

/**
 * @openapi
 * /api/users/register:
 *   post:
 *     summary: Crea un nuevo usuario
 *     description: Añade los detalles de un nuevo usuario.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - birthDate
 *               - email
 *               - password
 *               - weight
 *               - city
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *                 description: Contraseña del usuario (mínimo 8 caracteres)
 *               isAdmin:
 *                 type: boolean
 *               weight:
 *                 type: string
 *                 enum: [Peso pluma, Peso medio, Peso pesado]
 *               city:
 *                 type: string
 *               phone:
 *                 type: string
 *               gender:
 *                 enum: [Hombre, Mujer]
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error de validación
 */
router.post('/users/register', createUserHandler);

/**
 * @openapi
 * /api/users/search:
 *   get:
 *     summary: Buscar usuarios
 *     description: Busca usuarios por ciudad y categoría de peso
 *     tags:
 *       - Users
 *     parameters:
 *       - name: city
 *         in: query
 *         description: Ciudad para filtrar usuarios
 *         required: false
 *         schema:
 *           type: string
 *       - name: weight
 *         in: query
 *         description: Categoría de peso
 *         required: false
 *         schema:
 *           type: string
 *           enum: [Peso pluma, Peso medio, Peso pesado]
 *     responses:
 *       200:
 *         description: Lista de usuarios encontrados
 */
router.get('/users/search', searchUsersHandler);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Obtiene una lista de usuarios con paginación
 *     description: Retorna una lista de usuarios paginada.
 *     tags:
 *       - Users
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
 *                   birthDate:
 *                     type: string
 *                     format: date
 *                   email:
 *                     type: string
 *                   isAdmin:
 *                     type: boolean
 *                   isHidden:
 *                     type: boolean
 *       400:
 *         description: Tamaño de página inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/users', checkJwt, getAllUsersHandler); // Require authentication

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Obtiene un usuario por ID
 *     description: Retorna los detalles de un usuario específico.
 *     tags:
 *       - Users
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
 *                 name:
 *                   type: string
 *                 birthDate:
 *                   type: string
 *                   format: date
 *                 email:
 *                   type: string
 *                 isAdmin:
 *                   type: boolean
 *                 isHidden:
 *                   type: boolean
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/users/:id', checkJwt, getUserByIdHandler); // Add checkJwt here

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Actualiza un usuario por ID
 *     description: Modifica los detalles de un usuario específico.
 *     tags:
 *       - Users
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
 *               name:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *               isAdmin:
 *                 type: boolean
 *               isHidden:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/users/:id', checkJwt, upload.single("profilePicture"), updateUserHandler); // Corrige el orden

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Elimina un usuario por ID
 *     description: Elimina un usuario específico de la base de datos.
 *     tags:
 *       - Users
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/users/:id', checkJwt, deleteUserHandler); // Require authentication

/**
 * @openapi
 * /api/users/{id}/oculto:
 *   put:
 *     summary: Cambia la visibilidad de un usuario por ID
 *     description: Establece el campo isHidden de un usuario específico a true o false.
 *     tags:
 *       - Users
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
 *         description: Usuario actualizado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/users/:id/oculto', checkJwt, hideUserHandler); // Ensure checkJwt is here

/**
 * @openapi
 * /api/users/login:
 *   post:
 *     summary: Inicia sesión
 *     description: Inicia sesión con un usuario existente.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       200:
 *         description: Inicio de sesión completado
 *       400:
 *         description: Usuario no encontrado o contraseña incorrecta
 */
router.post('/users/login', loginUserHandler);

/**
 * @openapi
 * /api/users/refresh:
 *   post:
 *     summary: Refresca el token de acceso
 *     description: Genera un nuevo token de acceso usando el refresh token.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *       403:
 *         description: Refresh token inválido
 */
router.post('/users/refresh', refreshTokenHandler);

/**
 * @openapi
 * /api/users/refresh-token:
 *   post:
 *     summary: Refresca el token de acceso
 *     description: Genera un nuevo token de acceso usando el refresh token.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *       403:
 *         description: Refresh token inválido
 */
router.post('/users/refresh-token', refreshTokenHandler);

/**
 * @openapi
 * /api/combat/statistics/user/{boxerId}:
 *   get:
 *     summary: Obtiene las estadísticas de combates para un usuario
 *     tags:
 *       - Combat
 *     parameters:
 *       - name: boxerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario (boxeador)
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       400:
 *         description: ID de boxeador inválido
 *       500:
 *         description: Error interno del servidor
 *     security:
 *       - bearerAuth: []
 */
router.get('/combat/statistics/user/:boxerId', checkJwt, getUserStatisticsHandler);

router.put('/users/:id/boxing-video', checkJwt, uploadVideo.single('video'), updateUserBoxingVideoHandler);

export default router;