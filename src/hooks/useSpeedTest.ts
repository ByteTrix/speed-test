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
  const testModeRef = useRef<'download-only' | 'full'>('download-only');

  const runDummyDownloadTest = useCallback(async () => {
    console.log('📥 Running DUMMY download test');
    
    downloadDataRef.current = [];
    timeLabelsRef.current = [];
    startTimeRef.current = Date.now();
    pingRef.current = DUMMY_PING;

    setState(prev => ({ ...prev, testStage: 'download', progress: 10 }));
    
    // Simulate download measurements over 8 seconds
    for (let i = 0; i < 80; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      const variation = Math.sin(i / 10) * 20 + Math.random() * 10;
      const speed = Math.min(DUMMY_DOWNLOAD_SPEED, (DUMMY_DOWNLOAD_SPEED * i / 30) + variation);
      
      downloadDataRef.current.push(speed);
      timeLabelsRef.current.push(elapsedTime);
      
      setState(prev => ({
        ...prev,
        progress: Math.min(95, 10 + (i / 80) * 85),
        currentSpeed: speed,
      }));
    }

    console.log('✅ Dummy download test completed');
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
  }, []);

  const runDummyUploadTest = useCallback(async () => {
    console.log('📤 Running DUMMY upload test');
    
    uploadDataRef.current = [];
    startTimeRef.current = Date.now();

    setState(prev => ({ ...prev, testStage: 'upload', progress: 50 }));
    
    // Simulate upload measurements over 8 seconds
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

    console.log('✅ Dummy upload test completed');
  }, []);

  const runDummyFullTest = useCallback(async () => {
    console.log('🎭 Running DUMMY full test (download + upload)');

    downloadDataRef.current = [];
    uploadDataRef.current = [];
    timeLabelsRef.current = [];
    startTimeRef.current = Date.now();
    pingRef.current = DUMMY_PING;

    // Download phase
    setState(prev => ({ ...prev, testStage: 'download', progress: 10 }));
    console.log('📥 Download phase started');
    startTimeRef.current = Date.now();
    
    for (let i = 0; i < 80; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
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

    // Upload phase
    setState(prev => ({ ...prev, testStage: 'upload', progress: 50 }));
    console.log('📤 Upload phase started');
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
  }, []);

  const startTest = useCallback(async (testMode: 'download-only' | 'full' = 'download-only') => {
    testModeRef.current = testMode;
    
    setState({
      isTesting: true,
      testStage: 'download',
      result: null,
      error: null,
      progress: 0,
      currentSpeed: 0,
    });

    try {
      // DUMMY MODE
      if (TEST_MODE === 'dummy') {
        console.log(`📋 Test Mode: DUMMY (${testMode})`);
        
        if (testMode === 'download-only') {
          await runDummyDownloadTest();
        } else {
          await runDummyFullTest();
        }
        return;
      }

      // REAL MODE
      downloadDataRef.current = [];
      uploadDataRef.current = [];
      timeLabelsRef.current = [];
      startTimeRef.current = Date.now();
      pingRef.current = 0;

      if (!ndt7) {
        throw new Error('NDT7 library not available');
      }

      const config: any = {
        userAcceptedDataPolicy: true,
        metadata: {
          client_name: 'kvn-speed-test',
        },
      };

      let maxDownloadSpeed = 0;
      let maxUploadSpeed = 0;

      // DOWNLOAD-ONLY MODE: Use ndt7.downloadTest()
      if (testMode === 'download-only') {
        console.log('🚀 Running download-only test');

        const urlPromise = ndt7.discoverServerURLs(config, {
          serverChosen: (server: any) => {
            console.log('Server chosen for download test');
          },
          error: (err: Error) => {
            console.error('Server discovery error:', err);
          },
        });

        await ndt7.downloadTest(config, {
          downloadStart: () => {
            setState(prev => ({ ...prev, testStage: 'download', progress: 10 }));
            startTimeRef.current = Date.now();
            downloadDataRef.current = [];
            timeLabelsRef.current = [];
          },
          downloadMeasurement: (data: MLabMeasurement) => {
            if (data.Source === 'client' && data.Data.MeanClientMbps) {
              const speed = data.Data.MeanClientMbps;
              const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
              downloadDataRef.current.push(speed);
              timeLabelsRef.current.push(elapsedTime);
              
              setState(prev => ({
                ...prev,
                progress: Math.min(95, 10 + (elapsedTime / 10) * 85),
                currentSpeed: speed,
              }));
            }
            
            if (data.Source === 'server' && data.Data.TCPInfo?.MinRTT) {
              pingRef.current = Math.round(data.Data.TCPInfo.MinRTT / 1000);
            }
          },
          downloadComplete: (data: MLabComplete) => {
            const finalSpeed = data.LastClientMeasurement?.MeanClientMbps || maxDownloadSpeed;
            maxDownloadSpeed = finalSpeed;
            
            if (data.LastServerMeasurement?.TCPInfo?.MinRTT) {
              pingRef.current = Math.round(data.LastServerMeasurement.TCPInfo.MinRTT / 1000);
            }
          },
          error: (err: Error) => {
            console.error('Download test error:', err);
          },
        }, urlPromise);

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

        console.log('✅ Download-only test completed');
        return;
      }

      // FULL MODE: Use ndt7.test()
      console.log('🚀 Running full test (download + upload)');

      await ndt7.test(config, {
        serverChosen: (server: any) => {
          console.log('Server chosen for full test');
        },
        downloadStart: () => {
          setState(prev => ({ ...prev, testStage: 'download', progress: 10 }));
          startTimeRef.current = Date.now();
          downloadDataRef.current = [];
          timeLabelsRef.current = [];
        },
        downloadMeasurement: (data: MLabMeasurement) => {
          if (data.Source === 'client' && data.Data.MeanClientMbps) {
            const speed = data.Data.MeanClientMbps;
            const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
            downloadDataRef.current.push(speed);
            timeLabelsRef.current.push(elapsedTime);
            
            setState(prev => ({
              ...prev,
              progress: Math.min(45, 10 + (elapsedTime / 10) * 35),
              currentSpeed: speed,
            }));
          }
          
          if (data.Source === 'server' && data.Data.TCPInfo?.MinRTT && !pingRef.current) {
            pingRef.current = Math.round(data.Data.TCPInfo.MinRTT / 1000);
          }
        },
        downloadComplete: (data: MLabComplete) => {
          const finalSpeed = data.LastClientMeasurement?.MeanClientMbps || maxDownloadSpeed;
          maxDownloadSpeed = finalSpeed;
          
          if (data.LastServerMeasurement?.TCPInfo?.MinRTT) {
            pingRef.current = Math.round(data.LastServerMeasurement.TCPInfo.MinRTT / 1000);
          }

          setState(prev => ({ ...prev, testStage: 'upload', progress: 50 }));
        },
        uploadStart: () => {
          startTimeRef.current = Date.now();
          uploadDataRef.current = [];
        },
        uploadMeasurement: (data: MLabMeasurement) => {
          if (data.Source === 'client' && data.Data.MeanClientMbps) {
            const speed = data.Data.MeanClientMbps;
            const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
            uploadDataRef.current.push(speed);
            
            setState(prev => ({
              ...prev,
              progress: Math.min(95, 50 + (elapsedTime / 10) * 45),
              currentSpeed: speed,
            }));
          }
          
          if (data.Source === 'server' && data.Data.TCPInfo?.MinRTT && !pingRef.current) {
            pingRef.current = Math.round(data.Data.TCPInfo.MinRTT / 1000);
          }
        },
        uploadComplete: (data: MLabComplete) => {
          const finalSpeed = data.LastClientMeasurement?.MeanClientMbps || maxUploadSpeed;
          maxUploadSpeed = finalSpeed;
          
          if (!pingRef.current && data.LastServerMeasurement?.TCPInfo?.RTT) {
            pingRef.current = Math.round(data.LastServerMeasurement.TCPInfo.RTT / 1000);
          }
        },
        error: (err: Error) => {
          console.error('Test error:', err);
        },
      });

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

      console.log('✅ Full test completed');

    } catch (error) {
      console.error('❌ Speed test failed:', error);

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

      setState({
        isTesting: false,
        testStage: 'idle',
        result: null,
        error: errorMessage,
        progress: 0,
        currentSpeed: 0,
      });
    }
  }, [runDummyDownloadTest, runDummyFullTest]);

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

  // Method to run ONLY upload test (after download is already complete)
  const startUploadTest = useCallback(async () => {
    if (!state.result) {
      console.error('Cannot start upload test without download results');
      return;
    }

    console.log('🚀 Starting upload-only test');

    setState(prev => ({
      ...prev,
      isTesting: true,
      testStage: 'upload',
      progress: 50,
      currentSpeed: 0,
    }));

    try {
      // DUMMY MODE
      if (TEST_MODE === 'dummy') {
        await runDummyUploadTest();
        
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
        
        console.log('✅ Dummy upload test completed');
        return;
      }

      // REAL MODE - Use ndt7.uploadTest()
      if (!ndt7) {
        throw new Error('NDT7 library not available');
      }

      const config: any = {
        userAcceptedDataPolicy: true,
        metadata: {
          client_name: 'kvn-speed-test',
        },
      };

      uploadDataRef.current = [];
      let maxUploadSpeed = 0;

      const urlPromise = ndt7.discoverServerURLs(config, {
        serverChosen: (server: any) => {
          console.log('Server selected for upload test');
        },
        error: (err: Error) => {
          console.error('Server discovery error:', err);
        },
      });

      await ndt7.uploadTest(config, {
        uploadStart: () => {
          console.log('Upload test started');
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
          
          if (data.Source === 'server' && data.Data.TCPInfo?.MinRTT && !pingRef.current) {
            pingRef.current = Math.round(data.Data.TCPInfo.MinRTT / 1000);
          }
        },
        uploadComplete: (data: MLabComplete) => {
          const finalSpeed = data.LastClientMeasurement?.MeanClientMbps || maxUploadSpeed;
          maxUploadSpeed = finalSpeed;
          
          if (!pingRef.current && data.LastServerMeasurement?.TCPInfo?.RTT) {
            pingRef.current = Math.round(data.LastServerMeasurement.TCPInfo.RTT / 1000);
          }
          
          console.log('Upload test complete - Final speed:', maxUploadSpeed, 'Mbps');
        },
        error: (err: Error) => {
          console.error('Upload test error:', err);
        },
      }, urlPromise);

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

      console.log('✅ Upload-only test completed');
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
  }, [state.result, runDummyUploadTest]);

  return {
    ...state,
    startTest,
    cancelTest,
    startUploadTest,
  };
};
