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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-center">Guests</TableHead>
                  <TableHead className="text-center">Bedrooms</TableHead>
                  <TableHead className="text-center">Bathrooms</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium text-onyx">
                      {listing.name}
                    </TableCell>
                    <TableCell>{listing.city || "—"}</TableCell>
                    <TableCell>{listing.state || "—"}</TableCell>
                    <TableCell className="text-center font-mono">
                      {listing.personCapacity || "—"}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {listing.bedrooms || "—"}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {listing.bathrooms || "—"}
                    </TableCell>
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
