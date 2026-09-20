// One-time script: run once, right after the Teams migration.
// For every organization, creates a "Default Team" (if it doesn't already
// have one) and assigns any applications with no team to it — so nothing
// that existed before Teams silently disappears from anyone's view.
//
// Safe to run more than once — it only touches orgs/apps that still need it.
//
// Run with: node scripts/backfill-teams.js

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  let teamsCreated = 0;
  let appsAssigned = 0;

  for (const org of orgs) {
    const orphanApps = await prisma.application.findMany({
      where: { organizationId: org.id, teamId: null },
    });

    if (orphanApps.length === 0) continue;

    let defaultTeam = await prisma.team.findFirst({
      where: { organizationId: org.id, name: 'Default Team' },
    });

    if (!defaultTeam) {
      defaultTeam = await prisma.team.create({
        data: { name: 'Default Team', organizationId: org.id },
      });
      teamsCreated++;
      console.log(`[backfill] Created "Default Team" for org "${org.name}" (${org.id})`);
    }

    // Also make sure every ADMIN in this org is a member of the default
    // team — not strictly required (Admins bypass team filtering anyway),
    // but keeps things consistent if that ever changes.
    const admins = await prisma.user.findMany({
      where: { organizationId: org.id, role: 'ADMIN' },
    });
    for (const admin of admins) {
      await prisma.teamMember.upsert({
        where: { userId_teamId: { userId: admin.id, teamId: defaultTeam.id } },
        update: {},
        create: { userId: admin.id, teamId: defaultTeam.id },
      });
    }

    for (const app of orphanApps) {
      await prisma.application.update({
        where: { id: app.id },
        data: { teamId: defaultTeam.id },
      });
      appsAssigned++;
    }
    console.log(`[backfill] Assigned ${orphanApps.length} application(s) in org "${org.name}" to Default Team`);
  }

  console.log(`[backfill] Done. Teams created: ${teamsCreated}, applications assigned: ${appsAssigned}`);
}

main()
  .catch((err) => {
    console.error('[backfill] Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
