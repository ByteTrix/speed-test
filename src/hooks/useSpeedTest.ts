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

  const measurePing = async (url: string): Promise<number> => {
    const startTime = performance.now();
    try {
      await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      const endTime = performance.now();
      return Math.round(endTime - startTime);
    } catch {
      return 0;
    }
  };

  const runDummyTest = useCallback(async () => {
    console.log('🎭 Running DUMMY speed test');

    // Reset data arrays
    downloadDataRef.current = [];
    uploadDataRef.current = [];
    timeLabelsRef.current = [];
    startTimeRef.current = Date.now();
    pingRef.current = DUMMY_PING;

    // Simulate ping stage
    setState(prev => ({
      ...prev,
      testStage: 'ping',
      progress: 5,
    }));
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate download test
    setState(prev => ({
      ...prev,
      testStage: 'download',
      progress: 10,
    }));
    
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
      
      setState(prev => ({
        ...prev,
        progress: Math.min(45, 10 + (i / 80) * 35),
        currentSpeed: speed,
      }));
    }

    // Simulate upload test
    setState(prev => ({
      ...prev,
      testStage: 'upload',
      progress: 50,
    }));
    
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
    console.log('✅ Dummy test completed');
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
      },
      error: null,
      progress: 100,
      currentSpeed: 0,
    });
  }, []);

  const startTest = useCallback(async () => {
    // Start UI test
    setState({
      isTesting: true,
      testStage: 'ping',
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

      // Real test mode
      console.log('🚀 Test Mode: REAL (M-Lab NDT7)');
      
      if (!ndt7) {
        throw new Error('NDT7 library not available');
      }

      // Reset data arrays
      downloadDataRef.current = [];
      uploadDataRef.current = [];
      timeLabelsRef.current = [];
      startTimeRef.current = Date.now();
      pingRef.current = 0;

      console.log('🚀 Starting NDT7 speed test with M-Lab library');

      // Configure the ndt7 test
      const config: any = {
        userAcceptedDataPolicy: true,
        metadata: {
          client_name: 'speed-test-app',
        },
      };

      // Let ndt7 library handle server discovery automatically
      // It will find the best server based on location
      console.log('Using automatic server discovery from M-Lab');

      let maxDownloadSpeed = 0;
      let maxUploadSpeed = 0;

      // Run the NDT7 test
      await ndt7.test(
        config,
        {
          serverChosen: (server: any) => {
            console.log('Server chosen:', server);
            // Measure ping to the server
            // The server object has 'machine' property with hostname
            const hostname = server.machine || server.fqdn;
            if (hostname) {
              const pingUrl = `https://${hostname}`;
              measurePing(pingUrl).then((ping) => {
                pingRef.current = ping;
                console.log('Ping measured:', ping, 'ms');
              }).catch((err) => {
                console.warn('Ping measurement failed:', err);
              });
            }
          },
          downloadStart: () => {
            console.log('Download test started');
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
          },
          downloadComplete: (data: MLabComplete) => {
            console.log('Download test complete:', data);
            
            // Use the LastClientMeasurement for the final speed (this is the accurate average)
            const finalSpeed = data.LastClientMeasurement?.MeanClientMbps || maxDownloadSpeed;
            maxDownloadSpeed = finalSpeed; // Use the final measured speed, not max
            
            // Extract ping from server measurement if available (MinRTT is in microseconds)
            if (data.LastServerMeasurement?.TCPInfo?.MinRTT) {
              pingRef.current = Math.round(data.LastServerMeasurement.TCPInfo.MinRTT / 1000);
              console.log('Latency from TCPInfo.MinRTT:', pingRef.current, 'ms');
            }

            setState(prev => ({
              ...prev,
              testStage: 'upload',
              progress: 50,
            }));
          },
          uploadStart: () => {
            console.log('Upload test started');
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
          },
          uploadComplete: (data: MLabComplete) => {
            console.log('Upload test complete:', data);
            
            // Use the LastClientMeasurement for the final speed (this is the accurate average)
            const finalSpeed = data.LastClientMeasurement?.MeanClientMbps || maxUploadSpeed;
            maxUploadSpeed = finalSpeed; // Use the final measured speed, not max
            
            // Extract latency from server measurement if not already set (RTT is in microseconds)
            if (!pingRef.current && data.LastServerMeasurement?.TCPInfo?.RTT) {
              pingRef.current = Math.round(data.LastServerMeasurement.TCPInfo.RTT / 1000);
              console.log('Latency from TCPInfo.RTT:', pingRef.current, 'ms');
            }
            
            console.log('Final speeds - Download:', maxDownloadSpeed, 'Mbps, Upload:', maxUploadSpeed, 'Mbps');
          },
          error: (err: Error) => {
            console.error('NDT7 test error:', err);
            throw err;
          },
        }
      );

      // Test completed successfully
      console.log('✅ NDT7 test completed successfully');
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
        },
        error: null,
        progress: 100,
        currentSpeed: 0,
      });
    } catch (error) {
      console.error('❌ Speed test failed:', error);

      // Set error state
      setState({
        isTesting: false,
        testStage: 'idle',
        result: null,
        error: error instanceof Error ? error.message : 'Test failed',
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
  }, []);

  return {
    ...state,
    startTest,
    cancelTest,
  };
};
