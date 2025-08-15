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

export const baseCommands = [
  {
    id: 'MTL_STATUS',
    commands: [
      'What is the MTL status',
      'Give me MTL status',
      'Show MTL status',
      'MTL status',
      'Get MTL status'
    ],
    handler: 'getMTLStatus',
    description: 'Get MTL transaction status information'
  },
  {
    id: 'ORDER_TOTAL',
    commands: [
      'Give me Order total',
      'Show order total',
      'Order total by transaction type',
      'Get order totals',
      'Order total'
    ],
    handler: 'getOrderTotalByTransactionType',
    description: 'Get order totals by transaction type'
  },
  {
    id: 'PAYMENT_DETAILS',
    commands: [
      'Give me payment details',
      'Show payment details',
      'Payment details',
      'Get payment info',
      'Payment information'
    ],
    handler: 'getPaymentDetails',
    description: 'Get payment and credit card details'
  },
  {
    id: 'ITEM_DETAILS',
    commands: [
      'Give me the item details',
      'Show item details',
      'Item line details',
      'Get item information',
      'Item details'
    ],
    handler: 'getItemLineTotals',
    description: 'Get item line totals and details'
  },
  {
    id: 'ORDER_ATTRIBUTES',
    commands: [
      'give me order attributes',
      'Show order attributes',
      'Order attributes',
      'Get order attributes',
      'Order information'
    ],
    handler: 'getOrderAttributes',
    description: 'Get order attributes and totals'
  },
  {
    id: 'STORE_DETAILS',
    commands: [
      'What is store details',
      'Give me store details',
      'Show store details',
      'Store information',
      'Store details'
    ],
    handler: 'getStoreDetails',
    description: 'Get store location and details'
  }
];

  
  
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