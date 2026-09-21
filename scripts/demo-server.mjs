/**
 * Synthetic demo API server (plan §12).
 *
 * Serves the committed /v1 OpenAPI contract (openapi/wits-mobile-v1.yaml) over
 * plain HTTP from the same relational demo database the mock repository uses —
 * one dataset, two transports. Point a demo build at it with:
 *
 *   EXPO_PUBLIC_DATA_SOURCE=http \
 *   EXPO_PUBLIC_API_BASE_URL=http://localhost:8790 \
 *   npx expo start
 *
 * This exercises the production code path (HttpWitsRepository: fetch, Zod
 * boundary validation, typed errors, correlation IDs) during everyday demo
 * testing — no "works in mock, breaks over network" surprises.
 *
 * Compile/route logic lives in scripts/demo-runtime.mjs, shared with the
 * HTTP smoke test so both always serve the identical contract.
 *
 * Run: node scripts/demo-server.mjs   (or `pnpm demo:server`)
 */
import { startDemoServer } from './demo-runtime.mjs';

const PORT = Number(process.env.DEMO_SERVER_PORT ?? 8790);
const { server, shutdown } = await startDemoServer({ port: PORT });

console.log(`wits demo API → http://localhost:${PORT}`);
console.log(
  `start the app with: EXPO_PUBLIC_DATA_SOURCE=http EXPO_PUBLIC_API_BASE_URL=http://localhost:${PORT} npx expo start`,
);

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

void server;
