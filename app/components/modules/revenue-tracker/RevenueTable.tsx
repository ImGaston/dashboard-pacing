"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/app/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import type { RevenueEntry } from "@/types";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface RevenueTableProps {
  entries: RevenueEntry[];
  onDelete: (id: string) => void;
}

export function RevenueTable({ entries, onDelete }: RevenueTableProps) {
  // Sort by date descending (most recent first)
  const sorted = [...entries].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Summary</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {sorted.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="text-moss text-sm">No entries yet. Add your first monthly data above.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Occ. Nights</TableHead>
                <TableHead className="text-right">Avail. Nights</TableHead>
                <TableHead className="text-right">Occ%</TableHead>
                <TableHead className="text-right">ADR</TableHead>
                <TableHead className="text-right">RevPAN</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((entry) => {
                const occ = entry.availableNights > 0
                  ? (entry.occupiedNights / entry.availableNights) * 100
                  : 0;
                const adr = entry.occupiedNights > 0
                  ? entry.totalRevenue / entry.occupiedNights
                  : 0;
                const revpan = entry.availableNights > 0
                  ? entry.totalRevenue / entry.availableNights
                  : 0;

                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium text-onyx">{entry.propertyName}</TableCell>
                    <TableCell>{MONTH_SHORT[entry.month - 1]} {entry.year}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${entry.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right">{entry.occupiedNights}</TableCell>
                    <TableCell className="text-right">{entry.availableNights}</TableCell>
                    <TableCell className="text-right">{occ.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono">${adr.toFixed(0)}</TableCell>
                    <TableCell className="text-right font-mono">${revpan.toFixed(0)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(entry.id)}
                        className="h-8 w-8 p-0 text-moss hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
