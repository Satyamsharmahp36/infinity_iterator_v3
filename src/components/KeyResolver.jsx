import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY); 

export default function KeyResolver({ keys ,resolvedKey, setResolvedKey }) {
  const [userQuery, setUserQuery] = useState('');
//   const [matchedKey, setMatchedKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const handleMatch = async () => {
    setIsLoading(true);
    try {
      const prompt = `You are given a list of known data keys. The user has typed a vague or natural language term. Match it to the closest key from the list.

Known Keys:
${keys.join(', ')}

User input: "${userQuery}"

Return only the closest matching key.`;

      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.8,
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setResolvedKey(response.text().trim());

    } catch (error) {
      console.error('Error generating answer:', error);
      if (error.message.includes('API key')) {
        setMatchedKey('⚠️ Invalid Gemini API key. Check your .env config.');
      } else {
        setMatchedKey('❌ Error resolving key.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-6 border rounded shadow mt-6">
      <h2 className="text-lg font-semibold mb-2">🔎 Semantic Key Resolver (Gemini)</h2>
      <input
        type="text"
        className="w-full p-2 border border-gray-300 rounded mb-2"
        placeholder="e.g. change order, line total, etc"
        value={userQuery}
        onChange={(e) => setUserQuery(e.target.value)}
      />
      <button
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={handleMatch}
        disabled={isLoading || !userQuery}
      >
        {isLoading ? 'Matching...' : 'Match to Key'}
      </button>

        {resolvedKey && (
        <div className="mt-4">
            <p className="text-sm text-gray-600">Closest matched key:</p>
            <p className="font-mono text-blue-700 text-md">{resolvedKey}</p>
        </div>
        )}

    </div>
  );
}
