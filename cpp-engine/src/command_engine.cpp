#include <algorithm>
#include <cctype>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <numeric>
#include <sstream>
#include <string>
#include <vector>

namespace {

struct Command {
  std::string id;
  std::vector<std::string> keywords;
};

struct Match {
  std::string id;
  double score;
};

double clampValue(double value, double minValue, double maxValue) {
  return std::max(minValue, std::min(maxValue, value));
}

std::string trim(const std::string &value) {
  std::size_t start = 0;
  while (start < value.size() &&
         std::isspace(static_cast<unsigned char>(value[start]))) {
    ++start;
  }

  std::size_t end = value.size();
  while (end > start &&
         std::isspace(static_cast<unsigned char>(value[end - 1]))) {
    --end;
  }

  return value.substr(start, end - start);
}

std::string normalize(const std::string &input) {
  std::string out;
  out.reserve(input.size());
  bool lastWasSpace = true;

  for (unsigned char ch : input) {
    if (std::isalnum(ch)) {
      out.push_back(static_cast<char>(std::tolower(ch)));
      lastWasSpace = false;
      continue;
    }

    if (!lastWasSpace) {
      out.push_back(' ');
      lastWasSpace = true;
    }
  }

  return trim(out);
}

std::vector<std::string> split(const std::string &input, char delimiter) {
  std::vector<std::string> parts;
  std::stringstream stream(input);
  std::string item;

  while (std::getline(stream, item, delimiter)) {
    item = trim(item);
    if (!item.empty()) {
      parts.push_back(item);
    }
  }

  return parts;
}

std::vector<std::string> tokenize(const std::string &input) {
  return split(normalize(input), ' ');
}

std::string joinTokens(const std::vector<std::string> &tokens,
                       std::size_t start,
                       std::size_t count) {
  std::string joined;
  for (std::size_t i = 0; i < count && start + i < tokens.size(); ++i) {
    if (!joined.empty()) {
      joined.push_back(' ');
    }
    joined += tokens[start + i];
  }
  return joined;
}

std::size_t levenshtein(const std::string &a, const std::string &b) {
  if (a.empty()) {
    return b.size();
  }
  if (b.empty()) {
    return a.size();
  }

  std::vector<std::size_t> previous(b.size() + 1);
  std::vector<std::size_t> current(b.size() + 1);
  std::iota(previous.begin(), previous.end(), 0);

  for (std::size_t i = 1; i <= a.size(); ++i) {
    current[0] = i;
    for (std::size_t j = 1; j <= b.size(); ++j) {
      const std::size_t substitution =
          previous[j - 1] + (a[i - 1] == b[j - 1] ? 0 : 1);
      current[j] = std::min({previous[j] + 1, current[j - 1] + 1, substitution});
    }
    previous.swap(current);
  }

  return previous[b.size()];
}

double lexicalSimilarity(const std::string &a, const std::string &b) {
  if (a.empty() || b.empty()) {
    return 0.0;
  }
  if (a == b) {
    return 1.0;
  }

  const std::size_t maxLength = std::max(a.size(), b.size());
  double editScore =
      1.0 - static_cast<double>(levenshtein(a, b)) / static_cast<double>(maxLength);
  editScore = clampValue(editScore, 0.0, 1.0);

  const std::size_t minLength = std::min(a.size(), b.size());
  const bool prefix =
      a.rfind(b, 0) == 0 || b.rfind(a, 0) == 0;
  const bool contains =
      a.find(b) != std::string::npos || b.find(a) != std::string::npos;

  if (prefix && minLength >= 4) {
    editScore = std::max(editScore, 0.88);
  } else if (contains && std::min(a.size(), b.size()) >= 4) {
    editScore = std::max(editScore, 0.74);
  }

  return editScore;
}

double phraseSimilarity(const std::vector<std::string> &inputTokens,
                        const std::string &normalizedInput,
                        const std::string &keyword) {
  const std::string normalizedKeyword = normalize(keyword);
  const std::vector<std::string> keywordTokens = tokenize(keyword);

  if (normalizedKeyword.empty() || inputTokens.empty() || keywordTokens.empty()) {
    return 0.0;
  }

  if (normalizedInput == normalizedKeyword) {
    return 1.0;
  }

  double exactPhraseBoost = 0.0;
  const std::string paddedInput = " " + normalizedInput + " ";
  const std::string paddedKeyword = " " + normalizedKeyword + " ";
  if (paddedInput.find(paddedKeyword) != std::string::npos) {
    exactPhraseBoost = keywordTokens.size() > 1 ? 0.98 : 0.94;
  }

  double tokenTotal = 0.0;
  for (const std::string &keywordToken : keywordTokens) {
    double bestToken = 0.0;
    for (const std::string &inputToken : inputTokens) {
      bestToken = std::max(bestToken, lexicalSimilarity(keywordToken, inputToken));
    }
    tokenTotal += bestToken;
  }
  const double tokenAverage = tokenTotal / static_cast<double>(keywordTokens.size());

  double windowBest = 0.0;
  if (keywordTokens.size() > 1 && inputTokens.size() >= keywordTokens.size()) {
    for (std::size_t i = 0; i + keywordTokens.size() <= inputTokens.size(); ++i) {
      const std::string window = joinTokens(inputTokens, i, keywordTokens.size());
      windowBest = std::max(windowBest,
                            lexicalSimilarity(normalizedKeyword, window));
    }
  } else if (keywordTokens.size() == 1) {
    windowBest = tokenAverage;
  }

  const double blended = keywordTokens.size() > 1
                             ? (0.58 * tokenAverage + 0.42 * windowBest)
                             : tokenAverage;
  return clampValue(std::max(exactPhraseBoost, blended), 0.0, 1.0);
}

double scoreCommand(const Command &command,
                    const std::vector<std::string> &inputTokens,
                    const std::string &normalizedInput) {
  if (command.keywords.empty()) {
    return 0.0;
  }

  std::vector<double> phraseScores;
  phraseScores.reserve(command.keywords.size());
  for (const std::string &keyword : command.keywords) {
    phraseScores.push_back(phraseSimilarity(inputTokens, normalizedInput, keyword));
  }

  std::sort(phraseScores.begin(), phraseScores.end(), std::greater<double>());
  const double best = phraseScores.front();

  const std::size_t topCount = std::min<std::size_t>(3, phraseScores.size());
  const double topAverage =
      std::accumulate(phraseScores.begin(), phraseScores.begin() + topCount, 0.0) /
      static_cast<double>(topCount);

  std::size_t strongMatches = 0;
  for (double score : phraseScores) {
    if (score >= 0.72) {
      ++strongMatches;
    }
  }
  const double coverage =
      std::min(1.0, static_cast<double>(strongMatches) /
                        static_cast<double>(std::min<std::size_t>(3, phraseScores.size())));

  const double multiSignalBoost = strongMatches >= 2 ? 0.05 : 0.0;
  return clampValue(0.57 * best + 0.31 * topAverage + 0.12 * coverage +
                        multiSignalBoost,
                    0.0, 1.0);
}

std::string jsonEscape(const std::string &input) {
  std::ostringstream out;
  for (char ch : input) {
    switch (ch) {
    case '"':
      out << "\\\"";
      break;
    case '\\':
      out << "\\\\";
      break;
    case '\b':
      out << "\\b";
      break;
    case '\f':
      out << "\\f";
      break;
    case '\n':
      out << "\\n";
      break;
    case '\r':
      out << "\\r";
      break;
    case '\t':
      out << "\\t";
      break;
    default:
      if (static_cast<unsigned char>(ch) < 0x20) {
        out << "\\u" << std::hex << std::setw(4) << std::setfill('0')
            << static_cast<int>(static_cast<unsigned char>(ch)) << std::dec;
      } else {
        out << ch;
      }
    }
  }
  return out.str();
}

void writeJsonError(const std::string &message) {
  std::cout << "{\"ok\":false,\"error\":\"" << jsonEscape(message) << "\"}\n";
}

} // namespace

