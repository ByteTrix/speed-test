import { useState, useCallback, useRef, useEffect } from 'react';
import { NetworkInfo } from './useNetworkInfo';

// Import the ndt7 library
const ndt7 = typeof window !== 'undefined' ? require('@m-lab/ndt7') : null;

// Environment configuration
const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE || 'real';
const DUMMY_DOWNLOAD_SPEED = parseFloat(process.env.NEXT_PUBLIC_DUMMY_DOWNLOAD_SPEED || '150.5');
const DUMMY_UPLOAD_SPEED = parseFloat(process.env.NEXT_PUBLIC_DUMMY_UPLOAD_SPEED || '75.2');
const DUMMY_PING = parseInt(process.env.NEXT_PUBLIC_DUMMY_PING || '25', 10);

export interface SpeedTestResult {
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  downloadData: number[];
  uploadData: number[];
  timeLabels: number[];
  isDownloadOnly?: boolean; // Flag to indicate if this was a download-only test
}

export interface SpeedTestState {
  isTesting: boolean;
  testStage: 'idle' | 'ping' | 'download' | 'upload' | 'complete';
  result: SpeedTestResult | null;
  error: string | null;
  progress: number;
  currentSpeed: number; // Current speed being measured
}

// M-Lab NDT7 types
interface MLabMeasurement {
  Source: 'client' | 'server';
  Data: {
    ElapsedTime?: number;
    NumBytes?: number;
    MeanClientMbps?: number;
    TCPInfo?: {
      MinRTT?: number;
      RTT?: number;
    };
  };
}

interface MLabComplete {
  LastClientMeasurement?: {
    ElapsedTime: number;
    NumBytes: number;
    MeanClientMbps: number;
  };
  LastServerMeasurement?: {
    TCPInfo: {
      MinRTT: number;
      RTT: number;
    };
  };
}

