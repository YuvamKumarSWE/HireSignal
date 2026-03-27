import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { syncUser, getMyInterviews } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/', requireAuth, syncUser);
router.get('/interviews', requireAuth, getMyInterviews);

export default router;
