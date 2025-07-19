import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { registerDisp } from '../controllers/disp.controller';


const router = Router();

router.post('/register', authenticateToken,registerDisp);

export default router;
