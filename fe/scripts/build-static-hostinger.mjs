import { access, copyFile, mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();
const appDir = path.join(rootDir, 'src', 'app');
const outDir = path.join(rootDir, 'out');
const publicHtaccessPath = path.join(rootDir, 'public', '.htaccess');
const outHtaccessPath = path.join(outDir, '.htaccess');
const staticDisabledDir = path.join(rootDir, '.static-disabled-routes');

const disabledSegments = ['api', 'app', 'login', 'signup'];
const disabledPairs = [];

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function disableSegment(segment) {
  const sourcePath = path.join(appDir, segment);
  const disabledPath = path.join(staticDisabledDir, segment);

  if (!(await pathExists(sourcePath))) {
    return;
  }

  await mkdir(staticDisabledDir, { recursive: true });

  if (await pathExists(disabledPath)) {
    throw new Error(
      `Temporary path already exists: ${disabledPath}. Restore or delete it before running build:static.`,
    );
  }

  await rename(sourcePath, disabledPath);
  disabledPairs.push({ sourcePath, disabledPath });
  process.stdout.write(`- disabled src/app/${segment}\n`);
}

async function restoreSegments() {
  for (const pair of [...disabledPairs].reverse()) {
    if (await pathExists(pair.disabledPath)) {
      await rename(pair.disabledPath, pair.sourcePath);
      process.stdout.write(`- restored src/app/${path.basename(pair.sourcePath)}\n`);
    }
  }

  await rm(staticDisabledDir, { recursive: true, force: true });
}

function runStaticBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'npx',
      ['next', 'build', '--webpack'],
      {
        cwd: rootDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          STATIC_EXPORT: 'true',
          NEXT_PUBLIC_STATIC_EXPORT: 'true',
        },
      },
    );

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Static build failed with exit code ${code ?? 'unknown'}.`));
    });
  });
}

async function main() {
  process.stdout.write('Preparing static Hostinger build...\n');

  try {
    for (const segment of disabledSegments) {
      // eslint-disable-next-line no-await-in-loop
      await disableSegment(segment);
    }

    await runStaticBuild();
  } finally {
    await restoreSegments();
  }

  if (await pathExists(publicHtaccessPath)) {
    await copyFile(publicHtaccessPath, outHtaccessPath);
    process.stdout.write('- copied public/.htaccess to out/.htaccess\n');
  }

  process.stdout.write('Static export complete. Upload ./out contents to Hostinger public_html.\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
