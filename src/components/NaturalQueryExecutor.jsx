import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const isLineTotalSumQuery = (query) => {
  const normalized = query.toLowerCase();
  return (
    normalized.includes("line total") &&
    (normalized.includes("sum") || normalized.includes("add") || normalized.includes("total of"))
  );
};

const flattenJSON = (obj, prefix = '', result = {}) => {
  for (const key in obj) {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flattenJSON(value, path, result);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        flattenJSON(item, `${path}[${index}]`, result);
      });
    } else {
      result[path] = value;
    }
  }
  return result;
};

// Sum all lineTotal fields found in flattened JSON
const sumLineTotals = (flatJSON) => {
  let sum = 0;
  let count = 0;
  const keysUsed = [];

  for (const key in flatJSON) {
    const isValid =
      key.endsWith(".lineOverallTotals.lineTotal") &&
      !key.includes("oldLineTotal") &&
      !key.includes("Affected") &&
      !key.includes("changeOrderGrandTotalSet");

    if (isValid) {
      const value = flatJSON[key];
      if (!isNaN(value)) {
        sum += Number(value);
        count++;
        keysUsed.push(key);
      }
    }
  }

  return { sum, count, keysUsed };
};

// Helper to extract structured results with paths
const extractStructuredResults = (flatJSON, extractFields) => {
  const results = [];
  const processedPaths = new Set();
  
  for (const [fullPath, value] of Object.entries(flatJSON)) {
    if (processedPaths.has(fullPath)) continue;
    
    const matchedField = extractFields.find(field => 
      fullPath.toLowerCase().includes(field.toLowerCase())
    );
    
    if (matchedField && value !== null && value !== undefined && value !== '') {
      // Extract path components
      const pathParts = fullPath.split('.');
      const arrayMatch = fullPath.match(/\[(\d+)\]/);
      const arrayIndex = arrayMatch ? parseInt(arrayMatch[1]) : null;
      
      // Try to find related fields in the same object context
      const basePath = fullPath.replace(/\.[^.]*$/, '');
      const relatedFields = {};
      
      // Look for common related fields
      const commonFields = ['eventId', 'primeLineNo', 'lineNo', 'id', 'transactionType'];
      commonFields.forEach(field => {
        const relatedPath = `${basePath}.${field}`;
        if (flatJSON[relatedPath] !== undefined) {
          relatedFields[field] = flatJSON[relatedPath];
        }
      });
      
      results.push({
        field: matchedField,
        value: value,
        fullPath: fullPath,
        arrayIndex: arrayIndex,
        basePath: basePath,
        relatedFields: relatedFields
      });
      
      processedPaths.add(fullPath);
    }
  }
  
  return results;
};

