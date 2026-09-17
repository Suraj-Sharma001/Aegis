import { Router } from 'express';
import {
  createApplication,
  listApplications,
  createApiKey,
  listApiKeys,
  listAuditLogs,
} from '../controllers/application.controller.js';
import { getAnalytics } from '../controllers/analytics.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', listApplications);
router.post('/', requireRole('ADMIN', 'DEVELOPER'), createApplication);
router.post('/:id/keys', requireRole('ADMIN', 'DEVELOPER'), createApiKey);
router.get('/:id/keys', listApiKeys);
router.get('/:id/analytics', getAnalytics);
router.get('/:id/logs', listAuditLogs);

export default router;
