import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function NaturalQueryExecutor({ jsonData }) {
  const [userQuery, setUserQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedPlan, setParsedPlan] = useState(null);

const extractFromJson = (data, extractFields, filterField, filterValue) => {
  const matches = [];

  const recurse = (obj) => {
    if (Array.isArray(obj)) {
      obj.forEach(recurse);
    } else if (typeof obj === 'object' && obj !== null) {
      if (
        Object.prototype.hasOwnProperty.call(obj, filterField) &&
        String(obj[filterField]) === String(filterValue)
      ) {
        const result = {};
        extractFields.forEach((field) => {
          result[field] = obj[field];
        });
        matches.push({
          values: result,
          fullNode: obj
        });
      }

      for (const key in obj) {
        recurse(obj[key]);
      }
    }
  };

  recurse(data);
  return matches;
};


const handleQuery = async () => {
  if (!userQuery || !jsonData) return;
  setIsLoading(true);

  try {
const prompt = `
You are a JSON query planner. Given a user's natural language question, return a structured query plan.

Before answering, consider these hardcoded rules (examples):

- "line total" refers to: "transactionPayload.transactionPayload.attributes.transactionDetails.order.orderLineDetailSet[].lineOverallTotals.lineTotal"
- "event id" refers to: "eventId"
- "internal status" refers to: "internalStatus"

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

    // Strip code block formatting if present
    if (text.startsWith("```json")) {
      text = text.replace(/```json|```/g, '').trim();
    }

    const plan = JSON.parse(text); // may throw
    setParsedPlan(plan);

    const filterKey = Object.keys(plan.filter)[0];
    const filterValue = plan.filter[filterKey];

    const matches = extractFromJson(
      jsonData,
      plan.extract,
      filterKey,
      filterValue
    );

    setResults(matches);
  } catch (error) {
    console.error("❌ Query parsing or execution failed:", error);
    alert("Query failed. Check console for details.");
  }

  setIsLoading(false);
};


  return (
    <div className="bg-white p-6 border rounded shadow mt-6">
      <h2 className="text-lg font-semibold mb-2">🧠 Natural Query Executor (Gemini)</h2>
      <input
        type="text"
        placeholder="e.g. Give eventId of all transactions where transaction type is CREATE_ORDER"
        className="w-full p-2 border rounded mb-4"
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
          <ul className="space-y-3 text-sm">
            {results.map((item, index) => (
              <li key={index} className="bg-gray-100 p-2 rounded">
                        <div className="mb-2">
                        <strong className="text-gray-700">Extracted Fields:</strong>
                        <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-900 font-mono">
                            {Object.entries(item.values).map(([k, v]) => (
                            <div key={k} className="bg-gray-100 p-2 rounded border">
                                <span className="text-blue-700">{k}:</span> {v || '—'}
                            </div>
                            ))}
                        </div>
                        </div>

                <details>
                  <summary className="text-blue-600 cursor-pointer">Full Context</summary>
                  <pre className="text-green-800 text-xs overflow-x-auto">
                    {JSON.stringify(item.fullNode, null, 2)}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
