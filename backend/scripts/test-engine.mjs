import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { intents } = require('../src/commandCatalog');
const { runEngine } = require('../src/engineBridge');

const text = process.argv.slice(2).join(' ') || 'open github';

try {
  const result = await runEngine(text, intents);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
