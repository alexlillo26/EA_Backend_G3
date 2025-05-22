var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Contenido para EA_Backend_G3/src/server.ts (Versión Corregida y Ordenada)
import dotenv from 'dotenv';
dotenv.config(); // Asegúrate que esto esté al principio
import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from './utils/jwt.handle.js'; // Asumo .js es correcto para tu setup
import userRoutes from './modules/users/user_routes.js';
import gymRoutes from './modules/gyms/gym_routes.js';
import combatRoutes from './modules/combats/combat_routes.js';
import authRoutes from './modules/auth/auth_routes.js';
// import { corsHandler } from './middleware/corsHandler.js'; // Comentado para usar la librería cors estándar
import { loggingHandler } from './middleware/loggingHandler.js';
// import { routeNotFound } from './middleware/routeNotFound.js'; // Descomenta si lo usas
// import { routeNotFound } from './middleware/routeNotFound.js'; // Descomenta si lo usas
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import cors from 'cors'; // Importar la librería cors
const app = express();
const LOCAL_PORT = parseInt(process.env.SERVER_PORT || '9000', 10); // Parseado a entero
const httpServer = http.createServer(app);
// Configuración de Socket.IO
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: [
            "https://ea3.upc.edu",
            "https://ea3-back.upc.edu",
            "https://localhost:3000",
            "https://localhost:3001",
            "https://localhost",
            "https://localhost:54385",
            `https://localhost:${LOCAL_PORT}`,
            "https://10.0.2.2",
            process.env.FLUTTER_APP_ORIGIN || "*" // Para Flutter (ser específico en producción)
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});
// Configuración de Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API EA G3 - Despliegue',
            version: '1.0.0',
            description: 'Documentación de la API para el proyecto EA G3'
        },
        tags: [
            { name: 'Auth', description: 'Autenticación de Usuarios y Gimnasios' },
            { name: 'Users', description: 'Gestión de Usuarios' },
            { name: 'Gym', description: 'Gestión de Gimnasios' },
            { name: 'Combat', description: 'Gestión de Combates' },
            { name: 'Main', description: 'Rutas Principales y de Prueba' }
        ],
        servers: [
            { url: 'https://ea3-api.upc.edu', description: 'Servidor Desplegado (UPC)' },
            { url: `http://localhost:${LOCAL_PORT}`, description: 'Servidor Local de Desarrollo' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            }
        },
        security: [{ bearerAuth: [] }] // Aplica seguridad JWT globalmente por defecto
    },
    // Apunta a tus archivos TypeScript originales (.ts) donde tienes los comentarios JSDoc @openapi
    // Asumiendo que node se ejecuta desde /usr/src/app/build/ y tus fuentes .ts están en /usr/src/app/src/
    apis: ['../src/**/*.ts']
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);
// Log para depurar la especificación generada (muy útil)
console.log('Generated Swagger Spec:', JSON.stringify(swaggerSpec, null, 2));
// --- Middlewares de Express ---
// Parsear JSON bodies
app.use(express.json());
// CORS para desarrollo local y producción
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://ea3.upc.edu",
        "https://ea3-back.upc.edu",
        "https://localhost:3000",
        "https://localhost:3001",
        "https://localhost:54385",
        `https://localhost:${LOCAL_PORT}`,
        "https://10.0.2.2",
        process.env.FLUTTER_APP_ORIGIN || "*"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(loggingHandler);
// --- Rutas de la API ---
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes); // Si en user_routes.js las rutas son ej. /users, la URL será /api/users
app.use('/api', gymRoutes); // Si en gym_routes.js las rutas son ej. /gym, la URL será /api/gym
app.use('/api', combatRoutes); // Si en combat_routes.js las rutas son ej. /combat, la URL será /api/combat
// --- Ruta para Swagger UI ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
// --- Rutas de Prueba ---
app.get('/', (_req, res) => {
    res.send('Welcome to my API!');
});
/**
 * @openapi
 * /ping:
 * get:
 * tags:
 * - Main
 * summary: Endpoint de prueba de actividad del servidor.
 * description: Devuelve 'pong' si el servidor está activo.
 * responses:
 * '200':
 * description: Respuesta exitosa, el servidor está activo.
 * content:
 * text/plain:
 * schema:
 * type: string
 * example: pong
 */
