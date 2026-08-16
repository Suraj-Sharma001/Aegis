import { Router } from 'express';
import { createApplication, listApplications, createApiKey } from '../controllers/application.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth); // every route below requires a logged-in dashboard user

router.get('/', listApplications);
router.post('/', requireRole('ADMIN', 'DEVELOPER'), createApplication);
router.post('/:id/keys', requireRole('ADMIN', 'DEVELOPER'), createApiKey);

export default router;
