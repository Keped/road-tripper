import { useState, useEffect } from 'react';
import { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    historic: true,
    markets: true,
    hazards: true,
    podcasts: true,
    hiddenGems: true,
    news: true,
    social: true,
  },
  voice: {
    enabled: true,
    speed: 'normal',
  },
  triggerRadiusM: 500,
  simulationSpeed: 5,
  theme: 'auto',
};

const STORAGE_KEY = 'roadpulse_settings_v1';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...(parsed.notifications || {}),
        },
        voice: {
          ...DEFAULT_SETTINGS.voice,
          ...(parsed.voice || {}),
        },
      };
    }
  } catch (e) {
    console.error('Failed to parse settings from localStorage:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
}

export function useSettingsState() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const updateSettings = (updater: (prev: AppSettings) => AppSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      saveSettings(next);
      return next;
    });
  };

  return { settings, updateSettings };
}