app.get('/ping', (_req, res) => {
    console.log('Request a /ping recibido');
    res.send('pong');
});
// --- Conexión a MongoDB ---
const mongoUriToConnect = process.env.MONGODB_URI; // Esta la define tu docker-compose.yml
if (!mongoUriToConnect) {
    console.error('ERROR CRÍTICO: La variable de entorno MONGODB_URI no está definida.');
    console.log('Asegúrate de que esté configurada en tu docker-compose.yml para el servicio backend.');
    console.log('Usando fallback a mongodb://mongo:27017/proyecto_fallback (esto podría no ser lo que quieres)');
    // process.exit(1); // Considera salir si la URI no está, o usa un fallback seguro
}
mongoose.connect(mongoUriToConnect || 'mongodb://mongo:27017/proyecto_fallback_db') // Fallback MUY de emergencia
    .then(() => console.log(`Conectado a MongoDB exitosamente usando URI: ${mongoUriToConnect ? 'la proporcionada por env' : 'la de fallback'}`))
    .catch((error) => {
    console.error('ERROR DE CONEXIÓN A MONGODB:');
    console.error('URI Intentada:', mongoUriToConnect || 'mongodb://mongo:27017/proyecto_fallback_db');
    console.error('Error Detallado:', error.name, error.message);
    if (error.reason && error.reason.servers) {
        try {
            console.error('Detalles de los servidores de MongoDB (error.reason.servers):', JSON.stringify(error.reason.servers, null, 2));
        }
        catch (e) {
            console.error('Detalles de los servidores de MongoDB (error.reason.servers):', error.reason.servers);
        }
    }
});
io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = socket.handshake.auth.token;
    if (!token) {
        console.log(`Socket ${socket.id}: Conexión rechazada - Sin token.`);
        return next(new Error('Authentication error: No token provided'));
    }
    try {
        const decodedPayload = yield verifyToken(token);
        socket.user = {
            userId: decodedPayload.id,
            username: decodedPayload.username,
            email: decodedPayload.email
        }; // Asignación única y correcta
        console.log(`Socket ${socket.id}: Autenticado correctamente. UserID: ${socket.user.userId}, Username: ${socket.user.username}`);
        next();
    }
    catch (err) {
        console.log(`Socket ${socket.id}: Conexión rechazada - Token inválido o expirado. Error: ${err.message}`);
        return next(new Error(`Authentication error: ${err.message} (Invalid or expired token)`));
    }
}));
io.on('connection', (socket) => {
    var _a, _b;
    console.log(`Usuario conectado al chat: ${socket.id}, UserId: ${(_a = socket.user) === null || _a === void 0 ? void 0 : _a.userId}, Username: ${(_b = socket.user) === null || _b === void 0 ? void 0 : _b.username}`);
    socket.on('join_combat_chat', (data) => {
        if (!socket.user || !socket.user.userId) {
            socket.emit('combat_chat_error', { message: 'Usuario no autenticado para unirse al chat.' });
            return;
        }
        if (!data || !data.combatId) {
            socket.emit('combat_chat_error', { message: 'combatId es requerido para unirse al chat.' });
            return;
        }
        const combatRoom = `combat_${data.combatId}`;
        socket.join(combatRoom);
        console.log(`Usuario ${socket.user.username} (ID: ${socket.user.userId}, Socket: ${socket.id}) se unió a la sala: ${combatRoom}`);
        socket.to(combatRoom).emit('combat_chat_notification', { type: 'info', message: `${socket.user.username || 'Un oponente'} se ha unido.` });
        socket.emit('combat_chat_notification', { type: 'success', message: `Te has unido al chat del combate ${data.combatId}.` });
    });
    socket.on('send_combat_message', (data) => {
        if (!socket.user || !socket.user.userId) {
            socket.emit('combat_chat_error', { message: 'Usuario no autenticado para enviar mensaje.' });
            return;
        }
        if (!data || !data.combatId || !data.message) {
            socket.emit('combat_chat_error', { message: 'combatId y message son requeridos.' });
            return;
        }
        const combatRoom = `combat_${data.combatId}`;
        const messageData = {
            combatId: data.combatId,
            senderId: socket.user.userId,
            senderUsername: socket.user.username,
            message: data.message,
            timestamp: new Date().toISOString()
        };
        io.to(combatRoom).emit('receive_combat_message', messageData);
        console.log(`Mensaje ("${data.message}") enviado en ${combatRoom} por ${socket.user.username} (ID: ${socket.user.userId})`);
    });
    socket.on('typing_in_combat', (data) => {
        if (!socket.user || !socket.user.userId || !data || !data.combatId)
            return;
        const combatRoom = `combat_${data.combatId}`;
        socket.to(combatRoom).emit('opponent_typing', { userId: socket.user.userId, username: socket.user.username, isTyping: data.isTyping });
    });
    socket.on('disconnect', (reason) => {
        var _a, _b;
        console.log(`Usuario desconectado del chat: ${socket.id}, UserId: ${(_a = socket.user) === null || _a === void 0 ? void 0 : _a.userId}, Username: ${(_b = socket.user) === null || _b === void 0 ? void 0 : _b.username}. Razón: ${reason}`);
        if (socket.user) {
            socket.rooms.forEach(room => {
                var _a;
                if (room.startsWith('combat_')) {
                    socket.to(room).emit('combat_chat_notification', { type: 'info', message: `${((_a = socket.user) === null || _a === void 0 ? void 0 : _a.username) || 'Un oponente'} ha abandonado el chat.` });
                }
            });
        }
    });
    socket.on('error', (err) => {
        var _a, _b;
        console.error(`Error en socket ${socket.id} (Usuario ${(_a = socket.user) === null || _a === void 0 ? void 0 : _a.userId}, Username: ${(_b = socket.user) === null || _b === void 0 ? void 0 : _b.username}): ${err.message}`);
        socket.emit('combat_chat_error', { message: `Error interno del socket: ${err.message}` });
    });
});
// --- Fin Lógica de Socket.IO ---
// Iniciar el servidor HTTP (que incluye Express y Socket.IO)
httpServer.listen(LOCAL_PORT, '0.0.0.0', () => {
    console.log(`Servidor Express y Chat Socket.IO escuchando en https://ea3-api.upc.edu (internamente en VM puerto ${LOCAL_PORT})`);
    console.log(`Swagger UI disponible en https://ea3-api.upc.edu/api-docs (y localmente en http://localhost:${LOCAL_PORT}/api-docs si usas port-forwarding o corres local)`);
});
// Logs de variables de Google (se leen del .env que se copia a la imagen)
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("GOOGLE_OAUTH_REDIRECT_URL:", process.env.GOOGLE_OAUTH_REDIRECT_URL);
