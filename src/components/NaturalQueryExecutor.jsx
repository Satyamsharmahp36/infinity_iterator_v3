import React, { useState, useRef, useEffect } from 'react';
import { queryPatterns } from './constants.js';
import { recognizeQuery } from './utils.js';
import { QueryHandlers } from './queryHandlers.js';
import ExtendedSearchModal from './ExtendedSearchModal.jsx';
import { Bot, User, Send, Database, Maximize2, Minimize2, Plus, CreditCard, DollarSign, RefreshCw, Package, FileText, TrendingUp } from 'lucide-react';

export default function EnhancedNaturalQueryExecutor({ jsonData }) {
  const [userQuery, setUserQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [baseQuery, setBaseQuery] = useState(null);
  const [baseResult, setBaseResult] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pendingFollowUpQuery, setPendingFollowUpQuery] = useState('');
  const [showExtendedSearch, setShowExtendedSearch] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([{
        id: Date.now(),
        type: 'ai',
        content: 'Welcome to the Natural Language Query Tool! I can help you analyze JSON data using natural language queries. Please enter your query to get started.',
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  const handleQuery = async () => {
    if (!userQuery.trim() || !jsonData) return;

    const currentQuery = userQuery;
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: currentQuery,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    setUserQuery('');

    try {
      // Check if this is a follow-up query
      if (baseResult && baseQuery) {
        // This is a follow-up query - trigger ExtendedSearchModal
        setPendingFollowUpQuery(currentQuery);
        setShowExtendedSearch(true);
        return; // Don't set loading to false here
      } else {
        // This is a new base query
        try {
          const recognition = recognizeQuery(currentQuery);
          const handler = QueryHandlers[recognition.handler];
          
          let result;
          if (typeof handler === 'function') {
            if (handler.length === 2) {
              result = await handler(jsonData, currentQuery);
            } else {
              result = await handler(jsonData);
            }
          }

          setBaseQuery(currentQuery);
          setBaseResult(result);

          const aiMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: result,
            timestamp: new Date().toISOString(),
            isFollowUp: false
          };

          setChatHistory(prev => [...prev, aiMessage]);
        } catch (error) {
          console.error("❌ Query execution failed:", error);
          const errorMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: {
              queryType: 'ERROR',
              results: { error: error.message },
              metadata: { timestamp: new Date().toISOString() }
            },
            timestamp: new Date().toISOString()
          };
          setChatHistory(prev => [...prev, errorMessage]);
        }
      }
    } catch (error) {
      console.error("❌ Query execution failed:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: {
          queryType: 'ERROR',
          results: { error: error.message },
          metadata: { timestamp: new Date().toISOString() }
        },
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  // Handle results from the ExtendedSearchModal
  const handleExtendedSearchResult = (filteredResults) => {
    const messageId = Date.now() + Math.random();
    
    const result = {
      queryType: 'EXTENDED_SEARCH',
      results: filteredResults,
      metadata: {
        timestamp: new Date().toISOString(),
        isFollowUp: true,
        baseQuery: baseQuery,
        followUpQuery: pendingFollowUpQuery,
        originalResultCount: Array.isArray(baseResult.results) ? baseResult.results.length : 0,
        filteredResultCount: Array.isArray(filteredResults) ? filteredResults.length : 0
      }
    };

    const aiMessage = {
      id: messageId,
      type: 'ai',
      content: result,
      timestamp: new Date().toISOString(),
      isFollowUp: true
    };

    // Check for duplicates before adding
    setChatHistory(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.isFollowUp === true && 
          lastMessage.content?.metadata?.followUpQuery === pendingFollowUpQuery) {
        return prev; // Don't add duplicate
      }
      return [...prev, aiMessage];
    });
    
    // Clean up
    setPendingFollowUpQuery('');
    setShowExtendedSearch(false);
    setIsLoading(false);
  };

  const handleNewQuery = () => {
    setBaseQuery(null);
    setBaseResult(null);
    setPendingFollowUpQuery('');
    setShowExtendedSearch(false);
    setChatHistory([{
      id: Date.now(),
      type: 'ai',
      content: 'Ready for a new query! Please enter your question to analyze the JSON data.',
      timestamp: new Date().toISOString()
    }]);
    setUserQuery('');
  };

  const handleExampleQuery = (exampleQuery) => {
    setUserQuery(exampleQuery);
    inputRef.current?.focus();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getQueryTypeIcon = (queryType) => {
    switch (queryType) {
      case 'PAYMENT_DETAILS': return <CreditCard className="w-5 h-5" />;
      case 'ORDER_TOTAL_BY_TXN_TYPE': return <DollarSign className="w-5 h-5" />;
      case 'ITEM_LINE_TOTALS': return <Package className="w-5 h-5" />;
      case 'ORDER_ATTRIBUTES': return <FileText className="w-5 h-5" />;
      case 'MTL_STATUS': return <RefreshCw className="w-5 h-5" />;
      case 'SUM_LINE_TOTAL': return <TrendingUp className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  const renderQueryResult = (result, isFollowUp = false) => {
    if (!result) return null;

    return (
      <div className={`bg-slate-900/80 backdrop-blur-sm rounded-xl p-5 space-y-4 border shadow-lg ${
        isFollowUp ? 'border-purple-500/50' : 'border-slate-600/50'
      }`}>
        {isFollowUp && (
          <div className="flex items-center gap-2 text-purple-400 font-medium mb-4 bg-purple-500/10 px-3 py-2 rounded-lg">
            <RefreshCw className="w-4 h-4" />
            Follow-up Query Result
            {result.metadata?.originalResultCount && (
              <span className="text-purple-300 text-sm ml-2">
                (Filtered {result.metadata.filteredResultCount} from {result.metadata.originalResultCount} items)
              </span>
            )}
          </div>
        )}

{result.queryType === 'ORDER_ATTRIBUTES' && (
  <div>
    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg mb-4">
      {getQueryTypeIcon(result.queryType)}
      Order Attributes
    </div>
    
    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Total Records:</span>
          <span className="text-white font-semibold">{result.results.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Transaction Types:</span>
          <span className="text-cyan-400">{result.metadata.uniqueTransactionTypes?.join(', ') || 'None'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Business Dates:</span>
          <span className="text-emerald-400">{result.metadata.uniqueBusinessDates?.join(', ') || 'None'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Sales Dates:</span>
          <span className="text-blue-400">{result.metadata.uniqueSalesDates?.join(', ') || 'None'}</span>
        </div>
      </div>

      {result.metadata.filteringApplied && (
        <div className="mt-3 p-3 bg-green-900/20 border border-green-600/30 rounded">
          <p className="text-green-400 text-sm">
            🎯 Filtered by Transaction Types: <span className="font-semibold">{result.metadata.filteredBy.join(', ')}</span>
          </p>
          <p className="text-green-300 text-xs mt-1">
            Showing {result.results.length} out of {result.metadata.totalOrderAttributesFound} total order attribute records
          </p>
        </div>
      )}
    </div>

    {/* Show skipped transactions details if any */}
    {result.metadata.skippedTransactions?.length > 0 && (
      <details className="mb-4">
        <summary className="cursor-pointer text-gray-400 text-sm">
          View {result.metadata.skippedTransactions.length} Skipped Transactions
        </summary>
        <div className="mt-2 p-3 bg-slate-700/30 rounded text-xs">
          {result.metadata.skippedTransactions.map((skipped, i) => (
            <div key={i} className="mb-2 p-2 bg-slate-800/50 rounded">
              <strong className="text-amber-400">{skipped.transactionType}</strong> 
              <span className="text-slate-300"> ({skipped.eventId})</span>
              <div className="text-slate-400 mt-1">{skipped.reason}</div>
            </div>
          ))}
        </div>
      </details>
    )}

    <div className="space-y-4">
      {result.results.map((item, i) => (
        <div key={i} className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
          {/* Event Information */}
          <div className="mb-4 pb-3 border-b border-slate-600/30">
            <div className="text-blue-400 font-medium mb-3 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Event Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex flex-col">
                <span className="text-slate-400 text-xs mb-1">Event ID</span>
                <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs truncate">{item.eventId}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 text-xs mb-1">Transaction Type</span>
                <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-1 rounded text-xs">
                  {item.transactionType}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 text-xs mb-1">Order No</span>
                <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.orderNo}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Invoice Information */}
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-orange-400 font-medium mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Invoice Information
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 min-w-32">Original Invoice No:</span>
                  <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.originalInvoiceNo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 min-w-32">Master Invoice No:</span>
                  <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.originalMasterInvoiceNo}</span>
                </div>
              </div>
            </div>

            {/* Date Information */}
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-purple-400 font-medium mb-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Date Information
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 min-w-24">Business Date:</span>
                  <span className="text-white">{item.businessDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 min-w-24">Sales Date:</span>
                  <span className="text-white">{item.salesDate}</span>
                </div>
              </div>
            </div>

            {/* Financial Totals */}
            <div className="bg-slate-700/30 rounded-lg p-3 md:col-span-2">
              <div className="text-emerald-400 font-medium mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financial Totals
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Grand Total</span>
                  <span className="text-emerald-400 font-bold text-lg">
                    {item.grandTotal !== 'N/A' ? `₹${Number(item.grandTotal).toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Line Subtotal</span>
                  <span className="text-blue-400 font-semibold">
                    {item.lineSubTotal !== 'N/A' ? `₹${Number(item.lineSubTotal).toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Grand Tax</span>
                  <span className="text-yellow-400 font-semibold">
                    {item.grandTax !== 'N/A' ? `₹${Number(item.grandTax).toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Grand Discount</span>
                  <span className="text-red-400 font-semibold">
                    {item.grandDiscount !== 'N/A' ? `₹${Number(item.grandDiscount).toFixed(2)}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}


{result.queryType === 'STORE_DETAILS' && (
  <div>
    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg mb-4">
      {getQueryTypeIcon(result.queryType)}
      Store Details
    </div>
    
    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30 mb-4">
      <div className="text-slate-300 text-sm">
        Found <span className="text-white font-semibold">{result.results.length}</span> transactions with store info
      </div>
    </div>

    <div className="space-y-3">
      {result.results.map((item, i) => (
        <div key={i} className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-slate-400 text-xs mb-1">Event ID</span>
              <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs truncate">{item.eventId}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 text-xs mb-1">Transaction Type</span>
              <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-1 rounded text-xs">
                {item.transactionType}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 text-xs mb-1">Location Number</span>
              <span className="text-cyan-400 font-mono bg-slate-700/50 px-2 py-1 rounded text-xs font-bold">{item.locationNumber}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 text-xs mb-1">Zipped In Store</span>
              <span className="text-emerald-400 font-semibold">{item.zippedInStore}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}



        {/* Add all your existing query type renderers here */}
        {result.queryType === 'ORDER_TOTAL_BY_TXN_TYPE' && (
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg mb-4">
              {getQueryTypeIcon(result.queryType)}
              Order Total Summary
            </div>
            
            <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Total Transactions:</span>
                  <span className="text-white font-semibold">{result.results.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Total Sum:</span>
                  <span className="text-emerald-400 font-bold">₹{result.metadata.totalSum?.toFixed(2) || '0.00'}</span>
                </div>
                {result.metadata.requestedTypes?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Transaction Types:</span>
                    <span className="text-amber-400">{result.metadata.requestedTypes.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {result.results.map((item, i) => (
                <div key={i} className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Event ID</span>
                      <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs truncate">{item.eventId}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Transaction Type</span>
                      <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-1 rounded text-xs">
                        {item.transactionType}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Order Number</span>
                      <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.orderNo}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Grand Total</span>
                      <span className="text-emerald-400 font-bold text-lg">₹{item.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  {item.grandTotalRaw === 'Not Available' && (
                    <div className="mt-2 p-2 bg-red-900/20 border border-red-600/30 rounded text-xs text-red-400">
                      ⚠️ Grand total not available in transaction payload
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {result.queryType === 'MTL_STATUS' && (
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg mb-4">
              {getQueryTypeIcon(result.queryType)}
              MTL Status
            </div>
            
            <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30 mb-4">
              <div className="text-slate-300 text-sm">
                Found <span className="text-white font-semibold">{result.results.length}</span> transactions
              </div>
            </div>

            <div className="space-y-3">
              {result.results.map((item, i) => (
                <div key={i} className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Transaction Type</span>
                      <span className="text-blue-400">{item.TransactionType}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Status</span>
                      <span className={`font-semibold px-2 py-1 rounded text-xs ${
                        item.Status === 'SUCCESS' || item.Status === 'ProcessComplete' 
                          ? 'text-emerald-400 bg-emerald-400/10' 
                          : item.Status === 'Failed' 
                          ? 'text-red-400 bg-red-400/10'
                          : 'text-yellow-400 bg-yellow-400/10'
                      }`}>
                        {item.Status}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Error Code</span>
                      <span className={`text-xs ${
                        item.ErrorCode === 'N/A' ? 'text-slate-500' : 'text-red-400'
                      }`}>
                        {item.ErrorCode || 'None'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-600/30 text-xs text-slate-400">
                    Order: <span className="text-slate-300">{item.Details?.orderNo}</span> | 
                    Event: <span className="text-slate-300">{item.Details?.eventId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.queryType === 'ITEM_LINE_TOTALS' && (
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg mb-4">
              {getQueryTypeIcon(result.queryType)}
              Item Line Details
            </div>
            
            <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30 mb-4">
              <div className="text-slate-300 text-sm">
                Found <span className="text-white font-semibold">{result.results.length}</span> line items
              </div>
            </div>

            <div className="space-y-3">
              {result.results.map((item, i) => (
                <div key={i} className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Item ID</span>
                      <span className="text-cyan-400 font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.itemId}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Prime Line No</span>
                      <span className="text-blue-400">{item.primeLineNo}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Line Total</span>
                      <span className="text-emerald-400 font-bold">₹{item.lineTotal}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Tax</span>
                      <span className="text-yellow-400">₹{item.tax}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Discount</span>
                      <span className="text-red-400">₹{item.discount}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Order No</span>
                      <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.orderNo}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-600/30 text-xs text-slate-400">
                    Event ID: <span className="text-slate-300">{item.eventId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add all other query type renderers from your original code */}
        {result.queryType === 'PAYMENT_DETAILS' && (
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg mb-4">
              {getQueryTypeIcon(result.queryType)}
              Payment Details
            </div>
            
            <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Total Records:</span>
                  <span className="text-white font-semibold">{result.results.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Payment Types:</span>
                  <span className="text-cyan-400">{result.metadata.uniquePaymentTypes?.join(', ') || 'None'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Payment Statuses:</span>
                  <span className="text-emerald-400">{result.metadata.uniquePaymentStatuses?.join(', ') || 'None'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Credit Card Types:</span>
                  <span className="text-blue-400">{result.metadata.uniqueCreditCardTypes?.join(', ') || 'None'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {result.results.map((item, i) => (
                <div key={i} className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
                  {/* Event Information */}
                  <div className="mb-4 pb-3 border-b border-slate-600/30">
                    <div className="text-blue-400 font-medium mb-3 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Event Information
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-slate-400 text-xs mb-1">Event ID</span>
                        <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs truncate">{item.eventId}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-400 text-xs mb-1">Transaction Type</span>
                        <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-1 rounded text-xs">
                          {item.transactionType}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-400 text-xs mb-1">Order No</span>
                        <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.orderNo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payment Status */}
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="text-emerald-400 font-medium mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Payment Status
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-32">Payment Status:</span>
                          <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded">{item.paymentStatus}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-32">Payment Type:</span>
                          <span className="text-white">{item.paymentType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-32">Open Authorizations:</span>
                          <span className="text-emerald-400 font-semibold">₹{item.totalOpenAuthorizations}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-32">Open Bookings:</span>
                          <span className="text-emerald-400 font-semibold">₹{item.totalOpenBookings}</span>
                        </div>
                      </div>
                    </div>

                    {/* Credit Card Information */}
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="text-cyan-400 font-medium mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Credit Card Information
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-24">Card Type:</span>
                          <span className="text-white">{item.creditCardType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-24">Card Number:</span>
                          <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.creditCardNo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-24">Display Card:</span>
                          <span className="text-white">{item.displayCreditCardNo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-24">Expiry:</span>
                          <span className="text-white">{item.creditCardExpDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-24">Cardholder:</span>
                          <span className="text-white">{item.firstName} {item.lastName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="text-purple-400 font-medium mb-3 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Transaction Details
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-28">Request Amount:</span>
                          <span className="text-emerald-400 font-bold">₹{item.requestAmount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-28">Authorization ID:</span>
                          <span className="text-white">{item.authorizationId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-28">Book Amount:</span>
                          <span className="text-emerald-400">₹{item.bookAmount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-28">Credit Amount:</span>
                          <span className="text-emerald-400">₹{item.creditAmount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="text-orange-400 font-medium mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Additional Details
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-24">Status:</span>
                          <span className="text-blue-400 font-semibold">{item.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-24">Amount Collected:</span>
                          <span className="text-emerald-400">₹{item.amountCollected}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-24">Charge Type:</span>
                          <span className="text-white">{item.chargeType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 min-w-24">Record Type:</span>
                          <span className="text-white">{item.recordType}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add EXTENDED_SEARCH renderer */}
        {result.queryType === 'EXTENDED_SEARCH' && (
  <div>
    <div className="flex items-center gap-2 text-purple-400 font-semibold text-lg mb-4">
      <RefreshCw className="w-5 h-5" />
      Extended Search Results
    </div>
    
    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30 mb-4">
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Query:</span>
          <span className="text-purple-300 italic">"{result.metadata.followUpQuery}"</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Found:</span>
          <span className="text-white font-semibold">{Array.isArray(result.results) ? result.results.length : 0}</span>
          <span className="text-slate-400">matching items</span>
          {result.metadata?.originalResultCount && (
            <span className="text-slate-500">(filtered from {result.metadata.originalResultCount} original items)</span>
          )}
        </div>
      </div>
    </div>
    
    {Array.isArray(result.results) && result.results.length > 0 ? (
      <div className="space-y-4">
        {result.results.map((item, i) => (
          <div key={i} className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
            {/* Handle Item Line Totals data */}
            {item.itemId && item.lineTotal !== undefined && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Item ID</span>
                  <span className="text-cyan-400 font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.itemId}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Prime Line No</span>
                  <span className="text-blue-400">{item.primeLineNo}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Line Total</span>
                  <span className="text-emerald-400 font-bold">₹{item.lineTotal}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Tax</span>
                  <span className="text-yellow-400 font-semibold">₹{item.tax}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Discount</span>
                  <span className="text-red-400">₹{item.discount}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Order No</span>
                  <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.orderNo}</span>
                </div>
              </div>
            )}
            {/* Handle Store Details data in EXTENDED_SEARCH - Simple version */}
{item.locationNumber !== undefined && item.zippedInStore !== undefined && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
    <div className="flex flex-col">
      <span className="text-slate-400 text-xs mb-1">Event ID</span>
      <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs truncate">{item.eventId}</span>
    </div>
    <div className="flex flex-col">
      <span className="text-slate-400 text-xs mb-1">Transaction Type</span>
      <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-1 rounded text-xs">
        {item.transactionType}
      </span>
    </div>
    <div className="flex flex-col">
      <span className="text-slate-400 text-xs mb-1">Location Number</span>
      <span className="text-cyan-400 font-mono bg-slate-700/50 px-2 py-1 rounded text-xs font-bold">{item.locationNumber}</span>
    </div>
    <div className="flex flex-col">
      <span className="text-slate-400 text-xs mb-1">Zipped In Store</span>
      <span className="text-emerald-400 font-semibold">{item.zippedInStore}</span>
    </div>
  </div>
)}


            {/* Handle Order Attributes data in EXTENDED_SEARCH */}
{item.originalInvoiceNo !== undefined && (
  <div>
    {/* Event Information */}
    <div className="mb-4 pb-3 border-b border-slate-600/30">
      <div className="text-blue-400 font-medium mb-3 flex items-center gap-2">
        <Database className="w-4 h-4" />
        Event Information
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="flex flex-col">
          <span className="text-slate-400 text-xs mb-1">Event ID</span>
          <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs truncate">{item.eventId}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-400 text-xs mb-1">Transaction Type</span>
          <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-1 rounded text-xs">
            {item.transactionType}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-400 text-xs mb-1">Order No</span>
          <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.orderNo}</span>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Invoice Information */}
      <div className="bg-slate-700/30 rounded-lg p-3">
        <div className="text-orange-400 font-medium mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Invoice Information
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 min-w-32">Original Invoice No:</span>
            <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.originalInvoiceNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 min-w-32">Master Invoice No:</span>
            <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.originalMasterInvoiceNo}</span>
          </div>
        </div>
      </div>

      {/* Financial Totals */}
      <div className="bg-slate-700/30 rounded-lg p-3">
        <div className="text-emerald-400 font-medium mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Financial Totals
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 min-w-24">Grand Total:</span>
            <span className="text-emerald-400 font-bold">
              {item.grandTotal !== 'N/A' ? `₹${Number(item.grandTotal).toFixed(2)}` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 min-w-24">Grand Tax:</span>
            <span className="text-yellow-400 font-semibold">
              {item.grandTax !== 'N/A' ? `₹${Number(item.grandTax).toFixed(2)}` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 min-w-24">Line Subtotal:</span>
            <span className="text-blue-400">
              {item.lineSubTotal !== 'N/A' ? `₹${Number(item.lineSubTotal).toFixed(2)}` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
)}


            {/* Handle Payment Details specifically */}
            {item.paymentStatus && (
              <div>
                {/* Event Information */}
                <div className="mb-4 pb-3 border-b border-slate-600/30">
                  <div className="text-blue-400 font-medium mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Event Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Event ID</span>
                      <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs truncate">{item.eventId}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Transaction Type</span>
                      <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-1 rounded text-xs">
                        {item.transactionType}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs mb-1">Order No</span>
                      <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.orderNo}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Payment Status */}
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-emerald-400 font-medium mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Payment Status
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-32">Payment Status:</span>
                        <span className={`font-bold px-2 py-1 rounded text-xs ${
                          item.paymentStatus === 'PAID' ? 'text-green-400 bg-green-400/10' :
                          item.paymentStatus === 'AUTHORIZED' ? 'text-blue-400 bg-blue-400/10' :
                          'text-emerald-400 bg-emerald-400/10'
                        }`}>{item.paymentStatus}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-32">Payment Type:</span>
                        <span className="text-white">{item.paymentType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-32">Open Authorizations:</span>
                        <span className="text-emerald-400 font-semibold">₹{item.totalOpenAuthorizations}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-32">Open Bookings:</span>
                        <span className="text-emerald-400 font-semibold">₹{item.totalOpenBookings}</span>
                      </div>
                    </div>
                  </div>

                  {/* Credit Card Information */}
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-cyan-400 font-medium mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Credit Card Information
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-24">Card Type:</span>
                        <span className="text-white">{item.creditCardType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-24">Card Number:</span>
                        <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.creditCardNo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-24">Display Card:</span>
                        <span className="text-white">{item.displayCreditCardNo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-24">Expiry:</span>
                        <span className="text-white">{item.creditCardExpDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-24">Cardholder:</span>
                        <span className="text-white">{item.firstName} {item.lastName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-purple-400 font-medium mb-3 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Transaction Details
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-28">Request Amount:</span>
                        <span className="text-emerald-400 font-bold">₹{item.requestAmount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-28">Authorization ID:</span>
                        <span className="text-white">{item.authorizationId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-28">Book Amount:</span>
                        <span className="text-emerald-400">₹{item.bookAmount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-28">Credit Amount:</span>
                        <span className="text-emerald-400">₹{item.creditAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-orange-400 font-medium mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Additional Details
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-24">Status:</span>
                        <span className="text-blue-400 font-semibold">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-24">Amount Collected:</span>
                        <span className="text-emerald-400">₹{item.amountCollected}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-24">Charge Type:</span>
                        <span className="text-white">{item.chargeType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 min-w-24">Record Type:</span>
                        <span className="text-white">{item.recordType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Handle MTL Status data */}
            {item.TransactionType && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Transaction Type</span>
                  <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-1 rounded text-xs">
                    {item.TransactionType}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Status</span>
                  <span className={`font-semibold px-2 py-1 rounded text-xs ${
                    item.Status === 'ProcessComplete' || item.Status === 'SUCCESS' 
                      ? 'text-emerald-400 bg-emerald-400/10' 
                      : item.Status === 'Failed' 
                      ? 'text-red-400 bg-red-400/10'
                      : 'text-yellow-400 bg-yellow-400/10'
                  }`}>
                    {item.Status}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Error Code</span>
                  <span className={`text-xs ${
                    item.ErrorCode === 'N/A' ? 'text-slate-500' : 'text-red-400'
                  }`}>
                    {item.ErrorCode || 'None'}
                  </span>
                </div>
              </div>
            )}
            
            {item.Details && (
              <div className="mt-3 pt-2 border-t border-slate-600/30 text-xs text-slate-400">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <span>Event ID: <span className="text-slate-300 font-mono">{item.Details.eventId}</span></span>
                  <span>Order No: <span className="text-slate-300 font-mono">{item.Details.orderNo}</span></span>
                </div>
              </div>
            )}

            {/* Handle Order Details with Grand Total */}
            {(item.eventId || item.orderNo || item.grandTotal !== undefined) && !item.TransactionType && !item.paymentStatus && !item.itemId && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {item.eventId && (
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs mb-1">Event ID</span>
                    <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs truncate">{item.eventId}</span>
                  </div>
                )}
                {item.orderNo && (
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs mb-1">Order No</span>
                    <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">{item.orderNo}</span>
                  </div>
                )}
                {item.grandTotal !== undefined && (
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs mb-1">Grand Total</span>
                    <span className="text-emerald-400 font-bold text-lg">₹{typeof item.grandTotal === 'number' ? item.grandTotal.toFixed(2) : item.grandTotal}</span>
                  </div>
                )}
                {item.transactionType && (
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs mb-1">Transaction Type</span>
                    <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-1 rounded text-xs">{item.transactionType}</span>
                  </div>
                )}
              </div>
            )}

            {/* Add Event ID at the bottom for Item Line Totals */}
            {item.itemId && item.eventId && (
              <div className="mt-3 pt-2 border-t border-slate-600/30 text-xs text-slate-400">
                Event ID: <span className="text-slate-300 font-mono">{item.eventId}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center text-slate-400 py-8">
        <div className="text-slate-500 mb-2">No items match your filter criteria.</div>
        <div className="text-sm">Try adjusting your query or use different filter terms.</div>
      </div>
    )}
  </div>
)}


        {result.queryType === 'ERROR' && (
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
              <RefreshCw className="w-5 h-5" />
              Error
            </div>
            <p className="text-red-300">{result.results.error}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 shadow-lg">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Natural Language Query Tool
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleNewQuery}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Query
              </button>
              <button
                onClick={toggleFullscreen}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {baseQuery && (
            <div className="bg-slate-700/30 px-4 py-2 rounded-lg border border-slate-600 text-sm">
              <span className="text-slate-400">Base Query:</span> 
              <span className="text-white ml-2">{baseQuery.slice(0, 100)}...</span>
            </div>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
          <div className={`flex flex-col ${isFullscreen ? 'h-[calc(100vh-180px)]' : 'h-[calc(100vh-220px)]'}`}>
            {/* Chat Header */}
            <div className="bg-slate-800/60 px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Assistant</h3>
                  <p className="text-xs text-slate-400">Natural Language Query Tool</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-400">Online</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-slate-900/20 to-slate-800/40">
              {chatHistory.map((message) => {
                const isBot = message.type === 'ai';
                return (
                  <div key={message.id} className={`flex gap-4 ${isBot ? 'justify-start' : 'justify-end'}`}>
                    {isBot && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-4xl px-5 py-3 rounded-2xl shadow-lg ${
                      isBot 
                        ? 'bg-slate-800/80 backdrop-blur-sm text-white border border-slate-600/50' 
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-500/25'
                    }`}>
                      {typeof message.content === 'string' ? (
                        message.content
                      ) : (
                        renderQueryResult(message.content, message.isFollowUp)
                      )}
                    </div>
                    
                    {!isBot && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 px-5 py-3 rounded-2xl shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                      <span className="text-slate-300">
                        {baseQuery && baseResult ? 'Filtering results...' : 'Analyzing your query...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Examples (Only show when no base query is active) */}
            {/* {!baseQuery && (
              <div className="px-6 py-3 bg-slate-800/40 border-t border-slate-700/50">
                <p className="text-sm text-slate-400 mb-3">Quick Examples:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleExampleQuery('MTL status')}
                    className="px-3 py-1.5 bg-orange-700/20 border border-orange-600/30 text-orange-300 rounded-lg text-xs hover:bg-orange-600/30 transition-colors"
                  >
                    MTL Status
                  </button>
                  <button
                    onClick={() => handleExampleQuery('give me item details')}
                    className="px-3 py-1.5 bg-purple-700/20 border border-purple-600/30 text-purple-300 rounded-lg text-xs hover:bg-purple-600/30 transition-colors"
                  >
                    Item Details
                  </button>
                  <button
                    onClick={() => handleExampleQuery('show payment details')}
                    className="px-3 py-1.5 bg-blue-700/20 border border-blue-600/30 text-blue-300 rounded-lg text-xs hover:bg-blue-600/30 transition-colors"
                  >
                    Payment Details
                  </button>
                  <button
                    onClick={() => handleExampleQuery('sum of line total')}
                    className="px-3 py-1.5 bg-cyan-700/20 border border-cyan-600/30 text-cyan-300 rounded-lg text-xs hover:bg-cyan-600/30 transition-colors"
                  >
                    Sum Line Total
                  </button>
                </div>
              </div>
            )} */}

            {/* Input */}
            <div className="p-6 bg-slate-800/40 border-t border-slate-700/50">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleQuery()}
                  placeholder={baseQuery ? "Ask a follow-up question..." : "Type your query..."}
                  className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm placeholder-slate-400"
                  disabled={isLoading}
                />
                <button
                  onClick={handleQuery}
                  disabled={isLoading || !userQuery.trim()}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25 disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              {baseQuery && (
                <p className="text-xs text-slate-500 mt-2">
                  💡 This is a follow-up question. Results will be filtered from your base query.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ExtendedSearchModal for programmatic use */}
      {showExtendedSearch && (
        <ExtendedSearchModal
          data={baseResult?.results}
          onClose={() => {
            setShowExtendedSearch(false);
            setPendingFollowUpQuery('');
            setIsLoading(false);
          }}
          onFiltered={handleExtendedSearchResult}
          query={pendingFollowUpQuery}
          autoExecute={true}
        />
      )}
    </div>
  );
}
