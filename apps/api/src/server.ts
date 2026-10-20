import { buildApp } from './app.js'; // .js is required with NodeNext
import { loadEnv } from './schemas/env.js';

const env = loadEnv();
const app = buildApp(env);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void app.close();
  });
}

await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' });
