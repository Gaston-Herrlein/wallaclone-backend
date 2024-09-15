import express from 'express';
import { guardarChat, getUserConversations, getOrCreateChat } from '../controllers/chatController';
import jwtAuthMiddleware from '../middleware/jwtAuth';

const router = express.Router();

router.post('/', jwtAuthMiddleware, guardarChat); 
router.get('/', jwtAuthMiddleware, getUserConversations);
router.get('/messages/', jwtAuthMiddleware, getOrCreateChat);

export default router;