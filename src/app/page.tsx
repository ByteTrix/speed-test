'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  ErrorDisplay, 
  ResultsDisplay,
} from '../components/speedtest/index';
import { useNetworkInfo } from '../hooks/useNetworkInfo';
import { useSpeedTest } from '../hooks/useSpeedTest';
import { SettingsModal, useSettings, convertSpeed } from '../components/Settings';

// Environment configuration
const AUTO_START = process.env.NEXT_PUBLIC_AUTO_START === 'true';
const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE || 'real';

const Page = () => {
  const { networkInfo, loading, error } = useNetworkInfo();
  const speedTest = useSpeedTest(networkInfo);
  const { settings, updateSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  // Apply theme
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    if (settings.theme === 'auto') {
      const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', darkMode);
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Manual theme selection - explicitly set or remove dark class
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else {
        // settings.theme === 'light'
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Handler for Upload Test button (run only upload test)
  const handleUploadTest = () => {
    speedTest.startUploadTest();
  };

  // Handler for regular start test
  const handleStartTest = () => {
    speedTest.startTest(settings.testMode);
  };

  // Convert speeds based on selected unit
  const downloadSpeed = speedTest.result?.downloadSpeed 
    ? convertSpeed(speedTest.result.downloadSpeed, 'Mbps', settings.speedUnit)
    : 0;
  const uploadSpeed = speedTest.result?.uploadSpeed 
    ? convertSpeed(speedTest.result.uploadSpeed, 'Mbps', settings.speedUnit)
    : 0;
  // Keep currentSpeed in Mbps for dynamic unit calculation during real-time testing
  const currentSpeedInMbps = speedTest.currentSpeed;
  // Also provide converted speed for non-dynamic display (if needed)
  const currentSpeedConverted = convertSpeed(speedTest.currentSpeed, 'Mbps', settings.speedUnit);

  // Helper function to format speed based on unit
  const formatSpeed = (speed: number, unit: string): string => {
    if (unit === 'Mbps') {
      // Mbps shows integer (no decimal)
      return Math.round(speed).toString();
    }
    
    // For other units, show dynamic decimals to ensure at least 2 significant digits are visible
    if (speed === 0) return '0';
    
    // Calculate how many decimals needed to show at least 2 significant digits
    const absSpeed = Math.abs(speed);
    let decimals = 1; // Default for units like MBps, Kbps, Gbps
    
    if (absSpeed < 0.01) {
      decimals = Math.max(2, Math.ceil(-Math.log10(absSpeed)) + 1);
    } else if (absSpeed < 0.1) {
      decimals = Math.max(2, 3);
    } else if (absSpeed < 1) {
      decimals = 2;
    }
    
    return speed.toFixed(decimals);
  };

  // Track if auto-start has already been triggered to prevent infinite loops
  const autoStartTriggeredRef = useRef(false);

  // Auto-start test when network info is ready (controlled by environment variable)
  useEffect(() => {
    // Only log network info state in dummy mode
    if (TEST_MODE === 'dummy') {
      console.log('Network info state:', {
        hasNetworkInfo: !!networkInfo,
        hasTestServer: !!networkInfo?.testServer,
        serverUrls: networkInfo?.testServer?.urls,
        isTesting: speedTest.isTesting,
        hasResult: !!speedTest.result,
        hasError: !!speedTest.error,
        testStage: speedTest.testStage,
        autoStart: AUTO_START,
        autoStartTriggered: autoStartTriggeredRef.current,
        testMode: TEST_MODE,
        settingsTestMode: settings.testMode,
      });
    }

    // Only auto-start once and only if there's no error
    if (AUTO_START && !autoStartTriggeredRef.current && !speedTest.isTesting && !speedTest.result && !speedTest.error) {
      // For dummy mode, start immediately
      if (TEST_MODE === 'dummy') {
        console.log('Auto-starting DUMMY test...');
        autoStartTriggeredRef.current = true;
        const timer = setTimeout(() => {
          speedTest.startTest(settings.testMode);
        }, 500);
        return () => clearTimeout(timer);
      }
      // For real mode, wait for network info - only mark as triggered AFTER server is available
      else if (networkInfo?.testServer) {
        if (TEST_MODE === 'dummy') {
          console.log('Auto-starting REAL test with server:', networkInfo.testServer);
        }
        autoStartTriggeredRef.current = true;
        const timer = setTimeout(() => {
          speedTest.startTest(settings.testMode);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkInfo?.testServer, speedTest.isTesting, speedTest.result, speedTest.error, settings.testMode]);

  return (
    <div className="min-h-dvh w-full bg-white dark:bg-black text-black dark:text-white font-sans flex flex-col transition-colors duration-300">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 pb-0">
        <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Dev Mode Indicator */}
        {TEST_MODE === 'dummy' && (
          <div className="mb-4 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">Development Mode</span>
            <span className="text-yellow-400/70">— Using simulated speed test data</span>
          </div>
        )}

        {/* Error Display */}
        {(error || speedTest.error) && (
          <div className="mb-6 w-full">
            <ErrorDisplay error={error || speedTest.error} />
          </div>
        )}

        {/* Loading state while waiting for network info (only show if NOT auto-starting) */}
        {loading && !networkInfo && !AUTO_START && (
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-gray-500 animate-pulse">
              Connecting...
            </div>
            <div className="text-sm text-gray-600">
              Fetching network information
            </div>
          </div>
        )}

        {/* Results Display with Speed Graph */}
        {(!loading || networkInfo || speedTest.isTesting) ? (
          <ResultsDisplay
            downloadSpeed={formatSpeed(downloadSpeed, settings.speedUnit)}
            uploadSpeed={formatSpeed(uploadSpeed, settings.speedUnit)}
            currentSpeed={currentSpeedInMbps}
            displayUnit={settings.speedUnit}
            ping={speedTest.result?.ping || 0}
            networkInfo={networkInfo}
            loading={loading}
            isTesting={speedTest.isTesting}
            testStage={speedTest.testStage}
            downloadData={speedTest.result?.downloadData || []}
            uploadData={speedTest.result?.uploadData || []}
            timeLabels={speedTest.result?.timeLabels || []}
            onRestartTest={handleStartTest}
            onUploadTest={handleUploadTest}
            isDownloadOnly={speedTest.result?.isDownloadOnly}
            testMode={settings.testMode}
            autoStart={AUTO_START}
          />
        ) : null}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={updateSettings}
      />

      {/* Footer - Subtle, no separator */}
      <div className="w-full px-8 py-4 mt-auto flex items-center justify-between">
        {/* Left side - Icon buttons (Settings first) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800/50"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <a
            href="https://github.com/ByteTrix/speed-test"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800/50"
            title="GitHub"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
          <a
            href="https://ko-fi.com/itskavin"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800/50"
            title="Support"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </a>
          <a
            href="mailto:contact@thekavin.com"
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800/50"
            title="Contact"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
        </div>

        {/* Right side - Credits */}
        <div className="text-xs text-gray-600 dark:text-gray-600">
          Powered by ByteTrix
        </div>
      </div>
    </div>
  );
};

export default Page;
