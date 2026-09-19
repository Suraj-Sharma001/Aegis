import { Router } from 'express';
import { addProviderKey, listProviderKeys, deleteProviderKey } from '../controllers/providerKey.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', listProviderKeys);
router.post('/', requireRole('ADMIN'), addProviderKey);
router.delete('/:id', requireRole('ADMIN'), deleteProviderKey);

export default router;
