import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';

function resolveEnvFilePath() {
  const envFileName = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.local';

  const backendProjectRoot = resolve(__dirname, '../../../');
  const preferredEnvPath = resolve(backendProjectRoot, envFileName);
  if (existsSync(preferredEnvPath)) {
    return preferredEnvPath;
  }

  const cwdEnvPath = resolve(process.cwd(), envFileName);
  return existsSync(cwdEnvPath) ? cwdEnvPath : null;
}

const envFilePath = resolveEnvFilePath();
if (envFilePath) {
  loadDotenv({
    path: envFilePath,
    override: false,
  });
}
