import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { registerDisp , listDisp } from '../controllers/disp.controller';


const router = Router();

router.post('/register', authenticateToken,registerDisp);
router.get('/',listDisp);

export default router;
