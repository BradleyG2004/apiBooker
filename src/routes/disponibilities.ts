import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { registerDisp , listDisp, autoUpdt } from '../controllers/disp.controller';


const router = Router();

router.post('/register', authenticateToken,registerDisp);
router.get('/',listDisp);
router.patch('/auto-updt',autoUpdt);

export default router;
