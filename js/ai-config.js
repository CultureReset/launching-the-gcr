// AI Configuration - ChatGPT Integration
// ⚠️ IMPORTANT: This file contains your API key. Never commit to git!

window.AI_CONFIG = {
  // OpenAI API Configuration
  apiKey: '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',
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
