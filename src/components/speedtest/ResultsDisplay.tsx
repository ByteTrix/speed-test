import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  TooltipItem,
  Scale,
  CoreScaleOptions
} from 'chart.js';
import { NetworkInfo } from '../../hooks/useNetworkInfo';
import { NetworkInfoDisplay } from './NetworkInfoDisplay';
import { convertSpeed } from '../Settings';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ResultsDisplayProps {
  testStage?: string;
  isTesting?: boolean;
  ping?: number;
  downloadSpeed: string;
  uploadSpeed: string;
  currentSpeed?: number; // Current speed in Mbps (raw) for dynamic unit calculation
  displayUnit: string;
  onRestartTest?: () => void;
  onUploadTest?: () => void; // Prop for triggering upload test only
  networkInfo: NetworkInfo | null;
  loading: boolean;
  downloadData?: number[];
  uploadData?: number[];
  timeLabels?: number[];
  isDownloadOnly?: boolean; // New prop to indicate download-only mode
  testMode?: 'download-only' | 'full'; // Current test mode setting
  autoStart?: boolean; // New prop to indicate if auto-start is enabled
}

// Helper function to dynamically determine the best unit for real-time display (like fast.com)
// Based on user's preferred unit setting - stays in the same family (bits vs bytes)
const getDynamicUnit = (speedInMbps: number, preferredUnit: string): { value: number; unit: string } => {
  // Determine if user prefers bits or bytes
  const isBytesFamily = preferredUnit.includes('Bps') || preferredUnit.includes('BPS');
  const isGigaScale = preferredUnit.startsWith('G');
  const isTeraScale = preferredUnit.startsWith('T');
  const isKiloScale = preferredUnit.startsWith('K');
  
  if (isBytesFamily) {
    // Bytes family (MBps, GBps, etc.)
    const speedInMBps = speedInMbps / 8; // Convert Mbps to MBps
    
    if (isTeraScale) {
      // TBps scale
      if (speedInMBps < 1000) {
        return { value: speedInMBps, unit: 'MBps' };
      } else if (speedInMBps < 1000000) {
        return { value: speedInMBps / 1000, unit: 'GBps' };
      } else {
        return { value: speedInMBps / 1000000, unit: 'TBps' };
      }
    } else if (isGigaScale) {
      // GBps scale
      if (speedInMBps < 1) {
        return { value: speedInMBps * 1000, unit: 'KBps' };
      } else if (speedInMBps < 1000) {
        return { value: speedInMBps, unit: 'MBps' };
      } else {
        return { value: speedInMBps / 1000, unit: 'GBps' };
      }
    } else {
      // MBps scale (default for bytes)
      if (speedInMBps < 1) {
        return { value: speedInMBps * 1000, unit: 'KBps' };
      } else {
        return { value: speedInMBps, unit: 'MBps' };
      }
    }
  } else {
    // Bits family (Mbps, Gbps, Kbps, etc.)
    if (isTeraScale) {
      // Tbps scale
      if (speedInMbps < 1000) {
        return { value: speedInMbps, unit: 'Mbps' };
      } else if (speedInMbps < 1000000) {
        return { value: speedInMbps / 1000, unit: 'Gbps' };
      } else {
        return { value: speedInMbps / 1000000, unit: 'Tbps' };
      }
    } else if (isGigaScale) {
      // Gbps scale
      if (speedInMbps < 1) {
        return { value: speedInMbps * 1000, unit: 'Kbps' };
      } else if (speedInMbps < 1000) {
        return { value: speedInMbps, unit: 'Mbps' };
      } else {
        return { value: speedInMbps / 1000, unit: 'Gbps' };
      }
    } else if (isKiloScale) {
      // Kbps scale
      return { value: speedInMbps * 1000, unit: 'Kbps' };
    } else {
      // Mbps scale (default for bits)
      if (speedInMbps < 1) {
        return { value: speedInMbps * 1000, unit: 'Kbps' };
      } else {
        return { value: speedInMbps, unit: 'Mbps' };
      }
    }
  }
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  ping = 0,
  downloadSpeed = '0',
  uploadSpeed = '0',
  currentSpeed = 0,
  displayUnit,
  onRestartTest,
  onUploadTest,
  networkInfo,
  loading,
  isTesting = false,
  testStage = 'idle',
  downloadData = [],
  uploadData = [],
  timeLabels = [],
  isDownloadOnly = false,
  testMode = 'download-only',
  autoStart = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Helper function to format speed with dynamic precision for real-time display
  const formatDynamicSpeed = (speed: number, unit: string): string => {
    if (speed === 0) return '0';
    
    const absSpeed = Math.abs(speed);
    
    // For Mbps, show integer (no decimal) - matches old logic
    if (unit === 'Mbps') {
      return Math.round(speed).toString();
    }
    
    // For other units, show dynamic decimals to ensure at least 2 significant digits are visible
    let decimals = 1; // Default for units like Kbps, Gbps, Tbps
    
    if (absSpeed < 0.01) {
      decimals = Math.max(2, Math.ceil(-Math.log10(absSpeed)) + 1);
    } else if (absSpeed < 0.1) {
      decimals = Math.max(2, 3);
    } else if (absSpeed < 1) {
      decimals = 2;
    } else if (absSpeed >= 100) {
      // Integer for speeds >= 100
      return Math.round(speed).toString();
    } else if (absSpeed >= 10) {
      // 1 decimal for speeds 10-100
      decimals = 1;
    } else {
      // 2 decimals for speeds < 10
      decimals = 2;
    }
    
    return speed.toFixed(decimals);
  };
  
  // Use real data if available, otherwise use dummy data
  const hasRealData = downloadData.length > 0 || uploadData.length > 0;
  
  const labels = hasRealData 
    ? timeLabels.map((t, i) => i.toString())
    : Array.from({ length: 10 }, (_, i) => i.toString());
  
  // Convert data arrays to the selected unit (data is originally in Mbps)
  const finalDownloadData = hasRealData && downloadData.length > 0
    ? downloadData.map(speed => convertSpeed(speed, 'Mbps', displayUnit as any))
    : [0];
    
  const finalUploadData = hasRealData && uploadData.length > 0
    ? uploadData.map(speed => convertSpeed(speed, 'Mbps', displayUnit as any))
    : [0];

  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: `Download Speed`,
        data: finalDownloadData,
        borderColor: 'rgb(255, 255, 255)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: `Upload Speed`,
        data: finalUploadData,
        borderColor: 'rgb(100, 100, 100)',
        backgroundColor: 'rgba(100, 100, 100, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
            family: 'system-ui, sans-serif',
          },
          padding: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFont: {
          size: 12,
          family: 'system-ui, sans-serif',
        },
        bodyFont: {
          size: 11,
          family: 'system-ui, sans-serif',
        },
        padding: 10,
        cornerRadius: 6,
        displayColors: true,
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const value = context.parsed.y || 0;
            let formattedValue: string;
            
            if (displayUnit === 'Mbps') {
              formattedValue = Math.round(value).toString();
            } else {
              // Dynamic decimals to show at least 2 significant digits
              if (value === 0) {
                formattedValue = '0';
              } else {
                const absValue = Math.abs(value);
                let decimals = 1;
                
                if (absValue < 0.01) {
                  decimals = Math.max(2, Math.ceil(-Math.log10(absValue)) + 1);
                } else if (absValue < 0.1) {
                  decimals = Math.max(2, 3);
                } else if (absValue < 1) {
                  decimals = 2;
                }
                
                formattedValue = value.toFixed(decimals);
              }
            }
            
            return ` ${context.dataset.label}: ${formattedValue} ${displayUnit}`;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          font: {
            size: 10,
            family: 'system-ui, sans-serif',
          },
          padding: 6,
          callback: function(this: Scale<CoreScaleOptions>, tickValue: number | string): string {
            return `${tickValue}`;
          },
        },
        border: {
          display: false,
        },
      },
      x: {
        type: 'category' as const,
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 5,
        hitRadius: 10,
      },
      line: {
        borderWidth: 2,
      },
    },
  };

  return (
    <div className="w-full relative">
      {/* Main Speed Display - ABSOLUTELY FIXED IN CENTER */}
      <div className="text-center space-y-6">
        {/* Primary Download Speed */}
        <div className="space-y-2">
          {isTesting ? (
            <>
              {testStage === 'idle' ? (
                <div className="text-4xl sm:text-5xl animate-pulse text-gray-600 tracking-tight">
                  Preparing...
                </div>
              ) : (
                <>
                  {/* Real-time speed - number perfectly centered on screen */}
                  <div className="relative flex justify-center items-center">
                    <span className="text-8xl sm:text-9xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums">
                      {(() => {
                        const dynamic = getDynamicUnit(currentSpeed || 0, displayUnit);
                        return formatDynamicSpeed(dynamic.value, dynamic.unit);
                      })()}
                    </span>
                    <span className="text-2xl sm:text-3xl font-medium text-gray-500 ml-2 self-center">
                      {(() => {
                        const dynamic = getDynamicUnit(currentSpeed || 0, displayUnit);
                        return dynamic.unit;
                      })()}
                    </span>
                  </div>
                  {/* Clean label below - only "Download" or "Upload" */}
                  <div className="text-xl sm:text-2xl text-gray-400 font-light mt-4">
                    {testStage === 'download' && 'Download'}
                    {testStage === 'upload' && 'Upload'}
                  </div>
                </>
              )}
            </>
          ) : hasRealData ? (
            <>
              {/* Final results - number perfectly centered on screen */}
              <div className="relative flex justify-center items-center">
                <span className="text-8xl sm:text-9xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums">
                  {downloadSpeed}
                </span>
                <span className="text-2xl sm:text-3xl font-medium text-gray-500 ml-2 self-center">
                  {displayUnit}
                </span>
              </div>
            </>
          ) : !autoStart ? (
            <>
              <div className="text-4xl sm:text-5xl font-bold text-gray-600 tracking-tight">
                Ready to test
              </div>
              <div className="text-lg sm:text-xl text-gray-500 font-light mt-4">
                Click the button below to start
              </div>
              <button
                onClick={onRestartTest}
                disabled={!networkInfo?.testServer}
                className="mt-6 px-12 py-4 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black text-lg font-medium rounded-md
                         transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 
                         focus:ring-offset-white dark:focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {networkInfo?.testServer ? 'Start Test' : 'Loading server info...'}
              </button>
            </>
          ) : (
            <div className="text-4xl sm:text-5xl animate-pulse text-gray-600">
              Initializing test...
            </div>
          )}
        </div>

        {/* Secondary Info - Upload & Ping in compact format OR Upload Test button for download-only */}
        {!isTesting && hasRealData && (
          <>
            {isDownloadOnly ? (
              // Download-only mode: Show latency and Upload Test button
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-baseline gap-2 text-gray-400">
                  <span className="text-sm text-gray-500">Latency</span>
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">{ping}</span>
                  <span className="text-sm">ms</span>
                </div>
                  <button
                    onClick={onUploadTest}
                    className="px-6 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black text-sm font-medium rounded-md
                             transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 
                             focus:ring-offset-white dark:focus:ring-offset-black"
                  >
                  Upload Test
                  </button>
              </div>
            ) : (
              // Full test mode: Show upload and latency
              <div className="flex items-center justify-center gap-8 text-gray-400">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-500">Upload</span>
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">{uploadSpeed}</span>
                  <span className="text-sm">{displayUnit}</span>
                </div>
                <div className="w-px h-6 bg-gray-800"></div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-500">Latency</span>
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">{ping}</span>
                  <span className="text-sm">ms</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Expand Details Button - Only show when test is complete and NOT in download-only result mode */}
      {!isTesting && hasRealData && !isDownloadOnly && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors duration-200 flex items-center gap-2"
          >
            {showDetails ? (
              <>
                <span>Hide Details</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                <span>Show More Info</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* Expandable Details Section */}
      {showDetails && !isTesting && hasRealData && (
        <div className="mt-6 w-full">
          <div className="space-y-3 max-w-3xl mx-auto">
          {/* Speed Graph - Ultra Compact */}
          <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
            <h3 className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Speed Over Time (NDT7)</h3>
            <div className="h-[140px]">
              <Line data={chartData} options={options} />
            </div>
          </div>

          {/* Test Details Grid - Ultra Compact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* NDT7 Results */}
            <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
              <h3 className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                NDT7
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Download</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{downloadSpeed} {displayUnit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Upload</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{uploadSpeed} {displayUnit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Latency</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{ping} ms</span>
                </div>
              </div>
            </div>

            {/* MSAK Placeholder */}
            <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50 opacity-50">
              <h3 className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                MSAK
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Download</span>
                  <span className="text-gray-500 text-xs">Coming soon</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Upload</span>
                  <span className="text-gray-500 text-xs">Coming soon</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Latency</span>
                  <span className="text-gray-500 text-xs">Coming soon</span>
                </div>
              </div>
            </div>
          </div>

          {/* Network Info - Compact */}
          <div className="bg-zinc-900/30 rounded-lg p-4 border border-zinc-800/50">
            <h3 className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Connection Details</h3>
            <NetworkInfoDisplay 
              networkInfo={networkInfo} 
              loading={loading}
              compact={true}
            />
          </div>

          {/* Restart Button - Compact */}
          <div className="flex justify-center pt-2">
            <button
              onClick={onRestartTest}
              className="px-6 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black text-sm font-medium rounded-md
                       transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 
                       focus:ring-offset-white dark:focus:ring-offset-black"
            >
              Test Again
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;