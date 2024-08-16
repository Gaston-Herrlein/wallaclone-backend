import express from 'express';
import { recoveryPass, resetPass, updatePass } from '../controllers/userController';
import jwtAuthMiddleware from '../middleware/jwtAuth';

const router = express.Router();

router.post('/recuperar-contrasena', recoveryPass);
router.post('/restablecer-contrasena', resetPass);
router.put('/actualizar-contrasena', jwtAuthMiddleware, updatePass);

export default router;
