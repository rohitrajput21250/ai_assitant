import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const logsDir = path.join(root, 'logs');
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const shellBin = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : npmBin;

fs.mkdirSync(logsDir, { recursive: true });

function openLog(name) {
  return fs.openSync(path.join(logsDir, name), 'a');
}

function quoteArg(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:-]+$/.test(text)) {
    return text;
  }
  return `"${text.replace(/"/g, '\\"')}"`;
}

function startService(name, cwd, args) {
  const out = openLog(`${name}.log`);
  const err = openLog(`${name}.err.log`);

  const command = process.platform === 'win32' ? shellBin : npmBin;
  const commandArgs =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', [npmBin, ...args.map(quoteArg)].join(' ')]
      : args;

  const child = spawn(command, commandArgs, {
    cwd,
    detached: true,
    stdio: ['ignore', out, err],
    windowsHide: true
  });

  child.unref();
  return child.pid;
}

const backendPid = startService('backend', root, [
  '--prefix',
  path.join(root, 'backend'),
  'run',
  'dev'
]);

const frontendPid = startService('frontend', root, [
  '--prefix',
  path.join(root, 'frontend'),
  'run',
  'dev'
]);

console.log(JSON.stringify(
  {
    backendPid,
    frontendPid,
    backendUrl: 'http://localhost:4500',
    frontendUrl: 'http://localhost:5173',
    logs: {
      backend: path.join(logsDir, 'backend.log'),
      frontend: path.join(logsDir, 'frontend.log')
    }
  },
  null,
  2
));
