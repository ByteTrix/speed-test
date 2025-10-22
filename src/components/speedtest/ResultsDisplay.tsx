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
  currentSpeed?: number;
  displayUnit: string;
  onRestartTest?: () => void;
  networkInfo: NetworkInfo | null;
  loading: boolean;
  downloadData?: number[];
  uploadData?: number[];
  timeLabels?: number[];
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  ping = 0,
  downloadSpeed = '0',
  uploadSpeed = '0',
  currentSpeed = 0,
  displayUnit,
  onRestartTest,
  networkInfo,
  loading,
  isTesting = false,
  testStage = 'idle',
  downloadData = [],
  uploadData = [],
  timeLabels = [],
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Use real data if available, otherwise use dummy data
  const hasRealData = downloadData.length > 0 || uploadData.length > 0;
  
  const labels = hasRealData 
    ? timeLabels.map((t, i) => i.toString())
    : Array.from({ length: 10 }, (_, i) => i.toString());
    
  const finalDownloadData = hasRealData && downloadData.length > 0
    ? downloadData
    : [0];
    
  const finalUploadData = hasRealData && uploadData.length > 0
    ? uploadData
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
          label: (context: TooltipItem<'line'>) => 
            ` ${context.dataset.label}: ${(context.parsed.y || 0).toFixed(2)} ${displayUnit}`,
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
              <div className="text-6xl sm:text-8xl font-bold text-white tracking-tight">
                {testStage === 'ping' && (
                  <span className="text-4xl sm:text-5xl animate-pulse">Measuring latency...</span>
                )}
                {testStage === 'download' && currentSpeed.toFixed(1)}
                {testStage === 'upload' && currentSpeed.toFixed(1)}
                {testStage === 'idle' && (
                  <span className="text-4xl sm:text-5xl animate-pulse">Preparing...</span>
                )}
              </div>
              <div className="text-xl sm:text-2xl text-gray-400 font-light">
                {testStage === 'download' && `Testing download ${displayUnit}`}
                {testStage === 'upload' && `Testing upload ${displayUnit}`}
                {testStage === 'ping' && 'Testing connection'}
                {testStage === 'idle' && 'Getting ready'}
              </div>
            </>
          ) : hasRealData ? (
            <>
              <div className="text-8xl sm:text-9xl font-bold text-white tracking-tight">
                {downloadSpeed}
              </div>
              <div className="text-2xl sm:text-3xl text-gray-500 font-light">
                {displayUnit}
              </div>
            </>
          ) : (
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
                className="mt-6 px-12 py-4 bg-white hover:bg-gray-200 text-black text-lg font-medium rounded-md
                         transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 
                         focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {networkInfo?.testServer ? 'Start Test' : 'Loading server info...'}
              </button>
            </>
          )}
        </div>

        {/* Secondary Info - Upload & Ping in compact format */}
        {!isTesting && hasRealData && (
          <div className="flex items-center justify-center gap-8 text-gray-400">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-500">Upload</span>
              <span className="text-xl font-semibold text-white">{uploadSpeed}</span>
              <span className="text-sm">{displayUnit}</span>
            </div>
            <div className="w-px h-6 bg-gray-800"></div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-500">Latency</span>
              <span className="text-xl font-semibold text-white">{ping}</span>
              <span className="text-sm">ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Expand Details Button - Only show when test is complete */}
      {!isTesting && hasRealData && (
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
                  <span className="text-white font-semibold">{downloadSpeed} {displayUnit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Upload</span>
                  <span className="text-white font-semibold">{uploadSpeed} {displayUnit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Latency</span>
                  <span className="text-white font-semibold">{ping} ms</span>
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
              className="px-6 py-2.5 bg-white hover:bg-gray-200 text-black text-sm font-medium rounded-md
                       transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 
                       focus:ring-offset-black"
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