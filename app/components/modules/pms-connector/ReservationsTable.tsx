"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { X, ChevronDown, ChevronUp, ChevronsUpDown, Check, Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/app/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import type { PMSReservation } from "@/types";

interface ReservationsTableProps {
  reservations: PMSReservation[];
  loading: boolean;
}

type SortKey = "guestName" | "listingName" | "checkIn" | "checkOut" | "reservationDate" | "revenue" | "status" | "channel";
type SortDir = "asc" | "desc";

/* ── Multi-select dropdown ─────────────────────────────────── */
function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder,
  searchable = false,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  placeholder: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, searchable]);

  function toggle(value: string) {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  }

  const filteredOptions = searchable && search
    ? options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()))
    : options;

  const displayText =
    selected.size === 0
      ? placeholder
      : selected.size <= 2
        ? [...selected].join(", ")
        : `${selected.size} selected`;

  return (
    <div>
      <label className="block text-[9px] font-bold text-moss uppercase tracking-[1.5px] mb-1.5">
        {label}
      </label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full bg-bone border border-bone-dark/50 rounded-lg py-1.5 px-2.5 text-xs text-left focus:outline-none focus:ring-2 focus:ring-cedar/20 flex items-center justify-between gap-1"
        >
          <span className={`truncate ${selected.size === 0 ? "text-moss" : "text-onyx"}`}>
            {displayText}
          </span>
          <ChevronDown className="h-3 w-3 text-moss shrink-0" />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-bone-dark/40 rounded-lg shadow-lg">
            {/* Search input */}
            {searchable && (
              <div className="p-1.5 border-b border-bone-dark/20">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-moss" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-bone/50 border border-bone-dark/30 rounded-md py-1 pl-6 pr-2 text-xs text-onyx placeholder:text-moss/60 focus:outline-none focus:ring-1 focus:ring-cedar/20"
                  />
                </div>
              </div>
            )}
            <div className="max-h-52 overflow-y-auto">
              {filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-onyx hover:bg-bone/60 text-left"
                >
                  <span
                    className={`flex items-center justify-center h-3.5 w-3.5 rounded border shrink-0 ${
                      selected.has(opt)
                        ? "bg-cedar border-cedar text-white"
                        : "border-bone-dark/50 bg-white"
                    }`}
                  >
                    {selected.has(opt) && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <p className="px-2.5 py-2 text-xs text-moss">
                  {search ? "No matches" : "No options"}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  let color = "bg-moss/10 text-moss border-moss/20";

  if (normalized === "confirmed" || normalized === "accepted") {
    color = "bg-success-bg text-success border-success/30";
  } else if (normalized === "cancelled" || normalized === "canceled") {
    color = "bg-error-bg text-error border-error/30";
  } else if (normalized === "pending") {
    color = "bg-warning-bg text-warning border-warning/30";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}
    >
      {status}
    </span>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Sortable header ───────────────────────────────────────── */
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
  currentKey: SortKey | null;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = currentKey === sortKey;
  return (
    <TableHead
      className={`cursor-pointer select-none hover:text-onyx transition-colors ${className || ""}`}
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

/* ── Main component ────────────────────────────────────────── */
export function ReservationsTable({ reservations, loading }: ReservationsTableProps) {
  // Filter state
  const [filterListings, setFilterListings] = useState<Set<string>>(new Set());
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set());
  const [filterCheckInFrom, setFilterCheckInFrom] = useState("");
  const [filterCheckInTo, setFilterCheckInTo] = useState("");
  const [filterBookedFrom, setFilterBookedFrom] = useState("");
  const [filterBookedTo, setFilterBookedTo] = useState("");

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset page when filters, sort, or page size change
  useEffect(() => { setCurrentPage(1); }, [filterListings, filterStatuses, filterCheckInFrom, filterCheckInTo, filterBookedFrom, filterBookedTo, sortKey, sortDir, pageSize]);

  // Derive unique values for multi-selects
  const uniqueListings = useMemo(
    () => [...new Set(reservations.map((r) => r.listingName).filter(Boolean))].sort(),
    [reservations]
  );
  const uniqueStatuses = useMemo(
    () => [...new Set(reservations.map((r) => r.status).filter(Boolean))].sort(),
    [reservations]
  );

  const hasActiveFilters =
    filterListings.size > 0 || filterStatuses.size > 0 || filterCheckInFrom || filterCheckInTo || filterBookedFrom || filterBookedTo;

  // Filter + sort
  const displayed = useMemo(() => {
    // 1. Filter
    let result = reservations.filter((r) => {
      if (filterListings.size > 0 && !filterListings.has(r.listingName)) return false;
      if (filterStatuses.size > 0 && !filterStatuses.has(r.status)) return false;

      if (filterCheckInFrom && r.checkIn) {
        if (r.checkIn.slice(0, 10) < filterCheckInFrom) return false;
      }
      if (filterCheckInTo && r.checkIn) {
        if (r.checkIn.slice(0, 10) > filterCheckInTo) return false;
      }
      if (filterBookedFrom && r.reservationDate) {
        if (r.reservationDate.slice(0, 10) < filterBookedFrom) return false;
      }
      if (filterBookedTo && r.reservationDate) {
        if (r.reservationDate.slice(0, 10) > filterBookedTo) return false;
      }

      return true;
    });

    // 2. Sort
    if (sortKey) {
      result = [...result].sort((a, b) => {
        let cmp = 0;

        if (sortKey === "revenue") {
          cmp = a.revenue - b.revenue;
        } else if (sortKey === "checkIn" || sortKey === "checkOut" || sortKey === "reservationDate") {
          const da = a[sortKey] || "";
          const db = b[sortKey] || "";
          cmp = da.localeCompare(db);
        } else {
          const va = (a[sortKey] || "").toLowerCase();
          const vb = (b[sortKey] || "").toLowerCase();
          cmp = va.localeCompare(vb);
        }

        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [reservations, filterListings, filterStatuses, filterCheckInFrom, filterCheckInTo, filterBookedFrom, filterBookedTo, sortKey, sortDir]);

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(displayed.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, displayed.length);
  const paginatedRows = displayed.slice(startIdx, endIdx);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      // Toggle direction, or clear on third click
      if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir("asc");
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setFilterListings(new Set());
    setFilterStatuses(new Set());
    setFilterCheckInFrom("");
    setFilterCheckInTo("");
    setFilterBookedFrom("");
    setFilterBookedTo("");
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-bone-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Reservations
            <span className="ml-2 text-sm font-normal text-moss">
              {hasActiveFilters
                ? `Showing ${displayed.length} of ${reservations.length}`
                : `(${reservations.length})`}
            </span>
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5 text-xs text-moss hover:text-onyx"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Filters */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Listing — multi-select */}
          <MultiSelect
            label="Listing"
            options={uniqueListings}
            selected={filterListings}
            onChange={setFilterListings}
            placeholder="All listings"
            searchable
          />

          {/* Status — multi-select */}
          <MultiSelect
            label="Status"
            options={uniqueStatuses}
            selected={filterStatuses}
            onChange={setFilterStatuses}
            placeholder="All statuses"
          />

          {/* Check-in From */}
          <div>
            <label className="block text-[9px] font-bold text-moss uppercase tracking-[1.5px] mb-1.5">
              Check-in From
            </label>
            <input
              type="date"
              value={filterCheckInFrom}
              onChange={(e) => setFilterCheckInFrom(e.target.value)}
              className="w-full bg-bone border border-bone-dark/50 rounded-lg py-1.5 px-2.5 text-xs text-onyx focus:outline-none focus:ring-2 focus:ring-cedar/20"
            />
          </div>

          {/* Check-in To */}
          <div>
            <label className="block text-[9px] font-bold text-moss uppercase tracking-[1.5px] mb-1.5">
              Check-in To
            </label>
            <input
              type="date"
              value={filterCheckInTo}
              onChange={(e) => setFilterCheckInTo(e.target.value)}
              className="w-full bg-bone border border-bone-dark/50 rounded-lg py-1.5 px-2.5 text-xs text-onyx focus:outline-none focus:ring-2 focus:ring-cedar/20"
            />
          </div>

          {/* Booked From */}
          <div>
            <label className="block text-[9px] font-bold text-moss uppercase tracking-[1.5px] mb-1.5">
              Booked From
            </label>
            <input
              type="date"
              value={filterBookedFrom}
              onChange={(e) => setFilterBookedFrom(e.target.value)}
              className="w-full bg-bone border border-bone-dark/50 rounded-lg py-1.5 px-2.5 text-xs text-onyx focus:outline-none focus:ring-2 focus:ring-cedar/20"
            />
          </div>

          {/* Booked To */}
          <div>
            <label className="block text-[9px] font-bold text-moss uppercase tracking-[1.5px] mb-1.5">
              Booked To
            </label>
            <input
              type="date"
              value={filterBookedTo}
              onChange={(e) => setFilterBookedTo(e.target.value)}
              className="w-full bg-bone border border-bone-dark/50 rounded-lg py-1.5 px-2.5 text-xs text-onyx focus:outline-none focus:ring-2 focus:ring-cedar/20"
            />
          </div>
        </div>
      </div>

      <CardContent className="px-0 pb-0">
        {displayed.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="text-moss text-sm">
              {hasActiveFilters
                ? "No reservations match the current filters."
                : "No reservations found."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Guest" sortKey="guestName" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHead label="Listing" sortKey="listingName" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHead label="Check-in" sortKey="checkIn" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHead label="Check-out" sortKey="checkOut" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHead label="Booked Date" sortKey="reservationDate" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHead label="Revenue" sortKey="revenue" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" />
                  <SortableHead label="Status" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortableHead label="Channel" sortKey="channel" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-onyx">
                      {r.guestName || "—"}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {r.listingName || "—"}
                    </TableCell>
                    <TableCell>{formatDate(r.checkIn)}</TableCell>
                    <TableCell>{formatDate(r.checkOut)}</TableCell>
                    <TableCell>{formatDate(r.reservationDate)}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${r.revenue.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status || "Unknown"} />
                    </TableCell>
                    <TableCell>{r.channel || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination bar */}
        {displayed.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-bone-dark/20">
            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-moss">Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-bone border border-bone-dark/50 rounded-lg py-1 px-2 text-xs text-onyx focus:outline-none focus:ring-2 focus:ring-cedar/20"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Range indicator */}
            <span className="text-xs text-moss">
              {startIdx + 1}–{endIdx} of {displayed.length}{hasActiveFilters ? ` (${reservations.length} total)` : ""}
            </span>

            {/* Prev / Next */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-onyx min-w-[80px] text-center">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
