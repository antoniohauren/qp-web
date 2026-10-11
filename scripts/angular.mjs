import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { parseArgs, parseEnv } from 'node:util';
import { pathToFileURL } from 'node:url';

export function angularArgs(args, env = process.env) {
  const [command, ...options] = args;
  const { values } = parseArgs({
    args: options,
    options: {
      configuration: { type: 'string', short: 'c' },
      'build-target': { type: 'string' },
    },
    strict: false,
    allowPositionals: true,
  });
  const configuration =
    values.configuration ?? (command === 'serve' ? 'development' : 'production');
  const development = values['build-target']
    ? values['build-target'].split(':')[2] === 'development'
    : configuration === 'development';

  // Deployment values always win. Never load local defaults for production.
  const apiUrl =
    env.API_URL ??
    (development
      ? parseEnv(readFileSync(new URL('../.env', import.meta.url), 'utf8')).API_URL
      : undefined);
  if (!apiUrl?.trim()) {
    throw new Error(
      'API_URL is required. Set an absolute HTTP(S) backend URL for production builds.',
    );
  }
  let url;
  try {
    url = new URL(apiUrl);
  } catch {
    throw new Error('API_URL must be an absolute HTTP(S) backend URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('API_URL must be an absolute HTTP(S) backend URL.');
  }

  return [...args, '--define', `API_URL=${JSON.stringify(apiUrl)}`];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = angularArgs(process.argv.slice(2));
    const require = createRequire(import.meta.url);
    const result = spawnSync(
      process.execPath,
      [require.resolve('@angular/cli/bin/ng.js'), ...args],
      {
        stdio: 'inherit',
      },
    );
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
