const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { runEngineFallback } = require('./engineFallback');

class EngineUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EngineUnavailableError';
    this.code = 'CPP_ENGINE_UNAVAILABLE';
  }
}

function resolveEnginePath() {
  const envPath = process.env.CPP_ENGINE_PATH
    ? path.resolve(process.cwd(), process.env.CPP_ENGINE_PATH)
    : null;

  const executableName = process.platform === 'win32' ? 'command_engine.exe' : 'command_engine';
  const repoRoot = path.resolve(__dirname, '..', '..');
  const candidates = [
    envPath,
    path.join(repoRoot, 'cpp-engine', 'build', executableName),
    path.join(repoRoot, 'cpp-engine', executableName),
    path.join(repoRoot, 'cpp-engine', 'build', 'command_engine'),
    path.join(repoRoot, 'cpp-engine', 'build', 'command_engine.exe')
  ].filter(Boolean);

  return candidates.find((candidate) => {
    try {
      return fs.existsSync(candidate) && fs.statSync(candidate).isFile();
    } catch (_error) {
      return false;
    }
  });
}

function sanitizeProtocolField(value) {
  return String(value).replace(/[\t\r\n]+/g, ' ').trim();
}

function serializeEngineInput(text, commands) {
  const lines = [`TEXT\t${sanitizeProtocolField(text)}`];

  for (const command of commands) {
    const keywordLine = command.keywords.map(sanitizeProtocolField).join('|');
    lines.push(`COMMAND\t${sanitizeProtocolField(command.id)}\t${keywordLine}`);
  }

  return `${lines.join('\n')}\n`;
}

function runEngine(text, commands, options = {}) {
  const enginePath = resolveEnginePath();
  const timeoutMs = options.timeoutMs || 1800;

  if (!enginePath) {
    return Promise.resolve(runEngineFallback(text, commands));
  }

  return new Promise((resolve, reject) => {
    const child = spawn(enginePath, [], {
      cwd: path.dirname(enginePath),
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      child.kill('SIGKILL');
      reject(new Error(`C++ command engine timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);

      if (code !== 0) {
        reject(
          new Error(
            `C++ command engine exited with code ${code}.${stderr ? ` ${stderr}` : ''}`
          )
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        if (!parsed.ok) {
          reject(new Error(parsed.error || 'C++ command engine returned an error.'));
          return;
        }

        resolve({
          ...parsed,
          executable: enginePath
        });
      } catch (error) {
        reject(
          new Error(
            `Failed to parse C++ engine output: ${error.message}. Output: ${stdout}`
          )
        );
      }
    });

    child.stdin.end(serializeEngineInput(text, commands));
  });
}

module.exports = {
  EngineUnavailableError,
  resolveEnginePath,
  runEngine,
  serializeEngineInput
};
