"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { DashboardData, Reservation } from '@/types';
import { KPICard } from './KPICard';
import { PacingChart } from './PacingChart';
import { LeadTimeHistogram } from './LeadTimeHistogram';
import { MonthlyTable } from './MonthlyTable';
import { ChannelMixChart } from './ChannelMixChart';
import { PacingSnapshotChart } from './PacingSnapshotChart';
import { BookingCurveChart } from './BookingCurveChart';
import { ChevronDown, RefreshCw, XCircle } from 'lucide-react';
import { getYear } from 'date-fns';
import { processData } from '@/utils/dataProcessing';

interface DashboardProps {
    rawData: Reservation[];
    comparisonDate: Date;
    onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ rawData, comparisonDate, onBack }) => {
    const [selectedListing, setSelectedListing] = useState<string>("All Listings");
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        // Recalculate when listing changes
        const processed = processData(rawData, comparisonDate, selectedListing);
        setData(processed);
    }, [rawData, comparisonDate, selectedListing]);

    const filteredRawData = useMemo(() => {
        if (selectedListing === "All Listings") return rawData;
        return rawData.filter(r => r.listing === selectedListing);
    }, [rawData, selectedListing]);

    if (!data) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    const currentYear = getYear(comparisonDate);
    const prevYear = currentYear - 1;

    if (data.pacing.length === 0 && data.kpis.revenueYTD.current === 0) {
        // Empty state
        return (
            <div className="min-h-screen bg-bone p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-bone-light p-8 rounded-[12px] shadow-[0_1px_3px_rgba(22,25,16,0.04),0_4px_12px_rgba(22,25,16,0.06)] border border-bone">
                    <XCircle className="w-16 h-16 text-cedar mx-auto mb-4" />
                    <h2 className="text-2xl font-serif text-onyx">No Data Found</h2>
                    <p className="text-moss max-w-md">
                        There are no reservations found for the selected property &quot;{selectedListing}&quot;.
                        Try selecting &quot;All Listings&quot; or checking your CSV file.
                    </p>
                    <button
                        onClick={() => setSelectedListing("All Listings")}
                        className="mt-6 px-6 py-2 bg-cedar text-bone rounded-full hover:bg-onyx transition-colors"
                    >
                        Reset Filter
                    </button>
                    <button
                        onClick={onBack}
                        className="mt-2 block w-full text-sm text-cedar hover:underline"
                    >
                        Upload New File
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-bone font-sans text-tobacco pb-10" id="dashboard-content">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

                {/* Controls bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bone-light border border-bone-dark/40 rounded-[16px] px-5 py-4 shadow-[0_1px_3px_rgba(22,25,16,0.04)]">
                    <div className="flex items-center gap-3">
                        <div>
                            <p className="text-[9px] font-bold text-moss uppercase tracking-[2px] mb-1">Listing</p>
                            <div className="relative">
                                <select
                                    value={selectedListing}
                                    onChange={(e) => setSelectedListing(e.target.value)}
                                    className="appearance-none bg-bone border border-bone-dark/50 rounded-full py-2 pl-4 pr-9 text-sm font-medium text-onyx focus:outline-none focus:ring-2 focus:ring-cedar/20 cursor-pointer min-w-[200px]"
                                >
                                    <option value="All Listings">All Listings</option>
                                    {data.listings.map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-moss pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-moss uppercase tracking-[2px] mb-1">Comparison Date</p>
                            <p className="text-sm font-semibold text-onyx">{comparisonDate.toLocaleDateString()}</p>
                        </div>
                        <button
                            onClick={onBack}
                            className="p-2.5 rounded-full bg-bone border border-bone-dark/40 text-moss hover:text-cedar hover:border-cedar/30 transition-colors"
                            title="Upload New File"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Revenue YTD"
                        value={data.kpis.revenueYTD.current}
                        prevValue={data.kpis.revenueYTD.previous}
                        percentChange={data.kpis.revenueYTD.percentChange}
                        isCurrency
                        tooltipText={`Sum of revenue where Check-In Date <= ${comparisonDate.toLocaleDateString()} for ${currentYear} vs ${prevYear}`}
                    />
                    <KPICard
                        title="Forward Booked"
                        value={data.kpis.forwardBooked.current}
                        prevValue={data.kpis.forwardBooked.previous}
                        percentChange={data.kpis.forwardBooked.percentChange}
                        isCurrency
                        tooltipText={`Sum of revenue where Check-In Date > ${comparisonDate.toLocaleDateString()} for ${currentYear} vs ${prevYear}`}
                    />
                    <KPICard
                        title="ADR"
                        value={data.kpis.adr.current}
                        prevValue={data.kpis.adr.previous}
                        percentChange={data.kpis.adr.percentChange}
                        isCurrency
                        tooltipText="Average Daily Rate (Total Revenue / Total Nights)"
                    />
                    <KPICard
                        title="Avg Lead Time"
                        value={data.kpis.avgLeadTime.current}
                        prevValue={data.kpis.avgLeadTime.previous}
                        percentChange={data.kpis.avgLeadTime.percentChange}
                        tooltipText="Average days between Reservation Date and Check-In Date"
                    />
                </div>

                {/* New Advanced Metrics Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-bone-light p-6 rounded-[12px] shadow-[0_1px_3px_rgba(22,25,16,0.04),0_4px_12px_rgba(22,25,16,0.06)] border border-bone">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-onyx font-serif lowercase">pacing snapshot ({currentYear} vs {prevYear})</h2>
                        </div>
                        <PacingSnapshotChart data={filteredRawData} referenceDate={comparisonDate} />
                    </div>
                    <div className="bg-bone-light p-6 rounded-[12px] shadow-[0_1px_3px_rgba(22,25,16,0.04),0_4px_12px_rgba(22,25,16,0.06)] border border-bone">
                        <h2 className="text-lg font-bold text-onyx mb-6 font-serif lowercase">booking curve velocity</h2>
                        <BookingCurveChart data={filteredRawData} />
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-bone-light p-6 rounded-[12px] shadow-[0_1px_3px_rgba(22,25,16,0.04),0_4px_12px_rgba(22,25,16,0.06)] border border-bone">
                        <h2 className="text-lg font-bold text-onyx mb-6 font-serif lowercase">revenue cumulative pacing ({currentYear} vs {prevYear})</h2>
                        <PacingChart data={data.pacing} currentYear={currentYear} prevYear={prevYear} />
                    </div>
                    <div className="bg-bone-light p-6 rounded-[12px] shadow-[0_1px_3px_rgba(22,25,16,0.04),0_4px_12px_rgba(22,25,16,0.06)] border border-bone">
                        <h2 className="text-lg font-bold text-onyx mb-6 font-serif lowercase">channel mix ({currentYear})</h2>
                        <ChannelMixChart data={data.channelMix} />
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-bone-light p-6 rounded-[12px] shadow-[0_1px_3px_rgba(22,25,16,0.04),0_4px_12px_rgba(22,25,16,0.06)] border border-bone overflow-hidden">
                        <h2 className="text-lg font-bold text-onyx mb-6 font-serif lowercase">monthly performance</h2>
                        <MonthlyTable data={data.monthly} currentYear={currentYear} prevYear={prevYear} />
                    </div>
                    <div className="bg-bone-light p-6 rounded-[12px] shadow-[0_1px_3px_rgba(22,25,16,0.04),0_4px_12px_rgba(22,25,16,0.06)] border border-bone">
                        <h2 className="text-lg font-bold text-onyx mb-6 font-serif lowercase">lead time distribution</h2>
                        <LeadTimeHistogram data={data.leadTime} currentYear={currentYear} prevYear={prevYear} />
                    </div>
                </div>

            </div>
        </div>
    );
};
