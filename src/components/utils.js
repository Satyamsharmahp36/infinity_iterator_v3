import { knownTransactionTypes, typeVariations, queryPatterns } from './constants.js';

// Enhanced function to normalize and validate transaction types
export const normalizeTransactionType = (input) => {
  const normalized = input.toUpperCase().replace(/\s/g, '_');
  return knownTransactionTypes.find(type => type === normalized);
};

// Function to extract transaction types from user query
export const extractTransactionTypesFromQuery = (query) => {
  const foundTypes = new Set();
  const queryUpper = query.toUpperCase();

  for (const [standardType, variations] of Object.entries(typeVariations)) {
    for (const variant of variations) {
      // Match whole words only
      const pattern = new RegExp(`\\b${variant}\\b`, 'i');
      if (pattern.test(queryUpper)) {
        foundTypes.add(standardType);
        break;
      }
    }
  }

  return Array.from(foundTypes);
};

// Query Recognition Function
export const recognizeQuery = (query) => {
  const normalized = query.toLowerCase();
  
  // Special check for payment details queries
  const hasPaymentKeywords = ['payment details', 'payment', 'credit card', 'payment status', 'payment method', 'payment info', 'card details'].some(keyword => 
    normalized.includes(keyword)
  );
  
  if (hasPaymentKeywords) {
    return {
      type: 'PAYMENT_DETAILS',
      confidence: 1.0,
      handler: 'getPaymentDetails',
      description: 'Get payment details filtered by transaction type if applicable'
    };
  }
  
  
  // Special check for order total queries
  const hasOrderTotalKeywords = ['order total', 'grand total', 'total amount'].some(keyword => 
    normalized.includes(keyword)
  );
  
  const hasTransactionTypeKeywords = knownTransactionTypes.some(type => 
    normalized.includes(type.toLowerCase().replace('_', ' ')) || 
    normalized.includes(type.toLowerCase())
  );
  
  if (hasOrderTotalKeywords || hasTransactionTypeKeywords) {
    return {
      type: 'ORDER_TOTAL_BY_TXN_TYPE',
      confidence: 1.0,
      handler: 'getOrderTotalByTransactionType',
      description: 'Get grandTotal by transaction type'
    };
  }
  
  for (const [queryType, pattern] of Object.entries(queryPatterns)) {
    const matchCount = pattern.keywords.filter(keyword => 
      normalized.includes(keyword)
    ).length;
    
    if (matchCount > 0) {
      return {
        type: queryType,
        confidence: matchCount / pattern.keywords.length,
        handler: pattern.handler,
        description: pattern.description
      };
    }
  }
  
  return {
    type: 'UNKNOWN',
    confidence: 0,
    handler: 'fallbackQuery',
    description: 'Unknown query type - using AI fallback'
  };
};

// Utility function to flatten JSON objects
export const flattenJSON = (obj, prefix = '', result = {}) => {
  for (const key in obj) {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flattenJSON(value, path, result);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        flattenJSON(item, `${path}[${index}]`, result);
      });
    } else {
      result[path] = value;
    }
  }
  return result;
};

// Simple XML to JSON parser
export const parseXMLToJson = (xmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  
  const xmlToObj = (element) => {
    const obj = {};
    
    // Handle attributes
    if (element.attributes) {
      for (let attr of element.attributes) {
        obj[`@${attr.name}`] = attr.value;
      }
    }
    
    // Handle child elements
    if (element.children.length > 0) {
      for (let child of element.children) {
        const childName = child.tagName;
        const childObj = xmlToObj(child);
        
        if (obj[childName]) {
          if (!Array.isArray(obj[childName])) {
            obj[childName] = [obj[childName]];
          }
          obj[childName].push(childObj);
        } else {
          obj[childName] = childObj;
        }
      }
    } else {
      return element.textContent || '';
    }
    
    return obj;
  };
  
  return xmlToObj(xmlDoc.documentElement);
};