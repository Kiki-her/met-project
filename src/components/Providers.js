"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { I18nProvider } from "@/lib/i18n";
import {
  DEFAULTS,
  applySettings,
  loadSettings,
  saveSettings,
} from "@/lib/settings";

const SettingsContext = createContext(null);

function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);

  // 保存値の読み込みはマウント後（SSR との不一致を避ける）
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    applySettings(s);
  }, []);

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      update(patch) {
        setSettings(prev => {
          const next = { ...prev, ...patch };
          saveSettings(next);
          return next;
        });
      },
    }),
    [settings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within Providers");
  return ctx;
}

export default function Providers({ children }) {
  return (
    <I18nProvider>
      <SettingsProvider>{children}</SettingsProvider>
    </I18nProvider>
  );
}
