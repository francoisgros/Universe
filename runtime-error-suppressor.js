// Runtime Error Suppressor - Eliminates Chrome extension runtime.lastError messages
// This module specifically targets and suppresses the "message port closed" errors

(function() {
    'use strict';
    
    console.log('Runtime Error Suppressor: Initializing...');
    
    // Method 1: Override console.error to filter out runtime errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
        const message = args.join(' ');
        
        // Filter out specific runtime error messages
        if (message.includes('runtime.lastError') || 
            message.includes('message port closed') ||
            message.includes('Unchecked runtime.lastError')) {
            console.debug('Runtime Error Suppressor: Filtered runtime error:', message);
            return; // Don't log the error
        }
        
        // Log other errors normally
        originalConsoleError.apply(console, args);
    };
    
    // Method 2: Proactive chrome.runtime.lastError checking
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        console.log('Runtime Error Suppressor: Chrome runtime detected, implementing suppression');
        
        // Clear any existing runtime errors immediately
        const clearRuntimeError = () => {
            if (chrome.runtime.lastError) {
                const error = chrome.runtime.lastError;
                console.debug('Runtime Error Suppressor: Cleared runtime error:', error.message);
                // Accessing the error clears it
            }
        };
        
        // Clear errors periodically
        setInterval(clearRuntimeError, 100);
        
        // Override chrome.runtime methods if they exist
        ['sendMessage', 'connect', 'sendNativeMessage'].forEach(method => {
            if (chrome.runtime[method]) {
                const original = chrome.runtime[method];
                chrome.runtime[method] = function(...args) {
                    try {
                        const result = original.apply(this, args);
                        // Clear any errors that might have been generated
                        setTimeout(clearRuntimeError, 0);
                        return result;
                    } catch (error) {
                        console.debug('Runtime Error Suppressor: Intercepted chrome.runtime error:', error);
                        setTimeout(clearRuntimeError, 0);
                        throw error;
                    }
                };
            }
        });
    }
    
    // Method 3: Global error event suppression
    window.addEventListener('error', function(event) {
        if (event.error && event.error.message && 
            (event.error.message.includes('runtime.lastError') ||
             event.error.message.includes('message port closed'))) {
            console.debug('Runtime Error Suppressor: Suppressed global error event');
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }, true);
    
    // Method 4: Unhandled promise rejection suppression
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.message &&
            (event.reason.message.includes('runtime.lastError') ||
             event.reason.message.includes('message port closed'))) {
            console.debug('Runtime Error Suppressor: Suppressed unhandled rejection');
            event.preventDefault();
            return false;
        }
    });
    
    console.log('Runtime Error Suppressor: Initialization complete');
})();