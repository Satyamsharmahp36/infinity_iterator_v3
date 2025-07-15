import React, { useState } from 'react';

export default function KeyPathLocator({ resolvedKey, jsonData }) {
  const [foundPaths, setFoundPaths] = useState([]);

  const findKeyPaths = (data, targetKey, currentPath = '', results = []) => {
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        findKeyPaths(item, targetKey, `${currentPath}[${index}]`, results);
      });
    } else if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        const path = currentPath ? `${currentPath}.${key}` : key;
        if (key === targetKey) {
          results.push(path);
        }
        findKeyPaths(data[key], targetKey, path, results);
      }
    }
    return results;
  };

  const handleSearch = () => {
    if (!resolvedKey || !jsonData) {
      alert('Please provide a resolved key and valid JSON data.');
      return;
    }

    const targetKey = resolvedKey.split('.').pop(); // extract key like "transactionType"
    const paths = findKeyPaths(jsonData, targetKey);
    setFoundPaths(paths);
  };

  return (
    <div className="bg-white p-6 border rounded shadow mt-6">
      <h2 className="text-lg font-semibold mb-2">📍 Key Path Locator</h2>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600">Searching for: </span>
        <code className="text-blue-700">{resolvedKey}</code>
      </div>
      <button
        onClick={handleSearch}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Find All Key Paths
      </button>

      {foundPaths.length > 0 && (
        <div className="mt-4 max-h-60 overflow-y-auto bg-gray-100 p-4 rounded text-sm font-mono">
          <h3 className="text-sm font-bold mb-2">🔗 Found Paths:</h3>
          <ul className="space-y-1 text-gray-800">
            {foundPaths.map((path, index) => (
              <li key={index}>{path}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
