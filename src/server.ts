import dotenv from 'dotenv';
dotenv.config(); // Ensure this is at the top of the file



import express from 'express';
import mongoose from 'mongoose';
import http from 'http'; // Necesario para Socket.IO
import { Server as SocketIOServer, Socket } from 'socket.io'; // Importar Server y Socket de socket.io
import { verifyToken } from './utils/jwt.handle.js'; // Cambia a verifyToken
import userRoutes from './modules/users/user_routes.js'; // Nota el .js al final
import gymRoutes from './modules/gyms/gym_routes.js'; // Nota el .js al final
import combatRoutes from './modules/combats/combat_routes.js'; 
import authRoutes from './modules/auth/auth_routes.js'; // Ensure this file exists
import { corsHandler } from './middleware/corsHandler.js';
import { loggingHandler } from './middleware/loggingHandler.js';
import { routeNotFound } from './middleware/routeNotFound.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import cors from 'cors';

const app = express();
 
const LOCAL_PORT = process.env.SERVER_PORT || 9000;

// Crear un servidor HTTP a partir de la app de Express
const httpServer = http.createServer(app);

// Configurar Socket.IO, adjuntándolo al mismo servidor HTTP
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: [
            "http://localhost:3000", // Si tienes un frontend web en este puerto
            "http://localhost", // Para pruebas locales de Flutter web
            // Para emulador Android, el host es 10.0.2.2. Flutter se conectará a esta IP y al puerto LOCAL_PORT
            "http://10.0.2.2",
            // Añade aquí la URL de tu app Flutter cuando esté en producción o en pruebas en dispositivo físico
            // Ejemplo: si tu servidor está en 192.168.1.100, Flutter se conectaría a http://192.168.1.100:LOCAL_PORT
            // Considera usar una variable de entorno para el origen en producción.
            process.env.FLUTTER_APP_ORIGIN || "*" // En desarrollo puedes usar '*', pero sé específico en producción
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
            title: 'API de Usuarios',
            version: '1.0.0',
            description: 'Documentación de la API de Usuarios'
        },
        tags: [
            {
              name: 'Users',
              description: 'Rutas relacionadas con la gestión de usuarios',
            },
            {
              name: 'Gym',
              description: 'Rutas relacionadas con los gimnasios',
            },
            {
              name: 'Main',
              description: 'Rutas principales de la API',
            },
            {
                name: 'Combat',
                description: 'Rutas relacionadas con los combates',
            },
            {
                name: 'Auth',
                description: 'Rutas relacionadas con la autenticación',
            }
          ],
        servers: [
            {
                url: `http://localhost:${LOCAL_PORT}`
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./modules/users/*.js', './modules/gyms/*.js', './modules/combats/*.js', './modules/auth/*.ts'] // Incluye auth/*.ts
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use('/api-subjects', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Middleware
app.use(express.json());
app.use(corsHandler); // Ensure CORS middleware is applied
app.use(loggingHandler); // Ensure logging middleware is applied
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
//rutas
app.use('/api', userRoutes);
app.use('/api', gymRoutes);
app.use('/api', combatRoutes);
app.use('/api/auth', authRoutes); // Ensure this line is present and correct


// Rutes de prova
app.get('/', (req, res) => {
    res.send('Welcome to my API');
});

// Conexión a MongoDB
//mongoose;
mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/proyecto')
    //.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/proyecto')
    .then(() => console.log('Connected to DB'))
    .catch((error) => console.error('DB Connection Error:', error));




// -------------------- LÓGICA DE CHAT SOCKET.IO PARA COMBATES --------------------

// --- CAMBIO IMPORTANTE: Interfaz para el payload del JWT decodificado ---
// Esta interfaz debe reflejar EXACTAMENTE lo que verifyToken devuelve y lo que guardas en tu token.
// Basado en tus logs de `[jwt.handle.ts] Token decodificado...`, tu token contiene 'id', 'email', 'username'.
interface DecodedJWTPayload {
    id: string;       // El ID del usuario
    email: string;    // El email del usuario
    username: string; // El nombre de usuario
    iat?: number;     // Issued At (opcional, lo añade JWT)
    exp?: number;     // Expiration Time (opcional, lo añade JWT)
}

// --- CAMBIO IMPORTANTE: Interfaz para el objeto 'user' que adjuntaremos al socket ---
// Esta es la estructura que tendrá 'socket.user' después de la autenticación.
interface AuthenticatedUser {
    userId: string;   // Usaremos 'userId' consistentemente en socket.user para el ID.
    username: string; // Usaremos 'username' consistentemente en socket.user para el nombre.
    email?: string;   // Opcional, si lo necesitas en el socket.user
}

// Extender el tipo Socket para incluir la información del usuario
interface AuthenticatedSocket extends Socket {
    user?: AuthenticatedUser; // socket.user tendrá la estructura de AuthenticatedUser
}

// --- CAMBIO IMPORTANTE: Interfaz para mensajes de chat de combate ---
// Asegúrate de que esta interfaz incluya senderId, ya que es crucial para el cliente.
interface CombatChatMessage {
    combatId: string;
    senderId: string;         // ID del usuario que envía el mensaje (debe ser socket.user.userId)
    senderUsername?: string; // Nombre de usuario del que envía (debe ser socket.user.username)
    message: string;
    timestamp: string;
}

/**
 * @openapi
 * ... (tu documentación OpenAPI para sockets se mantiene igual) ...
 */

// Middleware de autenticación para Socket.IO (se ejecuta al intentar conectar)
io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
        console.log(`Socket ${socket.id}: Conexión rechazada - Sin token.`);
        return next(new Error('Authentication error: No token provided'));
    }

    try {
        // --- CAMBIO IMPORTANTE en la verificación y asignación del payload ---
        // 1. verifyToken devuelve un payload con 'id', 'email', 'username' (como DecodedJWTPayload)
        const decodedPayload = await verifyToken(token) as DecodedJWTPayload;

        // 2. Creamos el objeto 'authenticatedUser' que se adjuntará a socket.user.
        // Mapeamos 'id' del token a 'userId' en nuestro objeto 'socket.user'.
        const authenticatedUser: AuthenticatedUser = {
            userId: decodedPayload.id,       // 'id' del token se convierte en 'userId' para el socket
            username: decodedPayload.username, // 'username' del token se convierte en 'username' para el socket
            email: decodedPayload.email      // 'email' del token (opcional guardarlo en socket.user)
        };

        // 3. Adjuntamos el objeto 'authenticatedUser' formateado al socket.
        socket.user = authenticatedUser;

        // Log para verificar que los datos correctos se están asignando
        console.log(`Socket ${socket.id}: Autenticado correctamente. UserID: ${socket.user.userId}, Username: ${socket.user.username}`);
        next(); // Token válido, proceder con la conexión

    } catch (err: any) {
        console.log(`Socket ${socket.id}: Conexión rechazada - Token inválido o expirado. Error: ${err.message}`);
        return next(new Error(`Authentication error: ${err.message} (Invalid or expired token)`));
    }
});

