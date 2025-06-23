// Global error handler for browser extension conflicts
(function() {
  'use strict';
  
  // Capture and filter console errors
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Filter function for extension-related messages
  function isExtensionError(message) {
    const extensionPatterns = [
      'runtime.lastError',
      'message port closed',
      'Could not establish connection',
      'Receiving end does not exist',
      'Extension context invalidated',
      'chrome-extension://',
      'moz-extension://',
      'Unchecked runtime.lastError'
    ];
    
    return extensionPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }
  
  console.error = function(...args) {
    const message = args[0]?.toString() || '';
    if (!isExtensionError(message)) {
      originalError.apply(console, args);
    }
  };
  
  console.warn = function(...args) {
    const message = args[0]?.toString() || '';
    if (!isExtensionError(message)) {
      originalWarn.apply(console, args);
    }
  };
  
  // Handle unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', function(event) {
    const message = event.reason?.message || event.reason?.toString() || '';
    
    if (isExtensionError(message)) {
      event.preventDefault();
      return false;
    }
  });
  
  // Handle window errors from extensions
  window.addEventListener('error', function(event) {
    const message = event.message || event.error?.message || '';
    
    if (isExtensionError(message)) {
      event.preventDefault();
      return false;
    }
  });
  
  // Suppress specific Chrome extension errors at the document level
  document.addEventListener('DOMContentLoaded', function() {
    // Override any console methods that might be called after page load
    const suppressExtensionErrors = () => {
      const originalLog = console.log;
      console.log = function(...args) {
        const message = args[0]?.toString() || '';
        if (!isExtensionError(message)) {
          originalLog.apply(console, args);
        }
      };
    };
    
    suppressExtensionErrors();
  });
  
  console.log('🛡️ Extension error suppression active');
})();