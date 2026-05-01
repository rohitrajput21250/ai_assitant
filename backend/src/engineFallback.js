'use strict';

/**
 * JavaScript port of the C++ Levenshtein command-scoring engine.
 * Used automatically on platforms where the compiled binary is unavailable
 * (e.g. Vercel serverless). The algorithm and scoring weights mirror
 * cpp-engine/src/command_engine.cpp exactly.
 */

function normalize(text) {
  let out = '';
  let lastWasSpace = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    if ((ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122)) {
      out += text[i].toLowerCase();
      lastWasSpace = false;
    } else if (!lastWasSpace) {
      out += ' ';
      lastWasSpace = true;
    }
  }
  return out.trimEnd();
}

function tokenize(text) {
  const norm = normalize(text);
  return norm ? norm.split(' ') : [];
}

function levenshtein(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const sub = prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, sub);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function lexicalSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  let score = 1 - levenshtein(a, b) / maxLen;
  score = Math.max(0, Math.min(1, score));
  const minLen = Math.min(a.length, b.length);
  if ((a.startsWith(b) || b.startsWith(a)) && minLen >= 4) {
    score = Math.max(score, 0.88);
  } else if ((a.includes(b) || b.includes(a)) && minLen >= 4) {
    score = Math.max(score, 0.74);
  }
  return score;
}

function joinTokens(tokens, start, count) {
  return tokens.slice(start, start + count).join(' ');
}

function phraseSimilarity(inputTokens, normalizedInput, keyword) {
  const normKw = normalize(keyword);
  const kwTokens = tokenize(keyword);
  if (!normKw || !inputTokens.length || !kwTokens.length) return 0;
  if (normalizedInput === normKw) return 1;

  let exactPhraseBoost = 0;
  if ((' ' + normalizedInput + ' ').includes(' ' + normKw + ' ')) {
    exactPhraseBoost = kwTokens.length > 1 ? 0.98 : 0.94;
  }

  let tokenTotal = 0;
  for (const kwToken of kwTokens) {
    let best = 0;
    for (const inToken of inputTokens) {
      best = Math.max(best, lexicalSimilarity(kwToken, inToken));
    }
    tokenTotal += best;
  }
  const tokenAvg = tokenTotal / kwTokens.length;

  let windowBest = 0;
  if (kwTokens.length > 1 && inputTokens.length >= kwTokens.length) {
    for (let i = 0; i + kwTokens.length <= inputTokens.length; i++) {
      const window = joinTokens(inputTokens, i, kwTokens.length);
      windowBest = Math.max(windowBest, lexicalSimilarity(normKw, window));
    }
  } else if (kwTokens.length === 1) {
    windowBest = tokenAvg;
  }

  const blended =
    kwTokens.length > 1 ? 0.58 * tokenAvg + 0.42 * windowBest : tokenAvg;
  return Math.max(0, Math.min(1, Math.max(exactPhraseBoost, blended)));
}

function scoreCommand(command, inputTokens, normalizedInput) {
  if (!command.keywords.length) return 0;

  const phraseScores = command.keywords.map((kw) =>
    phraseSimilarity(inputTokens, normalizedInput, kw)
  );
  phraseScores.sort((a, b) => b - a);

  const best = phraseScores[0];
  const topCount = Math.min(3, phraseScores.length);
  const topAvg =
    phraseScores.slice(0, topCount).reduce((a, b) => a + b, 0) / topCount;
  const strongMatches = phraseScores.filter((s) => s >= 0.72).length;
  const coverage = Math.min(
    1,
    strongMatches / Math.min(3, phraseScores.length)
  );
  const multiBoost = strongMatches >= 2 ? 0.05 : 0;

  return Math.max(
    0,
    Math.min(
      1,
      0.57 * best + 0.31 * topAvg + 0.12 * coverage + multiBoost
    )
  );
}

/**
 * @param {string} text
 * @param {Array<{ id: string, keywords: string[] }>} commands
 * @returns {{ ok: boolean, bestIntent: string, score: number, normalized: string, tokens: string[], matches: Array<{ intent: string, score: number }>, executable: null }}
 */
function runEngineFallback(text, commands) {
  if (!commands || !commands.length) {
    return {
      ok: false,
      error: 'No COMMAND definitions were provided to the JS engine fallback.'
    };
  }

  const normalizedInput = normalize(text);
  const inputTokens = tokenize(text);

  const matches = commands.map((cmd) => ({
    intent: cmd.id,
    score: scoreCommand(
      { id: cmd.id, keywords: cmd.keywords },
      inputTokens,
      normalizedInput
    )
  }));

  matches.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.0001) {
      return a.intent < b.intent ? -1 : 1;
    }
    return b.score - a.score;
  });

  const best = matches[0];

  return {
    ok: true,
    bestIntent: best.intent,
    score: best.score,
    normalized: normalizedInput,
    tokens: inputTokens,
    matches: matches.slice(0, 5),
    executable: null
  };
}

module.exports = { runEngineFallback };
