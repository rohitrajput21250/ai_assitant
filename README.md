# 3D AI Voice Assistant Experience

A portfolio-grade realtime voice assistant built with React, React Three Fiber, GLSL shaders, Rapier physics, Web Speech API, Express, and a compiled C++ fuzzy command engine.

The app presents a fullscreen 3D neural orb that changes behavior across idle, listening, processing, responding, and error states. Voice input drives shader uniforms, particle forces, UI state, and command execution through a Node-to-C++ backend bridge.

## Features

- Fullscreen dark futuristic interface with glass panels and animated microphone states.
- Custom GLSL orb shader with time-based displacement, fresnel glow, plasma veins, wave distortion, pointer input, and voice-reactive uniforms.
- Physics-based animation through Rapier: the orb is a damped rigid body with pointer and state impulses.
- Audio-reactive particle field with a lightweight force integrator for swirl, radial push, inertia, and reset bounds.
- Web Speech API speech-to-text with continuous listening, interim transcripts, browser error handling, and mic-level metering.
- Express API that sends commands to a native C++ executable through `child_process`.
- C++17 command engine with tokenization, phrase windows, Levenshtein similarity, intent scoring, and ranked JSON output.
- Intelligent command handling for greetings, help, opening websites, Google search, project explanations, shader details, physics details, C++ engine details, time/status, and display reset.

## Project Structure

```text
3d-ai-voice-assistant-experience/
  frontend/      React + Vite + Three.js experience
  backend/       Express API and Node-to-C++ bridge
  cpp-engine/    C++17 fuzzy command scoring executable
```

## Prerequisites

- Node.js 18 or newer.
- npm 9 or newer.
- A C++17 compiler:
  - Windows: MinGW-w64, MSYS2, or Visual Studio Build Tools.
  - macOS: Xcode command line tools.
  - Linux: `g++` or `clang++`.
- Chrome, Edge, or another browser with Web Speech API support. Speech recognition support is browser-dependent.
- Microphone permission enabled in the browser.

## Install

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## Build The C++ Engine

From the repo root:

```bash
npm run build:cpp
```

Or from `backend/`:

```bash
npm run build:cpp
```

The default output is:

```text
cpp-engine/build/command_engine.exe
```

On macOS/Linux the executable is:

```text
cpp-engine/build/command_engine
```

You can also build with CMake:

```bash
cmake -S cpp-engine -B cpp-engine/build
cmake --build cpp-engine/build --config Release
```

If the binary lives somewhere else, set `CPP_ENGINE_PATH` in `backend/.env` or your shell.

## Run Locally

Start the backend:

```bash
cd backend
npm run dev
```

The API defaults to:

```text
http://localhost:4500
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

The app defaults to:

```text
http://localhost:5173
```

Vite proxies `/api` to the backend during development. For a custom backend URL, create `frontend/.env`:

```text
VITE_API_URL=http://localhost:4500
```

## Useful Commands

From the repo root:

```bash
npm run dev
npm run build:cpp
npm run dev:backend
npm run dev:frontend
npm run build:frontend
```

`npm run dev` starts both backend and frontend as detached local services and writes logs to `logs/backend.log` and `logs/frontend.log`.

From `backend/`:

```bash
npm run build:cpp
npm run test:engine -- "open github"
npm run test:engine -- "explain the c++ fuzzy matching engine"
```

From `frontend/`:

```bash
npm run typecheck
npm run build
```

## Command Examples

Try saying:

- `hello assistant`
- `open GitHub`
- `open Google`
- `search Google for realtime shaders`
- `explain this project`
- `what is the tech stack`
- `how does the shader work`
- `explain the physics`
- `explain the C++ engine`
- `what time is it`
- `reset conversation`

## How The Native Engine Works

The frontend sends a transcript to `POST /api/command`. Express passes that text plus the command catalog into `cpp-engine/build/command_engine` over stdin. The C++ program normalizes text, tokenizes input, compares phrase windows with command keywords using Levenshtein distance, computes a weighted intent score, and returns ranked JSON. Node then enriches the native result with dynamic responses and optional actions.

This makes the C++ module meaningful: intent scoring is not duplicated in JavaScript and the web app depends on the compiled engine for command ranking.

## Browser Notes

The Web Speech API is best supported in Chromium-based browsers. If speech recognition is unavailable, the UI shows a compatibility error instead of silently failing. Microphone audio level metering uses `getUserMedia`, so the page must be served from `localhost` or HTTPS.

## Production Notes

- Serve the built frontend from a static host or the Express server.
- Keep the C++ executable beside the backend deployment, or set `CPP_ENGINE_PATH`.
- Restrict CORS with `CLIENT_ORIGIN` in backend environment variables.
- The backend uses short native-process timeouts to avoid hanging requests.
