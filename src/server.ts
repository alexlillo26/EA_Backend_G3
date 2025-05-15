import dotenv from 'dotenv';
dotenv.config(); // Ensure this is at the top of the file

import express from 'express';
import mongoose from 'mongoose';
import http from 'http'; // Necesario para Socket.IO
import { Server as SocketIOServer, Socket } from 'socket.io'; // Importar Server y Socket de socket.io
import { verifyToken } from './utils/jwt.handle.js';
import userRoutes from './modules/users/user_routes.js';
import gymRoutes from './modules/gyms/gym_routes.js';
import combatRoutes from './modules/combats/combat_routes.js';
import authRoutes from './modules/auth/auth_routes.js';
import { corsHandler } from './middleware/corsHandler.js'; // Tu middleware CORS personalizado
import { loggingHandler } from './middleware/loggingHandler.js';
// import { routeNotFound } from './middleware/routeNotFound.js'; // Descomenta si lo usas
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
// import cors from 'cors'; // Comentado, ya que usas corsHandler. Si prefieres este, configúralo aquí.

const app = express();
 
const LOCAL_PORT = parseInt(process.env.SERVER_PORT || '9000', 10); // Asegurar que sea un número

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: [
            "http://ea3.upc.edu",         // URL del proxy para tu frontend Angular
            "http://ea3-back.upc.edu",   // URL del proxy para tu frontend WebReact
            "http://localhost:3000",     // Desarrollo local frontend Angular
            "http://localhost:3001",     // Desarrollo local frontend WebReact
            "http://localhost",
            "http://10.0.2.2",
            process.env.FLUTTER_APP_ORIGIN || "*" // Para Flutter, sé específico en producción
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Usuarios', // Puedes ajustar esto
            version: '1.0.0',
            description: 'Documentación de la API de Usuarios'
        },
        tags: [ /* Tus tags definidos antes */ ],
        servers: [
            {
                url: 'http://ea3-api.upc.edu' // URL PÚBLICA del proxy para tu backend
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    // Apunta a tus archivos TypeScript (.ts) originales donde tienes los comentarios JSDoc
    // Asumiendo que tu código fuente está en 'src/' relativo a la raíz del proyecto en el contenedor
    apis: [
        './src/server.ts', // Si tienes JSDoc aquí
        './src/modules/auth/auth_routes.ts',
        './src/modules/users/user_routes.ts',
        './src/modules/gyms/gym_routes.ts',
        './src/modules/combats/combat_routes.ts'
        // Considera un glob como './src/**/*.ts' si es más simple
    ]
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Middlewares de Express
app.use(express.json());
app.use(corsHandler); // TU MIDDLEWARE CORS. Asegúrate que permite los orígenes de tus proxies.
app.use(loggingHandler);

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', gymRoutes);
app.use('/api', combatRoutes);

// Ruta para Swagger UI (Eliminada /api-subjects, usando /api-docs)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// Rutas de prueba
app.get('/', (req, res) => {
    res.send('Welcome to my API');
});
app.get('/ping', (_req, res) => { // Endpoint /ping añadido si no estaba explícito
    console.log('Request a /ping recibido');
    res.send('pong');
});

// Conexión a MongoDB
// La variable MONGODB_URI la define tu docker-compose.yml
// El fallback ahora apunta al nombre de servicio 'mongo' para Docker, no a 'localhost'
const mongoUriToConnect = process.env.MONGODB_URI || 'mongodb://mongo:27017/proyecto';
mongoose
    .connect(mongoUriToConnect)
    .then(() => console.log('Conectado a MongoDB exitosamente'))
    .catch((error) => console.error('Error de conexión a MongoDB:', error));

// -------------------- LÓGICA DE CHAT SOCKET.IO PARA COMBATES --------------------
// (Manteniendo tus interfaces y lógica de Socket.IO como las tenías,
// solo corrigiendo la doble asignación a socket.user)

interface DecodedJWTPayload {
    id: string;
    email: string;
    username: string;
    iat?: number;
    exp?: number;
}
interface AuthenticatedUser {
    userId: string;
    username: string;
    email?: string;
}
interface AuthenticatedSocket extends Socket {
    user?: AuthenticatedUser;
}
interface CombatChatMessage {
    combatId: string;
    senderId: string;
    senderUsername?: string;
    message: string;
    timestamp: string;
}

io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
        console.log(`Socket ${socket.id}: Conexión rechazada - Sin token.`);
        return next(new Error('Authentication error: No token provided'));
    }
    try {
        const decodedPayload = await verifyToken(token) as DecodedJWTPayload;
        const authenticatedUser: AuthenticatedUser = {
            userId: decodedPayload.id,
            username: decodedPayload.username,
            email: decodedPayload.email
        };
        socket.user = authenticatedUser; // Asignación única
        console.log(`Socket ${socket.id}: Autenticado correctamente. UserID: ${socket.user.userId}, Username: ${socket.user.username}`);
        next();
    } catch (err: any) {
        console.log(`Socket ${socket.id}: Conexión rechazada - Token inválido o expirado. Error: ${err.message}`);
        return next(new Error(`Authentication error: ${err.message} (Invalid or expired token)`));
    }
});

