import { Router } from 'express';
import {
  createTeam,
  listTeams,
  listTeamMembers,
  addTeamMember,
  removeTeamMember,
} from '../controllers/team.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', listTeams);
router.post('/', requireRole('ADMIN'), createTeam);
router.get('/:id/members', requireRole('ADMIN'), listTeamMembers);
router.post('/:id/members', requireRole('ADMIN'), addTeamMember);
router.delete('/:id/members/:userId', requireRole('ADMIN'), removeTeamMember);

export default router;
