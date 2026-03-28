"use client";

import { useState } from "react";
import { Plug, Loader2, ExternalLink, HelpCircle } from "lucide-react";
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

          {/* API setup help */}
          {provider && (
            <div className="bg-cedar/5 border border-cedar/15 rounded-[12px] p-4 space-y-2">
              <div className="flex items-center gap-2 text-cedar font-semibold text-sm">
                <HelpCircle className="h-4 w-4" />
                How to get your {provider === "hostaway" ? "Hostaway" : provider === "hospitable" ? "Hospitable" : "OwnerRez"} API credentials
              </div>
              {provider === "hospitable" && (
                <ol className="text-xs text-tobacco space-y-1 list-decimal list-inside">
                  <li>Log in to your Hospitable account</li>
                  <li>Go to <span className="font-medium">Apps</span> (or Settings → Integrations)</li>
                  <li>Choose <span className="font-medium">API access</span> and generate a Personal Access Token</li>
                  <li className="pt-1">
                    <a
                      href="https://help.hospitable.com/en/articles/8609392-accessing-the-public-api-with-a-personal-access-token-pat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cedar underline underline-offset-2 hover:text-cedar/80"
                    >
                      View full guide <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                </ol>
              )}
              {provider === "hostaway" && (
                <ol className="text-xs text-tobacco space-y-1 list-decimal list-inside">
                  <li>Log in to your Hostaway dashboard</li>
                  <li>Go to <span className="font-medium">Settings → Hostaway API</span></li>
                  <li>Copy your <span className="font-medium">Account ID</span> and <span className="font-medium">API Key</span></li>
                  <li className="pt-1 space-x-3">
                    <a
                      href="https://dashboard.hostaway.com/settings/hostaway-api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cedar underline underline-offset-2 hover:text-cedar/80"
                    >
                      Go to API settings <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href="https://support.hostaway.com/hc/en-us/articles/360002576293-Hostaway-Public-API-Account-Secret-Key"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cedar underline underline-offset-2 hover:text-cedar/80"
                    >
                      View full guide <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                </ol>
              )}
              {provider === "ownerrez" && (
                <ol className="text-xs text-tobacco space-y-1 list-decimal list-inside">
                  <li>Log in to your OwnerRez account</li>
                  <li>Go to <span className="font-medium">Settings → API</span></li>
                  <li>Copy your <span className="font-medium">Email</span> and <span className="font-medium">API Token</span></li>
                  <li className="pt-1 space-x-3">
                    <a
                      href="https://app.ownerrez.com/settings/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cedar underline underline-offset-2 hover:text-cedar/80"
                    >
                      Go to API settings <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href="https://www.ownerrez.com/support/articles/api-overview"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cedar underline underline-offset-2 hover:text-cedar/80"
                    >
                      View full guide <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                </ol>
              )}
            </div>
          )}

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
