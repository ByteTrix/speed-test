import React, { useState, useEffect } from 'react';

export type SpeedUnit = 'Mbps' | 'MBps' | 'Kbps' | 'Gbps';
export type Theme = 'auto' | 'dark' | 'light';
export type TestMode = 'download-only' | 'full';

export interface Settings {
  speedUnit: SpeedUnit;
  theme: Theme;
  testMode: TestMode;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Speed Unit Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Speed Unit
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Mbps', 'MBps', 'Kbps', 'Gbps'] as SpeedUnit[]).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setLocalSettings({ ...localSettings, speedUnit: unit })}
                  className={`px-4 py-2.5 rounded-lg border transition-all ${
                    localSettings.speedUnit === unit
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white font-medium'
                      : 'bg-gray-100 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Choose how speed is displayed (1 MBps = 8 Mbps)
            </p>
          </div>

          {/* Theme Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['auto', 'dark', 'light'] as Theme[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setLocalSettings({ ...localSettings, theme })}
                  className={`px-4 py-2.5 rounded-lg border transition-all capitalize ${
                    localSettings.theme === theme
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white font-medium'
                      : 'bg-gray-100 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Auto follows your system preference
            </p>
          </div>

          {/* Test Mode Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Test Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['download-only', 'full'] as TestMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLocalSettings({ ...localSettings, testMode: mode })}
                  className={`px-4 py-2.5 rounded-lg border transition-all ${
                    localSettings.testMode === mode
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white font-medium'
                      : 'bg-gray-100 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600'
                  }`}
                >
                  {mode === 'download-only' ? 'Download Only' : 'Full Test'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Download Only tests download speed and latency only. Full Test includes upload.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black text-sm font-medium rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook to manage settings with localStorage
export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    speedUnit: 'Mbps',
    theme: 'auto',
    testMode: 'download-only',
  });

  useEffect(() => {
    // Load settings from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('speedTestSettings');
      if (saved) {
        try {
          const parsedSettings = JSON.parse(saved);
          // Ensure testMode exists, default to 'download-only' if not present
          setSettings({
            speedUnit: parsedSettings.speedUnit || 'Mbps',
            theme: parsedSettings.theme || 'auto',
            testMode: parsedSettings.testMode || 'download-only',
          });
        } catch (e) {
          console.error('Failed to parse settings:', e);
        }
      }
    }
  }, []);

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('speedTestSettings', JSON.stringify(newSettings));
    }
  };

  return { settings, updateSettings };
};

// Utility function to convert speed between units
export const convertSpeed = (speed: number, fromUnit: SpeedUnit, toUnit: SpeedUnit): number => {
  // Convert to Mbps first
  let mbps = speed;
  
  switch (fromUnit) {
    case 'Kbps':
      mbps = speed / 1000;
      break;
    case 'MBps':
      mbps = speed * 8;
      break;
    case 'Gbps':
      mbps = speed * 1000;
      break;
  }

  // Convert from Mbps to target unit
  switch (toUnit) {
    case 'Kbps':
      return mbps * 1000;
    case 'MBps':
      return mbps / 8;
    case 'Gbps':
      return mbps / 1000;
    default:
      return mbps;
  }
};
