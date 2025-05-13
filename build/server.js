var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dotenv from 'dotenv';
dotenv.config(); // Ensure this is at the top of the file
import express from 'express';
import mongoose from 'mongoose';
import http from 'http'; // Necesario para Socket.IO
import { Server as SocketIOServer } from 'socket.io'; // Importar Server y Socket de socket.io
// ASUNCIÓN: Tu verifyToken está en './utils/jwt.handle.js' y devuelve un payload como:
// { id: string, email: string, username: string, iat?: number, exp?: number }
import { verifyToken } from './utils/jwt.handle.js';
import userRoutes from './modules/users/user_routes.js';
import gymRoutes from './modules/gyms/gym_routes.js';
import combatRoutes from './modules/combats/combat_routes.js';
import authRoutes from './modules/auth/auth_routes.js';
import { corsHandler } from './middleware/corsHandler.js';
import { loggingHandler } from './middleware/loggingHandler.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import cors from 'cors';
const app = express();
const LOCAL_PORT = process.env.SERVER_PORT || 9000;
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: [
            "http://localhost:3000",
            "http://localhost",
            "http://10.0.2.2",
            process.env.FLUTTER_APP_ORIGIN || "*"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});
// Configuración de Swagger (sin cambios)
// ... (tu código de swaggerOptions y swaggerSpec se mantiene igual) ...
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Usuarios',
            version: '1.0.0',
            description: 'Documentación de la API de Usuarios'
        },
        tags: [ /* ... tus tags ... */],
        servers: [{ url: `http://localhost:${LOCAL_PORT}` }],
        components: { /* ... tus componentes ... */},
        security: [ /* ... tu seguridad ... */]
    },
    apis: ['./modules/users/*.js', './modules/gyms/*.js', './modules/combats/*.js', './modules/auth/*.ts']
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-subjects', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Middleware (sin cambios)
app.use(express.json());
app.use(corsHandler);
app.use(loggingHandler);
//rutas (sin cambios)
app.use('/api', userRoutes);
app.use('/api', gymRoutes);
app.use('/api', combatRoutes);
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
    res.send('Welcome to my API');
});
mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/proyecto')
    .then(() => console.log('Connected to DB'))
    .catch((error) => console.error('DB Connection Error:', error));
/**
 * @openapi
 * ... (tu documentación OpenAPI para sockets se mantiene igual) ...
 */
