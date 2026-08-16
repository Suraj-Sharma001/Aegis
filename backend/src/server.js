import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectRedis } from './config/redis.js';

async function main() {
  await connectRedis();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`[Aegis] Gateway running on http://localhost:${env.port}`);
    console.log(`[Aegis] Environment: ${env.nodeEnv}`);
  });
}

main().catch((err) => {
  console.error('[Aegis] Failed to start:', err);
  process.exit(1);
});
