import express, { Router } from 'express';
import SparringController from '../controllers/sparringController';

const router = Router();
const sparringController = new SparringController();

router.post('/sparrings', sparringController.createSparring);
router.get('/sparrings/:id', sparringController.getSparring);
router.put('/sparrings/:id', sparringController.updateSparring);
router.delete('/sparrings/:id', sparringController.deleteSparring);

export default function setSparringRoutes(app: express.Application) {
    app.use('/api', router);
}