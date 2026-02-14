import React from 'react';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface KPICardProps {
    title: string;
    value: string | number;
    prevValue: string | number;
    percentChange: number;
    isCurrency?: boolean;
    tooltipText?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, prevValue, percentChange, isCurrency, tooltipText }) => {
    const isPositive = percentChange >= 0;
    const formattedValue = isCurrency
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value))
        : typeof value === 'number' ? value.toFixed(1) : value;

    const formattedPrev = isCurrency
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(prevValue))
        : typeof prevValue === 'number' ? prevValue.toFixed(1) : prevValue;

    return (
        <div className="bg-white p-6 rounded-xl border border-bone shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-moss uppercase tracking-widest">{title}</h3>
                    {tooltipText && (
                        <div className="relative group/tooltip">
                            <Info className="w-4 h-4 text-moss/50 cursor-help" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-onyx text-bone text-xs p-2 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                                {tooltipText}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-onyx"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-onyx font-sans">{formattedValue}</span>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs">
                <div className="text-moss">
                    vs {formattedPrev}
                </div>
                <div className={cn(
                    "flex items-center font-bold px-2 py-1 rounded-full",
                    isPositive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(percentChange).toFixed(1)}%
                </div>
            </div>
        </div>
    );
};
