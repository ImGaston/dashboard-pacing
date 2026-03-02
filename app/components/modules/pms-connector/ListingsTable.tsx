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
import type { PMSListing } from "@/types";

interface ListingsTableProps {
  listings: PMSListing[];
  loading: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const isActive = normalized === "active" || normalized === "listed" || normalized === "live";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isActive
          ? "bg-success-bg text-success border border-success/30"
          : "bg-moss/10 text-moss border border-bone-dark"
      }`}
    >
      {status}
    </span>
  );
}

export function ListingsTable({ listings, loading }: ListingsTableProps) {
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
          Properties
          <span className="ml-2 text-sm font-normal text-moss">
            ({listings.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {listings.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="text-moss text-sm">No properties found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium text-onyx">
                    {listing.name}
                  </TableCell>
                  <TableCell>{listing.type || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={listing.status || "Unknown"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
