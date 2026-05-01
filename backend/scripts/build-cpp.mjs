import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const source = path.join(repoRoot, 'cpp-engine', 'src', 'command_engine.cpp');
const buildDir = path.join(repoRoot, 'cpp-engine', 'build');
const output = path.join(
  buildDir,
  process.platform === 'win32' ? 'command_engine.exe' : 'command_engine'
);

fs.mkdirSync(buildDir, { recursive: true });

const args = [
  '-std=c++17',
  '-O3',
  '-Wall',
  '-Wextra',
  '-pedantic',
  '-o',
  output,
  source
];

console.log(`Compiling C++ command engine -> ${output}`);
const result = spawnSync('g++', args, {
  stdio: 'inherit'
});

if (result.error) {
  console.error('\nUnable to start g++. Install MinGW-w64, MSYS2, or use CMake with a C++17 compiler.');
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error('\nC++ engine compilation failed.');
  process.exit(result.status || 1);
}

console.log('C++ engine build complete.');
