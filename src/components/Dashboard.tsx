import React, { useState, useEffect, useMemo } from 'react';
import type { DashboardData } from '../types';
import { KPICard } from './KPICard';
import { PacingChart } from './PacingChart';
import { LeadTimeHistogram } from './LeadTimeHistogram';
import { MonthlyTable } from './MonthlyTable';
import { ChannelMixChart } from './ChannelMixChart';
import { PacingSnapshotChart } from './PacingSnapshotChart';
import { BookingCurveChart } from './BookingCurveChart';
import { ChevronDown, RefreshCw, XCircle } from 'lucide-react';
import { getYear } from 'date-fns';
import { processData } from '../utils/dataProcessing';

interface DashboardProps {
    rawData: any[]; // The raw reservation data
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
                <div className="bg-white p-8 rounded-xl shadow-lg border border-moss/20">
                    <XCircle className="w-16 h-16 text-cedar mx-auto mb-4" />
                    <h2 className="text-2xl font-serif text-onyx">No Data Found</h2>
                    <p className="text-moss max-w-md">
                        There are no reservations found for the selected property "{selectedListing}".
                        Try selecting "All Listings" or checking your CSV file.
                    </p>
                    <button
                        onClick={() => setSelectedListing("All Listings")}
                        className="mt-6 px-6 py-2 bg-cedar text-bone rounded hover:bg-onyx transition-colors"
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
        <div className="min-h-screen bg-bone font-sans text-tobacco pb-10" id="dashboard-content">
            {/* Header */}
            <header className="bg-white border-b border-moss/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-serif text-onyx italic">revfactor</h1>
                        <div className="h-6 w-px bg-moss/20"></div>

                        <div className="relative group">
                            <select
                                value={selectedListing}
                                onChange={(e) => setSelectedListing(e.target.value)}
                                className="appearance-none bg-bone/50 border border-moss/20 rounded-lg py-2 pl-4 pr-10 text-sm font-medium text-onyx focus:outline-none focus:ring-2 focus:ring-cedar/20 cursor-pointer min-w-[200px]"
                            >
                                <option value="All Listings">All Listings</option>
                                {data.listings.map(l => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-moss pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-xs text-right hidden sm:block">
                            <p className="text-moss uppercase tracking-wider">Comparison Date</p>
                            <p className="font-bold text-onyx">{comparisonDate.toLocaleDateString()}</p>
                        </div>
                        <button
                            onClick={onBack}
                            className="p-2 text-moss hover:text-cedar transition-colors"
                            title="Upload New File"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

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
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-bone">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-onyx font-serif">Pacing Snapshot ({currentYear} vs {prevYear})</h2>
                        </div>
                        <PacingSnapshotChart data={filteredRawData} referenceDate={comparisonDate} />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-bone">
                        <h2 className="text-lg font-bold text-onyx mb-6 font-serif">Booking Curve Velocity</h2>
                        <BookingCurveChart data={filteredRawData} />
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-bone">
                        <h2 className="text-lg font-bold text-onyx mb-6 font-serif">Revenue Cummulative Pacing ({currentYear} vs {prevYear})</h2>
                        <PacingChart data={data.pacing} currentYear={currentYear} prevYear={prevYear} />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-bone">
                        <h2 className="text-lg font-bold text-onyx mb-6 font-serif">Channel Mix ({currentYear})</h2>
                        <ChannelMixChart data={data.channelMix} />
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-bone overflow-hidden">
                        <h2 className="text-lg font-bold text-onyx mb-6 font-serif">Monthly Performance</h2>
                        <MonthlyTable data={data.monthly} currentYear={currentYear} prevYear={prevYear} />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-bone">
                        <h2 className="text-lg font-bold text-onyx mb-6 font-serif">Lead Time Distribution</h2>
                        <LeadTimeHistogram data={data.leadTime} currentYear={currentYear} prevYear={prevYear} />
                    </div>
                </div>

            </main>

            <footer className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-moss/60">
                <p>Generated by RevPulse • {new Date().toLocaleDateString()}</p>
            </footer>
        </div>
    );
};
