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
  const [email, setEmail] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!provider) {
      setError("Please select a PMS provider.");
      return;
    }
    if (!apiKey.trim()) {
      setError("API key / token is required.");
      return;
    }
    if (provider === "hostaway" && !accountId.trim()) {
      setError("Account ID is required for Hostaway.");
      return;
    }
    if (provider === "ownerrez" && !email.trim()) {
      setError("Email is required for OwnerRez.");
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
          email: provider === "ownerrez" ? email.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        const credentials: PMSCredentials = {
          provider: provider as PMSProvider,
          apiKey: apiKey.trim(),
          accountId: provider === "hostaway" ? accountId.trim() : undefined,
          email: provider === "ownerrez" ? email.trim() : undefined,
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

  const apiKeyPlaceholder =
    provider === "hostaway"
      ? "Your Hostaway API Key"
      : provider === "ownerrez"
        ? "Your OwnerRez API Token"
        : "Your Hospitable API Key";

  const apiKeyHelp =
    provider === "hostaway"
      ? "Find this in Hostaway → Settings → API Keys."
      : provider === "ownerrez"
        ? "Find this in OwnerRez → Settings → API Access → Personal API Token."
        : "Find this in Hospitable → Settings → Developer → API Keys.";

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
                <SelectItem value="ownerrez">OwnerRez</SelectItem>
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

          {/* OwnerRez: Email */}
          {provider === "ownerrez" && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your OwnerRez account email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {/* API Key (shown for all providers) */}
          {provider && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {provider === "ownerrez" ? "API Token" : "API Key"}
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder={apiKeyPlaceholder}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-moss">{apiKeyHelp}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-error-bg border border-error/30 text-error text-sm p-3 rounded-[12px]">
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
