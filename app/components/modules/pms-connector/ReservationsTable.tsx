"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/app/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import type { PMSReservation } from "@/types";

interface ReservationsTableProps {
  reservations: PMSReservation[];
  loading: boolean;
}

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

export function ReservationsTable({ reservations, loading }: ReservationsTableProps) {
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
        <CardTitle>
          Reservations
          <span className="ml-2 text-sm font-normal text-moss">
            ({reservations.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {reservations.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="text-moss text-sm">No reservations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Channel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-onyx">
                      {r.guestName || "—"}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {r.listingName || "—"}
                    </TableCell>
                    <TableCell>{r.checkIn || "—"}</TableCell>
                    <TableCell>{r.checkOut || "—"}</TableCell>
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
      </CardContent>
    </Card>
  );
}
