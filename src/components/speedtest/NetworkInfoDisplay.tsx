import React from 'react';
import { NetworkInfo } from '../../hooks/useNetworkInfo';

interface NetworkInfoDisplayProps {
  networkInfo: NetworkInfo | null;
  loading: boolean;
  compact?: boolean;
}

export const NetworkInfoDisplay: React.FC<NetworkInfoDisplayProps> = ({ 
  networkInfo, 
  loading,
}) => {
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

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, index) => (
          <div key={index} className="h-8 bg-zinc-800/50 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

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
};
