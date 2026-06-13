/**
 * Development helper: boots the API against an in-memory MongoDB.
 * Useful for trying the server without Docker or Atlas:
 *   npm run dev:memory
 * Data is lost when the process exits.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri('fleetpilot');

const { connectDb } = await import('./db/connect.js');
const { buildApp } = await import('./app.js');
const { env } = await import('./config/env.js');
const { runSeed } = await import('./seed/seed.js');

await connectDb(mongod.getUri('fleetpilot'));
await runSeed();

buildApp().listen(env.PORT, () => {
  console.log(`🚐 FleetPilot API (in-memory DB) on port ${env.PORT}`);
  console.log(`   Admin login: ${env.SEED_ADMIN_EMAIL} / ${env.SEED_ADMIN_PASSWORD}`);
});
