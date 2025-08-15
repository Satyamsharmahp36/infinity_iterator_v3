import { GoogleGenerativeAI } from '@google/generative-ai';
import { baseCommands } from './constants.js';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const enhancedRecognizeQuery = async (userQuery) => {
  try {
    // First, try simple keyword matching for speed
    const simpleMatch = simpleKeywordMatch(userQuery);
    if (simpleMatch.confidence > 0.8) {
      return simpleMatch;
    }

    // If simple matching isn't confident enough, use LLM
    return await llmRecognizeQuery(userQuery);
  } catch (error) {
    console.error('Enhanced query recognition failed:', error);
    // Fallback to simple matching
    return simpleKeywordMatch(userQuery);
  }
};

const simpleKeywordMatch = (userQuery) => {
  const query = userQuery.toLowerCase().trim();
  let bestMatch = null;
  let highestScore = 0;

  for (const command of baseCommands) {
    for (const example of command.commands) {
      const similarity = calculateSimilarity(query, example.toLowerCase());
      if (similarity > highestScore) {
        highestScore = similarity;
        bestMatch = command;
      }
    }
  }

  return {
    type: bestMatch?.id || 'UNKNOWN',
    handler: bestMatch?.handler || 'fallbackQuery',
    confidence: highestScore,
    description: bestMatch?.description || 'Unknown query type',
    matchedCommand: bestMatch
  };
};

const llmRecognizeQuery = async (userQuery) => {
  const commandsText = baseCommands.map(cmd => 
    `${cmd.id}: ${cmd.commands.join(', ')} (Description: ${cmd.description})`
  ).join('\n');

  const prompt = `
You are a query classifier. Given a user query, determine which of these predefined commands it most closely matches:

AVAILABLE COMMANDS:
${commandsText}

User Query: "${userQuery}"

Return a JSON response with this exact structure:
{
  "type": "COMMAND_ID",
  "handler": "handlerFunction",
  "confidence": 0.95,
  "reasoning": "Why this command was selected"
}

Rules:
- confidence should be between 0.0 and 1.0
- type should be one of: MTL_STATUS, ORDER_TOTAL, PAYMENT_DETAILS, ITEM_DETAILS, ORDER_ATTRIBUTES, STORE_DETAILS
- If no good match (confidence < 0.3), use type "UNKNOWN" and handler "fallbackQuery"
- Be flexible with synonyms and variations
- Focus on the main intent of the query
`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0.3,
    },
  });

  const result = await model.generateContent(prompt);
  let text = await result.response.text();

  // Clean up the response - FIXED VERSION
  const codeBlockStart = '```'
  const codeBlockEnd = '```';
  
  if (text.includes(codeBlockStart)) {
    text = text.replace(codeBlockStart, '');
  }
  if (text.includes(codeBlockEnd)) {
    text = text.split(codeBlockEnd)[0];
  }
  
  text = text.trim();

  const response = JSON.parse(text);
  
  // Find the matching command details
  const matchedCommand = baseCommands.find(cmd => cmd.id === response.type);
  
  return {
    type: response.type,
    handler: matchedCommand?.handler || response.handler,
    confidence: response.confidence,
    description: matchedCommand?.description || response.reasoning,
    reasoning: response.reasoning,
    matchedCommand
  };
};

// Helper function for simple similarity calculation
const calculateSimilarity = (str1, str2) => {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  
  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1.includes(word2) || word2.includes(word1)) {
        matches++;
        break;
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
};