io.on('connection', (socket: AuthenticatedSocket) => {
    // --- CAMBIO IMPORTANTE en el log de conexión ---
    // Usamos socket.user.userId y socket.user.username consistentemente.
    console.log(`Usuario conectado al chat: ${socket.id}, UserId: ${socket.user?.userId}, Username: ${socket.user?.username}`);

    // Evento para unirse a la sala de chat de un combate específico
    socket.on('join_combat_chat', (data: { combatId: string }) => {
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
    socket.on('send_combat_message', (data: { combatId: string; message: string }) => {
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
        const messageData: CombatChatMessage = {
            combatId: data.combatId,
            senderId: socket.user.userId,         // ¡Este campo es crucial para el cliente!
            senderUsername: socket.user.username, // Nombre del remitente
            message: data.message,
            timestamp: new Date().toISOString()
        };

        io.to(combatRoom).emit('receive_combat_message', messageData); // Enviar a todos en la sala
        // Log mejorado
        console.log(`Mensaje ("${data.message}") enviado en ${combatRoom} por ${socket.user.username} (ID: ${socket.user.userId})`);
    });

    // Evento para indicar que el usuario está escribiendo
    socket.on('typing_in_combat', (data: { combatId: string; isTyping: boolean }) => {
        // --- CAMBIO IMPORTANTE: Verificar socket.user y socket.user.userId ---
        if (!socket.user || !socket.user.userId || !data || !data.combatId) return;

        const combatRoom = `combat_${data.combatId}`;
        socket.to(combatRoom).emit('opponent_typing', {
            userId: socket.user.userId, // Enviar el userId
            username: socket.user.username, // Enviar el username
            isTyping: data.isTyping
        });
    });

    // Manejar desconexión
    socket.on('disconnect', (reason) => {
        console.log(`Usuario desconectado del chat: ${socket.id}, UserId: ${socket.user?.userId}, Username: ${socket.user?.username}. Razón: ${reason}`);
        if (socket.user) {
            socket.rooms.forEach(room => {
                if (room.startsWith('combat_')) {
                    socket.to(room).emit('combat_chat_notification', {
                        type: 'info',
                        message: `${socket.user?.username || 'Un oponente'} ha abandonado el chat.`
                    });
                }
            });
        }
    });

    // Manejar errores de socket post-conexión
    socket.on('error', (err) => {
        console.error(`Error en socket ${socket.id} (Usuario ${socket.user?.userId}, Username: ${socket.user?.username}): ${err.message}`);
        socket.emit('combat_chat_error', { message: `Error interno del socket: ${err.message}` });
    });
});

// Iniciar el servidor HTTP (que incluye Express y Socket.IO)
httpServer.listen(LOCAL_PORT, () => {
    console.log(`Servidor Express y Chat Socket.IO escuchando en http://localhost:${LOCAL_PORT}`);
    console.log(`Swagger disponible en http://localhost:${LOCAL_PORT}/api-docs`);
});

app.use(cors({
    origin: ['*'], // Añade la IP del servidor
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Configuración de CORS para Express (sin cambios)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("GOOGLE_OAUTH_REDIRECT_URL:", process.env.GOOGLE_OAUTH_REDIRECT_URL);