io.on('connection', (socket: AuthenticatedSocket) => {
    // Tu lógica de io.on('connection', ...eventos...) se mantiene como la tenías.
    // Asegúrate de usar socket.user.userId y socket.user.username consistentemente.
    console.log(`Usuario conectado al chat: ${socket.id}, UserId: ${socket.user?.userId}, Username: ${socket.user?.username}`);

    socket.on('join_combat_chat', (data: { combatId: string }) => {
        if (!socket.user || !socket.user.userId) {
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
        console.log(`Usuario ${socket.user.username} (ID: ${socket.user.userId}, Socket: ${socket.id}) se unió a la sala: ${combatRoom}`);
        socket.to(combatRoom).emit('combat_chat_notification', { type: 'info', message: `${socket.user.username || 'Un oponente'} se ha unido al chat del combate.` });
        socket.emit('combat_chat_notification', { type: 'success', message: `Te has unido al chat del combate ${data.combatId}.`});
    });

    socket.on('send_combat_message', (data: { combatId: string; message: string }) => {
        if (!socket.user || !socket.user.userId) {
            socket.emit('combat_chat_error', { message: 'Usuario no autenticado para enviar mensaje.' });
            console.log(`Socket ${socket.id}: Intento de enviar mensaje sin autenticación completa (falta userId).`);
            return;
        }
        if (!data || !data.combatId || !data.message) {
            socket.emit('combat_chat_error', { message: 'combatId y message son requeridos.' });
            return;
        }
        const combatRoom = `combat_${data.combatId}`;
        const messageData: CombatChatMessage = {
            combatId: data.combatId,
            senderId: socket.user.userId,
            senderUsername: socket.user.username,
            message: data.message,
            timestamp: new Date().toISOString()
        };
        io.to(combatRoom).emit('receive_combat_message', messageData);
        console.log(`Mensaje ("${data.message}") enviado en ${combatRoom} por ${socket.user.username} (ID: ${socket.user.userId})`);
    });

    socket.on('typing_in_combat', (data: { combatId: string; isTyping: boolean }) => {
        if (!socket.user || !socket.user.userId || !data || !data.combatId) return;
        const combatRoom = `combat_${data.combatId}`;
        socket.to(combatRoom).emit('opponent_typing', { userId: socket.user.userId, username: socket.user.username, isTyping: data.isTyping });
    });

    socket.on('disconnect', (reason) => {
        console.log(`Usuario desconectado del chat: ${socket.id}, UserId: ${socket.user?.userId}, Username: ${socket.user?.username}. Razón: ${reason}`);
        if (socket.user) {
            socket.rooms.forEach(room => {
                if (room.startsWith('combat_')) {
                    socket.to(room).emit('combat_chat_notification', { type: 'info', message: `${socket.user?.username || 'Un oponente'} ha abandonado el chat.` });
                }
            });
        }
    });

    socket.on('error', (err) => {
        console.error(`Error en socket ${socket.id} (Usuario ${socket.user?.userId}, Username: ${socket.user?.username}): ${err.message}`);
        socket.emit('combat_chat_error', { message: `Error interno del socket: ${err.message}` });
    });
});
// --- Fin Lógica de Socket.IO ---

// Iniciar el servidor HTTP (que incluye Express y Socket.IO)
httpServer.listen(LOCAL_PORT, '0.0.0.0', () => { // Escuchar en 0.0.0.0 para Docker
    console.log(`Servidor Express y Chat Socket.IO escuchando en http://ea3-api.upc.edu (internamente en VM puerto ${LOCAL_PORT})`);
    console.log(`Swagger UI disponible en http://ea3-api.upc.edu/api-docs`);
});

// Eliminado el app.use(cors({...})) que estaba después de listen y era redundante/mal ubicado.
// El app.use('/api-docs', ...) ya está definido antes de listen.

// Logs de variables de Google (para verificar que se cargan desde .env que se copia a la imagen)
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("GOOGLE_OAUTH_REDIRECT_URL:", process.env.GOOGLE_OAUTH_REDIRECT_URL);