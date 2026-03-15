"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/app/components/ui/table";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatDate,
  type BookingPacingRow,
} from "@/app/utils/bookingPacingUtils";

interface BookingPacingTableProps {
  rows: BookingPacingRow[];
  totalRevenue: number;
  totalNights: number;
}

type SortKey = "reservationDate" | "checkInDate" | "nights" | "revenue" | "impactPct";
type SortDir = "asc" | "desc";

function SortableHead({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = currentKey === sortKey;
  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none hover:text-onyx transition-colors",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </TableHead>
  );
}

export function BookingPacingTable({
  rows,
  totalRevenue,
  totalNights,
}: BookingPacingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "reservationDate" || sortKey === "checkInDate") {
        cmp = a[sortKey].getTime() - b[sortKey].getTime();
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-moss text-sm">
        No reservations found in the selected booking window.
      </div>
    );
  }

  return (
    <div className="max-h-[500px] overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-white z-10">
          <TableRow>
            <SortableHead
              label="Booking Date"
              sortKey="reservationDate"
              currentKey={sortKey}
              currentDir={sortDir}
              onSort={handleSort}
            />
            <SortableHead
              label="Check-in"
              sortKey="checkInDate"
              currentKey={sortKey}
              currentDir={sortDir}
              onSort={handleSort}
            />
            <TableHead>Property</TableHead>
            <TableHead>Platform</TableHead>
            <SortableHead
              label="Nights"
              sortKey="nights"
              currentKey={sortKey}
              currentDir={sortDir}
              onSort={handleSort}
              className="text-right"
            />
            <SortableHead
              label="Revenue"
              sortKey="revenue"
              currentKey={sortKey}
              currentDir={sortDir}
              onSort={handleSort}
              className="text-right"
            />
            <SortableHead
              label="% Impact"
              sortKey="impactPct"
              currentKey={sortKey}
              currentDir={sortDir}
              onSort={handleSort}
              className="text-right"
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row, i) => (
            <TableRow
              key={i}
              className={cn(row.impactPct >= 5 && "font-bold")}
            >
              <TableCell>{formatDate(row.reservationDate)}</TableCell>
              <TableCell>{formatDate(row.checkInDate)}</TableCell>
              <TableCell className="max-w-[180px] truncate">
                {row.listing}
              </TableCell>
              <TableCell>{row.channel}</TableCell>
              <TableCell className="text-right font-mono">
                {row.nights}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(row.revenue)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono",
                  row.impactPct >= 5 && "text-success"
                )}
              >
                {row.impactPct.toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}

          {/* Footer totals */}
          <TableRow className="border-t-2 border-onyx/20 font-bold bg-bone/30">
            <TableCell colSpan={4} className="text-onyx">
              Total
            </TableCell>
            <TableCell className="text-right font-mono">{totalNights}</TableCell>
            <TableCell className="text-right font-mono">
              {formatCurrency(totalRevenue)}
            </TableCell>
            <TableCell className="text-right font-mono">100%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
