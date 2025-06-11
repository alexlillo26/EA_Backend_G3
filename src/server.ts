// Contenido para EA_Backend_G3/src/server.ts (Versión Corregida y Ordenada)
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config(); // Asegúrate que esto esté al principio

import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from './utils/jwt.handle.js'; // Asumo .js es correcto para tu setup
import userRoutes from './modules/users/user_routes.js';
import gymRoutes from './modules/gyms/gym_routes.js';
import combatRoutes from './modules/combats/combat_routes.js';
import authRoutes from './modules/auth/auth_routes.js';
import ratingRoutes from './modules/ratings/rating_routes.js'; 
import chatRoutes from './modules/chat/chat_routes.js'; // Asegúrate que esta importación esté
import * as chatService from './modules/chat/chat_service.js'; 
// import { corsHandler } from './middleware/corsHandler.js'; // Comentado para usar la librería cors estándar
import { loggingHandler } from './middleware/loggingHandler.js';
// import { routeNotFound } from './middleware/routeNotFound.js'; // Descomenta si lo usas
// import { routeNotFound } from './middleware/routeNotFound.js'; // Descomenta si lo usas
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import cors from 'cors'; // Importar la librería cors
import Combat from './modules/combats/combat_models.js';
import { setSocketIoInstance } from './modules/combats/combat_controller.js';
import path from "path";
import { fileURLToPath } from "url";


// Definir __filename y __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { Types } from 'mongoose';

const app = express();
const LOCAL_PORT = parseInt(process.env.SERVER_PORT || '9000', 10); // Parseado a entero
const httpServer = http.createServer(app);

