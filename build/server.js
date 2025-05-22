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
const app = express();
const LOCAL_PORT = parseInt(process.env.SERVER_PORT || '9000', 10);
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: [
            "http://ea3.upc.edu",
            "http://ea3-back.upc.edu",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost",
            `http://localhost:${LOCAL_PORT}`,
            "http://10.0.2.2",
            process.env.FLUTTER_APP_ORIGIN || "*"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Usuarios',
            version: '1.0.0',
            description: 'Documentación de la API de Usuarios'
        },
        tags: [
            { name: 'Auth', description: 'Rutas relacionadas con la autenticación' },
            { name: 'Users', description: 'Rutas relacionadas con la gestión de usuarios' },
            { name: 'Gym', description: 'Rutas relacionadas con los gimnasios' },
            { name: 'Combat', description: 'Rutas relacionadas con los combates' },
            { name: 'Main', description: 'Rutas principales de la API' }
        ],
        servers: [
            {
                url: 'http://ea3-api.upc.edu',
                description: 'Servidor Desplegado (UPC)'
            },
            {
                url: `http://localhost:${LOCAL_PORT}`,
                description: 'Servidor Local de Desarrollo'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: [
        './src/server.ts',
        './src/modules/auth/*.ts',
        './src/modules/users/*.ts',
        './src/modules/gyms/*.ts',
        './src/modules/combats/*.ts'
    ]
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);
// Este console.log es CRUCIAL para depurar qué está generando swagger-jsdoc
console.log('Generated Swagger Spec:', JSON.stringify(swaggerSpec, null, 2));
/**
 * @openapi
 * /ping_test_swagger:
 * get:
 * tags:
 * - Main
 * summary: Endpoint de prueba simple para Swagger
 * responses:
 * '200':
 * description: Respuesta exitosa de prueba
 * content:
 * text/plain:
 * schema:
 * type: string
 * example: pong test
 */
app.get('/ping_test_swagger', (_req, res) => {
    res.send('pong test para swagger');
});
app.use(express.json());
app.use(corsHandler);
app.use(loggingHandler);
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', gymRoutes);
app.use('/api/combat', combatRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/', (req, res) => {
    res.send('Welcome to my API');
});
app.get('/ping', (_req, res) => {
    console.log('Request a /ping recibido');
    res.send('pong');
});
const mongoUriToConnect = process.env.MONGODB_URI || 'mongodb://localhost:27017/proyecto';
mongoose
    .connect(mongoUriToConnect)
    .then(() => console.log('Conectado a MongoDB exitosamente'))
    .catch((error) => console.error('Error de conexión a MongoDB:', error));
io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }
    try {
        const decodedPayload = yield verifyToken(token);
        socket.user = { userId: decodedPayload.id, username: decodedPayload.username, email: decodedPayload.email };
        console.log(`Socket ${socket.id}: Autenticado. UserID: ${socket.user.userId}, Username: ${socket.user.username}`);
        next();
    }
    catch (err) {
        return next(new Error(`Authentication error: ${err.message} (Invalid or expired token)`));
    }
}));
io.on('connection', (socket) => {
    var _a, _b;
    console.log(`Usuario conectado al chat: ${socket.id}, UserId: ${(_a = socket.user) === null || _a === void 0 ? void 0 : _a.userId}, Username: ${(_b = socket.user) === null || _b === void 0 ? void 0 : _b.username}`);
    socket.on('join_combat_chat', (data) => { });
    socket.on('send_combat_message', (data) => { });
    socket.on('typing_in_combat', (data) => { });
    socket.on('disconnect', (reason) => { });
    socket.on('error', (err) => { });
});
// --- Fin Lógica de Socket.IO ---
httpServer.listen(LOCAL_PORT, '0.0.0.0', () => {
    console.log(`Servidor Express y Chat Socket.IO escuchando en http://ea3-api.upc.edu (internamente en VM puerto ${LOCAL_PORT})`);
    console.log(`Swagger UI disponible en http://ea3-api.upc.edu/api-docs (y localmente en http://localhost:${LOCAL_PORT}/api-docs si usas port-forwarding o corres local)`);
});
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("GOOGLE_OAUTH_REDIRECT_URL:", process.env.GOOGLE_OAUTH_REDIRECT_URL);
