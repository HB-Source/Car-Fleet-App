import { buildApp } from './app.js';
import { env } from './config/env.js';
import { connectDb } from './db/connect.js';

async function main() {
  await connectDb();

  if (env.SEED_ON_START) {
    const { runSeed } = await import('./seed/seed.js');
    console.log('SEED_ON_START is set — seeding database…');
    await runSeed();
  }

  const app = buildApp();
  app.listen(env.PORT, () => {
    console.log(`🚐 FleetPilot API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
