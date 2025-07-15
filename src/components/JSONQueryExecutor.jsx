import React, { useState } from 'react';

export default function JSONQueryExecutor({ resolvedKey, jsonData }) {
  const [filterValue, setFilterValue] = useState('');
  const [results, setResults] = useState([]);

  const findMatches = (data, key, value, path = '', matches = []) => {
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        findMatches(item, key, value, `${path}[${index}]`, matches);
      });
    } else if (typeof data === 'object' && data !== null) {
      for (const k in data) {
        const newPath = path ? `${path}.${k}` : k;
        if (k === key && String(data[k]) === value) {
          matches.push({ path: newPath, value: data[k], fullNode: data });
        }
        findMatches(data[k], key, value, newPath, matches);
      }
    }
    return matches;
  };

  const handleRunQuery = () => {
    if (!resolvedKey || !filterValue || !jsonData) return;

    const key = resolvedKey.split('.').pop(); // get final key like "transactionType"
    const matches = findMatches(jsonData, key, filterValue);
    setResults(matches);
  };

  return (
    <div className="bg-white p-6 border rounded shadow mt-6">
      <h2 className="text-lg font-semibold mb-2">⚙️ JSON Query Executor</h2>
      <p className="text-sm mb-2 text-gray-600">Resolved Key: <code className="text-blue-700 font-mono">{resolvedKey}</code></p>

      <input
        type="text"
        placeholder="Enter filter value (e.g. CREATE_ORDER)"
        className="w-full p-2 border rounded mb-2"
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
      />

      <button
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        onClick={handleRunQuery}
      >
        Run Query
      </button>

      {results.length > 0 && (
        <div className="mt-4 max-h-60 overflow-y-auto text-sm">
          <h3 className="font-semibold mb-2">📄 Matching Entries ({results.length}):</h3>
          <ul className="space-y-3">
            {results.map((item, index) => (
              <li key={index} className="bg-gray-100 p-2 rounded shadow-sm">
                <p className="text-gray-700 font-mono">Path: {item.path}</p>
                <pre className="text-xs text-green-700 overflow-x-auto">{JSON.stringify(item.fullNode, null, 2)}</pre>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
