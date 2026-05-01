# C++ Command Engine

This module is a native C++17 executable used by the Express backend for fuzzy command scoring.

## Build With npm

From the repository root:

```bash
npm run build:cpp
```

From `backend/`:

```bash
npm run build:cpp
```

## Build With g++ Directly

Windows:

```bash
g++ -std=c++17 -O3 -Wall -Wextra -pedantic -o cpp-engine/build/command_engine.exe cpp-engine/src/command_engine.cpp
```

macOS/Linux:

```bash
g++ -std=c++17 -O3 -Wall -Wextra -pedantic -o cpp-engine/build/command_engine cpp-engine/src/command_engine.cpp
```

## Build With CMake

```bash
cmake -S cpp-engine -B cpp-engine/build
cmake --build cpp-engine/build --config Release
```

## Protocol

The executable reads lines from stdin:

```text
TEXT    open github
COMMAND open_github open github|launch github|go to github
COMMAND greeting    hello|hi|hey
```

Fields are tab-separated. Command keywords are pipe-separated.

It returns JSON:

```json
{
  "ok": true,
  "bestIntent": "open_github",
  "score": 0.8376,
  "normalized": "open github",
  "tokens": ["open", "github"],
  "matches": [
    { "intent": "open_github", "score": 0.8376 }
  ]
}
```
