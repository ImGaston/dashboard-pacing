import React from 'react';
import type { MonthlyMetric } from '../types';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../lib/utils';

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
                <thead className="text-xs text-moss uppercase bg-bone/50 font-bold tracking-wider">
                    <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Month</th>
                        <th className="px-4 py-3 text-right">{prevYear} Rev</th>
                        <th className="px-4 py-3 text-right">{prevYear} Occ%</th>
                        <th className="px-4 py-3 text-right">{prevYear} ADR</th>
                        <th className="px-4 py-3 text-right border-l border-moss/10">{currentYear} Booked</th>
                        <th className="px-4 py-3 text-right">{currentYear} Occ%</th>
                        <th className="px-4 py-3 text-right">{currentYear} ADR</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">Δ Rev</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-moss/10">
                    {data.map((row) => (
                        <tr key={row.month} className="hover:bg-bone/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-onyx">{row.month}</td>
                            <td className="px-4 py-3 text-right text-tobacco">{formatCurrency(row.revenue2025)}</td>
                            <td className="px-4 py-3 text-right text-tobacco">{formatPct(row.occupancy2025)}</td>
                            <td className="px-4 py-3 text-right text-tobacco">{formatCurrency(row.adr2025)}</td>
                            <td className="px-4 py-3 text-right font-medium text-cedar border-l border-moss/10">{formatCurrency(row.revenue2026)}</td>
                            <td className="px-4 py-3 text-right text-cedar">{formatPct(row.occupancy2026)}</td>
                            <td className="px-4 py-3 text-right text-cedar">{formatCurrency(row.adr2026)}</td>
                            <td className="px-4 py-3 text-right">
                                <div className={cn(
                                    "flex items-center justify-end gap-1 font-bold",
                                    row.deltaRevenue >= 0 ? "text-green-700" : "text-red-700"
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
