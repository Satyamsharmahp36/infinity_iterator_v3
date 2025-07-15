import React, { useState } from 'react';
import { XMLParser } from 'fast-xml-parser';
import KeyResolver from './KeyResolver';
import KeyPathLocator from './KeyPathLocator';
import JSONQueryExecutor from './JSONQueryExecutor';
import NaturalQueryExecutor from './NaturalQueryExecutor';




const flattenJSON = (obj, prefix = '', result = {}) => {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      flattenJSON(obj[key], `${prefix}${key}.`, result);
    } else {
      result[`${prefix}${key}`] = obj[key];
    }
  }
  return result;
};

export default function KeyMapperViewer() {
  const [xmlInput, setXmlInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState(null);
  const [flatKeys, setFlatKeys] = useState([]);
  const [resolvedKey, setResolvedKey] = useState('');


const handleConvert = () => {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseAttributeValue: true,
      parseTagValue: true
    });

    const parsed = parser.parse(xmlInput);
    setJsonOutput(parsed);
    const flattened = flattenJSON(parsed);
    setFlatKeys(Object.keys(flattened));
  } catch (e) {
    alert('Invalid XML!');
  }
};


  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🔍 Infinity Report Key Mapper</h1>

        <textarea
          rows={10}
          className="w-full p-4 border border-gray-300 rounded mb-4 text-sm font-mono"
          placeholder="Paste Infinity XML here..."
          value={xmlInput}
          onChange={(e) => setXmlInput(e.target.value)}
        />

        <button
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleConvert}
        >
          Convert & Map Keys
        </button>

        {flatKeys.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">🗝️ Mapped Keys:</h2>
            <div className="bg-white p-4 rounded shadow max-h-[400px] overflow-y-scroll border border-gray-200">
              <ul className="text-sm font-mono space-y-1">
                {flatKeys.map((key, index) => (
                  <li key={index} className="text-gray-800">{key}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {flatKeys.length > 0 && (
            <KeyResolver keys={flatKeys} resolvedKey={resolvedKey} setResolvedKey={setResolvedKey} />

        )}

        {flatKeys.length > 0 && resolvedKey && jsonOutput && (
  <KeyPathLocator resolvedKey={resolvedKey} jsonData={jsonOutput} />
)}

{flatKeys.length > 0 && resolvedKey && jsonOutput && (
  <JSONQueryExecutor resolvedKey={resolvedKey} jsonData={jsonOutput} />
)}

{jsonOutput && (
  <NaturalQueryExecutor jsonData={jsonOutput} />
)}




        {jsonOutput && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">🧾 Parsed JSON:</h2>
            <pre className="bg-gray-900 text-green-300 p-4 rounded overflow-x-auto text-xs">
              {JSON.stringify(jsonOutput, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
