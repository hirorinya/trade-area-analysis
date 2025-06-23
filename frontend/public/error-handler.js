// Global error handler for browser extension conflicts
(function() {
  'use strict';
  
  // Capture and filter console errors
  const originalError = console.error;
  console.error = function(...args) {
    const message = args[0]?.toString() || '';
    
    // Filter out known browser extension errors
    const extensionErrors = [
      'runtime.lastError',
      'message port closed',
      'Could not establish connection',
      'Receiving end does not exist',
      'Extension context invalidated',
      'chrome-extension://'
    ];
    
    const isExtensionError = extensionErrors.some(pattern => 
      message.includes(pattern)
    );
    
    if (!isExtensionError) {
      originalError.apply(console, args);
    }
  };
  
  // Handle unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', function(event) {
    const message = event.reason?.message || '';
    
    if (
      message.includes('runtime.lastError') ||
      message.includes('Extension context')
    ) {
      event.preventDefault(); // Prevent logging
    }
  });
  
  // Handle window errors from extensions
  window.addEventListener('error', function(event) {
    const message = event.message || '';
    
    if (
      message.includes('chrome-extension://') ||
      message.includes('moz-extension://')
    ) {
      event.preventDefault(); // Prevent logging
    }
  });
})();