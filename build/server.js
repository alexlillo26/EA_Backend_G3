import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './modules/users/user_routes.js'; // Nota el .js al final
import gymRoutes from './modules/gyms/gym_routes.js'; // Nota el .js al final
import combatRoutes from './modules/combats/combat_routes.js'; // Nota el .js al final
import { corsHandler } from './middleware/corsHandler.js';
import { loggingHandler } from './middleware/loggingHandler.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import cors from 'cors';
dotenv.config(); // Cargamos las variables de entorno desde el archivo .env
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
            }
        ],
        servers: [
            {
                url: `http://localhost:${LOCAL_PORT}`
            }
        ]
    },
    apis: ['./modules/users/*.js', './modules/gyms/*.js', './modules/combats/*.js'] // Asegúrate de que esta ruta apunta a tus rutas
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-subjects', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Middleware
app.use(express.json());
app.use(loggingHandler);
app.use(corsHandler);
//rutas
app.use('/api', userRoutes);
app.use('/api', gymRoutes);
app.use('/api', combatRoutes);
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
