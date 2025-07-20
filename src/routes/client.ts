import { Router } from 'express';
import { registerClient } from '../controllers/client.controller';

const router = Router();

router.post('/register', registerClient);

export default router;