int main() {
  std::ios::sync_with_stdio(false);

  std::string rawText;
  std::vector<Command> commands;
  std::string line;

  while (std::getline(std::cin, line)) {
    if (line.rfind("TEXT\t", 0) == 0) {
      rawText = line.substr(5);
      continue;
    }

    if (line.rfind("COMMAND\t", 0) == 0) {
      const std::size_t idStart = 8;
      const std::size_t idEnd = line.find('\t', idStart);
      if (idEnd == std::string::npos) {
        continue;
      }

      Command command;
      command.id = trim(line.substr(idStart, idEnd - idStart));
      command.keywords = split(line.substr(idEnd + 1), '|');
      if (!command.id.empty() && !command.keywords.empty()) {
        commands.push_back(command);
      }
    }
  }

  if (rawText.empty()) {
    writeJsonError("No TEXT line was provided to the C++ command engine.");
    return 2;
  }

  if (commands.empty()) {
    writeJsonError("No COMMAND definitions were provided to the C++ command engine.");
    return 2;
  }

  const std::string normalizedInput = normalize(rawText);
  const std::vector<std::string> inputTokens = tokenize(rawText);

  std::vector<Match> matches;
  matches.reserve(commands.size());
  for (const Command &command : commands) {
    matches.push_back({command.id, scoreCommand(command, inputTokens, normalizedInput)});
  }

  std::sort(matches.begin(), matches.end(), [](const Match &a, const Match &b) {
    if (std::abs(a.score - b.score) < 0.0001) {
      return a.id < b.id;
    }
    return a.score > b.score;
  });

  const Match best = matches.front();

  std::cout << std::fixed << std::setprecision(4);
  std::cout << "{\"ok\":true,";
  std::cout << "\"bestIntent\":\"" << jsonEscape(best.id) << "\",";
  std::cout << "\"score\":" << best.score << ",";
  std::cout << "\"normalized\":\"" << jsonEscape(normalizedInput) << "\",";

  std::cout << "\"tokens\":[";
  for (std::size_t i = 0; i < inputTokens.size(); ++i) {
    if (i > 0) {
      std::cout << ",";
    }
    std::cout << "\"" << jsonEscape(inputTokens[i]) << "\"";
  }
  std::cout << "],";

  std::cout << "\"matches\":[";
  const std::size_t matchLimit = std::min<std::size_t>(5, matches.size());
  for (std::size_t i = 0; i < matchLimit; ++i) {
    if (i > 0) {
      std::cout << ",";
    }
    std::cout << "{\"intent\":\"" << jsonEscape(matches[i].id)
              << "\",\"score\":" << matches[i].score << "}";
  }
  std::cout << "]}";

  return 0;
}
