"use client";

import { useState } from "react";
import { Plug, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import type { PMSProvider, PMSCredentials } from "@/types";

interface ConnectScreenProps {
  onConnect: (credentials: PMSCredentials) => void;
}

export function ConnectScreen({ onConnect }: ConnectScreenProps) {
  const [provider, setProvider] = useState<PMSProvider | "">("");
  const [apiKey, setApiKey] = useState("");
  const [accountId, setAccountId] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!provider) {
      setError("Please select a PMS provider.");
      return;
    }
    if (!apiKey.trim()) {
      setError("API key is required.");
      return;
    }
    if (provider === "hostaway" && !accountId.trim()) {
      setError("Account ID is required for Hostaway.");
      return;
    }

    setError(null);
    setIsValidating(true);

    try {
      const res = await fetch("/api/pms/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          accountId: provider === "hostaway" ? accountId.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        const credentials: PMSCredentials = {
          provider: provider as PMSProvider,
          apiKey: apiKey.trim(),
          accountId: provider === "hostaway" ? accountId.trim() : undefined,
          connectedAt: new Date().toISOString(),
        };
        onConnect(credentials);
      } else {
        setError(data.error || "Validation failed. Check your credentials.");
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">
            <Plug className="h-10 w-10 text-cedar" />
          </div>
          <CardTitle>Connect Your PMS</CardTitle>
          <CardDescription>
            Link your property management system to automatically sync listings,
            reservations, and financial data.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Provider selector */}
          <div className="space-y-2">
            <Label>PMS Provider</Label>
            <Select
              value={provider}
              onValueChange={(v) => {
                setProvider(v as PMSProvider);
                setError(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your PMS..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hostaway">Hostaway</SelectItem>
                <SelectItem value="hospitable">Hospitable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hostaway: Account ID */}
          {provider === "hostaway" && (
            <div className="space-y-2">
              <Label htmlFor="accountId">Account ID</Label>
              <Input
                id="accountId"
                placeholder="Your Hostaway Account ID"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
            </div>
          )}

          {/* API Key (shown for both) */}
          {provider && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder={
                  provider === "hostaway"
                    ? "Your Hostaway API Key"
                    : "Your Hospitable API Key"
                }
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-moss">
                {provider === "hostaway"
                  ? "Find this in Hostaway → Settings → API Keys."
                  : "Find this in Hospitable → Settings → Developer → API Keys."}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleConnect}
            disabled={!provider || isValidating}
            className="w-full gap-2"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              "Connect"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
