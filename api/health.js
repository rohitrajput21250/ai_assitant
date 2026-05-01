'use strict';

const { resolveEnginePath } = require('../backend/src/engineBridge');

module.exports = (_req, res) => {
  const enginePath = resolveEnginePath();
  res.status(200).json({
    ok: true,
    service: '3D AI Voice Assistant API',
    engine: {
      available: Boolean(enginePath),
      path: enginePath,
      buildHint: enginePath
        ? null
        : 'C++ engine not available; JavaScript fallback is active.'
    }
  });
};
