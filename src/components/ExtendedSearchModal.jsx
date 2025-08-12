import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function ExtendedSearchModal({ data, onClose, onFiltered, isEmbedded = false, query = '', autoExecute = false }) {
  const [extendedQuery, setExtendedQuery] = useState(query);
  const [isFiltering, setIsFiltering] = useState(false);
  const hasExecutedRef = useRef(false); // Prevent multiple executions

  useEffect(() => {
    setExtendedQuery(query);
    
    // Auto-execute if requested (for direct follow-up queries)
    // Use ref to prevent multiple executions
    if (autoExecute && query && !hasExecutedRef.current) {
      hasExecutedRef.current = true;
      handleRunExtendedFilter();
    }
  }, [query, autoExecute]);

  // Reset the execution flag when component unmounts or query changes
  useEffect(() => {
    hasExecutedRef.current = false;
  }, [query]);

  const handleRunExtendedFilter = async () => {
    if (isFiltering) return; // Prevent multiple simultaneous calls
    
    setIsFiltering(true);
  
    try {
      const prompt = `
You are a JSON filter engine. 

Given:
- A JSON array of objects  
- A human query for filtering

Filter and return only the matching records based on the query.

User Query: "${extendedQuery}"

JSON Input:
${JSON.stringify(data, null, 2)}

Instructions:
- If the query asks for items "with error code" or "which have error code", return items where ErrorCode is NOT "N/A" 
- If the query asks for specific transaction types, filter by TransactionType field
- If the query asks for specific status values, filter by Status field
- If the query asks for payment status, filter by paymentStatus field
- Be flexible with natural language queries
- Return ONLY the filtered JSON array (valid JSON, no extra explanation)
`;
  
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.3,
        },
      });
  
      const result = await model.generateContent(prompt);
      let text = await result.response.text();
  
      // Clean up the response using string methods
      const codeBlockStart = '```'
      const codeBlockEnd = '```';
      
      if (text.includes(codeBlockStart)) {
        text = text.replace(codeBlockStart, '');
      }
      if (text.includes(codeBlockEnd)) {
        text = text.split(codeBlockEnd)[0];
      }
      
      text = text.trim();
      
      // Extract JSON array
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        text = text.substring(jsonStart, jsonEnd + 1);
      }
  
      const filtered = JSON.parse(text);
      
      // Only call onFiltered once
      if (onFiltered && !hasExecutedRef.current) {
        hasExecutedRef.current = true;
        onFiltered(filtered);
      }
    } catch (err) {
      console.error("❌ Extended filter failed:", err.message);
      alert("Error processing filter. Please refine your query.");
    }
  
    setIsFiltering(false);
  };

  // If auto-execute mode, don't render any UI - just execute
  if (autoExecute) {
    return null;
  }

  if (isEmbedded) {
    return (
      <button
        disabled={!extendedQuery.trim() || isFiltering}
        onClick={handleRunExtendedFilter}
        className="px-4 py-2 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isFiltering ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Filtering...</span>
          </div>
        ) : (
          'Apply AI Filter'
        )}
      </button>
    );
  }

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
