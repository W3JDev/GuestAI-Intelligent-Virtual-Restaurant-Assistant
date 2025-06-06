
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = new URL('/sw.js', window.location.origin).href;

    const isLocalhost = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '[::1]';
    const isSecureContext = window.isSecureContext;
    const isBlobOrDataURI = document.documentURI.startsWith('blob:') || document.documentURI.startsWith('data:');

    if (isBlobOrDataURI) {
      console.error(
        'Service Worker Registration Aborted: Cannot register Service Worker.\n' +
        `Reason: The application is effectively running from a '${document.documentURI.substring(0,5)}' URI (${document.documentURI}).\n` +
        'Service Workers cannot be registered from blob: or data: URIs due to security restrictions.\n' +
        'This can happen in sandboxed environments or specific iframe setups.'
      );
      return;
    }

    if (!isSecureContext && !isLocalhost) {
      console.error(
        'Service Worker Registration Aborted: Cannot register Service Worker.\n' +
        'Reason: The application is not running in a secure context (HTTPS) and is not localhost.\n' +
        'Service Workers require HTTPS or localhost to be registered.\n' +
        'Please serve your application over HTTPS or access it via http://localhost.'
      );
      return;
    }

    // Defer registration slightly to ensure document is fully stable
    setTimeout(() => {
      // Enhanced diagnostic log
      console.log(
        `Attempting ServiceWorker registration.\n` +
        `  SW URL: ${swUrl}\n` +
        `  window.isSecureContext: ${window.isSecureContext}\n` +
        `  isLocalhost: ${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '[::1]'}\n` +
        `  document.readyState: ${document.readyState}\n` +
        `  document.documentURI: ${document.documentURI}`
      );

      if (document.readyState !== 'complete') {
        console.warn(`ServiceWorker Registration Warning: document.readyState is '${document.readyState}' at the time of registration attempt, expected 'complete'. Proceeding anyway.`);
      }

      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          let logMessage = 'ServiceWorker registration failed: ';
          if (error instanceof DOMException) {
            logMessage += `${error.message} (Name: ${error.name})`;
            if (error.name === 'InvalidStateError') {
              logMessage += '\nThis error (InvalidStateError) strongly indicates the page is not served over HTTPS or from localhost, OR the document is in an unstable state (e.g., blob: URI).';
              // Further context based on checks (re-checked for absolute certainty)
              const currentIsSecureContext = window.isSecureContext;
              const currentIsLocalhost = window.location.hostname === 'localhost' ||
                                        window.location.hostname === '127.0.0.1' ||
                                        window.location.hostname === '[::1]';
              const currentDocumentURI = document.documentURI;
              const currentIsBlobOrData = currentDocumentURI.startsWith('blob:') || currentDocumentURI.startsWith('data:');

              logMessage += `\n  Context at failure: isSecureContext=${currentIsSecureContext}, isLocalhost=${currentIsLocalhost}, readyState=${document.readyState}, documentURI=${currentDocumentURI}`;

              if (currentIsBlobOrData) {
                logMessage += `\n  Diagnosis: Running from a '${currentDocumentURI.substring(0,5)}' URI. Service Worker registration is not allowed from blob: or data: URIs.`;
              } else if (!currentIsSecureContext && !currentIsLocalhost) {
                 logMessage += '\n  Diagnosis: Not a secure context and not localhost. Registration should have been aborted but was attempted.';
              } else if (currentIsSecureContext) {
                 logMessage += '\n  Diagnosis: Secure context (HTTPS/localhost) IS DETECTED. The InvalidStateError might be due to other subtle document state issues (e.g., readyState not "complete" despite onload) or browser-specific quirks if not a blob/data URI.';
              } else if (currentIsLocalhost) {
                 logMessage += '\n  Diagnosis: Running on localhost (which is permissible). The InvalidStateError might be due to subtle document state issues or if the browser is not treating localhost as secure for some reason (e.g., specific browser flags or configurations).';
              }
            }
          } else if (error instanceof Error) {
            logMessage += `${error.message} (Name: ${error.name})`;
          } else {
            logMessage += String(error);
          }
          console.error(logMessage, error);
        });
    }, 100);
  });
}