// Configuración de Socket.IO
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: [
            "https://ea3.upc.edu",         // Frontend Angular (proxy)
            "https://ea3-back.upc.edu",   // Frontend WebReact (proxy)
            "http://localhost:3000",     // Desarrollo local frontend Angular
            "http://localhost:3001",     // Desarrollo local frontend WebReact
            "http://localhost",          // Pruebas generales API local
            "http://localhost:54385", // Origen de Flutter web debug
            `http://localhost:${LOCAL_PORT}`, // Para Swagger UI local si accedes por localhost
            "http://10.0.2.2",           // Emulador Android
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
            title: 'API EA G3 - Despliegue', // Título actualizado
            version: '1.0.0',
            description: 'Documentación de la API para el proyecto EA G3'
        },
        tags: [
            { name: 'Auth', description: 'Autenticación de Usuarios y Gimnasios' },
            { name: 'Users', description: 'Gestión de Usuarios' },
            { name: 'Gym', description: 'Gestión de Gimnasios' },
            { name: 'Chat', description: 'Gestión de Conversaciones y Mensajes' },
            { name: 'Combat', description: 'Gestión de Combates' },
            { name: 'Ratings', description: 'Valoraciones de Combates' },
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

// Servir archivos estáticos de /uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// CORS para desarrollo local y producción
app.use(cors({
    origin: [
        "http://localhost:3000", // React local
        "https://ea3.upc.edu",
        "https://ea3-back.upc.edu",
        "https://localhost:3000",
        "https://localhost:3001",
        "http://localhost:54385", // Origen de Flutter web debug

        // Añade otros orígenes de desarrollo si los necesitas
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(loggingHandler);

// --- Rutas de la API ---
//Mínimo de rutas para Swagger
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);    // Si en user_routes.js las rutas son ej. /users, la URL será /api/users
app.use('/api', gymRoutes);     // Si en gym_routes.js las rutas son ej. /gym, la URL será /api/gym
app.use('/api', combatRoutes);  // Si en combat_routes.js las rutas son ej. /combat, la URL será /api/combat
app.use('/api', ratingRoutes);  // Si en rating_routes.js las rutas son ej. /ratings, la URL será /api/ratings
app.use('/api/chat', chatRoutes); // Si en chat_routes.js las rutas son ej. /conversations, la URL será /api/chat/conversations

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
        // Corrige acceso a error.message
        const msg = (error && error.message) ? error.message : String(error);
        console.error('Error Detallado:', error.name, msg);
        if (error.reason && error.reason.servers) {
            try {
                console.error('Detalles de los servidores de MongoDB (error.reason.servers):', JSON.stringify(error.reason.servers, null, 2));
            } catch (e) {
                console.error('Detalles de los servidores de MongoDB (error.reason.servers):', error.reason.servers);
            }
        }
    });

// --- Lógica de Socket.IO ---
interface UserPayloadFromToken {
    id: string;
    email: string;
    username?: string;
    name?: string;
}

interface AuthenticatedSocketUser {
    userId: string;
    email: string;
    nameToDisplay: string;
}

interface CustomSocket extends Socket {
    user?: AuthenticatedSocketUser;
}

interface DirectChatMessageData {
    conversationId: string;
    senderId: string;
    senderUsername: string;
    message: string;
    timestamp: string; // ISO string
}

const userSocketMap = new Map<string, string>();

io.use(async (socket: CustomSocket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }
    try {
        const decodedPayload = await verifyToken(token) as UserPayloadFromToken;
        socket.user = {
            userId: decodedPayload.id,
            email: decodedPayload.email,
            nameToDisplay: decodedPayload.username || decodedPayload.name || "Usuario Desconocido"
        };
        if (socket.user?.userId) {
            userSocketMap.set(socket.user.userId, socket.id);
        }
        next();
    } catch (err: any) {
        console.error(`Socket Auth Error for socket ${socket.id}: ${err.message}`);
        return next(new Error(`Authentication error: ${err.message}`));
    }
});

io.on('connection', (socket: CustomSocket) => {
    console.log(`Usuario conectado a Socket.IO: ${socket.id}, UserId: ${socket.user?.userId}, Name: ${socket.user?.nameToDisplay}`);

    if (socket.user?.userId) {
        socket.join(socket.user.userId);
    }

    // --- EVENTOS PARA CHAT 1 A 1 (CONVERSACIONES DIRECTAS) ---
    socket.on('join_chat_room', (data: { conversationId: string }) => {
        if (!socket.user?.userId) {
            return socket.emit('chat_error', { message: 'Usuario no autenticado para unirse al chat.' });
        }
        if (!data?.conversationId) {
            return socket.emit('chat_error', { message: 'conversationId es requerido para unirse al chat.' });
        }
        const conversationRoom = `conversation_${data.conversationId}`;
        socket.join(conversationRoom);
        console.log(`Usuario ${socket.user.nameToDisplay} (ID: ${socket.user.userId}) se unió a la sala: ${conversationRoom}`);
        socket.emit('chat_notification', {
            type: 'success',
            message: `Te has unido al chat (ID Conversación: ${data.conversationId}).`,
            conversationId: data.conversationId
        });
    });

    socket.on('send_message', async (data: { conversationId: string; message: string }) => {
        if (!socket.user?.userId || !socket.user.nameToDisplay) { // Verificamos nameToDisplay también
            return socket.emit('chat_error', { message: 'Usuario no autenticado completamente para enviar mensaje.' });
        }
        const messageText = data?.message?.trim();
        if (!data?.conversationId || !messageText) {
            return socket.emit('chat_error', { message: 'conversationId y un mensaje no vacío son requeridos.' });
        }

        const conversationRoom = `conversation_${data.conversationId}`;
        
        try {
            // --- GUARDAR MENSAJE EN LA BASE DE DATOS ---
            // Esta es la línea crucial que activa la persistencia:
            const savedMessage = await chatService.addMessageToConversation(
              data.conversationId,
              socket.user.userId,
              socket.user.nameToDisplay, // Nombre del remitente
              messageText
            );
            // --------------------------------------------

            // Construir el objeto a emitir usando los datos del mensaje guardado (incluye _id y createdAt de la BD)
            const finalMessageDataToEmit: DirectChatMessageData = {
                conversationId: (savedMessage.conversationId as Types.ObjectId | string).toString(),
                senderId: (savedMessage.senderId as Types.ObjectId | string).toString(),
                senderUsername: savedMessage.senderUsername,
                message: savedMessage.message,
                timestamp: savedMessage.createdAt.toISOString(), // Usar el timestamp de la BD
                // Podrías añadir el _id del mensaje si el cliente lo necesita:
                //messageId: (savedMessage._id as Types.ObjectId | string).toString(),
            };

            io.to(conversationRoom).emit('new_message', finalMessageDataToEmit);
            console.log(`Mensaje ("${messageText}") guardado (ID: ${(savedMessage._id as Types.ObjectId | string).toString()}) y enviado en ${conversationRoom} por ${socket.user.nameToDisplay} (ID: ${socket.user.userId})`);

        } catch (dbError: any) {
            console.error(`Error al intentar guardar/procesar mensaje para conv ${data.conversationId}:`, dbError.message);
            socket.emit('chat_error', { message: `Error del servidor al procesar el mensaje: ${dbError.message}` });
        }
    });

    socket.on('typing_started', (data: { conversationId: string }) => {
        if (!socket.user?.userId || !data?.conversationId) return;
        const conversationRoom = `conversation_${data.conversationId}`;
        socket.to(conversationRoom).emit('opponent_typing', {
            conversationId: data.conversationId,
            userId: socket.user.userId,
            username: socket.user.nameToDisplay,
            isTyping: true
        });
    });

    socket.on('typing_stopped', (data: { conversationId: string }) => {
        if (!socket.user?.userId || !data?.conversationId) return;
        const conversationRoom = `conversation_${data.conversationId}`;
        socket.to(conversationRoom).emit('opponent_typing', {
            conversationId: data.conversationId,
            userId: socket.user.userId,
            username: socket.user.nameToDisplay,
            isTyping: false
        });
    });
    // --- FIN DE EVENTOS PARA CHAT 1 A 1 ---

    // --- EVENTOS RELACIONADOS CON COMBATES (NO CHAT DIRECTO) ---
     socket.on('sendCombatInvitation', ({ opponentId, combat }: { opponentId: string, combat: any }) => {
         const targetSocketId = userSocketMap.get(opponentId);
         if (targetSocketId) {
             console.log(`📨 Enviando invitación de combate a ${opponentId} (socket: ${targetSocketId}) para combate: ${combat?._id || 'ID no disponible'}`);
             io.to(targetSocketId).emit("new_invitation", combat);
         } else {
             console.log(`⚠️ Usuario ${opponentId} no está conectado para recibir invitación de combate`);
         }
     });

     socket.on('respond_combat', ({ combatId, status }: { combatId: string, status: string }) => {
         console.log(`🔄 Respuesta a combate ${combatId}: ${status}`);
         socket.broadcast.emit("combat_response", { combatId, status });
     });
    // --- FIN DE EVENTOS DE COMBATE ---

    socket.on('disconnect', (reason: string) => {
        if (socket.user?.userId) {
            const prevSocketId = userSocketMap.get(socket.user.userId);
            if (prevSocketId === socket.id) {
                userSocketMap.delete(socket.user.userId);
            }
            console.log(`❌ Usuario desconectado: ${socket.user.userId}. Socket: ${socket.id}. Razón: ${reason}`);
        } else {
            console.log(`Socket ${socket.id} desconectado sin usuario autenticado. Razón: ${reason}`);
        }
    });

    socket.on('error', (err: Error) => {
        console.error(`Error de bajo nivel en socket ${socket.id} (Usuario ${socket.user?.userId}): ${err.message}`);
    });
});
// --- Fin Lógica de Socket.IO ---

// Pasa la instancia de io al controlador de combates para emitir eventos desde handlers HTTP
setSocketIoInstance(io);

// Iniciar el servidor HTTP (que incluye Express y Socket.IO)
httpServer.listen(LOCAL_PORT, '0.0.0.0', () => { 
    console.log(`Servidor Express y Chat Socket.IO escuchando en https://ea3-api.upc.edu (internamente en VM puerto ${LOCAL_PORT})`);
    console.log(`Swagger UI disponible en https://ea3-api.upc.edu/api-docs (y localmente en http://localhost:${LOCAL_PORT}/api-docs si usas port-forwarding o corres local)`);
});

// Logs de variables de Google (se leen del .env que se copia a la imagen)
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("GOOGLE_OAUTH_REDIRECT_URL:", process.env.GOOGLE_OAUTH_REDIRECT_URL);