// Middleware de autenticación para Socket.IO (se ejecuta al intentar conectar)
io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = socket.handshake.auth.token;
    if (!token) {
        console.log(`Socket ${socket.id}: Conexión rechazada - Sin token.`);
        return next(new Error('Authentication error: No token provided'));
    }
    try {
        // --- CAMBIO IMPORTANTE en la verificación y asignación del payload ---
        // 1. verifyToken devuelve un payload con 'id', 'email', 'username' (como DecodedJWTPayload)
        const decodedPayload = yield verifyToken(token);
        // 2. Creamos el objeto 'authenticatedUser' que se adjuntará a socket.user.
        // Mapeamos 'id' del token a 'userId' en nuestro objeto 'socket.user'.
        const authenticatedUser = {
            userId: decodedPayload.id,
            username: decodedPayload.username,
            email: decodedPayload.email // 'email' del token (opcional guardarlo en socket.user)
        };
        // 3. Adjuntamos el objeto 'authenticatedUser' formateado al socket.
        socket.user = authenticatedUser;
        // Log para verificar que los datos correctos se están asignando
        console.log(`Socket ${socket.id}: Autenticado correctamente. UserID: ${socket.user.userId}, Username: ${socket.user.username}`);
        next(); // Token válido, proceder con la conexión
    }
    catch (err) {
        console.log(`Socket ${socket.id}: Conexión rechazada - Token inválido o expirado. Error: ${err.message}`);
        return next(new Error(`Authentication error: ${err.message} (Invalid or expired token)`));
    }
}));
io.on('connection', (socket) => {
    var _a, _b;
    // --- CAMBIO IMPORTANTE en el log de conexión ---
    // Usamos socket.user.userId y socket.user.username consistentemente.
    console.log(`Usuario conectado al chat: ${socket.id}, UserId: ${(_a = socket.user) === null || _a === void 0 ? void 0 : _a.userId}, Username: ${(_b = socket.user) === null || _b === void 0 ? void 0 : _b.username}`);
    // Evento para unirse a la sala de chat de un combate específico
    socket.on('join_combat_chat', (data) => {
        // --- CAMBIO IMPORTANTE: Verificar socket.user y socket.user.userId ---
        if (!socket.user || !socket.user.userId) { // Verificar que userId exista
            socket.emit('combat_chat_error', { message: 'Usuario no autenticado para unirse al chat.' });
            console.log(`Socket ${socket.id}: Intento de unirse al chat sin autenticación completa (falta userId).`);
            return;
        }
        if (!data || !data.combatId) {
            socket.emit('combat_chat_error', { message: 'combatId es requerido para unirse al chat.' });
            return;
        }
        const combatRoom = `combat_${data.combatId}`;
        socket.join(combatRoom);
        // Usar socket.user.userId y socket.user.username
        console.log(`Usuario ${socket.user.username} (ID: ${socket.user.userId}, Socket: ${socket.id}) se unió a la sala: ${combatRoom}`);
        socket.to(combatRoom).emit('combat_chat_notification', {
            type: 'info',
            message: `${socket.user.username || 'Un oponente'} se ha unido al chat del combate.`
        });
        socket.emit('combat_chat_notification', {
            type: 'success',
            message: `Te has unido al chat del combate ${data.combatId}.`
        });
    });
    // Evento para enviar un mensaje en el chat de un combate
    socket.on('send_combat_message', (data) => {
        // --- CAMBIO IMPORTANTE: Verificar socket.user y socket.user.userId ---
        if (!socket.user || !socket.user.userId) { // Verificar que userId exista
            socket.emit('combat_chat_error', { message: 'Usuario no autenticado para enviar mensaje.' });
            console.log(`Socket ${socket.id}: Intento de enviar mensaje sin autenticación completa (falta userId).`);
            return;
        }
        if (!data || !data.combatId || !data.message) {
            socket.emit('combat_chat_error', { message: 'combatId y message son requeridos.' });
            return;
        }
        const combatRoom = `combat_${data.combatId}`;
        // --- CAMBIO IMPORTANTE: Construir messageData usando socket.user.userId y socket.user.username ---
        const messageData = {
            combatId: data.combatId,
            senderId: socket.user.userId,
            senderUsername: socket.user.username,
            message: data.message,
            timestamp: new Date().toISOString()
        };
        io.to(combatRoom).emit('receive_combat_message', messageData); // Enviar a todos en la sala
        // Log mejorado
        console.log(`Mensaje ("${data.message}") enviado en ${combatRoom} por ${socket.user.username} (ID: ${socket.user.userId})`);
    });
    // Evento para indicar que el usuario está escribiendo
    socket.on('typing_in_combat', (data) => {
        // --- CAMBIO IMPORTANTE: Verificar socket.user y socket.user.userId ---
        if (!socket.user || !socket.user.userId || !data || !data.combatId)
            return;
        const combatRoom = `combat_${data.combatId}`;
        socket.to(combatRoom).emit('opponent_typing', {
            userId: socket.user.userId,
            username: socket.user.username,
            isTyping: data.isTyping
        });
    });
    // Manejar desconexión
    socket.on('disconnect', (reason) => {
        var _a, _b;
        console.log(`Usuario desconectado del chat: ${socket.id}, UserId: ${(_a = socket.user) === null || _a === void 0 ? void 0 : _a.userId}, Username: ${(_b = socket.user) === null || _b === void 0 ? void 0 : _b.username}. Razón: ${reason}`);
        if (socket.user) {
            socket.rooms.forEach(room => {
                var _a;
                if (room.startsWith('combat_')) {
                    socket.to(room).emit('combat_chat_notification', {
                        type: 'info',
                        message: `${((_a = socket.user) === null || _a === void 0 ? void 0 : _a.username) || 'Un oponente'} ha abandonado el chat.`
                    });
                }
            });
        }
    });
    // Manejar errores de socket post-conexión
    socket.on('error', (err) => {
        var _a, _b;
        console.error(`Error en socket ${socket.id} (Usuario ${(_a = socket.user) === null || _a === void 0 ? void 0 : _a.userId}, Username: ${(_b = socket.user) === null || _b === void 0 ? void 0 : _b.username}): ${err.message}`);
        socket.emit('combat_chat_error', { message: `Error interno del socket: ${err.message}` });
    });
});
// Iniciar el servidor HTTP (que incluye Express y Socket.IO)
httpServer.listen(LOCAL_PORT, () => {
    console.log(`Servidor Express y Chat Socket.IO escuchando en http://localhost:${LOCAL_PORT}`);
    console.log(`Swagger disponible en http://localhost:${LOCAL_PORT}/api-docs`);
});
// Configuración de CORS para Express (sin cambios)
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("GOOGLE_OAUTH_REDIRECT_URL:", process.env.GOOGLE_OAUTH_REDIRECT_URL);
