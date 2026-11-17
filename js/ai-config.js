// AI Configuration
// Do not put API keys in client-side JavaScript. The browser must not hold a secret key.
// External AI stays off until a server-side proxy supplies a key. Never commit a key here.

window.AI_CONFIG = {
  // OpenAI API Configuration
  apiKey: '',
  provider: 'openai',
  model: 'gpt-4o-mini', // Fast, cheap model for intent analysis only

  // HYBRID MODE: Use ChatGPT only for understanding questions, not generating answers
  useHybridMode: true, // true = intent analysis only (cheap), false = full ChatGPT (expensive)

  // FULL AI MODE for specific menu item searches
  // When user asks for specific food (crab legs, grouper, etc), use full AI with menu search
  useFullAIForMenuSearch: true, // true = search actual menus (accurate), false = generic filtering (fast)

  // Text-to-Speech Configuration (Optional)
  tts: {
    // Using browser voices (free) by default
    // To enable premium AI voices, uncomment one of these:

    // OpenAI TTS (uses same API key, ~$0.015 per 1,000 chars)
    // provider: 'openai',
    // voice: 'nova' // Options: alloy, echo, fable, onyx, nova, shimmer
  }
};
