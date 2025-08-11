export const knownTransactionTypes = [
    'TRANS_IN',
    'TRANS_OUT',
    'REFUND_TRANS_IN',
    'REFUND_TRANS_OUT',
    'CHANGE_ORDER',
    'CREATE_ORDER',
    'FULFILLED_SALE'
  ];
  
  export const typeVariations = {
    'CREATE_ORDER': ['CREATE ORDER', 'CREATE_ORDER', 'CREATEORDER', 'CREATE'],
    'CHANGE_ORDER': ['CHANGE ORDER', 'CHANGE_ORDER', 'CHANGEORDER', 'CHANGE'],
    'TRANS_IN': ['TRANS IN', 'TRANS_IN', 'TRANSIN', 'TRANSACTION IN'],
    'TRANS_OUT': ['TRANS OUT', 'TRANS_OUT', 'TRANSOUT', 'TRANSACTION OUT'],
    'REFUND_TRANS_IN': ['REFUND TRANS IN', 'REFUND_TRANS_IN', 'REFUND IN'],
    'REFUND_TRANS_OUT': ['REFUND TRANS OUT', 'REFUND_TRANS_OUT', 'REFUND OUT'],
    'FULFILLED_SALE': ['FULFILLED SALE', 'FULFILLED_SALE', 'FULFILLEDSALE']
  };

  
  
  export const queryPatterns = {
    SUM_LINE_TOTAL: {
      keywords: ['line total', 'sum', 'add', 'total of'],
      description: 'Sum of all line totals',
      handler: 'sumLineTotals'
    },
    ITEM_LINE_TOTALS: {
      keywords: ['item details', 'line totals', 'item and line total'],
      description: 'Get itemId, primeLineNo, lineTotal, tax, discount for all line items',
      handler: 'getItemLineTotals'
    },
    ORDER_ATTRIBUTES: {
      keywords: ['order attributes', 'original invoice', 'master invoice', 'business date', 'sales date'],
      description: 'Get order attribute fields including invoice numbers, dates, and totals',
      handler: 'getOrderAttributes'
    },
    STORE_DETAILS: {
      keywords: ['store details', 'store info', 'location number', 'zippedinstore'],
      description: 'Get store details including location number and zippedInStore',
      handler: 'getStoreDetails'
    },
    MTL_STATUS: {
      keywords: ['mtl status', 'transaction status', 'status'],
      description: 'Get MTL transaction status information',
      handler: 'getMTLStatus'
    },
    INTERNAL_STATUS: {
      keywords: ['internal status', 'internal state'],
      description: 'Get internal status information',
      handler: 'getInternalStatus'
    },
    INTERNAL_FAILED_REASON: {
      keywords: ['internal failed reason', 'failed reason', 'failure reason'],
      description: 'Get internal failed reason information',
      handler: 'getInternalFailedReason'
    },
    ORDER_TOTAL_BY_TXN_TYPE: {
      keywords: ['order total', 'grand total', 'total amount', 'create order', 'change order', 'transaction type'],
      description: 'Get grandTotal by transaction type',
      handler: 'getOrderTotalByTransactionType'
    },
    PAYMENT_DETAILS: {
      keywords: ['payment details', 'payment', 'credit card', 'payment status', 'payment method', 'payment info', 'card details'],
      description: 'Get payment details including credit card info, payment status, and request amount',
      handler: 'getPaymentDetails'
    }
  };