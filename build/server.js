import dotenv from 'dotenv';
dotenv.config(); // Ensure this is at the top of the file
import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './modules/users/user_routes.js'; // Nota el .js al final
import gymRoutes from './modules/gyms/gym_routes.js'; // Nota el .js al final
import combatRoutes from './modules/combats/combat_routes.js';
import authRoutes from './modules/auth/auth_routes.js'; // Ensure this file exists
import { corsHandler } from './middleware/corsHandler.js';
import { loggingHandler } from './middleware/loggingHandler.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
const app = express();
const LOCAL_PORT = process.env.SERVER_PORT || 9000;
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
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/proyecto')
    .then(() => console.log('Connected to DB'))
    .catch((error) => console.error('DB Connection Error:', error));
// Iniciar el servidor
app.listen(LOCAL_PORT, () => {
    console.log('Server listening on port: ' + LOCAL_PORT);
    console.log(`Swagger disponible a http://localhost:${LOCAL_PORT}/api-subjects`);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Ensure Swagger is accessible
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("GOOGLE_OAUTH_REDIRECT_URL:", process.env.GOOGLE_OAUTH_REDIRECT_URL);
