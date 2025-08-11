import React, { useState } from 'react';
import { queryPatterns } from './constants.js';
import { recognizeQuery } from './utils.js';
import { QueryHandlers } from './queryHandlers.js';
import ExtendedSearchModal from './ExtendedSearchModal.jsx';


export default function EnhancedNaturalQueryExecutor({ jsonData }) {
  const [userQuery, setUserQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recognizedQuery, setRecognizedQuery] = useState(null);
  const [showExtendSearch, setShowExtendSearch] = useState(false);


  const handleQuery = async () => {
    if (!userQuery || !jsonData) return;
    setIsLoading(true);
  
    try {
      // Step 1: Recognize query type
      const recognition = recognizeQuery(userQuery);
      setRecognizedQuery(recognition);
  
      // Step 2: Execute corresponding handler
      const handler = QueryHandlers[recognition.handler];
      let result;
  
      // Always pass both jsonData and userQuery
      if (typeof handler === 'function') {
        if (handler.length === 2) {
          result = await handler(jsonData, userQuery); // handlers expecting (data, query)
        } else {
          result = await handler(jsonData); // handlers expecting (data)
        }
      }
  
      setQueryResult(result);
    } catch (error) {
      console.error("❌ Query execution failed:", error);
      setQueryResult({
        queryType: 'ERROR',
        results: { error: error.message },
        metadata: { timestamp: new Date().toISOString() }
      });
    }
  
    setIsLoading(false);
  };
  

  const resetQuery = () => {
    setUserQuery('');
    setQueryResult(null);
    setRecognizedQuery(null);
  };

  return (
    <div className="bg-white p-6 border rounded shadow mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">🧠 Enhanced Natural Query Executor</h2>
        <button
          onClick={resetQuery}
          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
        >
          Reset
        </button>
      </div>

      {/* Query Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="e.g. 'Give me Order total of Create order or Change order', 'sum of line total', 'MTL status'"
          className="w-full p-2 border border-gray-300 rounded"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
        />
      </div>

      {/* Query Examples */}
      <div className="mb-4 text-sm text-gray-600">
        <p className="font-semibold mb-1">Example Queries:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setUserQuery('Give me Order total of Create order or Change order')}
            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
          >
            Order Total by Transaction Type
          </button>
          {Object.entries(queryPatterns).map(([key, pattern]) => (
            <button
              key={key}
              onClick={() => setUserQuery(pattern.keywords[0])}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
            >
              {pattern.description}
            </button>
          ))}
        </div>
      </div>

      <button
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        onClick={handleQuery}
        disabled={isLoading || !userQuery.trim()}
      >
        {isLoading ? 'Processing...' : 'Execute Query'}
      </button>

      {queryResult && (
          <button
            className="mt-2 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            onClick={() => setShowExtendSearch(true)}
          >
            🔍 Extend Search
          </button>
        )}


      {/* Query Recognition Results */}
      {recognizedQuery && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="font-semibold text-blue-800 mb-2">🎯 Query Recognition:</p>
          <div className="text-sm">
            <p><strong>Type:</strong> {recognizedQuery.type}</p>
            <p><strong>Confidence:</strong> {(recognizedQuery.confidence * 100).toFixed(0)}%</p>
            <p><strong>Handler:</strong> {recognizedQuery.handler}</p>
            <p><strong>Description:</strong> {recognizedQuery.description}</p>
          </div>
        </div>
      )}

      {/* Query Results */}
      {queryResult && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">📊 Query Results:</h3>
            <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
              {queryResult.queryType}
            </span>
          </div>

          {/* Results Display */}
          <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            {queryResult.queryType === 'ORDER_TOTAL_BY_TXN_TYPE' && (
              <div>
                <div className="mb-4 p-3 bg-green-50 rounded">
                  <p className="font-semibold text-green-800">📊 Summary:</p>
                  <p><strong>Total Transactions Found:</strong> {queryResult.results.length}</p>
                  <p><strong>Total Sum of Grand Totals:</strong> ₹{queryResult.metadata.totalSum?.toFixed(2) || '0.00'}</p>
                  {queryResult.metadata.requestedTypes?.length > 0 && (
                    <p><strong>Filtered by Transaction Types:</strong> {queryResult.metadata.requestedTypes.join(', ')}</p>
                  )}
                </div>

                <p className="mb-3"><strong>Transaction Details:</strong></p>
                <div className="space-y-3">
                  {queryResult.results.map((item, i) => (
                    <div key={i} className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><strong>Event ID:</strong> {item.eventId}</p>
                        <p><strong>Transaction Type:</strong> <span className="font-mono bg-blue-100 px-1 rounded">{item.transactionType}</span></p>
                        <p><strong>Order No:</strong> {item.orderNo}</p>
                        <p><strong>Grand Total:</strong> <span className="font-semibold text-green-600">₹{item.grandTotal.toFixed(2)}</span></p>
                      </div>
                      {item.grandTotalRaw === 'Not Available' && (
                        <p className="text-xs text-red-500 mt-1">⚠️ Grand total not available in transaction payload</p>
                      )}
                    </div>
                  ))}
                </div>

                {queryResult.results.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <p>No transactions found matching the specified criteria.</p>
                    {queryResult.metadata.requestedTypes?.length > 0 && (
                      <p className="text-sm mt-2">Searched for: {queryResult.metadata.requestedTypes.join(', ')}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {queryResult.queryType === 'PAYMENT_DETAILS' && (
              <div>
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <p className="font-semibold text-blue-800">💳 Payment Details Summary:</p>
                  <p><strong>Total Records Found:</strong> {queryResult.results.length}</p>
                  
                 
                  {queryResult.metadata.filteringApplied ? (
                    <div className="mt-2 p-2 bg-green-100 rounded">
                      <p><strong>🎯 Filtered by Transaction Types:</strong> {Array.isArray(queryResult.metadata.filteredBy) ? queryResult.metadata.filteredBy.join(', ') : 'None'}</p>
                      <p><strong>Showing:</strong> {Array.isArray(queryResult.metadata.returnedTransactionTypes) ? queryResult.metadata.returnedTransactionTypes.join(', ') : 'None'}</p>
                      <p><strong>Found {queryResult.results.length} out of {queryResult.metadata.totalPaymentDetailsFound} total payment records</strong></p>
                      {queryResult.metadata.skippedTransactions.filter(s => s.reason.includes('Filtered out')).length > 0 && (
                        <p><strong>Filtered Out:</strong> {queryResult.metadata.skippedTransactions.filter(s => s.reason.includes('Filtered out')).length} transactions</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 p-2 bg-yellow-100 rounded">
                      <p><strong>📋 Showing All Transaction Types:</strong> {queryResult.metadata.returnedTransactionTypes.join(', ')}</p>
                      <p><strong>Total Available Types:</strong> {queryResult.metadata.allAvailableTransactionTypes?.join(', ') || 'None'}</p>
                    </div>
                  )}
                                    
                  <p><strong>Payment Types Found:</strong> {queryResult.metadata.uniquePaymentTypes?.join(', ') || 'None'}</p>
                  <p><strong>Payment Statuses Found:</strong> {queryResult.metadata.uniquePaymentStatuses?.join(', ') || 'None'}</p>
                  <p><strong>Credit Card Types Found:</strong> {queryResult.metadata.uniqueCreditCardTypes?.join(', ') || 'None'}</p>
                </div>

                {/* Show skipped transactions details if any */}
                {queryResult.metadata.skippedTransactions?.length > 0 && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-gray-600 text-sm">
                      View {queryResult.metadata.skippedTransactions.length} Skipped Transactions
                    </summary>
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      {queryResult.metadata.skippedTransactions.map((skipped, i) => (
                        <div key={i} className="mb-1">
                          <strong>{skipped.transactionType}</strong> ({skipped.eventId}): {skipped.reason}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <p className="mb-3"><strong>Payment Details:</strong></p>
                <div className="space-y-4">
                  {queryResult.results.map((item, i) => (
                    <div key={i} className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                      {/* Basic Transaction Info */}
                      <div className="mb-3 pb-2 border-b">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <p><strong>Event ID:</strong> {item.eventId}</p>
                          <p><strong>Transaction Type:</strong> 
                            <span className={`font-mono px-1 rounded ml-1 ${
                              queryResult.metadata.filteredBy?.includes(item.transactionType) 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.transactionType}
                            </span>
                          </p>
                          <p><strong>Order No:</strong> {item.orderNo}</p>
                        </div>
                      </div>

                      {/* Payment Status Info */}
                      <div className="mb-3 pb-2 border-b">
                        <p className="font-semibold text-green-700 mb-2">💰 Payment Status:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><strong>Payment Status:</strong> <span className="font-semibold text-green-600">{item.paymentStatus}</span></p>
                          <p><strong>Payment Type:</strong> {item.paymentType}</p>
                          <p><strong>Total Open Authorizations:</strong> {item.totalOpenAuthorizations}</p>
                          <p><strong>Total Open Bookings:</strong> {item.totalOpenBookings}</p>
                        </div>
                      </div>

                      {/* Credit Card Info */}
                      <div className="mb-3 pb-2 border-b">
                        <p className="font-semibold text-blue-700 mb-2">💳 Credit Card Information:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><strong>Card Type:</strong> <span className="font-mono bg-gray-100 px-1 rounded">{item.creditCardType}</span></p>
                          <p><strong>Card Number:</strong> <span className="font-mono bg-gray-100 px-1 rounded">{item.creditCardNo}</span></p>
                          <p><strong>Display Card No:</strong> {item.displayCreditCardNo}</p>
                          <p><strong>Expiry Date:</strong> {item.creditCardExpDate}</p>
                          <p><strong>First Name:</strong> {item.firstName}</p>
                          <p><strong>Last Name:</strong> {item.lastName}</p>
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div className="mb-3 pb-2 border-b">
                        <p className="font-semibold text-purple-700 mb-2">🔄 Transaction Details:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><strong>Request Amount:</strong> <span className="font-semibold text-green-600">₹{item.requestAmount}</span></p>
                          <p><strong>Authorization ID:</strong> {item.authorizationId}</p>
                          <p><strong>Book Amount:</strong> ₹{item.bookAmount}</p>
                          <p><strong>Credit Amount:</strong> ₹{item.creditAmount}</p>
                          <p><strong>Amount Collected:</strong> ₹{item.amountCollected}</p>
                          <p><strong>Status:</strong> <span className="font-semibold text-blue-600">{item.status}</span></p>
                          <p><strong>Charge Type:</strong> {item.chargeType}</p>
                          <p><strong>Record Type:</strong> {item.recordType}</p>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="text-xs text-gray-600">
                        <p><strong>Payment Key:</strong> {item.paymentKey}</p>
                        <p><strong>Max Charge Limit:</strong> ₹{item.maxChargeLimit}</p>
                        <p><strong>Payment Reference:</strong> {item.paymentReference1}</p>
                        <p><strong>Authorization Expires:</strong> {item.authorizationExpirationDate}</p>
                        <p><strong>Collection Date:</strong> {item.collectionDate}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {queryResult.results.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <p>No payment details found matching the specified criteria.</p>
                    {queryResult.metadata.filteredBy?.length > 0 && (
                      <p className="text-sm mt-2">Searched for transaction types: {Array.isArray(queryResult?.metadata?.filteredBy) ? queryResult.metadata.filteredBy.join(', ') : 'None'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {queryResult.queryType === 'ITEM_LINE_TOTALS' && (
              <div>
                <p className="mb-3"><strong>Found {queryResult.results.length} line items:</strong></p>
                <div className="space-y-2">
                  {queryResult.results.map((item, i) => (
                    <div key={i} className="bg-white p-3 rounded border">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <p><strong>Item ID:</strong> {item.itemId}</p>
                        <p><strong>Prime Line No:</strong> {item.primeLineNo}</p>
                        <p><strong>Line Total:</strong> ₹{item.lineTotal}</p>
                        <p><strong>Tax:</strong> ₹{item.tax}</p>
                        <p><strong>Discount:</strong> ₹{item.discount}</p>
                        <p><strong>Order No:</strong> {item.orderNo}</p>
                        <p><strong>Event ID:</strong> {item.eventId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {queryResult.queryType === 'ORDER_ATTRIBUTES' && (
              <div>
                <div className="mb-3">
                  <p className="font-semibold mb-2">🧾 Order Attribute Details:</p>
                  {queryResult.results.map((item, i) => (
                    <div key={i} className="bg-white p-4 rounded border mb-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <p><strong>Event ID:</strong> {item.eventId}</p>
                        <p><strong>Transaction Type:</strong> {item.transactionType}</p>
                        <p><strong>Original Invoice No:</strong> {item.originalInvoiceNo}</p>
                        <p><strong>Original Master Invoice No:</strong> {item.originalMasterInvoiceNo}</p>
                        <p><strong>Business Date:</strong> {item.businessDate}</p>
                        <p><strong>Sales Date:</strong> {item.salesDate}</p>
                        <p><strong>Grand Discount:</strong> ₹{item.grandDiscount}</p>
                        <p><strong>Grand Tax:</strong> ₹{item.grandTax}</p>
                        <p><strong>Grand Total:</strong> ₹{item.grandTotal}</p>
                        <p><strong>Line Subtotal:</strong> ₹{item.lineSubTotal}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

              {queryResult.queryType === 'STORE_DETAILS' && (
                <div>
                  <p className="mb-3"><strong>Found {queryResult.results.length} transactions with store info:</strong></p>
                  <div className="space-y-2">
                    {queryResult.results.map((item, i) => (
                      <div key={i} className="bg-white p-3 rounded border text-sm">
                        <p><strong>Event ID:</strong> {item.eventId}</p>
                        <p><strong>Transaction Type:</strong> {item.transactionType}</p>
                        <p><strong>Location Number:</strong> {item.locationNumber}</p>
                        <p><strong>Zipped In Store:</strong> {item.zippedInStore}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}



            {queryResult.queryType === 'SUM_LINE_TOTAL' && (
              <div>
                <p><strong>Sum:</strong> {queryResult.results.sum}</p>
                <p><strong>Count:</strong> {queryResult.results.count}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600">View Keys Used</summary>
                  <ul className="text-xs font-mono list-disc ml-5 mt-1">
                    {queryResult.results.keysUsed.map((key, i) => (
                      <li key={i}>{key}</li>
                    ))}
                  </ul>
                </details>
              </div>
            )}

            {queryResult.queryType === 'MTL_STATUS' && (
              <div>
                <p className="mb-3"><strong>Found {queryResult.results.length} transactions:</strong></p>
                <div className="space-y-2">
                  {queryResult.results.map((item, i) => (
                    <div key={i} className="bg-white p-3 rounded border">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><strong>Transaction Type:</strong> {item.TransactionType}</p>
                        <p><strong>Status:</strong> {item.Status}</p>
                        <p><strong>Error Code:</strong> {item.ErrorCode}</p>
                        <p><strong>Order No:</strong> {item.Details.orderNo}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Event ID: {item.Details.eventId}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {queryResult.queryType === 'INTERNAL_STATUS' && (
              <div>
                <p className="mb-3"><strong>Found {queryResult.results.length} internal statuses:</strong></p>
                <div className="space-y-2">
                  {queryResult.results.map((item, i) => (
                    <div key={i} className="bg-white p-3 rounded border">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><strong>Internal Status:</strong> {item.internalStatus}</p>
                        <p><strong>Transaction Type:</strong> {item.transactionType}</p>
                        <p><strong>Order No:</strong> {item.orderNo}</p>
                        <p><strong>Event ID:</strong> {item.eventId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {queryResult.queryType === 'INTERNAL_FAILED_REASON' && (
              <div>
                <p className="mb-3"><strong>Found {queryResult.results.length} failed transactions:</strong></p>
                <div className="space-y-2">
                  {queryResult.results.map((item, i) => (
                    <div key={i} className="bg-white p-3 rounded border">
                      <div className="text-sm">
                        <p><strong>Failed Reason:</strong> {item.internalFailedReason}</p>
                        <p><strong>Transaction Type:</strong> {item.transactionType}</p>
                        <p><strong>Internal Status:</strong> {item.internalStatus}</p>
                        <p><strong>Order No:</strong> {item.orderNo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {queryResult.queryType === 'FALLBACK_AI' && (
              <div>
                <p className="mb-2"><strong>AI Generated Plan:</strong></p>
                <pre className="text-xs bg-gray-100 p-2 rounded mb-3">
                  {JSON.stringify(queryResult.results.plan, null, 2)}
                </pre>
                <p><strong>Extracted Values:</strong></p>
                <ul className="text-sm list-disc ml-5">
                  {queryResult.results.extracted.map((item, i) => (
                    <li key={i}><strong>{item.key}:</strong> {item.value}</li>
                  ))}
                </ul>
              </div>
            )}

            {queryResult.queryType === 'ERROR' && (
              <div className="text-red-600">
                <p><strong>Error:</strong> {queryResult.results.error}</p>
              </div>
            )}
          </div>


          {showExtendSearch && (
            <ExtendedSearchModal
              data={queryResult.results}
              onClose={() => setShowExtendSearch(false)}
              onFiltered={(filteredResults) => {
                setQueryResult((prev) => ({
                  ...prev,
                  results: filteredResults,
                  metadata: {
                    ...prev.metadata,
                    extendedSearchApplied: true,
                    extendedFilterQuery: userQuery,
                    extendedResultCount: filteredResults.length,
                  },
                }));
                setShowExtendSearch(false);
              }}
            />
          )}

          

          {/* Metadata */}
          {queryResult.metadata && (
            <details className="mt-3">
              <summary className="cursor-pointer text-gray-600 text-sm">View Metadata</summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                {JSON.stringify(queryResult.metadata, null, 2)}
              </pre>
            </details>
          )}



          {queryResult.metadata?.extendedSearchApplied && (
            <p className="text-xs text-purple-600 mt-1">
              🔍 Extended filter applied: <em>{queryResult.metadata.extendedFilterQuery}</em>
            </p>
          )}


        </div>
      )}
    </div>
  );
}