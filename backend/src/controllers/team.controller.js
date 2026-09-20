import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';

// POST /teams — Admin only. Creates a new team in the caller's org.
export async function createTeam(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const team = await prisma.team.create({
      data: { name, organizationId: req.user.organizationId },
    });

    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
}

// GET /teams — lists teams. Admins see every team in the org (needed to
// assign applications to any team); Developers/Viewers only see teams
// they're already a member of (so the "create application" team picker
// only offers teams they can actually use).
export async function listTeams(req, res, next) {
  try {
    const where =
      req.user.role === 'ADMIN'
        ? { organizationId: req.user.organizationId }
        : { organizationId: req.user.organizationId, members: { some: { userId: req.user.id } } };

    const teams = await prisma.team.findMany({
      where,
      include: {
        _count: { select: { applications: true, members: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(teams);
  } catch (err) {
    next(err);
  }
}

// GET /teams/:id/members — Admin only. Lists who's on a team.
export async function listTeamMembers(req, res, next) {
  try {
    const { id: teamId } = req.params;

    const team = await prisma.team.findFirst({
      where: { id: teamId, organizationId: req.user.organizationId },
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    res.json(members.map((m) => ({ ...m.user, joinedAt: m.joinedAt })));
  } catch (err) {
    next(err);
  }
}

// POST /teams/:id/members — Admin only. Adds someone to a team.
// If the email already belongs to a user in this org, just adds the
// membership (handles "same person, second team"). Otherwise creates a
// brand-new account with the given initial password — no email/invite
// infrastructure needed.
export async function addTeamMember(req, res, next) {
  try {
    const { id: teamId } = req.params;
    const { email, name, password, role } = req.body;

    const team = await prisma.team.findFirst({
      where: { id: teamId, organizationId: req.user.organizationId },
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (!email) return res.status(400).json({ error: 'email is required' });

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (user.organizationId !== req.user.organizationId) {
        return res.status(400).json({ error: 'This email belongs to a user in a different organization' });
      }
    } else {
      if (!name || !password) {
        return res.status(400).json({ error: 'name and password are required when creating a new user' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: role && ['ADMIN', 'DEVELOPER', 'VIEWER'].includes(role) ? role : 'DEVELOPER',
          organizationId: req.user.organizationId,
        },
      });
    }

    const membership = await prisma.teamMember.upsert({
      where: { userId_teamId: { userId: user.id, teamId } },
      update: {},
      create: { userId: user.id, teamId },
    });

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      joinedAt: membership.joinedAt,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /teams/:id/members/:userId — Admin only. Removes someone from a team.
export async function removeTeamMember(req, res, next) {
  try {
    const { id: teamId, userId } = req.params;

    const team = await prisma.team.findFirst({
      where: { id: teamId, organizationId: req.user.organizationId },
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    await prisma.teamMember.deleteMany({ where: { teamId, userId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
