import React from 'react';

type ErrorDisplayProps = {
  error: Error | string | null;
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Check if it's a connection/WebSocket error
  const isConnectionError = errorMessage.toLowerCase().includes('websocket') || 
                            errorMessage.toLowerCase().includes('connection') ||
                            errorMessage.toLowerCase().includes('failed');
  
  return (
    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 my-4">
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Test Failed</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">{errorMessage}</p>
          
          {isConnectionError && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              This may be due to network restrictions, firewall settings, or temporary server issues.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
