"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { RevenueEntryForm } from "./revenue-tracker/RevenueEntryForm";
import { RevenueTable } from "./revenue-tracker/RevenueTable";
import { RevenueTrendChart } from "./revenue-tracker/RevenueTrendChart";
import { PropertySelector } from "./revenue-tracker/PropertySelector";
import { useToast } from "@/app/components/ui/use-toast";
import type { RevenueEntry } from "@/types";

const STORAGE_KEY = "revfactor_revenue_entries";

function loadEntries(): RevenueEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RevenueEntry[];
  } catch {
    return [];
  }
}

function saveEntries(entries: RevenueEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function RevenueTracker() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setEntries(loadEntries());
    setIsLoaded(true);
  }, []);

  // Sync to localStorage on changes (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveEntries(entries);
    }
  }, [entries, isLoaded]);

  const properties = useMemo(
    () => Array.from(new Set(entries.map((e) => e.propertyName))).sort(),
    [entries]
  );

  const filteredEntries = useMemo(
    () =>
      selectedProperty === "all"
        ? entries
        : entries.filter((e) => e.propertyName === selectedProperty),
    [entries, selectedProperty]
  );

  const addEntry = useCallback((entry: RevenueEntry) => {
    setEntries((prev) => [...prev, entry]);
  }, []);

  const deleteEntry = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Entry deleted" });
    },
    [toast]
  );

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-bone rounded-xl" />
          <div className="h-48 bg-bone rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Form Section */}
      <RevenueEntryForm onSave={addEntry} existingProperties={properties} />

      {/* Filter + heading */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif text-onyx">Performance Data</h2>
          {properties.length > 1 && (
            <PropertySelector
              properties={properties}
              selectedProperty={selectedProperty}
              onSelect={setSelectedProperty}
            />
          )}
        </div>
      )}

      {/* Chart */}
      {entries.length > 0 && (
        <RevenueTrendChart entries={filteredEntries} selectedProperty={selectedProperty} />
      )}

      {/* Table */}
      <RevenueTable entries={filteredEntries} onDelete={deleteEntry} />
    </div>
  );
}
