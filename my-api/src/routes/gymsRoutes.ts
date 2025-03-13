import express, { Router } from 'express';
import { GymsController } from '../controllers/gymsController';

const router = Router();
const gymsController = new GymsController();

router.post('/gyms', gymsController.createGym);
router.get('/gyms/:id', gymsController.getGym);
router.put('/gyms/:id', gymsController.updateGym);
router.delete('/gyms/:id', gymsController.deleteGym);

export default function setGymsRoutes(app: express.Application) {
    app.use('/api', router);
}