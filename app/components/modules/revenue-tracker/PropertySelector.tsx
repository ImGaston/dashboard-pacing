"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

interface PropertySelectorProps {
  properties: string[];
  selectedProperty: string;
  onSelect: (property: string) => void;
}

export function PropertySelector({ properties, selectedProperty, onSelect }: PropertySelectorProps) {
  return (
    <Select value={selectedProperty} onValueChange={onSelect}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="All Properties" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Properties</SelectItem>
        {properties.map((property) => (
          <SelectItem key={property} value={property}>
            {property}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
