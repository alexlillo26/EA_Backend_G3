import { Router } from 'express';
import UsersController from '../controllers/usersController';

const router = Router();
const usersController = new UsersController();

router.post('/users', usersController.createUser);
router.get('/users/:id', usersController.getUser);
router.put('/users/:id', usersController.updateUser);
router.delete('/users/:id', usersController.deleteUser);

export default function setUsersRoutes(app) {
    app.use('/api', router);
}