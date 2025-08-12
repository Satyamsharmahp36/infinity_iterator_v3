// ChatbotQueryExecutor.jsx
import React, { useState, useRef, useEffect } from 'react';
import { queryPatterns } from './constants.js';
import { recognizeQuery } from './utils.js';
import { QueryHandlers } from './queryHandlers.js';
import ExtendedSearchModal from './ExtendedSearchModal.jsx';

export default function ChatbotQueryExecutor({ jsonData }) {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [baseQueryResult, setBaseQueryResult] = useState(null);
  const [showExtendSearch, setShowExtendSearch] = useState(false);
  const [activeExtendedData, setActiveExtendedData] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (content, type = 'user', queryResult = null, recognition = null) => {
    const newMessage = {
      id: Date.now(),
      content,
      type,
      timestamp: new Date().toISOString(),
      queryResult,
      recognition
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleQuery = async (query, isFollowUp = false) => {
    if (!query || !jsonData) return;
    
    setIsLoading(true);
    
    try {
      // Add user message
      addMessage(query, 'user');

      // Step 1: Recognize query type
      const recognition = recognizeQuery(query);
      
      // Step 2: Execute corresponding handler
      const handler = QueryHandlers[recognition.handler];
      let result;
      let dataToProcess = jsonData;

      // If it's a follow-up and we have base query results, use them
      if (isFollowUp && baseQueryResult?.results) {
        dataToProcess = baseQueryResult.results;
      }

      // Always pass both data and query
      if (typeof handler === 'function') {
        if (handler.length === 2) {
          result = await handler(dataToProcess, query);
        } else {
          result = await handler(dataToProcess);
        }
      }

      // If this is not a follow-up, save as base query
      if (!isFollowUp) {
        setBaseQueryResult(result);
      }

      // Add bot response
      addMessage('Here are your query results:', 'bot', result, recognition);

    } catch (error) {
      console.error("❌ Query execution failed:", error);
      const errorResult = {
        queryType: 'ERROR',
        results: { error: error.message },
        metadata: { timestamp: new Date().toISOString() }
      };
      addMessage('Sorry, I encountered an error processing your query.', 'bot', errorResult);
    }

    setIsLoading(false);
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    const isFollowUp = baseQueryResult !== null;
    handleQuery(userInput, isFollowUp);
    setUserInput('');
  };

  const handleNewQuery = () => {
    setBaseQueryResult(null);
    addMessage('Starting a new query session. Your next question will be treated as a base query.', 'system');
  };

  const clearChat = () => {
    setMessages([]);
    setBaseQueryResult(null);
    addMessage('Welcome! Ask me anything about your data. Try queries like "Give me Order total" or "Payment details".', 'system');
  };

  const handleExampleQuery = (exampleQuery) => {
    setUserInput(exampleQuery);
  };

  // Initialize chat
  useEffect(() => {
    if (messages.length === 0) {
      clearChat();
    }
  }, []);

  const renderQueryResult = (queryResult, messageId) => {
    if (!queryResult) return null;

    return (
      <div className="mt-3 bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
            {queryResult.queryType}
          </span>
          <button
            onClick={() => {
              setActiveExtendedData(queryResult.results);
              setShowExtendSearch(true);
            }}
            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
          >
            🔍 Extend Search
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {queryResult.queryType === 'ORDER_TOTAL_BY_TXN_TYPE' && (
            <div>
              <div className="mb-3 p-3 bg-green-50 rounded">
                <p className="font-semibold text-green-800">📊 Summary:</p>
                <p><strong>Total Transactions:</strong> {queryResult.results.length}</p>
                <p><strong>Total Sum:</strong> ₹{queryResult.metadata.totalSum?.toFixed(2) || '0.00'}</p>
                {queryResult.metadata.requestedTypes?.length > 0 && (
                  <p><strong>Transaction Types:</strong> {queryResult.metadata.requestedTypes.join(', ')}</p>
                )}
              </div>

              <div className="space-y-2">
                {queryResult.results.slice(0, 3).map((item, i) => (
                  <div key={i} className="bg-white p-3 rounded border">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>Event ID:</strong> {item.eventId}</p>
                      <p><strong>Type:</strong> <span className="font-mono bg-blue-100 px-1 rounded">{item.transactionType}</span></p>
                      <p><strong>Order No:</strong> {item.orderNo}</p>
                      <p><strong>Total:</strong> <span className="font-semibold text-green-600">₹{item.grandTotal.toFixed(2)}</span></p>
                    </div>
                  </div>
                ))}
                {queryResult.results.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    ... and {queryResult.results.length - 3} more transactions
                  </p>
                )}
              </div>
            </div>
          )}

          {queryResult.queryType === 'PAYMENT_DETAILS' && (
            <div>
              <div className="mb-3 p-3 bg-blue-50 rounded">
                <p className="font-semibold text-blue-800">💳 Payment Summary:</p>
                <p><strong>Records Found:</strong> {queryResult.results.length}</p>
                <p><strong>Payment Types:</strong> {queryResult.metadata.uniquePaymentTypes?.join(', ') || 'None'}</p>
                <p><strong>Payment Statuses:</strong> {queryResult.metadata.uniquePaymentStatuses?.join(', ') || 'None'}</p>
              </div>

              <div className="space-y-2">
                {queryResult.results.slice(0, 2).map((item, i) => (
                  <div key={i} className="bg-white p-3 rounded border">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>Event ID:</strong> {item.eventId}</p>
                      <p><strong>Payment Status:</strong> <span className="font-semibold text-green-600">{item.paymentStatus}</span></p>
                      <p><strong>Payment Type:</strong> {item.paymentType}</p>
                      <p><strong>Amount:</strong> ₹{item.requestAmount}</p>
                      <p><strong>Card Type:</strong> {item.creditCardType}</p>
                      <p><strong>Card No:</strong> {item.displayCreditCardNo}</p>
                    </div>
                  </div>
                ))}
                {queryResult.results.length > 2 && (
                  <p className="text-sm text-gray-500 text-center">
                    ... and {queryResult.results.length - 2} more payment records
                  </p>
                )}
              </div>
            </div>
          )}

          {queryResult.queryType === 'SUM_LINE_TOTAL' && (
            <div className="bg-white p-3 rounded border">
              <p className="text-lg"><strong>Sum:</strong> ₹{queryResult.results.sum}</p>
              <p><strong>Count:</strong> {queryResult.results.count} items</p>
            </div>
          )}

          {queryResult.queryType === 'MTL_STATUS' && (
            <div>
              <p className="mb-2"><strong>Found {queryResult.results.length} transactions:</strong></p>
              <div className="space-y-2">
                {queryResult.results.slice(0, 3).map((item, i) => (
                  <div key={i} className="bg-white p-3 rounded border text-sm">
                    <p><strong>Type:</strong> {item.TransactionType}</p>
                    <p><strong>Status:</strong> {item.Status}</p>
                    <p><strong>Order:</strong> {item.Details.orderNo}</p>
                  </div>
                ))}
                {queryResult.results.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    ... and {queryResult.results.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {queryResult.queryType === 'ERROR' && (
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <p className="text-red-600"><strong>Error:</strong> {queryResult.results.error}</p>
            </div>
          )}

          {/* Add other query types as needed */}
        </div>

        {queryResult.metadata?.extendedSearchApplied && (
          <p className="text-xs text-purple-600 mt-2">
            🔍 Extended filter applied: <em>{queryResult.metadata.extendedFilterQuery}</em>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[600px] bg-white border rounded-lg shadow">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">🤖 Query Assistant Chatbot</h2>
          {baseQueryResult && (
            <p className="text-sm text-blue-600">
              Follow-up mode: Questions will filter from base query results
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleNewQuery}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
            disabled={!baseQueryResult}
          >
            New Query
          </button>
          <button
            onClick={clearChat}
            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Example Queries */}
      <div className="p-3 border-b bg-gray-50">
        <p className="text-sm font-semibold mb-2">Quick Examples:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExampleQuery('Give me Order total of Create order')}
            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
          >
            Order Totals
          </button>
          <button
            onClick={() => handleExampleQuery('Payment details')}
            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
          >
            Payment Details
          </button>
          <button
            onClick={() => handleExampleQuery('sum of line total')}
            className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
          >
            Line Total Sum
          </button>
          <button
            onClick={() => handleExampleQuery('MTL status')}
            className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200"
          >
            MTL Status
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'system'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {/* Message content */}
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Query recognition */}
              {message.recognition && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <p className="font-semibold text-blue-800">🎯 Query Recognition:</p>
                  <p><strong>Type:</strong> {message.recognition.type}</p>
                  <p><strong>Confidence:</strong> {(message.recognition.confidence * 100).toFixed(0)}%</p>
                </div>
              )}

              {/* Query results */}
              {message.queryResult && renderQueryResult(message.queryResult, message.id)}
              
              {/* Timestamp */}
              <div className="text-xs opacity-70 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Processing your query...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Ask me about your data... (e.g., 'Show payment details for Create orders')"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>

      {/* Extended Search Modal */}
      {showExtendSearch && (
        <ExtendedSearchModal
          data={activeExtendedData}
          onClose={() => setShowExtendSearch(false)}
          onFiltered={(filteredResults) => {
            // Update the last bot message with filtered results
            setMessages(prev => {
              const lastBotMessageIndex = prev.length - 1;
              if (lastBotMessageIndex >= 0 && prev[lastBotMessageIndex].type === 'bot') {
                const updatedMessages = [...prev];
                updatedMessages[lastBotMessageIndex] = {
                  ...updatedMessages[lastBotMessageIndex],
                  queryResult: {
                    ...updatedMessages[lastBotMessageIndex].queryResult,
                    results: filteredResults,
                    metadata: {
                      ...updatedMessages[lastBotMessageIndex].queryResult.metadata,
                      extendedSearchApplied: true,
                      extendedResultCount: filteredResults.length,
                    }
                  }
                };
                return updatedMessages;
              }
              return prev;
            });
            setShowExtendSearch(false);
          }}
        />
      )}
    </div>
  );
}
