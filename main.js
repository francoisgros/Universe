import { UniverseScene } from './universe.js';

// Add global error handlers to catch runtime errors
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    if (event.error && event.error.message && event.error.message.includes('runtime.lastError')) {
        console.error('Chrome runtime error detected - likely browser extension conflict');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (event.reason && event.reason.message && event.reason.message.includes('runtime.lastError')) {
        console.error('Chrome runtime promise rejection - likely browser extension conflict');
    }
});

// Check for Chrome extension environment and suppress runtime errors
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.warn('Chrome extension environment detected - implementing runtime error suppression');
    
    // Suppress chrome.runtime.lastError by checking it proactively
    const checkRuntimeError = () => {
        if (chrome.runtime.lastError) {
            // Silently consume the error to prevent console spam
            const error = chrome.runtime.lastError;
            console.debug('Chrome runtime error suppressed:', error.message);
        }
    };
    
    // Override chrome.runtime methods to catch errors
    const originalSendMessage = chrome.runtime.sendMessage;
    if (originalSendMessage) {
        chrome.runtime.sendMessage = function(...args) {
            try {
                const result = originalSendMessage.apply(this, args);
                // Check for runtime errors after the call
                setTimeout(checkRuntimeError, 0);
                return result;
            } catch (error) {
                console.debug('Chrome runtime.sendMessage error intercepted:', error);
                return Promise.reject(error);
            }
        };
    }
    
    // Periodically check and clear runtime errors
    setInterval(checkRuntimeError, 1000);
}

async function initUniverse() {
    try {
        const universe = new UniverseScene('renderCanvas');
        await universe.initPromise; // Wait for initialization to complete
    } catch (error) {
        console.error('Failed to initialize universe:', error);
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="text-align: center;">
                    <div style="color: #ff3366; font-size: 1.2em; margin-bottom: 1em;">
                        Failed to initialize universe
                    </div>
                    <div style="color: #00fff7; font-size: 0.9em;">
                        ${error.message}
                    </div>
                    <div style="margin-top: 2em;">
                        <button onclick="location.reload()" style="
                            background: none;
                            border: 1px solid #00fff7;
                            color: #00fff7;
                            padding: 10px 20px;
                            font-family: 'Orbitron', sans-serif;
                            cursor: pointer;
                        ">Retry</button>
                    </div>
                </div>
            `;
        }
    }
}

// Initialize when document is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUniverse);
} else {
    initUniverse();
}