export default function NaturalQueryExecutor({ jsonData }) {
  const [userQuery, setUserQuery] = useState('');
  const [results, setResults] = useState([]);
  const [structuredResults, setStructuredResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedPlan, setParsedPlan] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  const handleQuery = async () => {
    if (!userQuery || !jsonData) return;
    setIsLoading(true);
    setResults([]);
    setStructuredResults([]);

    try {
      const cleanedQuery = userQuery.trim().toLowerCase();

      // ✅ Use custom logic for sum of line total
      if (isLineTotalSumQuery(cleanedQuery)) {
        const flat = flattenJSON(jsonData);
        const { sum, count, keysUsed } = sumLineTotals(flat);

        setResults([
          {
            values: { sum, count, keysUsed },
            fullNode: jsonData
          }
        ]);
        setParsedPlan({ intent: 'sum_line_total', pathMode: 'dynamic (flattened)', usedFallback: true });
        setIsLoading(false);
        return;
      }

      // 🔁 Fallback to Gemini
      const prompt = `
You are a JSON query planner. Given a user's natural language question, return a structured query plan.

Use this structure:
{
  "extract": ["<field1>", "<field2>"],
  "filter": {
    "<fieldName>": "<filterValue>"
  }
}

Query: "${userQuery}"
`;

      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.6,
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      if (text.startsWith("```json")) {
        text = text.replace(/```json|```/g, '').trim();
      }

      const plan = JSON.parse(text);
      setParsedPlan(plan);

      const flat = flattenJSON(jsonData);
      const structured = extractStructuredResults(flat, plan.extract);
      setStructuredResults(structured);

      // Keep original results for backward compatibility
      const matches = Object.entries(flat).filter(([key]) =>
        plan.extract.some(field => key.toLowerCase().includes(field.toLowerCase()))
      );

      setResults([
        {
          values: { extracted: matches.map(([, val]) => val) },
          fullNode: matches
        }
      ]);
    } catch (error) {
      console.error("❌ Query parsing or execution failed:", error);
      alert("Query failed. Check console for details.");
    }

    setIsLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const renderCardView = () => (
    <div className="space-y-4">
      {structuredResults.map((item, index) => (
        <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                {item.field}
              </span>
              {item.arrayIndex !== null && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  Index: {item.arrayIndex}
                </span>
              )}
            </div>
            <button
              onClick={() => copyToClipboard(item.fullPath)}
              className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs transition-colors"
              title="Copy path"
            >
              📋 Path
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Value:</p>
              <p className="bg-white p-2 rounded border font-mono text-sm break-all">
                {item.value}
              </p>
            </div>
            
            {Object.keys(item.relatedFields).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Related Fields:</p>
                <div className="bg-white p-2 rounded border space-y-1">
                  {Object.entries(item.relatedFields).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="font-medium text-gray-600">{key}:</span>
                      <span className="font-mono text-gray-800 ml-2 truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              🔍 Full Path
            </summary>
            <p className="mt-1 bg-gray-100 p-2 rounded text-xs font-mono break-all text-gray-700">
              {item.fullPath}
            </p>
          </details>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Field
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Value
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Event ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Prime Line No
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Index
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Path
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {structuredResults.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                  {item.field}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="max-w-xs truncate font-mono text-sm" title={item.value}>
                  {item.value}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="max-w-xs truncate font-mono text-xs text-gray-600" title={item.relatedFields.eventId}>
                  {item.relatedFields.eventId || '-'}
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-mono text-sm">
                  {item.relatedFields.primeLineNo || '-'}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {item.arrayIndex !== null ? item.arrayIndex : '-'}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => copyToClipboard(item.fullPath)}
                  className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs transition-colors"
                  title={item.fullPath}
                >
                  📋 Copy
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white p-6 border rounded shadow mt-6">
      <h2 className="text-lg font-semibold mb-2">🧠 Natural Query Executor</h2>

      <input
        type="text"
        placeholder="e.g. sum of line total, get eventId and primeLineNo"
        className="w-full p-2 border border-gray-300 rounded mb-4"
        value={userQuery}
        onChange={(e) => setUserQuery(e.target.value)}
      />

      <button
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        onClick={handleQuery}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Run Query'}
      </button>

      {parsedPlan && (
        <div className="mt-4 text-sm text-gray-700">
          <p className="mb-1 font-semibold">Parsed Plan:</p>
          <pre className="bg-gray-100 p-2 rounded text-xs text-blue-800">
            {JSON.stringify(parsedPlan, null, 2)}
          </pre>
        </div>
      )}

      {(structuredResults.length > 0 || (results.length > 0 && results[0].values.sum !== undefined)) && (
        <div className="mt-4">
          {/* View Toggle */}
          {structuredResults.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">📄 Results ({structuredResults.length}):</h3>
              <div className="flex bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'cards' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Table
                </button>
              </div>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {/* Line Total Sum Results */}
            {results.length > 0 && results[0].values.sum !== undefined && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">💰 Line Total Sum</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Sum:</p>
                    <p className="text-2xl font-bold text-green-600">{results[0].values.sum}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Count:</p>
                    <p className="text-xl font-semibold text-gray-800">{results[0].values.count}</p>
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    🔎 Show Keys Used ({results[0].values.keysUsed.length})
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {results[0].values.keysUsed.map((key, i) => (
                      <li key={i} className="text-xs font-mono bg-white p-1 rounded border">
                        {key}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            )}

            {/* Structured Results */}
            {structuredResults.length > 0 && (
              viewMode === 'cards' ? renderCardView() : renderTableView()
            )}
          </div>
        </div>
      )}
    </div>
  );
}