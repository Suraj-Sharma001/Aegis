import { prisma } from '../config/prisma.js';

// The single place that decides "can this user see this application?" —
// used by every endpoint that reads an application's keys/analytics/logs,
// so the rule can never drift between endpoints (this was the exact gap
// flagged during design: checking org membership alone isn't enough once
// teams exist within an org).
//
// Rule: ADMIN → yes, always (within their own org). DEVELOPER/VIEWER →
// only if they're a member of the application's team.
//
// Throws a 403 AppError-shaped error if access isn't allowed, or a 404 if
// the application doesn't exist in their org at all (never leaks whether
// an application exists in a DIFFERENT org — same as before).
export async function assertCanAccessApplication(user, applicationId) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, organizationId: user.organizationId },
  });

  if (!application) {
    const err = new Error('Application not found');
    err.statusCode = 404;
    err.expose = true;
    throw err;
  }

  if (user.role === 'ADMIN') {
    return application; // Admins bypass team filtering entirely.
  }

  if (!application.teamId) {
    // Shouldn't happen after the backfill script runs, but fail closed
    // rather than open if it ever does.
    const err = new Error('You do not have access to this application');
    err.statusCode = 403;
    err.expose = true;
    throw err;
  }

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: user.id, teamId: application.teamId } },
  });

  if (!membership) {
    const err = new Error('You do not have access to this application');
    err.statusCode = 403;
    err.expose = true;
    throw err;
  }

  return application;
}

// Returns the list of teamIds a user belongs to — used to scope the
// Applications list for non-Admins.
export async function getUserTeamIds(userId) {
  const memberships = await prisma.teamMember.findMany({ where: { userId }, select: { teamId: true } });
  return memberships.map((m) => m.teamId);
}
