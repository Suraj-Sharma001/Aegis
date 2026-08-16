import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { signToken } from '../lib/jwt.js';
import { registerSchema, loginSchema, validate } from '../utils/validators.js';

// POST /auth/register — creates a new Organization + first ADMIN user
export async function register(req, res, next) {
  try {
    const data = validate(registerSchema, req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create org + admin user together — first user in an org is always ADMIN
    const organization = await prisma.organization.create({
      data: {
        name: data.organizationName,
        users: {
          create: {
            name: data.name,
            email: data.email,
            passwordHash,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    });

    const user = organization.users[0];
    const token = signToken({ userId: user.id, organizationId: organization.id, role: user.role });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      organization: { id: organization.id, name: organization.name },
    });
  } catch (err) {
    next(err);
  }
}

// POST /auth/login
export async function login(req, res, next) {
  try {
    const data = validate(loginSchema, req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken({ userId: user.id, organizationId: user.organizationId, role: user.role });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// GET /auth/me — sanity check route, returns the logged-in user
export async function me(req, res) {
  const { id, name, email, role, organizationId } = req.user;
  res.json({ id, name, email, role, organizationId });
}
