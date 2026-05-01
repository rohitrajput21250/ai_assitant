'use strict';

const { processCommand } = require('../backend/src/commandProcessor');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  const text =
    typeof req.body?.text === 'string' ? req.body.text.trim() : '';

  if (!text) {
    res.status(400).json({ ok: false, error: 'Text is required.' });
    return;
  }

  try {
    const result = await processCommand(text, {
      locale: req.body?.locale || 'en-US'
    });
    res.status(200).json(result);
  } catch (error) {
    const status = error.code === 'CPP_ENGINE_UNAVAILABLE' ? 503 : 500;
    res.status(status).json({
      ok: false,
      error: error.message,
      code: error.code || 'COMMAND_PROCESSING_FAILED'
    });
  }
};
