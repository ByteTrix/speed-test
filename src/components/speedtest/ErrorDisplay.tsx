import React from 'react';

type ErrorDisplayProps = {
  error: Error | string | null;
  onRetry?: () => void;
  canRetry?: boolean;
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, canRetry = true }) => {
  if (!error) return null;
  
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Check if it's a connection/WebSocket error
  const isConnectionError = errorMessage.toLowerCase().includes('websocket') || 
                            errorMessage.toLowerCase().includes('connection') ||
                            errorMessage.toLowerCase().includes('failed');
  
  return (
    <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-6 my-4">
      <div className="flex items-start gap-3">
        <svg className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-red-400 mb-1">Test Failed</h3>
            <p className="text-sm text-gray-300">{errorMessage}</p>
          </div>
          
          {isConnectionError && (
            <div className="text-xs text-gray-400 bg-gray-900/50 p-3 rounded border border-gray-800">
              <p className="mb-2">💡 <span className="font-medium">Possible reasons:</span></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>M-Lab servers may be temporarily unavailable or rate-limiting</li>
                <li>Your network may be blocking WebSocket connections</li>
                <li>Firewall or VPN might be interfering</li>
              </ul>
            </div>
          )}
            </div>
        </div>
      </div>
  );
};
