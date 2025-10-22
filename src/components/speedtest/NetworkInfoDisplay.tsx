import React, { useState, useEffect } from 'react';
import { NetworkInfo } from '../../hooks/useNetworkInfo';

interface NetworkInfoDisplayProps {
  networkInfo: NetworkInfo | null;
  loading: boolean;
  isMobile?: boolean;
  compact?: boolean;
}

const NetworkInfoDisplay: React.FC<NetworkInfoDisplayProps> = ({ 
  networkInfo, 
  loading,
  isMobile = false,
  compact = false
}) => {
  const [showDetails, setShowDetails] = useState(!isMobile);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  useEffect(() => {
    if (loading && !dataLoaded) {
      return;
    }
    
    if (networkInfo && !dataLoaded) {
      setDataLoaded(true);
    }
  }, [networkInfo, dataLoaded, loading]);

  const displayInfo = networkInfo || {
    ip: "Loading...",
    isp: "Loading...",
    city: "Loading...",
    country: "Loading...",
    testServer: null
  };

  const formatDistance = (distance: number | undefined) => {
    if (distance === undefined || isNaN(distance)) return "Unknown";
    return distance < 100 
      ? distance.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",") 
      : Math.round(distance).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatISP = (isp: string): string => {
    return isp.replace(/^AS\d+\s+/i, '');
  };

  if (loading && !dataLoaded) {
    return (
      <div className="space-y-2">
        {[...Array(compact ? 2 : 4)].map((_, index) => (
          <div key={index} className="h-8 bg-zinc-800/50 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  // Compact view for expanded details section
  if (compact) {
    return (
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex justify-between">
            <span className="text-gray-500">IP Address</span>
            <span className="text-gray-300">{displayInfo.ip}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">ISP</span>
            <span className="text-gray-300">{formatISP(displayInfo.isp)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Your Location</span>
            <span className="text-gray-300">{`${displayInfo.city}, ${displayInfo.country}`}</span>
          </div>
          {displayInfo.testServer && (
            <div className="flex justify-between">
              <span className="text-gray-500">Server Location</span>
              <span className="text-gray-300 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {displayInfo.testServer.location}
                <span className="text-gray-500 text-xs">({formatDistance(displayInfo.testServer.distance)} km)</span>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original detailed view (not used in new design, but kept for backward compatibility)
  const cardClasses = `
    bg-gradient-to-r from-slate-900/70 to-slate-800/70 
    p-2 sm:p-4 rounded-lg shadow-lg w-full 
    backdrop-blur-sm border border-slate-700/40 
    transition-all duration-300
    ${isMobile ? 'hover:bg-slate-800/80 active:bg-slate-800/90 cursor-pointer' : 'hover:shadow-blue-900/10'}
    ${isMobile && !showDetails ? 'h-12' : 'h-auto'}
  `;

  return (
    <div 
      className={cardClasses}
      onClick={() => isMobile ? setShowDetails(!showDetails) : undefined}
      role={isMobile ? "button" : undefined}
    > 
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/50 mb-2.5">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-blue-100">
            Connection Info
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center ${isMobile ? 'bg-slate-800/90' : 'bg-slate-900/70'} px-2 py-0.5 sm:py-1.5 rounded-full`}>
            <span className="inline-flex h-2 w-2 relative mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
            </span>
            <span className="text-xs font-medium text-green-400">Active</span>
          </div>
          {isMobile && !showDetails && (
            <div className="flex items-center bg-blue-900/20 px-2 py-0.5 rounded-full">
              <span className="text-[10px] font-medium tracking-wide text-blue-300/90">
                Tap to view
              </span>
            </div>
          )}
          {!isMobile && (
            <button 
              className="text-blue-400/80 hover:text-blue-400 flex items-center transition-colors py-1 px-2 rounded-md hover:bg-slate-800/50"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
              <span className="ml-1 text-xs">{showDetails ? 'Hide Details' : 'Show Details'}</span>
            </button>
          )}
        </div>
      </div>
      
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${isMobile && !showDetails ? 'hidden' : ''}`}>
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-2 sm:px-3 py-2 sm:py-3 flex flex-col justify-between">
          <div className="flex items-center text-gray-400 mb-1 pb-0.5 sm:pb-1 border-b border-slate-700/30">
            <svg className="w-4 h-4 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">IP</span>
          </div>
          <div className="font-medium text-white text-[11px] sm:text-sm truncate pt-0.5">
            {displayInfo.ip}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-2 sm:px-3 py-2 sm:py-3 flex flex-col justify-between">
          <div className="flex items-center text-gray-400 mb-1 pb-0.5 sm:pb-1 border-b border-slate-700/30">
            <svg className="w-4 h-4 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Provider</span>
          </div>
          <div className="font-medium text-white text-[11px] sm:text-sm truncate pt-0.5">
            {formatISP(displayInfo.isp)}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-2 sm:px-3 py-2 sm:py-3 flex flex-col justify-between">
          <div className="flex items-center text-gray-400 mb-1 pb-0.5 sm:pb-1 border-b border-slate-700/30">
            <svg className="w-4 h-4 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Location</span>
          </div>
          <div className="font-medium text-white text-[11px] sm:text-sm truncate pt-0.5">
            {`${displayInfo.city}, ${displayInfo.country}`}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-2 sm:px-3 py-2 sm:py-3 flex flex-col justify-between">
          <div className="flex items-center text-gray-400 mb-1 pb-0.5 sm:pb-1 border-b border-slate-700/30">
            <svg className="w-4 h-4 text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Server</span>
          </div>
          <div className="font-medium text-white text-[11px] sm:text-sm truncate pt-0.5">
            {displayInfo.testServer ? (
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{displayInfo.testServer.location}</span>
                <span className="text-gray-400 text-[10px] flex-shrink-0">({formatDistance(displayInfo.testServer.distance)} km)</span>
              </div>
            ) : (
              <span className="text-gray-400">Selecting...</span>
            )}
          </div>
        </div>
      </div>

      {showDetails && !isMobile && (
        <div className="mt-3 pt-2 text-xs border-t border-slate-700/30">
          <div className="bg-slate-900/50 p-2.5 rounded-lg text-gray-300 font-mono shadow-inner">
            {displayInfo.testServer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Host:</span>
                  <span className="ml-1">{displayInfo.testServer.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Server Type:</span>
                  <span className="ml-1">Measurement Lab (NDT7)</span>
                </div>
                <div>
                  <span className="text-gray-500">Server Status:</span>
                  <span className="ml-1 text-green-400">Active</span>
                </div>
                <div>
                  <span className="text-gray-500">Connection:</span>
                  <span className="ml-1">{displayInfo.ip.includes(':') ? 'IPv6' : 'IPv4'} / WebSocket (WSS)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { NetworkInfoDisplay };
export default NetworkInfoDisplay;
