"use client";

import { useState } from "react";
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
import type { RevenueEntry } from "@/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i); // 2020-2030

interface RevenueEntryFormProps {
  onSave: (entry: RevenueEntry) => void;
  existingProperties: string[];
}

export function RevenueEntryForm({ onSave, existingProperties }: RevenueEntryFormProps) {
  const { toast } = useToast();

  const [propertyName, setPropertyName] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [totalRevenue, setTotalRevenue] = useState("");
  const [occupiedNights, setOccupiedNights] = useState("");
  const [availableNights, setAvailableNights] = useState("");

  // Live calculated outputs
  const revenue = parseFloat(totalRevenue) || 0;
  const occupied = parseInt(occupiedNights) || 0;
  const available = parseInt(availableNights) || 0;

  const occupancyRate = available > 0 ? (occupied / available) * 100 : 0;
  const adr = occupied > 0 ? revenue / occupied : 0;
  const revpan = available > 0 ? revenue / available : 0;

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

    const entry: RevenueEntry = {
      id: crypto.randomUUID(),
      propertyName: propertyName.trim(),
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear),
      totalRevenue: revenue,
      occupiedNights: occupied,
      availableNights: available,
    };

    onSave(entry);

    toast({
      title: "Entry saved",
      description: `${MONTHS[parseInt(selectedMonth) - 1]} ${selectedYear} data for ${propertyName.trim()}`,
    });

    // Reset number fields (keep propertyName for rapid multi-month entry)
    setTotalRevenue("");
    setOccupiedNights("");
    setAvailableNights("");
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
              step="1"
              placeholder="0"
              value={occupiedNights}
              onChange={(e) => setOccupiedNights(e.target.value)}
            />
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
          <div className="bg-bone/50 rounded-lg p-4 text-center">
            <p className="text-xs font-bold text-moss uppercase tracking-widest mb-1">Occupancy</p>
            <p className="text-2xl font-serif text-onyx">{occupancyRate.toFixed(1)}%</p>
          </div>
          <div className="bg-bone/50 rounded-lg p-4 text-center">
            <p className="text-xs font-bold text-moss uppercase tracking-widest mb-1">ADR</p>
            <p className="text-2xl font-serif text-onyx">${adr.toFixed(2)}</p>
          </div>
          <div className="bg-bone/50 rounded-lg p-4 text-center">
            <p className="text-xs font-bold text-moss uppercase tracking-widest mb-1">RevPAN</p>
            <p className="text-2xl font-serif text-onyx">${revpan.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full sm:w-auto">
          Save Entry
        </Button>
      </CardFooter>
    </Card>
  );
}
