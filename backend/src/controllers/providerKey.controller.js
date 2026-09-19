import { prisma } from '../config/prisma.js';
import { encrypt } from '../lib/crypto.js';

const VALID_PROVIDERS = ['OPENAI', 'GEMINI', 'CLAUDE', 'OLLAMA'];

// POST /provider-keys — add (or rotate) an organization's own key for a provider.
// Only Admins should do this — it's real billing credentials.
// If the org already has an active key for this provider, it's deactivated
// first (soft — kept for audit history) so lookups always resolve to
// exactly one active key per provider per org.
export async function addProviderKey(req, res, next) {
  try {
    const { provider, label, apiKey } = req.body;

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: `provider must be one of: ${VALID_PROVIDERS.join(', ')}` });
    }
    if (!apiKey || apiKey.trim().length < 8) {
      return res.status(400).json({ error: 'apiKey is required and looks too short to be real' });
    }

    const organizationId = req.user.organizationId;

    // Deactivate any existing active key for this org+provider — one
    // active key per provider per org, old ones kept for audit history.
    await prisma.providerKey.updateMany({
      where: { organizationId, provider, isActive: true },
      data: { isActive: false },
    });

    const encryptedKey = encrypt(apiKey.trim());

    const created = await prisma.providerKey.create({
      data: {
        provider,
        label: label || `${provider} key`,
        encryptedKey,
        organizationId,
        isActive: true,
      },
    });

    // Never return the encrypted value, let alone the raw key.
    res.status(201).json({
      id: created.id,
      provider: created.provider,
      label: created.label,
      isActive: created.isActive,
      createdAt: created.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

// GET /provider-keys — list this org's configured provider keys, metadata only.
export async function listProviderKeys(req, res, next) {
  try {
    const keys = await prisma.providerKey.findMany({
      where: { organizationId: req.user.organizationId },
      select: { id: true, provider: true, label: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(keys);
  } catch (err) {
    next(err);
  }
}

// DELETE /provider-keys/:id — remove a stored key. Requests needing that
// provider will fail with a clear "no key configured" error until a new
// one is added — no silent fallback to anything shared.
export async function deleteProviderKey(req, res, next) {
  try {
    const { id } = req.params;

    const key = await prisma.providerKey.findFirst({
      where: { id, organizationId: req.user.organizationId },
    });
    if (!key) return res.status(404).json({ error: 'Provider key not found' });

    await prisma.providerKey.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
