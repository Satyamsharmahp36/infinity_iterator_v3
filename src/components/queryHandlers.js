import { GoogleGenerativeAI } from '@google/generative-ai';
import { knownTransactionTypes } from './constants.js';
import { flattenJSON, extractTransactionTypesFromQuery } from './utils.js';

// Initialize Gemini AI (you might want to move this to a separate config file)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Query Handler Functions
export const QueryHandlers = {
  // Function 1: Sum Line Totals
  sumLineTotals: (data) => {
    const flat = flattenJSON(data);
    let sum = 0;
    let count = 0;
    const keysUsed = [];

    for (const key in flat) {
      const isValid =
        key.endsWith(".lineOverallTotals.lineTotal") &&
        !key.includes("oldLineTotal") &&
        !key.includes("Affected") &&
        !key.includes("changeOrderGrandTotalSet");

      if (isValid) {
        const value = flat[key];
        if (!isNaN(value)) {
          sum += Number(value);
          count++;
          keysUsed.push(key);
        }
      }
    }

    return {
      queryType: 'SUM_LINE_TOTAL',
      results: {
        sum,
        count,
        keysUsed
      },
      metadata: {
        searchPaths: keysUsed,
        totalProcessed: Object.keys(flat).length
      }
    };
  },

  // Function 2: Get MTL Status
  getMTLStatus: (data) => {
    const txns = data?.InfinityReportResponse?.infinityTransactionReport?.infinityTransactionReport;
  
    if (!txns) {
      return {
        queryType: 'MTL_STATUS',
        results: [],
        metadata: { error: 'No transaction report found.' }
      };
    }
  
    const txnList = Array.isArray(txns) ? txns : [txns];
  
    const result = txnList.map((txn, i) => ({
      TransactionType: txn.transactionType || 'N/A',
      Status: txn.internalStatus || 'N/A',
      ErrorCode: txn.internalFailedReason || 'N/A',
      Details: {
        eventId: txn.eventId || `index-${i}`,
        orderNo: txn.orderNo || 'N/A'
      }
    }));
  
    return {
      queryType: 'MTL_STATUS',
      results: result,
      metadata: {
        totalTransactions: result.length,
        uniqueTypes: [...new Set(result.map(r => r.TransactionType))]
      }
    };
  },

  // Function 3: Get Internal Status
  getInternalStatus: (data) => {
    const flat = flattenJSON(data);
    const internalStatuses = [];

    for (const key in flat) {
      if (key.includes('infinityTransactionReport') && key.endsWith('.internalStatus')) {
        const basePath = key.replace('.internalStatus', '');
        const internalStatus = flat[key];
        const transactionType = flat[`${basePath}.transactionType`] || 'N/A';
        const eventId = flat[`${basePath}.eventId`] || 'N/A';
        const orderNo = flat[`${basePath}.orderNo`] || 'N/A';
        
        internalStatuses.push({
          internalStatus,
          transactionType,
          eventId,
          orderNo,
          basePath
        });
      }
    }

    return {
      queryType: 'INTERNAL_STATUS',
      results: internalStatuses,
      metadata: {
        totalStatuses: internalStatuses.length,
        uniqueStatuses: [...new Set(internalStatuses.map(s => s.internalStatus))]
      }
    };
  },

  // Function 4: Get Internal Failed Reason
  getInternalFailedReason: (data) => {
    const flat = flattenJSON(data);
    const failedReasons = [];

    for (const key in flat) {
      if (key.includes('infinityTransactionReport') && key.endsWith('.internalFailedReason')) {
        const basePath = key.replace('.internalFailedReason', '');
        const internalFailedReason = flat[key];
        const transactionType = flat[`${basePath}.transactionType`] || 'N/A';
        const internalStatus = flat[`${basePath}.internalStatus`] || 'N/A';
        const eventId = flat[`${basePath}.eventId`] || 'N/A';
        const orderNo = flat[`${basePath}.orderNo`] || 'N/A';
        
        failedReasons.push({
          internalFailedReason,
          transactionType,
          internalStatus,
          eventId,
          orderNo,
          basePath
        });
      }
    }

    return {
      queryType: 'INTERNAL_FAILED_REASON',
      results: failedReasons,
      metadata: {
        totalFailures: failedReasons.length,
        uniqueReasons: [...new Set(failedReasons.map(f => f.internalFailedReason))]
      }
    };
  },

  // Function 5: Get Order Total by Transaction Type - ENHANCED VERSION
  getOrderTotalByTransactionType: (data, query) => {
    const txns = data?.InfinityReportResponse?.infinityTransactionReport?.infinityTransactionReport;
    
    if (!txns) {
      return { 
        queryType: 'ORDER_TOTAL_BY_TXN_TYPE', 
        results: [], 
        metadata: { error: 'No transaction data found in InfinityReportResponse' } 
      };
    }

    // Extract transaction types from the query
    const requestedTypes = extractTransactionTypesFromQuery(query);
    
    const txnList = Array.isArray(txns) ? txns : [txns];
    const result = [];
    const invalidTransactionTypes = [];

    for (const txn of txnList) {
      const txnType = txn.transactionType;
      
      // If specific types requested, filter by them
      if (requestedTypes.length > 0) {
        if (requestedTypes.includes(txnType)) {
          const grandTotal = txn?.transactionPayload?.transactionPayload?.attributes?.transactionDetails?.totals?.grandTotal;
          result.push({
            eventId: txn.eventId || 'N/A',
            transactionType: txnType,
            orderNo: txn.orderNo || 'N/A',
            grandTotal: grandTotal ? Number(grandTotal) : 0,
            grandTotalRaw: grandTotal || 'Not Available'
          });
        }
      } else {
        // If no specific types requested, show all
        const grandTotal = txn?.transactionPayload?.transactionPayload?.attributes?.transactionDetails?.totals?.grandTotal;
        result.push({
          eventId: txn.eventId || 'N/A',
          transactionType: txnType,
          orderNo: txn.orderNo || 'N/A',
          grandTotal: grandTotal ? Number(grandTotal) : 0,
          grandTotalRaw: grandTotal || 'Not Available'
        });
      }
    }

    const totalSum = result.reduce((acc, t) => acc + t.grandTotal, 0);

    return {
      queryType: 'ORDER_TOTAL_BY_TXN_TYPE',
      results: result,
      metadata: {
        requestedTypes: requestedTypes,
        matchedTransactions: result.length,
        totalSum: totalSum,
        availableTransactionTypes: [...new Set(txnList.map(txn => txn.transactionType))],
        invalidTypes: invalidTransactionTypes,
        allKnownTypes: knownTransactionTypes
      }
    };
  },
  getPaymentDetails: async (data, query = '') => {
    const txns = data?.InfinityReportResponse?.infinityTransactionReport?.infinityTransactionReport;
    if (!txns) {
      return {
        queryType: 'PAYMENT_DETAILS',
        results: [],
        metadata: { error: 'No transaction data found' }
      };
    }
  
    const txnList = Array.isArray(txns) ? txns : [txns];
    let requestedTypes = extractTransactionTypesFromQuery(query).map(t => t.trim().toUpperCase());
  
    // Step 1: LLM fallback if no types found
    if (requestedTypes.length === 0 && query) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
  From this query, extract transaction types like CREATE_ORDER, CHANGE_ORDER from this list:
  [${knownTransactionTypes.join(', ')}]
  Return only valid types as JSON array.
  
  Query: "${query}"
        `;
        const result = await model.generateContent(prompt);
        let text = await result.response.text();
        if (text.startsWith('```')) text = text.replace(/```(json)?|```/g, '').trim();
        const extracted = JSON.parse(text);
        if (Array.isArray(extracted)) {
          requestedTypes = extracted.map(t => t.trim().toUpperCase());
        }
      } catch (e) {
        console.warn('LLM fallback failed:', e.message);
      }
    }
  
    // Step 2: Collect all payment records
    const allRecords = [];
    const skipped = [];
  
    for (const txn of txnList) {
      const txnType = (txn?.transactionType || '').trim().toUpperCase();
      const eventId = txn?.eventId || 'N/A';
  
      const details = txn?.transactionPayload?.transactionPayload?.attributes?.transactionDetails;
      const payments = details?.payments;
      if (!payments) {
        skipped.push({ eventId, txnType, reason: 'No payments section' });
        continue;
      }
  
      const paymentMethods = Array.isArray(payments.paymentMethods)
        ? payments.paymentMethods[0]
        : payments.paymentMethods || {};
  
      const chargeSet = Array.isArray(paymentMethods.chargeTransactionDetailSet)
        ? paymentMethods.chargeTransactionDetailSet[0]
        : paymentMethods.chargeTransactionDetailSet || {};
  
      const hasData =
        payments.paymentStatus ||
        paymentMethods.creditCardNo ||
        chargeSet.requestAmount;
  
      if (!hasData) {
        skipped.push({ eventId, txnType, reason: 'No relevant payment data' });
        continue;
      }
  
      allRecords.push({
        eventId,
        transactionType: txnType,
        orderNo: txn.orderNo || 'N/A',
  
        // Payment Info
        paymentStatus: payments.paymentStatus || 'N/A',
        totalOpenAuthorizations: payments.totalOpenAuthorizations || 'N/A',
        totalOpenBookings: payments.totalOpenBookings || 'N/A',
  
        // Card Info
        creditCardType: paymentMethods.creditCardType || 'N/A',
        creditCardNo: paymentMethods.creditCardNo || 'N/A',
        displayCreditCardNo: paymentMethods.displayCreditCardNo || 'N/A',
        creditCardExpDate: paymentMethods.creditCardExpDate || 'N/A',
        firstName: paymentMethods.firstName || 'N/A',
        lastName: paymentMethods.lastName || 'N/A',
  
        // Additional
        paymentType: paymentMethods.paymentType || 'N/A',
        paymentReference1: paymentMethods.paymentReference1 || 'N/A',
        paymentKey: paymentMethods.paymentKey || 'N/A',
        maxChargeLimit: paymentMethods.maxChargeLimit || 'N/A',
  
        // Charge Details
        requestAmount: chargeSet.requestAmount || 'N/A',
        authorizationId: chargeSet.authorizationId || 'N/A',
        bookAmount: chargeSet.bookAmount || 'N/A',
        creditAmount: chargeSet.creditAmount || 'N/A',
        amountCollected: chargeSet.amountCollected || 'N/A',
        status: chargeSet.status || 'N/A',
        chargeType: chargeSet.chargeType || 'N/A',
        recordType: chargeSet.recordType || 'N/A',
        authorizationExpirationDate: chargeSet.authorizationExpirationDate || 'N/A',
        collectionDate: chargeSet.collectionDate || 'N/A'
      });
    }
  
    // Step 3: Apply filter
    const filtered = requestedTypes.length > 0
      ? allRecords.filter(r => requestedTypes.includes(r.transactionType))
      : allRecords;
  
    const filteredOut = allRecords.filter(r =>
      requestedTypes.length > 0 && !requestedTypes.includes(r.transactionType)
    ).map(r => ({
      eventId: r.eventId,
      transactionType: r.transactionType,
      reason: `Filtered out - not in requested: [${requestedTypes.join(', ')}]`
    }));
  
    const resultSet = filtered;
    const finalSkipped = [...skipped, ...filteredOut];
  
    return {
      queryType: 'PAYMENT_DETAILS',
      results: resultSet,
      metadata: {
        filteringApplied: requestedTypes.length > 0,
        filteredBy: requestedTypes,
        returnedTransactionTypes: [...new Set(resultSet.map(r => r.transactionType))],
        totalReturned: resultSet.length,
        totalPaymentDetailsFound: allRecords.length,
        skippedTransactions: finalSkipped,
        uniquePaymentTypes: [...new Set(resultSet.map(r => r.paymentType))],
        uniquePaymentStatuses: [...new Set(resultSet.map(r => r.paymentStatus))],
        uniqueCreditCardTypes: [...new Set(resultSet.map(r => r.creditCardType))],
        allAvailableTransactionTypes: [...new Set(allRecords.map(r => r.transactionType))]
      }
    };
  },

  getStoreDetails: (data) => {
    const txns = data?.InfinityReportResponse?.infinityTransactionReport?.infinityTransactionReport;
    if (!txns) {
      return {
        queryType: 'STORE_DETAILS',
        results: [],
        metadata: { error: 'No transaction data found' }
      };
    }
  
    const txnList = Array.isArray(txns) ? txns : [txns];
    const results = [];
  
    for (const txn of txnList) {
      const transactionType = txn?.transactionType || 'N/A';
      const storeInfo = txn?.transactionPayload?.transactionPayload?.attributes?.transactionDetails?.storeInfo || {};
  
      results.push({
        eventId: txn?.eventId || 'N/A',
        transactionType,
        locationNumber: storeInfo.locationNumber || 'N/A',
        zippedInStore: storeInfo.zippedInStore || 'N/A'
      });
    }
  
    return {
      queryType: 'STORE_DETAILS',
      results,
      metadata: {
        total: results.length,
        uniqueTransactionTypes: [...new Set(results.map(r => r.transactionType))],
        uniqueLocations: [...new Set(results.map(r => r.locationNumber))]
      }
    };
  },
  

  getOrderAttributes: (data) => {
    const txns = data?.InfinityReportResponse?.infinityTransactionReport?.infinityTransactionReport;
    if (!txns) {
      return {
        queryType: 'ORDER_ATTRIBUTES',
        results: [],
        metadata: { error: 'No transaction data found' }
      };
    }
  
    const txnList = Array.isArray(txns) ? txns : [txns];
    const results = [];
  
    for (const txn of txnList) {
      const details = txn?.transactionPayload?.transactionPayload?.attributes?.transactionDetails;
      const attrs = details?.order?.orderAttributes || {};
      const totals = details?.totals || {};
  
      results.push({
        eventId: txn.eventId || 'N/A',
        transactionType: txn.transactionType || 'N/A', // ✅ Replacing orderNo
        originalInvoiceNo: attrs.originalInvoiceNo || 'N/A',
        originalMasterInvoiceNo: attrs.originalMasterInvoiceNo || 'N/A',
        businessDate: attrs.businessDate || 'N/A',
        salesDate: attrs.salesDate || 'N/A',
        grandDiscount: totals.grandDiscount ?? 'N/A',
        grandTax: totals.grandTax ?? 'N/A',
        grandTotal: totals.grandTotal ?? 'N/A',
        lineSubTotal: totals.lineSubTotal ?? 'N/A'
      });
    }
  
    return {
      queryType: 'ORDER_ATTRIBUTES',
      results,
      metadata: {
        totalTransactions: results.length,
        transactionTypes: [...new Set(results.map(r => r.transactionType))]
      }
    };
  },
  
  


  getItemLineTotals: (data) => {
    const txns = data?.InfinityReportResponse?.infinityTransactionReport?.infinityTransactionReport;
    if (!txns) {
      return {
        queryType: 'ITEM_LINE_TOTALS',
        results: [],
        metadata: { error: 'No transaction data found' }
      };
    }
  
    const txnList = Array.isArray(txns) ? txns : [txns];
    const results = [];
  
    for (const txn of txnList) {
      const orderLines = txn?.transactionPayload?.transactionPayload?.attributes?.transactionDetails?.order?.orderLineDetailSet;
      if (!Array.isArray(orderLines)) continue;
  
      orderLines.forEach((line) => {
        const lineTotals = line?.lineOverallTotals || {};
  
        results.push({
          eventId: txn.eventId || 'N/A',
          orderNo: txn.orderNo || 'N/A',
          itemId: line?.item?.itemId ?? 'N/A',
          primeLineNo: line?.primeLineNo ?? 'N/A',
          lineTotal: lineTotals.lineTotal ?? 'N/A',
          tax: lineTotals.tax ?? 'N/A',
          discount: lineTotals.discount ?? 'N/A'
        });
      });
    }
  
    return {
      queryType: 'ITEM_LINE_TOTALS',
      results,
      metadata: {
        totalItems: results.length,
        uniqueItems: [...new Set(results.map(r => r.itemId))],
        uniqueOrders: [...new Set(results.map(r => r.orderNo))]
      }
    };
  },
  
   

  // Function 0: Fallback AI Query
  fallbackQuery: async (data, query) => {
    try {
      const prompt = `
You are a JSON query planner. Given a user's natural language question, return a structured query plan.

Use this structure:
{
  "extract": ["<field1>", "<field2>"],
  "filter": {
    "<fieldName>": "<filterValue>"
  }
}

Query: "${query}"
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
      const flat = flattenJSON(data);
      const matches = Object.entries(flat).filter(([key]) =>
        plan.extract.some(field => key.toLowerCase().includes(field.toLowerCase()))
      );

      return {
        queryType: 'FALLBACK_AI',
        results: {
          plan,
          extracted: matches.map(([key, val]) => ({ key, value: val }))
        },
        metadata: {
          aiPlan: plan,
          totalMatches: matches.length
        }
      };
    } catch (error) {
      return {
        queryType: 'ERROR',
        results: { error: error.message },
        metadata: { timestamp: new Date().toISOString() }
      };
    }
  }
};