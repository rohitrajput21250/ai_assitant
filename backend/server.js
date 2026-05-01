const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { processCommand } = require('./src/commandProcessor');
const { resolveEnginePath } = require('./src/engineBridge');

const app = express();
const port = Number(process.env.PORT || 4500);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === clientOrigin) {
        callback(null, true);
        return;
      }
      callback(null, true);
    }
  })
);
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => {
  const enginePath = resolveEnginePath();
  res.json({
    ok: true,
    service: '3D AI Voice Assistant API',
    engine: {
      available: Boolean(enginePath),
      path: enginePath,
      buildHint: enginePath
        ? null
        : 'Run `npm --prefix backend run build:cpp` before processing commands.'
    }
  });
});

app.post('/api/command', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

  if (!text) {
    res.status(400).json({
      ok: false,
      error: 'Text is required.'
    });
    return;
  }

  try {
    const result = await processCommand(text, {
      locale: req.body?.locale || 'en-US'
    });
    res.json(result);
  } catch (error) {
    const status = error.code === 'CPP_ENGINE_UNAVAILABLE' ? 503 : 500;
    res.status(status).json({
      ok: false,
      error: error.message,
      code: error.code || 'COMMAND_PROCESSING_FAILED'
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Route not found.' });
});

app.listen(port, () => {
  const enginePath = resolveEnginePath();
  console.log(`Voice assistant API listening on http://localhost:${port}`);
  console.log(
    enginePath
      ? `C++ command engine: ${enginePath}`
      : 'C++ command engine missing. Run `npm run build:cpp` inside backend.'
  );
});
