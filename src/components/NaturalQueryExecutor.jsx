import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Detect if the user is asking for line total summation
const isLineTotalSumQuery = (query) => {
  const normalized = query.toLowerCase();
  return (
    normalized.includes("line total") &&
    (normalized.includes("sum") || normalized.includes("add") || normalized.includes("total of"))
  );
};

// Flatten nested JSON into key-value pairs
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
    const lower = key.toLowerCase();

    const isValid = (
      lower.includes("lineoveralltotals.lineTotal".toLowerCase()) &&
      !lower.includes("oldlinetotal") &&
      !lower.includes("changeordergrandtotalset")
    );

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


export default function NaturalQueryExecutor({ jsonData }) {
  const [userQuery, setUserQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedPlan, setParsedPlan] = useState(null);

  const handleQuery = async () => {
    if (!userQuery || !jsonData) return;
    setIsLoading(true);

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

      const filterKey = Object.keys(plan.filter)[0];
      const filterValue = plan.filter[filterKey];

      const flat = flattenJSON(jsonData);
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

  return (
    <div className="bg-white p-6 border rounded shadow mt-6">
      <h2 className="text-lg font-semibold mb-2">🧠 Natural Query Executor</h2>

      <input
        type="text"
        placeholder="e.g. sum of line total"
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

      {results.length > 0 && (
        <div className="mt-4 max-h-60 overflow-y-auto">
          <h3 className="font-semibold mb-2">📄 Results ({results.length}):</h3>
          {results.map((item, index) => (
            <div key={index} className="bg-gray-100 p-2 rounded mb-3">
              {item.values.sum !== undefined ? (
                <div>
                  <p><strong>Sum:</strong> {item.values.sum}</p>
                  <p><strong>Count:</strong> {item.values.count}</p>
                  <details className="text-sm text-blue-700">
                    <summary className="cursor-pointer">🔎 Keys Used</summary>
                    <ul className="text-xs font-mono list-disc ml-5 mt-1">
                      {item.values.keysUsed.map((k, i) => <li key={i}>{k}</li>)}
                    </ul>
                  </details>
                </div>
              ) : (
                <div>
                  <strong>Extracted Values:</strong>
                  <ul className="text-xs font-mono list-disc ml-4">
                    {item.values.extracted.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
