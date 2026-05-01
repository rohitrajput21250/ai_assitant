const websiteActions = {
  open_google: {
    type: 'openUrl',
    label: 'Open Google',
    url: 'https://www.google.com'
  },
  open_github: {
    type: 'openUrl',
    label: 'Open GitHub',
    url: 'https://github.com'
  }
};

const intents = [
  {
    id: 'greeting',
    label: 'Greeting',
    keywords: [
      'hello',
      'hi',
      'hey',
      'hey assistant',
      'good morning',
      'good evening',
      'wake up',
      'are you there'
    ],
    response: ({ timeLabel }) =>
      `Hello. I am online, calibrated, and listening from the ${timeLabel} cycle.`
  },
  {
    id: 'help',
    label: 'Command help',
    keywords: [
      'help',
      'what can you do',
      'show commands',
      'commands',
      'how do I use this',
      'assistant help'
    ],
    response: () =>
      'Try asking me to open Google or GitHub, search Google for a topic, explain this project, describe the shader, or tell you how the C++ engine works.'
  },
  {
    id: 'open_google',
    label: 'Open Google',
    keywords: [
      'open google',
      'launch google',
      'go to google',
      'google website',
      'start google'
    ],
    action: websiteActions.open_google,
    response: () => 'Opening Google. I also kept a launch button visible in case the browser blocks the new tab.'
  },
  {
    id: 'open_github',
    label: 'Open GitHub',
    keywords: [
      'open github',
      'launch github',
      'go to github',
      'github website',
      'open git hub',
      'show github'
    ],
    action: websiteActions.open_github,
    response: () => 'Opening GitHub. The action is ready as a button too, because browsers can be strict about automated tabs.'
  },
  {
    id: 'google_search',
    label: 'Google search',
    keywords: [
      'search google',
      'google search',
      'search the web',
      'look up',
      'find on google',
      'google for'
    ],
    response: ({ searchQuery }) =>
      searchQuery
        ? `Searching Google for "${searchQuery}".`
        : 'Tell me what to search for and I will turn it into a Google query.'
  },
  {
    id: 'project_about',
    label: 'Project overview',
    keywords: [
      'what is this project',
      'explain this project',
      'project overview',
      'tell me about this assistant',
      'describe the app',
      'portfolio project'
    ],
    response: () =>
      'This is a realtime 3D AI voice assistant: Web Speech API input, a GLSL orb rendered through React Three Fiber, Rapier-powered motion, audio-reactive particles, an Express API, and a native C++ scoring engine.'
  },
  {
    id: 'tech_stack',
    label: 'Tech stack',
    keywords: [
      'tech stack',
      'what technologies',
      'what is it built with',
      'react three fiber',
      'node backend',
      'tools used'
    ],
    response: () =>
      'The stack is React with Vite, Three.js through React Three Fiber, Drei helpers, Rapier physics, Framer Motion, Tailwind CSS, Express, and a compiled C++ command engine.'
  },
  {
    id: 'shader_details',
    label: 'Shader details',
    keywords: [
      'shader',
      'glsl',
      'orb shader',
      'how does the orb glow',
      'visual effect',
      'wave distortion'
    ],
    response: () =>
      'The orb uses custom vertex and fragment shaders. Time, assistant state, pointer drift, and microphone energy drive wave displacement, fresnel glow, chromatic color shifts, and the outer plasma shell.'
  },
  {
    id: 'physics_details',
    label: 'Physics details',
    keywords: [
      'physics',
      'rapier',
      'floating physics',
      'particle forces',
      'motion system',
      'inertia'
    ],
    response: () =>
      'Rapier gives the orb a damped body with impulses toward a floating target, while particles run a lightweight force integrator so speech intensity and pointer movement push the field instead of just playing a canned loop.'
  },
  {
    id: 'cpp_engine',
    label: 'C++ engine details',
    keywords: [
      'c++',
      'cpp',
      'native module',
      'command engine',
      'fuzzy matching',
      'levenshtein',
      'scoring engine'
    ],
    response: ({ confidence }) =>
      `The backend sent your text to a compiled C++ executable. It normalized tokens, ran Levenshtein-based fuzzy matching, scored every intent, and returned this match at ${(confidence * 100).toFixed(1)} percent confidence.`
  },
  {
    id: 'time_status',
    label: 'Time status',
    keywords: [
      'what time is it',
      'current time',
      'system time',
      'time now',
      'status check'
    ],
    response: ({ fullTime }) => `System clock reads ${fullTime}. Voice, renderer, and command bridge are online.`
  },
  {
    id: 'reset_conversation',
    label: 'Reset display',
    keywords: [
      'reset',
      'clear',
      'clear screen',
      'start over',
      'reset conversation'
    ],
    action: {
      type: 'resetConversation',
      label: 'Clear display'
    },
    response: () => 'Clearing the visible transcript and restoring the orb to idle.'
  }
];

module.exports = {
  intents,
  websiteActions
};
