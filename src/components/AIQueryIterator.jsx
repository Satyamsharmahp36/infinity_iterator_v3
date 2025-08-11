  import React, { useState, useRef, useEffect } from 'react';
  import { Send, Bot, User, Database, CreditCard, DollarSign, RefreshCw } from 'lucide-react';

  const AIQueryIterator = ({onDevModeToggle }) => {
    const [messages, setMessages] = useState([
      {
        id: 1,
        type: 'bot',
        content: 'Welcome to AI Query Iterator Tool! Please enter your order number to get started.',
        timestamp: new Date()
      }
    ]);
    
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [section, setSection] = useState('infinity');
    const [environment, setEnvironment] = useState('development');
    const [orderFetched, setOrderFetched] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    const addMessage = (type, content) => {
      const newMessage = {
        id: messages.length + 1,
        type,
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    };

    const simulateTyping = (callback, delay = 1500) => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        callback();
      }, delay);
    };

    const handleSendMessage = () => {
      if (!inputValue.trim()) return;

      addMessage('user', inputValue);
      
      if (!orderFetched && inputValue === '100901267240868001') {
        simulateTyping(() => {
          addMessage('bot', 'Data fetched successfully! ✅ Now you can ask any queries related to this order.');
          setOrderFetched(true);
        });
      } else if (orderFetched && inputValue.toLowerCase().includes('payment details')) {
        simulateTyping(() => {
          addMessage('bot', 'payment_details');
        }, 2000);
      } else if (!orderFetched) {
        simulateTyping(() => {
          addMessage('bot', 'Please enter a valid order number first.');
        });
      } else {
        simulateTyping(() => {
          addMessage('bot', 'I can help you with queries related to the fetched order. Try asking about payment details, order status, or transaction information.');
        });
      }

      setInputValue('');
    };

    const renderPaymentDetails = () => (
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-5 space-y-4 border border-slate-600/50 shadow-lg">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg">
          <CreditCard className="w-5 h-5" />
          Payment Details
        </div>
        
        {/* Event Information */}
        <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
          <div className="text-blue-400 font-medium mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Event Information
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 min-w-20">Event ID:</span> 
              <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">58D4CD24672E0D023940F4CF1B2AAC9C414DEFD0787E54F701E95ABA45869D1C</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-20">Transaction Type:</span> 
              <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-1 rounded">CREATE_ORDER</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-20">Order No:</span> 
              <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">100901267240868001</span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
          <div className="text-emerald-400 font-medium mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Payment Status
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-32">Payment Status:</span> 
              <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded">AUTHORIZED</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-32">Payment Type:</span> 
              <span className="text-white">CREDIT_CARD_MTL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-32">Total Open Authorizations:</span> 
              <span className="text-emerald-400 font-semibold">₹15.36</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-32">Total Open Bookings:</span> 
              <span className="text-emerald-400 font-semibold">₹15.36</span>
            </div>
          </div>
        </div>

        {/* Credit Card Information */}
        <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
          <div className="text-cyan-400 font-medium mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Credit Card Information
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-24">Card Type:</span> 
              <span className="text-white">LCC</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-24">Card Number:</span> 
              <span className="text-white font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">690257TZVOIA1116</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-24">Display Card No:</span> 
              <span className="text-white">690257TZVOIA1116</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-24">Expiry Date:</span> 
              <span className="text-white">12/26</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-24">Cardholder:</span> 
              <span className="text-white">TAMMELA HOPKINS</span>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
          <div className="text-purple-400 font-medium mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Transaction Details
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-28">Request Amount:</span> 
              <span className="text-emerald-400 font-bold">₹15.36</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-28">Authorization ID:</span> 
              <span className="text-white">251</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-28">Book Amount:</span> 
              <span className="text-emerald-400">₹15.36</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 min-w-28">Credit Amount:</span> 
              <span className="text-emerald-400">₹15.36</span>
            </div>
          </div>
        </div>
      </div>
    );

    const renderMessage = (message) => {
      const isBot = message.type === 'bot';
      
      return (
        <div key={message.id} className={`flex gap-4 ${isBot ? 'justify-start' : 'justify-end'}`}>
          {isBot && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}
          
          <div className={`max-w-2xl px-5 py-3 rounded-2xl shadow-lg ${
            isBot 
              ? 'bg-slate-800/80 backdrop-blur-sm text-white border border-slate-600/50' 
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-500/25'
          }`}>
            {message.content === 'payment_details' ? renderPaymentDetails() : message.content}
          </div>
          
          {!isBot && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 shadow-lg">
          <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                AI Query Iterator Tool
              </h1>
              <div className="flex items-center gap-3 bg-slate-700/50 px-4 py-2 rounded-full">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-sm font-semibold">
                  S
                </div>
                <span className="text-slate-300 font-medium">Satyam</span>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <div className="flex items-center gap-3 bg-slate-700/30 px-4 py-2 rounded-lg border border-slate-600">
                <label className="text-sm text-slate-300 font-medium">Section:</label>
                <select 
                  value={section} 
                  onChange={(e) => setSection(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="infinity">Infinity</option>
                  <option value="beta">Beta</option>
                  <option value="alpha">Alpha</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-700/30 px-4 py-2 rounded-lg border border-slate-600">
                <label className="text-sm text-slate-300 font-medium">Environment:</label>
                <select 
                  value={environment} 
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <button
                onClick={() => onDevModeToggle()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
              >
                Dev Mode
              </button>

            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="max-w-5xl mx-auto p-6">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="flex flex-col h-[calc(100vh-220px)]">
              {/* Chat Header */}
              <div className="bg-slate-800/60 px-6 py-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">AI Assistant</h3>
                    <p className="text-xs text-slate-400">Query Iterator Tool</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-400">Online</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-slate-900/20 to-slate-800/40">
                {messages.map(renderMessage)}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 px-4 py-3 rounded-2xl shadow-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 bg-slate-800/40 border-t border-slate-700/50">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm placeholder-slate-400"
                    disabled={isTyping}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isTyping || !inputValue.trim()}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25 disabled:shadow-none"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default AIQueryIterator;