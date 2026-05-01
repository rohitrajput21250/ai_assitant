const { intents } = require('./commandCatalog');
const { runEngine } = require('./engineBridge');

const confidenceFloor = 0.48;

function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function tokenize(text) {
  const normalized = normalizeText(text);
  return normalized ? normalized.split(' ') : [];
}

function timeContext(locale) {
  const now = new Date();
  const hour = now.getHours();
  const timeLabel = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  return {
    now,
    timeLabel,
    fullTime: new Intl.DateTimeFormat(locale || 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(now)
  };
}

function extractSearchQuery(text) {
  const normalized = text.trim();
  const patterns = [
    /\b(?:search|google)\s+(?:for\s+)?(.+)$/i,
    /\b(?:look up|find)\s+(.+?)\s+(?:on|with)\s+google$/i,
    /\b(?:look up|find)\s+(.+)$/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const query = match[1].replace(/\b(on|with)\s+google\b/i, '').trim();
      if (query && !/^google$/i.test(query)) {
        return query;
      }
    }
  }

  return '';
}

function maybeGenericWebsiteAction(text) {
  const normalized = normalizeText(text);
  const openLike = /\b(open|launch|go to|visit|show)\b/i.test(text);

  if (!openLike) {
    return null;
  }

  const knownSites = [
    ['google', 'https://www.google.com', 'Open Google'],
    ['github', 'https://github.com', 'Open GitHub'],
    ['git hub', 'https://github.com', 'Open GitHub'],
    ['linkedin', 'https://www.linkedin.com', 'Open LinkedIn'],
    ['youtube', 'https://www.youtube.com', 'Open YouTube']
  ];

  for (const [name, url, label] of knownSites) {
    if (normalized.includes(name)) {
      return { type: 'openUrl', url, label };
    }
  }

  const domainMatch = text.match(/\b([a-z0-9-]+(?:\.[a-z]{2,})+)\b/i);
  if (domainMatch) {
    const domain = domainMatch[1].toLowerCase();
    return {
      type: 'openUrl',
      url: `https://${domain}`,
      label: `Open ${domain}`
    };
  }

  return null;
}

function buildContext(text, engineResult, options) {
  const locale = options.locale || 'en-US';
  const searchQuery = extractSearchQuery(text);

  return {
    text,
    searchQuery,
    confidence: Number(engineResult.score || 0),
    tokens: engineResult.tokens || tokenize(text),
    normalized: engineResult.normalized || normalizeText(text),
    ...timeContext(locale)
  };
}

function formatMatches(matches) {
  return (matches || []).map((match) => ({
    intent: match.intent,
    score: Number(match.score)
  }));
}

async function processCommand(text, options = {}) {
  const engineResult = await runEngine(text, intents);
  const context = buildContext(text, engineResult, options);
  const matches = formatMatches(engineResult.matches);
  const bestIntentId = engineResult.bestIntent;
  const intent = intents.find((candidate) => candidate.id === bestIntentId);
  const genericAction = maybeGenericWebsiteAction(text);

  if (context.searchQuery && (bestIntentId === 'google_search' || context.confidence < 0.68)) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(context.searchQuery)}`;
    return {
      ok: true,
      transcript: text,
      intent: 'google_search',
      intentLabel: 'Google search',
      confidence: Math.max(context.confidence, 0.76),
      response: `Searching Google for "${context.searchQuery}".`,
      action: {
        type: 'openUrl',
        label: 'Open search',
        url
      },
      tokens: context.tokens,
      matches,
      engine: {
        name: 'cpp-levenshtein-command-engine',
        executable: engineResult.executable,
        normalized: context.normalized
      }
    };
  }

  if (genericAction && (!intent || context.confidence < 0.7)) {
    return {
      ok: true,
      transcript: text,
      intent: 'open_website',
      intentLabel: genericAction.label,
      confidence: Math.max(context.confidence, 0.72),
      response: `${genericAction.label.replace('Open ', 'Opening ')}. A manual launch button is ready if the browser blocks the tab.`,
      action: genericAction,
      tokens: context.tokens,
      matches,
      engine: {
        name: 'cpp-levenshtein-command-engine',
        executable: engineResult.executable,
        normalized: context.normalized
      }
    };
  }

  if (!intent || context.confidence < confidenceFloor) {
    const suggestions = matches
      .slice(0, 3)
      .map((match) => match.intent.replace(/_/g, ' '))
      .join(', ');

    return {
      ok: true,
      transcript: text,
      intent: 'unknown',
      intentLabel: 'Unknown',
      confidence: context.confidence,
      response: suggestions
        ? `I heard you, but the intent is fuzzy. Closest matches: ${suggestions}.`
        : 'I heard you, but could not map that to a command yet.',
      action: null,
      tokens: context.tokens,
      matches,
      engine: {
        name: 'cpp-levenshtein-command-engine',
        executable: engineResult.executable,
        normalized: context.normalized
      }
    };
  }

  const response =
    typeof intent.response === 'function' ? intent.response(context) : intent.response;

  let action = intent.action || null;
  if (intent.id === 'google_search' && context.searchQuery) {
    action = {
      type: 'openUrl',
      label: 'Open search',
      url: `https://www.google.com/search?q=${encodeURIComponent(context.searchQuery)}`
    };
  }

  return {
    ok: true,
    transcript: text,
    intent: intent.id,
    intentLabel: intent.label,
    confidence: context.confidence,
    response,
    action,
    tokens: context.tokens,
    matches,
    engine: {
      name: 'cpp-levenshtein-command-engine',
      executable: engineResult.executable,
      normalized: context.normalized
    }
  };
}

module.exports = {
  normalizeText,
  processCommand,
  tokenize
};
