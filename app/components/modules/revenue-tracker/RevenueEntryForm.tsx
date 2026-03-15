"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/app/components/ui/card";
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
import { useToast } from "@/app/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { RevenueEntry } from "@/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i); // 2020-2030

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

interface RevenueEntryFormProps {
  onSave: (entry: RevenueEntry) => void;
  onReplace: (entry: RevenueEntry) => void;
  existingEntries: RevenueEntry[];
  existingProperties: string[];
}

export function RevenueEntryForm({ onSave, onReplace, existingEntries, existingProperties }: RevenueEntryFormProps) {
  const { toast } = useToast();

  const [propertyName, setPropertyName] = useState("");
  const [duplicateEntry, setDuplicateEntry] = useState<RevenueEntry | null>(null);
  const [pendingEntry, setPendingEntry] = useState<RevenueEntry | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [totalRevenue, setTotalRevenue] = useState("");
  const [occupiedNights, setOccupiedNights] = useState("");
  const [availableNights, setAvailableNights] = useState(
    String(getDaysInMonth(parseInt(selectedMonth), parseInt(selectedYear)))
  );

  useEffect(() => {
    setAvailableNights(String(getDaysInMonth(parseInt(selectedMonth), parseInt(selectedYear))));
  }, [selectedMonth, selectedYear]);

  // Live calculated outputs
  const revenue = parseFloat(totalRevenue) || 0;
  const occupied = parseInt(occupiedNights) || 0;
  const available = parseInt(availableNights) || 0;

  const isOccupiedExceedsAvailable = occupied > 0 && available > 0 && occupied > available;

  const occupancyRate = available > 0 ? (occupied / available) * 100 : 0;
  const adr = occupied > 0 ? revenue / occupied : 0;
  const revpan = available > 0 ? revenue / available : 0;

  const resetNumberFields = () => {
    setTotalRevenue("");
    setOccupiedNights("");
    setAvailableNights(String(getDaysInMonth(parseInt(selectedMonth), parseInt(selectedYear))));
  };

  const handleSave = () => {
    if (!propertyName.trim()) {
      toast({ variant: "destructive", title: "Property name is required" });
      return;
    }
    if (revenue <= 0) {
      toast({ variant: "destructive", title: "Revenue must be greater than 0" });
      return;
    }
    if (occupied <= 0) {
      toast({ variant: "destructive", title: "Occupied nights must be greater than 0" });
      return;
    }
    if (available <= 0) {
      toast({ variant: "destructive", title: "Available nights must be greater than 0" });
      return;
    }
    if (occupied > available) {
      toast({ variant: "destructive", title: "Occupied nights cannot exceed available nights" });
      return;
    }

    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);
    const trimmedName = propertyName.trim();

    const existing = existingEntries.find(
      (e) => e.propertyName === trimmedName && e.month === month && e.year === year
    );

    const entry: RevenueEntry = {
      id: existing ? existing.id : crypto.randomUUID(),
      propertyName: trimmedName,
      month,
      year,
      totalRevenue: revenue,
      occupiedNights: occupied,
      availableNights: available,
    };

    if (existing) {
      setDuplicateEntry(existing);
      setPendingEntry(entry);
      return;
    }

    onSave(entry);
    toast({
      title: "Entry saved",
      description: `${MONTHS[month - 1]} ${year} data for ${trimmedName}`,
    });
    resetNumberFields();
  };

  const handleReplace = () => {
    if (pendingEntry) {
      onReplace(pendingEntry);
      toast({
        title: "Entry replaced",
        description: `${MONTHS[pendingEntry.month - 1]} ${pendingEntry.year} data for ${pendingEntry.propertyName}`,
      });
      resetNumberFields();
    }
    setDuplicateEntry(null);
    setPendingEntry(null);
  };

  const handleCancelDuplicate = () => {
    setDuplicateEntry(null);
    setPendingEntry(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Monthly Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Row 1: Property + Month + Year */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="propertyName">Property Name</Label>
            <Input
              id="propertyName"
              placeholder="e.g. Beach House A"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              list="property-suggestions"
            />
            {existingProperties.length > 0 && (
              <datalist id="property-suggestions">
                {existingProperties.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            )}
          </div>
          <div className="space-y-2">
            <Label>Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, i) => (
                  <SelectItem key={month} value={String(i + 1)}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Revenue + Occupied + Available */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalRevenue">Total Revenue ($)</Label>
            <Input
              id="totalRevenue"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={totalRevenue}
              onChange={(e) => setTotalRevenue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="occupiedNights">Occupied Nights</Label>
            <Input
              id="occupiedNights"
              type="number"
              min="0"
              max={available > 0 ? available : undefined}
              step="1"
              placeholder="0"
              value={occupiedNights}
              onChange={(e) => setOccupiedNights(e.target.value)}
              className={isOccupiedExceedsAvailable ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : ""}
            />
            {isOccupiedExceedsAvailable && (
              <p className="text-[13px] text-red-600 mt-1">
                Cannot exceed available nights ({available})
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="availableNights">Available Nights</Label>
            <Input
              id="availableNights"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={availableNights}
              onChange={(e) => setAvailableNights(e.target.value)}
            />
          </div>
        </div>

        {/* Row 3: Live calculated outputs */}
        <div className="grid grid-cols-3 gap-4">
          <div className={cn(
            "rounded-[12px] p-4 text-center",
            isOccupiedExceedsAvailable ? "bg-red-50 ring-1 ring-red-200" : "bg-bone-muted/50"
          )}>
            <p className="text-[9px] font-bold text-walnut uppercase tracking-[2px] mb-1">Occupancy</p>
            <p className={cn(
              "text-2xl font-mono",
              isOccupiedExceedsAvailable ? "text-red-600" : "text-onyx"
            )}>{occupancyRate.toFixed(1)}%</p>
          </div>
          <div className="bg-bone-muted/50 rounded-[12px] p-4 text-center">
            <p className="text-[9px] font-bold text-walnut uppercase tracking-[2px] mb-1">ADR</p>
            <p className="text-2xl font-mono text-onyx">${adr.toFixed(2)}</p>
          </div>
          <div className="bg-bone-muted/50 rounded-[12px] p-4 text-center">
            <p className="text-[9px] font-bold text-walnut uppercase tracking-[2px] mb-1">RevPAN</p>
            <p className="text-2xl font-mono text-onyx">${revpan.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 items-stretch">
        {duplicateEntry && (
          <div className="w-full rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              Data for <span className="font-bold">{duplicateEntry.propertyName}</span> in{" "}
              <span className="font-bold">{MONTHS[duplicateEntry.month - 1]} {duplicateEntry.year}</span> already exists.
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Existing: ${duplicateEntry.totalRevenue.toLocaleString()} rev · {duplicateEntry.occupiedNights}/{duplicateEntry.availableNights} nights
            </p>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={handleCancelDuplicate}>
                Cancel
              </Button>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleReplace}>
                Replace
              </Button>
            </div>
          </div>
        )}
        {!duplicateEntry && (
          <Button onClick={handleSave} className="w-full sm:w-auto self-start" disabled={isOccupiedExceedsAvailable}>
            Save Entry
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
