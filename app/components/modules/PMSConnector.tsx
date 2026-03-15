"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { ConnectScreen } from "./pms-connector/ConnectScreen";
import { PMSDashboard } from "./pms-connector/PMSDashboard";
import type { PMSCredentials } from "@/types";

const STORAGE_KEY = "revfactor_pms_credentials";

function loadCredentials(): PMSCredentials | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(atob(raw)) as PMSCredentials;
  } catch {
    return null;
  }
}

function saveCredentials(creds: PMSCredentials) {
  localStorage.setItem(STORAGE_KEY, btoa(JSON.stringify(creds)));
}

function clearCredentials() {
  localStorage.removeItem(STORAGE_KEY);
}

export function PMSConnector() {
  const [credentials, setCredentials] = useState<PMSCredentials | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setCredentials(loadCredentials());
    setIsLoaded(true);
  }, []);

  const handleConnect = (creds: PMSCredentials) => {
    saveCredentials(creds);
    setCredentials(creds);
  };

  const handleDisconnect = () => {
    clearCredentials();
    // Also clear cached PMS data
    localStorage.removeItem("revfactor_pms_cache");
    setCredentials(null);
  };

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-bone-muted rounded-lg w-full" />
          <div className="h-64 bg-bone-muted rounded-[12px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Beta warning banner */}
      <div className="flex items-start gap-3 bg-warning-bg border border-warning/30 text-warning text-sm p-4 rounded-[12px]">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Beta Feature</p>
          <p className="text-warning mt-0.5">
            PMS Connector is in beta. Your API credentials are stored locally in
            your browser and are never sent to our servers. Data is fetched
            directly from your PMS provider.
          </p>
        </div>
      </div>

      {/* Conditional view */}
      {credentials ? (
        <PMSDashboard
          credentials={credentials}
          onDisconnect={handleDisconnect}
        />
      ) : (
        <ConnectScreen onConnect={handleConnect} />
      )}
    </div>
  );
}
