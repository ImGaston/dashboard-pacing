"use client";

import React from 'react';
import type { MonthlyMetric } from '@/types';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthlyTableProps {
    data: MonthlyMetric[];
    currentYear: number;
    prevYear: number;
}

export const MonthlyTable: React.FC<MonthlyTableProps> = ({ data, currentYear, prevYear }) => {
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    const formatPct = (val: number) => val.toFixed(1) + '%';

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-[9px] text-walnut uppercase bg-bone-light font-bold tracking-[2px]">
                    <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Month</th>
                        <th className="px-4 py-3 text-right">{prevYear} Rev</th>
                        <th className="px-4 py-3 text-right">{prevYear} Occ%</th>
                        <th className="px-4 py-3 text-right">{prevYear} ADR</th>
                        <th className="px-4 py-3 text-right border-l border-bone-dark">{currentYear} Booked</th>
                        <th className="px-4 py-3 text-right">{currentYear} Occ%</th>
                        <th className="px-4 py-3 text-right">{currentYear} ADR</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">&Delta; Rev</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-bone-dark">
                    {data.map((row) => (
                        <tr key={row.month} className="hover:bg-bone-light transition-colors duration-[120ms]">
                            <td className="px-4 py-3 font-medium text-onyx">{row.month}</td>
                            <td className="px-4 py-3 text-right text-tobacco font-mono">{formatCurrency(row.revenue2025)}</td>
                            <td className="px-4 py-3 text-right text-tobacco font-mono">{formatPct(row.occupancy2025)}</td>
                            <td className="px-4 py-3 text-right text-tobacco font-mono">{formatCurrency(row.adr2025)}</td>
                            <td className="px-4 py-3 text-right font-medium text-cedar border-l border-bone-dark font-mono">{formatCurrency(row.revenue2026)}</td>
                            <td className="px-4 py-3 text-right text-cedar font-mono">{formatPct(row.occupancy2026)}</td>
                            <td className="px-4 py-3 text-right text-cedar font-mono">{formatCurrency(row.adr2026)}</td>
                            <td className="px-4 py-3 text-right">
                                <div className={cn(
                                    "flex items-center justify-end gap-1 font-bold font-mono",
                                    row.deltaRevenue >= 0 ? "text-success" : "text-error"
                                )}>
                                    {row.deltaRevenue >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {Math.abs(row.deltaRevenue).toFixed(1)}%
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
