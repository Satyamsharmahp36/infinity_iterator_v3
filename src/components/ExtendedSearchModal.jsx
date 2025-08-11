import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function ExtendedSearchModal({ data, onClose, onFiltered }) {
  const [extendedQuery, setExtendedQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  const handleRunExtendedFilter = async () => {
    setIsFiltering(true);

    try {
      const prompt = `
You are a JSON filter engine.

Given:
- A JSON array of objects
- A human query like "where transactionType is CREATE_ORDER"

Filter and return only the matching records.

User Query: "${extendedQuery}"

JSON Input:
${JSON.stringify(data, null, 2)}

Return ONLY the filtered JSON array (valid JSON, no extra explanation).
`;

      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.6,
        },
      });

      const result = await model.generateContent(prompt);
      let text = await result.response.text();

      if (text.startsWith('```')) {
        text = text.replace(/```json|```/g, '').trim();
      }

      const filtered = JSON.parse(text);
      onFiltered(filtered);
    } catch (err) {
      console.error("❌ Extended filter failed:", err.message);
      alert("Error processing filter. Please refine your query.");
    }

    setIsFiltering(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-3xl p-6 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">🔍 Extend Search</h3>
        <textarea
          className="w-full border p-2 rounded text-sm h-24 mb-3"
          placeholder="e.g. where transactionType is CREATE_ORDER or paymentStatus is AUTHORIZED"
          value={extendedQuery}
          onChange={(e) => setExtendedQuery(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 text-sm bg-gray-300 hover:bg-gray-400 rounded">
            Cancel
          </button>
          <button
            disabled={!extendedQuery.trim() || isFiltering}
            onClick={handleRunExtendedFilter}
            className="px-3 py-1 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded disabled:opacity-50"
          >
            {isFiltering ? 'Filtering...' : 'Apply Filter'}
          </button>
        </div>
      </div>
    </div>
  );
}
