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
    .connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/proyecto')
    //.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/proyecto')
    .then(() => console.log('Connected to DB'))
    .catch((error) => console.error('DB Connection Error:', error));




// -------------------- LÓGICA DE CHAT SOCKET.IO PARA COMBATES --------------------

// Interfaz para la información del usuario decodificada del token
interface AuthenticatedUser {
    userId: string;
    username?: string; // o cualquier otro campo que tengas en tu token
    // ...otros campos del payload del JWT
}

// Extender el tipo Socket para incluir la información del usuario
interface AuthenticatedSocket extends Socket {
    user?: AuthenticatedUser;
}

// Interfaz para mensajes de chat de combate
interface CombatChatMessage {
    combatId: string;
    senderId: string; // ID del usuario que envía
    senderUsername?: string; // Nombre de usuario del que envía (opcional, del token)
    message: string;
    timestamp: string;
}

/**
 * @openapi
 * components:
 * schemas:
 * CombatChatMessage:
 * type: object
 * properties:
 * combatId:
 * type: string
 * description: ID del combate al que pertenece el mensaje.
 * senderId:
 * type: string
 * description: ID del usuario que envió el mensaje.
 * senderUsername:
 * type: string
 * description: Nombre de usuario del remitente.
 * message:
 * type: string
 * description: Contenido del mensaje.
 * timestamp:
 * type: string
 * format: date-time
 * description: Fecha y hora del mensaje.
 * sockets:
 * CombatChat:
 * description: Namespace para el chat de combates. (Conceptualmente, aunque aquí no usamos namespace explícito)
 * clientEvents:
 * join_combat_chat:
 * summary: Unirse a la sala de chat de un combate específico.
 * payload:
 * type: object
 * properties:
 * combatId:
 * type: string
 * send_combat_message:
 * summary: Enviar un mensaje al chat de un combate.
 * payload:
 * $ref: '#/components/schemas/CombatChatMessage' # O una versión simplificada que el servidor completará
 * serverEvents:
 * receive_combat_message:
 * summary: Recibir un nuevo mensaje en el chat de un combate.
 * payload:
 * $ref: '#/components/schemas/CombatChatMessage'
 * combat_chat_notification:
 * summary: Notificaciones generales del chat del combate (ej. usuario unido/ido).
 * payload:
 * type: object
 * properties:
 * message:
 * type: string
 * type:
 * type: string
 * enum: [info, error, success]
 */

// Middleware de autenticación para Socket.IO (se ejecuta al intentar conectar)
io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
        console.log(`Socket ${socket.id}: Conexión rechazada - Sin token.`);
        return next(new Error('Authentication error: No token provided'));
    }

    try {
        // verifyAccessToken debería devolver el payload del token o lanzar un error
        interface DecodedJWTPayload {
            userId: string;
            username?: string; // Add other fields as needed
        }
        const decodedPayload = await verifyToken(token) as unknown as DecodedJWTPayload; // Convert to 'unknown' first to resolve type conflict
        const authenticatedUser: AuthenticatedUser = {
            userId: decodedPayload.userId, // Ensure userId exists in DecodedJWTPayload
            username: decodedPayload.username // Map other fields as needed
        };
        socket.user = authenticatedUser; // Adjuntar información del usuario al socket
        socket.user = decodedPayload; // Adjuntar información del usuario al socket
        console.log(`Socket ${socket.id}: Autenticado correctamente. Usuario: ${decodedPayload.userId}`);
        next(); // Token válido, proceder con la conexión
    } catch (err: any) {
        console.log(`Socket ${socket.id}: Conexión rechazada - Token inválido. Error: ${err.message}`);
        return next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Usuario conectado al chat: ${socket.id}, UserId: ${socket.user?.userId}`);

    // Evento para unirse a la sala de chat de un combate específico
    socket.on('join_combat_chat', (data: { combatId: string }) => {
        if (!socket.user) {
            socket.emit('combat_chat_error', { message: 'Usuario no autenticado para unirse al chat.' });
            return;
        }
        if (!data || !data.combatId) {
            socket.emit('combat_chat_error', { message: 'combatId es requerido para unirse al chat.' });
            return;
        }

        const combatRoom = `combat_${data.combatId}`;
        socket.join(combatRoom);
        console.log(`Usuario ${socket.user.userId} (Socket ${socket.id}) se unió a la sala del combate: ${combatRoom}`);

        // Notificar al otro participante en la sala (si hay alguno)
        // El 'to' envía a todos en la sala excepto al socket actual.
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
        if (!socket.user) {
            socket.emit('combat_chat_error', { message: 'Usuario no autenticado para enviar mensaje.' });
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

        // Enviar el mensaje a todos en la sala del combate (incluyendo al remitente)
        io.to(combatRoom).emit('receive_combat_message', messageData);
        console.log(`Mensaje enviado en ${combatRoom} por ${socket.user.userId}: "${data.message}"`);
    });

    // Evento para indicar que el usuario está escribiendo
    socket.on('typing_in_combat', (data: { combatId: string; isTyping: boolean }) => {
        if (!socket.user || !data || !data.combatId) return;
        const combatRoom = `combat_${data.combatId}`;
        socket.to(combatRoom).emit('opponent_typing', {
            userId: socket.user.userId,
            username: socket.user.username,
            isTyping: data.isTyping
        });
    });


    // Manejar desconexión
    socket.on('disconnect', (reason) => {
        console.log(`Usuario desconectado del chat: ${socket.id}, UserId: ${socket.user?.userId}. Razón: ${reason}`);
        if (socket.user) {
            // Notificar a las salas de combate en las que estaba el usuario
            // socket.rooms es un Set que incluye el ID del socket como una sala.
            socket.rooms.forEach(room => {
                if (room.startsWith('combat_')) { // Solo notificar a las salas de combate
                    socket.to(room).emit('combat_chat_notification', {
                        type: 'info',
                        message: `${socket.user?.username || 'Un oponente'} ha abandonado el chat.`
                    });
                }
            });
        }
    });

    // Manejar errores de socket post-conexión (la autenticación ya se hizo en io.use)
    socket.on('error', (err) => {
        console.error(`Error en socket ${socket.id} (Usuario ${socket.user?.userId}): ${err.message}`);
        // Podrías emitir un error genérico al cliente si es apropiado
        socket.emit('combat_chat_error', { message: `Error interno del socket: ${err.message}` });
    });
});



// Iniciar el servidor HTTP (que incluye Express y Socket.IO)
httpServer.listen(LOCAL_PORT, () => {
    console.log(`Servidor Express y Chat Socket.IO escuchando en http://localhost:${LOCAL_PORT}`);
    console.log(`Swagger disponible en http://localhost:${LOCAL_PORT}/api-docs`);
});



app.use(cors(
    {
        origin: 'http://localhost:3000', // Cambia '*' por la URL de tu frontend si es necesario
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'], }
))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Ensure Swagger is accessible

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("GOOGLE_OAUTH_REDIRECT_URL:", process.env.GOOGLE_OAUTH_REDIRECT_URL);