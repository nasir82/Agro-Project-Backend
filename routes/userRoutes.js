import express from 'express';
import UserController from '../controllers/userController';

const router = express.Router();
const userController = new UserController();

const setUserRoutes = (app) => {
    router.post('/register', userController.createUser);
    router.post('/login', userController.authenticateUser);
    router.get('/:id', userController.getUser);

    app.use('/api/users', router);
};

export default setUserRoutes;