export const useSpeedTest = (networkInfo: NetworkInfo | null) => {
  const [state, setState] = useState<SpeedTestState>({
    isTesting: false,
    testStage: 'idle',
    result: null,
    error: null,
    progress: 0,
    currentSpeed: 0,
  });

  const downloadDataRef = useRef<number[]>([]);
  const uploadDataRef = useRef<number[]>([]);
  const timeLabelsRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const pingRef = useRef<number>(0);
  const skipUploadRef = useRef<boolean>(false); // Track if we should skip upload

  const runDummyTest = useCallback(async () => {
    console.log('🎭 Running DUMMY speed test');

    // Reset data arrays
    downloadDataRef.current = [];
    uploadDataRef.current = [];
    timeLabelsRef.current = [];
    startTimeRef.current = Date.now();
    pingRef.current = DUMMY_PING;

    const isDownloadOnly = skipUploadRef.current;

    // Simulate download test (skip ping stage)
    setState(prev => ({
      ...prev,
      testStage: 'download',
      progress: 10,
    }));
    
    console.log('📥 Download phase started');
    startTimeRef.current = Date.now();
    
    // Simulate download measurements over 8 seconds
    for (let i = 0; i < 80; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      // Simulate varying speed (ramp up then stabilize)
      const variation = Math.sin(i / 10) * 20 + Math.random() * 10;
      const speed = Math.min(DUMMY_DOWNLOAD_SPEED, (DUMMY_DOWNLOAD_SPEED * i / 30) + variation);
      
      downloadDataRef.current.push(speed);
      timeLabelsRef.current.push(elapsedTime);
      
      const maxProgress = isDownloadOnly ? 95 : 45;
      setState(prev => ({
        ...prev,
        progress: Math.min(maxProgress, 10 + (i / 80) * (maxProgress - 10)),
        currentSpeed: speed,
      }));
    }

    // Skip upload if download-only mode
    if (isDownloadOnly) {
      console.log('✅ Dummy download-only test completed');
      setState({
        isTesting: false,
        testStage: 'complete',
        result: {
          downloadSpeed: DUMMY_DOWNLOAD_SPEED,
          uploadSpeed: 0,
          ping: DUMMY_PING,
          downloadData: downloadDataRef.current,
          uploadData: [],
          timeLabels: timeLabelsRef.current,
          isDownloadOnly: true,
        },
        error: null,
        progress: 100,
        currentSpeed: 0,
      });
      skipUploadRef.current = false; // Reset flag
      return;
    }

    // Simulate upload test
    setState(prev => ({
      ...prev,
      testStage: 'upload',
      progress: 50,
    }));
    
    console.log('📤 Upload phase started');
    startTimeRef.current = Date.now();
    uploadDataRef.current = [];
    
    // Simulate upload measurements over 8 seconds
    for (let i = 0; i < 80; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      // Simulate varying speed
      const variation = Math.sin(i / 8) * 15 + Math.random() * 8;
      const speed = Math.min(DUMMY_UPLOAD_SPEED, (DUMMY_UPLOAD_SPEED * i / 30) + variation);
      
      uploadDataRef.current.push(speed);
      
      setState(prev => ({
        ...prev,
        progress: Math.min(95, 50 + (i / 80) * 45),
        currentSpeed: speed,
      }));
    }

    // Complete the test
    console.log('✅ Dummy full test completed');
    setState({
      isTesting: false,
      testStage: 'complete',
      result: {
        downloadSpeed: DUMMY_DOWNLOAD_SPEED,
        uploadSpeed: DUMMY_UPLOAD_SPEED,
        ping: DUMMY_PING,
        downloadData: downloadDataRef.current,
        uploadData: uploadDataRef.current,
        timeLabels: timeLabelsRef.current,
        isDownloadOnly: false,
      },
      error: null,
      progress: 100,
      currentSpeed: 0,
    });
    skipUploadRef.current = false; // Reset flag
  }, []);

  const startTest = useCallback(async () => {
    // Start UI test - go straight to download
    setState({
      isTesting: true,
      testStage: 'download',
      result: null,
      error: null,
      progress: 0,
      currentSpeed: 0,
    });

    try {
      // Check test mode
      if (TEST_MODE === 'dummy') {
        console.log('📋 Test Mode: DUMMY (simulated data)');
        await runDummyTest();
        return;
      }

      // Real test mode - minimal logging
      // Reset data arrays
      downloadDataRef.current = [];
      uploadDataRef.current = [];
      timeLabelsRef.current = [];
      startTimeRef.current = Date.now();
      pingRef.current = 0;

      if (!ndt7) {
        throw new Error('NDT7 library not available');
      }

      // Configure the ndt7 test
      const config: any = {
        userAcceptedDataPolicy: true,
        metadata: {
          client_name: 'speed-test-app',
        },
      };

      // Let NDT7 library handle server discovery automatically via locate API
      // It will get the proper access tokens and WebSocket URLs

      let maxDownloadSpeed = 0;
      let maxUploadSpeed = 0;

      // Run the NDT7 test
      await ndt7.test(
        config,
        {
          serverChosen: (server: any) => {
            // Only log in dummy mode or if there's an issue
            if (TEST_MODE === 'dummy') {
              console.log('Server chosen:', server);
            }
            // Validate that server has proper URLs
            if (!server.urls || (!server.urls.wss && !server.urls['wss:///ndt/v7/download'])) {
              console.warn('⚠️ Server missing WebSocket URLs, this may cause connection issues');
            }
          },
          downloadStart: () => {
            setState(prev => ({
              ...prev,
              testStage: 'download',
              progress: 10,
            }));
            startTimeRef.current = Date.now();
            downloadDataRef.current = [];
            timeLabelsRef.current = [];
          },
          downloadMeasurement: (data: MLabMeasurement) => {
            if (data.Source === 'client' && data.Data.MeanClientMbps) {
              const speed = data.Data.MeanClientMbps;
              // Track max speed for visual feedback during test
              const displaySpeed = Math.max(maxDownloadSpeed, speed);
              
              const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
              downloadDataRef.current.push(speed);
              timeLabelsRef.current.push(elapsedTime);
              
              setState(prev => ({
                ...prev,
                progress: Math.min(45, 10 + (elapsedTime / 10) * 35),
                currentSpeed: speed, // Show current instantaneous speed
              }));
            }
            
            // Capture ping from server measurements
            if (data.Source === 'server' && data.Data.TCPInfo) {
              const minRTT = data.Data.TCPInfo.MinRTT;
              if (minRTT && minRTT > 0) {
                pingRef.current = Math.round(minRTT / 1000); // Convert microseconds to milliseconds
              }
            }
          },
          downloadComplete: (data: MLabComplete) => {
            if (TEST_MODE === 'dummy') {
              console.log('Download test complete:', data);
            }
            
            // Use the LastClientMeasurement for the final speed (this is the accurate average)
            const finalSpeed = data.LastClientMeasurement?.MeanClientMbps || maxDownloadSpeed;
            maxDownloadSpeed = finalSpeed; // Use the final measured speed, not max
            
            // Extract ping from server measurement if available (MinRTT is in microseconds)
            if (data.LastServerMeasurement?.TCPInfo?.MinRTT) {
              pingRef.current = Math.round(data.LastServerMeasurement.TCPInfo.MinRTT / 1000);
              if (TEST_MODE === 'dummy') {
                console.log('Latency from TCPInfo.MinRTT:', pingRef.current, 'ms');
              }
            }

            // If download-only mode, complete the test here
            if (skipUploadRef.current) {
              if (TEST_MODE === 'dummy') {
                console.log('✅ Download-only test completed');
              }
              
              setState({
                isTesting: false,
                testStage: 'complete',
                result: {
                  downloadSpeed: Math.round(maxDownloadSpeed * 10) / 10,
                  uploadSpeed: 0,
                  ping: pingRef.current,
                  downloadData: downloadDataRef.current,
                  uploadData: [],
                  timeLabels: timeLabelsRef.current,
                  isDownloadOnly: true,
                },
                error: null,
                progress: 100,
                currentSpeed: 0,
              });
              skipUploadRef.current = false; // Reset flag
              
              // Throw error to exit the test early (NDT7 will catch it)
              throw new Error('DOWNLOAD_ONLY_COMPLETE');
            }

            setState(prev => ({
              ...prev,
              testStage: 'upload',
              progress: 50,
            }));
          },
          uploadStart: () => {
            if (TEST_MODE === 'dummy') {
              console.log('Upload test started');
            }
            startTimeRef.current = Date.now();
            uploadDataRef.current = [];
          },
          uploadMeasurement: (data: MLabMeasurement) => {
            if (data.Source === 'client' && data.Data.MeanClientMbps) {
              const speed = data.Data.MeanClientMbps;
              // Track max speed for visual feedback during test
              const displaySpeed = Math.max(maxUploadSpeed, speed);
              
              const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
              uploadDataRef.current.push(speed);
              
              setState(prev => ({
                ...prev,
                progress: Math.min(95, 50 + (elapsedTime / 10) * 45),
                currentSpeed: speed, // Show current instantaneous speed
              }));
            }
            
            // Capture ping from server measurements if not already set
            if (data.Source === 'server' && data.Data.TCPInfo) {
              const minRTT = data.Data.TCPInfo.MinRTT;
              if (minRTT && minRTT > 0 && !pingRef.current) {
                pingRef.current = Math.round(minRTT / 1000); // Convert microseconds to milliseconds
              }
            }
          },
          uploadComplete: (data: MLabComplete) => {
            if (TEST_MODE === 'dummy') {
              console.log('Upload test complete:', data);
            }
            
            // Use the LastClientMeasurement for the final speed (this is the accurate average)
            const finalSpeed = data.LastClientMeasurement?.MeanClientMbps || maxUploadSpeed;
            maxUploadSpeed = finalSpeed; // Use the final measured speed, not max
            
            // Extract latency from server measurement if not already set (RTT is in microseconds)
            if (!pingRef.current && data.LastServerMeasurement?.TCPInfo?.RTT) {
              pingRef.current = Math.round(data.LastServerMeasurement.TCPInfo.RTT / 1000);
              if (TEST_MODE === 'dummy') {
                console.log('Latency from TCPInfo.RTT:', pingRef.current, 'ms');
              }
            }
            
            if (TEST_MODE === 'dummy') {
              console.log('Final speeds - Download:', maxDownloadSpeed, 'Mbps, Upload:', maxUploadSpeed, 'Mbps');
            }
          },
          error: (err: Error) => {
            console.error('NDT7 test error:', err);
            console.error('Error details:', {
              message: err.message,
              name: err.name,
              stack: err.stack
            });
            // Don't throw immediately, let the test try to complete
            // Only throw if we get no data at all
          },
        }
      );

      // Test completed successfully - only log in dummy mode
      if (TEST_MODE === 'dummy') {
        console.log('✅ NDT7 test completed successfully');
      }
      
      // Check if we actually got any data
      if (maxDownloadSpeed === 0 && maxUploadSpeed === 0 && downloadDataRef.current.length === 0) {
        throw new Error('WebSocket connection failed. No data received from test servers. This may be due to firewall, antivirus, or network restrictions blocking WebSocket connections.');
      }
      
      setState({
        isTesting: false,
        testStage: 'complete',
        result: {
          downloadSpeed: Math.round(maxDownloadSpeed * 10) / 10,
          uploadSpeed: Math.round(maxUploadSpeed * 10) / 10,
          ping: pingRef.current,
          downloadData: downloadDataRef.current,
          uploadData: uploadDataRef.current,
          timeLabels: timeLabelsRef.current,
          isDownloadOnly: false,
        },
        error: null,
        progress: 100,
        currentSpeed: 0,
      });
    } catch (error) {
      // Ignore the DOWNLOAD_ONLY_COMPLETE error - it's intentional
      if (error instanceof Error && error.message === 'DOWNLOAD_ONLY_COMPLETE') {
        if (TEST_MODE === 'dummy') {
          console.log('Download-only test exited successfully');
        }
        return; // Exit cleanly
      }
      
      console.error('❌ Speed test failed:', error);

      // Provide more helpful error message
      let errorMessage = 'Test failed';
      if (error instanceof Error) {
        if (error.message.includes('WebSocket') || error.message.includes('connection')) {
          errorMessage = 'Unable to connect to test servers. Please check your network connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Test timed out. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      // Set error state
      setState({
        isTesting: false,
        testStage: 'idle',
        result: null,
        error: errorMessage,
        progress: 0,
        currentSpeed: 0,
      });
    }
  }, [networkInfo, runDummyTest]);

  const cancelTest = useCallback(() => {
    setState({
      isTesting: false,
      testStage: 'idle',
      result: null,
      error: null,
      progress: 0,
      currentSpeed: 0,
    });
    skipUploadRef.current = false; // Reset flag on cancel
  }, []);

  // Method to set download-only mode for next test
  const setDownloadOnlyMode = useCallback((downloadOnly: boolean) => {
    skipUploadRef.current = downloadOnly;
  }, []);

  // Method to run ONLY upload test (after download is already complete)
  const startUploadTest = useCallback(async () => {
    if (!state.result) {
      console.error('Cannot start upload test without download results');
      return;
    }

    if (TEST_MODE === 'dummy') {
      console.log('🚀 Starting upload-only test (DUMMY mode)');
    }

    // Set testing state for upload
    setState(prev => ({
      ...prev,
      isTesting: true,
      testStage: 'upload',
      progress: 50,
      currentSpeed: 0,
    }));

    try {
      if (TEST_MODE === 'dummy') {
        // Simulate upload test for dummy mode
        startTimeRef.current = Date.now();
        uploadDataRef.current = [];
        
        for (let i = 0; i < 80; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
          const variation = Math.sin(i / 8) * 15 + Math.random() * 8;
          const speed = Math.min(DUMMY_UPLOAD_SPEED, (DUMMY_UPLOAD_SPEED * i / 30) + variation);
          
          uploadDataRef.current.push(speed);
          
          setState(prev => ({
            ...prev,
            progress: Math.min(95, 50 + (i / 80) * 45),
            currentSpeed: speed,
          }));
        }

        // Complete with upload data added
        setState({
          isTesting: false,
          testStage: 'complete',
          result: {
            ...state.result,
            uploadSpeed: DUMMY_UPLOAD_SPEED,
            uploadData: uploadDataRef.current,
            isDownloadOnly: false,
          },
          error: null,
          progress: 100,
          currentSpeed: 0,
        });
      } else {
        // Real upload test with NDT7
        if (!ndt7) {
          throw new Error('NDT7 library not available');
        }

        const config: any = {
          userAcceptedDataPolicy: true,
          metadata: {
            client_name: 'speed-test-app',
          },
        };

        uploadDataRef.current = [];
        let maxUploadSpeed = 0;

        await ndt7.test(config, {
          serverChosen: () => {
            if (TEST_MODE === 'dummy') {
              console.log('Server already chosen, starting upload test');
            }
          },
          downloadStart: () => {
            // Skip download, we already have it
          },
          downloadMeasurement: () => {
            // Skip download measurements
          },
          downloadComplete: () => {
            if (TEST_MODE === 'dummy') {
              console.log('Skipping download phase');
            }
          },
          uploadStart: () => {
            if (TEST_MODE === 'dummy') {
              console.log('Upload test started');
            }
            startTimeRef.current = Date.now();
            uploadDataRef.current = [];
          },
          uploadMeasurement: (data: MLabMeasurement) => {
            if (data.Source === 'client' && data.Data.MeanClientMbps) {
              const speed = data.Data.MeanClientMbps;
              maxUploadSpeed = Math.max(maxUploadSpeed, speed);
              
              const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
              uploadDataRef.current.push(speed);
              
              setState(prev => ({
                ...prev,
                progress: Math.min(95, 50 + (elapsedTime / 10) * 45),
                currentSpeed: speed,
              }));
            }
          },
          uploadComplete: (data: MLabComplete) => {
            if (TEST_MODE === 'dummy') {
              console.log('Upload test complete:', data);
            }
            
            const finalSpeed = data.LastClientMeasurement?.MeanClientMbps || maxUploadSpeed;
            maxUploadSpeed = finalSpeed;
            
            if (TEST_MODE === 'dummy') {
              console.log('Final upload speed:', maxUploadSpeed, 'Mbps');
            }
          },
          error: (err: Error) => {
            console.error('Upload test error:', err);
            throw err;
          },
        });

        // Update result with upload data
        setState({
          isTesting: false,
          testStage: 'complete',
          result: {
            ...state.result,
            uploadSpeed: Math.round(maxUploadSpeed * 10) / 10,
            uploadData: uploadDataRef.current,
            isDownloadOnly: false,
          },
          error: null,
          progress: 100,
          currentSpeed: 0,
        });
      }

      if (TEST_MODE === 'dummy') {
        console.log('✅ Upload test completed');
      }
    } catch (error) {
      console.error('❌ Upload test failed:', error);
      
      setState(prev => ({
        ...prev,
        isTesting: false,
        testStage: 'complete',
        error: error instanceof Error ? error.message : 'Upload test failed',
        currentSpeed: 0,
      }));
    }
  }, [state.result]);

  return {
    ...state,
    startTest,
    cancelTest,
    setDownloadOnlyMode,
    startUploadTest,
  };
};
