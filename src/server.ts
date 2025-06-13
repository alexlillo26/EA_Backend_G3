// src/server.ts — Servidor unificado para chat y notificaciones push

import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import webpush from 'web-push';
import { Types } from 'mongoose';

// Rutas y controladores
import authRoutes from './modules/auth/auth_routes.js';
import userRoutes from './modules/users/user_routes.js';
import gymRoutes from './modules/gyms/gym_routes.js';
import combatRoutes from './modules/combats/combat_routes.js';
import ratingRoutes from './modules/ratings/rating_routes.js';
import chatRoutes from './modules/chat/chat_routes.js';
import * as chatService from './modules/chat/chat_service.js';
import followerRoutes from './modules/followers/follower_routes.js';
import { verifyToken } from './utils/jwt.handle.js';
import { loggingHandler } from './middleware/loggingHandler.js';
import { setSocketIoInstance } from './modules/combats/combat_controller.js';

// Modelos necesarios
import Combat from './modules/combats/combat_models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const LOCAL_PORT = parseInt(process.env.SERVER_PORT || '9000', 10);
const httpServer = http.createServer(app);

// Configuración de Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:54385',
      'https://ea3.upc.edu',
      'https://ea3-back.upc.edu',
      'http://10.0.2.2',
      process.env.FLUTTER_APP_ORIGIN || '*'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configuración de Swagger
const swaggerSpec = swaggerJSDoc({
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
    security: [{ bearerAuth: [] }]
  },
  apis: ['../src/**/*.ts']
});

// Middlewares
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:54385',
    'https://ea3.upc.edu',
    'https://ea3-back.upc.edu'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(loggingHandler);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Montaje de rutas
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', gymRoutes);
app.use('/api', combatRoutes);
app.use('/api', ratingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/followers', followerRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// Rutas básicas
app.get('/', (_req, res) => res.send('Welcome to my API!'));
app.get('/ping', (_req, res) => res.send('pong'));

// Conexión a MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://mongo:27017/proyecto_fallback_db';
mongoose.connect(mongoUri)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err.message));

// Mapa global de sockets
(global as any).userSocketMap = new Map<string, string>();

// Tipos para el middleware de Socket.IO
interface UserPayload { id: string; email: string; username?: string; name?: string; }
interface CustomSocket extends Socket { user?: { userId: string; email: string; nameToDisplay: string }; }

// Autenticación de sockets
io.use(async (socket: CustomSocket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) return next(new Error('Authentication error: No token provided'));
  try {
    const decoded = await verifyToken(token) as UserPayload;
    socket.user = {
      userId: decoded.id,
      email: decoded.email,
      nameToDisplay: decoded.username || decoded.name || 'Usuario'
    };
    (global as any).userSocketMap.set(socket.user.userId, socket.id);
    socket.join(socket.user.userId);
    next();
  } catch (err: any) {
    next(new Error(`Authentication error: ${err.message}`));
  }
});

// Manejo de conexiones Socket.IO
io.on('connection', (socket: CustomSocket) => {
  if (!socket.user) return;
  const { userId, nameToDisplay } = socket.user;

  // — Chat Flutter —
  socket.on('join_chat_room', ({ conversationId }) => {
    socket.join(`conversation_${conversationId}`);
  });
  socket.on('send_message', async ({ conversationId, message }) => {
    const saved = await chatService.addMessageToConversation(
      conversationId,
      userId,
      nameToDisplay,
      message
    );
    io.to(`conversation_${conversationId}`).emit('new_message', {
      conversationId,
      senderId: userId,
      senderUsername: nameToDisplay,
      message,
      timestamp: saved.createdAt.toISOString()
    });
  });
  socket.on('typing_started', ({ conversationId }) => {
    socket.to(`conversation_${conversationId}`).emit('opponent_typing', {
      conversationId, userId, username: nameToDisplay, isTyping: true
    });
  });
  socket.on('typing_stopped', ({ conversationId }) => {
    socket.to(`conversation_${conversationId}`).emit('opponent_typing', {
      conversationId, userId, username: nameToDisplay, isTyping: false
    });
  });

  // — Combates y notificaciones Web —
  socket.on('sendCombatInvitation', ({ opponentId, combat }) => {
    const target = (global as any).userSocketMap.get(opponentId);
    if (target) io.to(target).emit('new_invitation', combat);
  });
  socket.on('respond_combat', ({ combatId, status }) => {
    socket.broadcast.emit('combat_response', { combatId, status });
  });

  socket.on('disconnect', () => {
    (global as any).userSocketMap.delete(userId);
  });
});

// Configuración Web Push
webpush.setVapidDetails(
  'mailto:admin@ea3.upc.edu',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// Pasar instancia de io al controlador de combates
setSocketIoInstance(io);

// Iniciar servidor
httpServer.listen(LOCAL_PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en http://localhost:${LOCAL_PORT}`);
  console.log(`Swagger docs: http://localhost:${LOCAL_PORT}/api-docs`);
});

// Debug variables
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_OAUTH_REDIRECT_URL:', process.env.GOOGLE_OAUTH_REDIRECT_URL);
